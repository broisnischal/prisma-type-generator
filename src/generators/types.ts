import type { DMMF } from "@prisma/generator-helper";
import {
  getTypeScriptType,
  extractJSDoc,
  parseTypeMappingFromComment,
  parseLooseEnumFromComment,
  parseTypeMappings,
  parseOmitDirective,
  parsePickDirective,
  parseInputDirective,
  parseGroupDirective,
  parseWithDirective,
  parseSelectDirective,
  parseValidatedDirective,
  generateOmitTypeName,
  type TypeMapping,
} from "../util";

export interface GenerateTypesOptions {
  dataModel: DMMF.Datamodel;
  typeMappings?: TypeMapping;
  jsDocComments?: boolean;
  include?: string;
  exclude?: string;
  models?: readonly DMMF.Model[];
  enums?: readonly DMMF.Datamodel["enums"][number][];
  jsonTypeMapping?: boolean;
  namespaceName?: string;
  basicUtilityTypes?: boolean;
}

export function generateTypes(options: GenerateTypesOptions): string {
  const {
    dataModel,
    typeMappings,
    jsDocComments = false,
    include,
    exclude,
    models,
    enums,
    jsonTypeMapping = false,
    namespaceName = "PrismaType",
    basicUtilityTypes = true,
  } = options;

  const mappings = parseTypeMappings(undefined, typeMappings, jsonTypeMapping, namespaceName);
  let output = "";

  // Add global namespace declaration if jsonTypeMapping is enabled
  // This allows users to extend PrismaType namespace in their prisma-json.ts file
  if (jsonTypeMapping) {
    output += `// This file must be a module, so we include an empty export.\n`;
    output += `export {};\n\n`;
    output += `/// <reference path="./prisma-json.d.ts" />\n\n`;
  }

  // Use provided models/enums or fall back to dataModel
  const modelsToGenerate = models || dataModel.models;
  let enumsToGenerate = enums || dataModel.enums;

  // Filter enums based on include/exclude if not already filtered
  // Only filter if enums weren't explicitly provided (meaning they came from dataModel)
  if (!enums && (include || exclude)) {
    enumsToGenerate = enumsToGenerate.filter((enumType) => {
      // Check exclude filter
      if (exclude) {
        const excludeList = exclude.split(",").map((s) => s.trim());
        if (excludeList.includes(enumType.name)) {
          return false;
        }
      }
      // Check include filter
      if (include) {
        const includeList = include.split(",").map((s) => s.trim());
        return includeList.includes(enumType.name);
      }
      return true;
    });
  }

  // Generate enums
  for (const enumType of enumsToGenerate) {
    const comment = jsDocComments ? extractJSDoc(enumType.documentation) : "";
    const jsDoc = comment ? `/**\n * ${comment}\n */\n` : "";

    output += `${jsDoc}export type ${enumType.name} = ${enumType.values
      .map((v: { name: string }) => `"${v.name}"`)
      .join(" | ")};\n\n`;

    output += `export declare const ${enumType.name}: {\n`;
    for (const enumValue of enumType.values) {
      output += `  readonly ${enumValue.name}: "${enumValue.name}";\n`;
    }
    output += "};\n\n";
  }

  // Generate models
  for (const model of modelsToGenerate) {
    // Check include/exclude filters
    if (
      include &&
      !include
        .split(",")
        .map((s) => s.trim())
        .includes(model.name)
    ) {
      continue;
    }
    if (
      exclude &&
      exclude
        .split(",")
        .map((s) => s.trim())
        .includes(model.name)
    ) {
      continue;
    }

    const comment = jsDocComments ? extractJSDoc(model.documentation) : "";
    const jsDoc = comment ? `/**\n * ${comment}\n */\n` : "";

    // Parse @omit directive from model documentation (for utility type generation)
    const omitDirective = parseOmitDirective(model.documentation);
    const omitFields = omitDirective?.fields || [];
    const customTypeName = omitDirective?.typeName;

    output += `${jsDoc}export interface ${model.name} {\n`;

    const scalarAndEnumFields = model.fields.filter((field) =>
      ["scalar", "enum"].includes(field.kind)
    );

    // Include all fields in the base interface
    for (const field of scalarAndEnumFields) {
      const fieldComment = jsDocComments
        ? extractJSDoc(field.documentation)
        : "";

      let typeScriptType: string;

      // Check for loose enum type first (for String fields)
      const looseEnum = parseLooseEnumFromComment(field.documentation);
      if (looseEnum && field.type === "String") {
        if (looseEnum.strict) {
          // Strict: literal union type (e.g., "email" | "google")
          typeScriptType = looseEnum.values.map((v) => `"${v}"`).join(" | ");
        } else {
          // Loose: autocomplete-friendly but allows other strings
          // Use a pattern that preserves autocomplete: "email" | "google" | (string & {})
          // The (string & {}) prevents TypeScript from collapsing to just string
          // This provides autocomplete for the literals while accepting any string
          const literalUnion = looseEnum.values.map((v) => `"${v}"`).join(" | ");
          typeScriptType = `${literalUnion} | (string & {})`;
        }
      } else {
        // Check for custom type mapping in comment
        const customType = parseTypeMappingFromComment(field.documentation, jsonTypeMapping, namespaceName);
        if (customType) {
          typeScriptType = customType;
        } else {
          typeScriptType = getTypeScriptType(field.type, mappings);
        }
      }

      const nullability = field.isRequired ? "" : "| null";
      const list = field.isList ? "[]" : "";
      const fieldJsDoc = fieldComment
        ? `  /**\n   * ${fieldComment}\n   */\n`
        : "";

      output += `${fieldJsDoc}  ${field.name}: ${typeScriptType}${nullability}${list};\n`;
    }

    output += "}\n\n";

    // Generate all utility types in a namespace
    const utilityTypes = generateUtilityTypes(
      model,
      dataModel,
      omitDirective,
      jsonTypeMapping,
      undefined,
      undefined,
      basicUtilityTypes
    );
    if (utilityTypes) {
      output += utilityTypes;
    }
  }

  return output;
}

/**
 * Collect model types referenced in relation types (@with directive)
 */
function collectReferencedModels(
  model: DMMF.Model,
  modelFileMap?: Map<string, string>,
  currentFileName?: string
): Set<string> {
  const referencedModels = new Set<string>();

  if (!modelFileMap || !currentFileName) {
    return referencedModels;
  }

  const relationFields = model.fields.filter((field) =>
    field.kind !== "scalar" && field.kind !== "enum" && field.relationName !== undefined
  );

  const withDirective = parseWithDirective(model.documentation);
  if (withDirective && withDirective.relations.length > 0) {
    for (const relationName of withDirective.relations) {
      const relationField = relationFields.find((f) => f.name === relationName);
      if (relationField) {
        const relationType = relationField.type;
        if (relationType) {
          const relationModelFile = modelFileMap.get(relationType);
          if (relationModelFile && relationModelFile !== currentFileName) {
            referencedModels.add(relationType);
          }
        }
      }
    }
  }

  return referencedModels;
}

/**
 * Collect all imports needed for a model (enums and referenced models)
 * Returns a Set of import statements
 */
export function collectModelImports(
  model: DMMF.Model,
  options: {
    dataModel?: DMMF.Datamodel;
    enumFileMap?: Map<string, string>;
    modelFileMap?: Map<string, string>;
    currentFileName?: string;
  }
): Set<string> {
  const { dataModel, enumFileMap, modelFileMap, currentFileName } = options;
  const imports = new Set<string>();

  if (!currentFileName) {
    return imports;
  }

  // Collect enum types used by this model
  const usedEnums = new Set<string>();
  const scalarAndEnumFields = model.fields.filter((field) =>
    ["scalar", "enum"].includes(field.kind)
  );

  // Build a set of all enum names for quick lookup
  const allEnumNames = new Set<string>();
  if (dataModel?.enums) {
    for (const enumType of dataModel.enums) {
      allEnumNames.add(enumType.name);
    }
  }

  for (const field of scalarAndEnumFields) {
    // Check if field is an enum type
    if (field.kind === "enum") {
      usedEnums.add(field.type);
    }
  }

  // Collect model types referenced in relation types (@with directive)
  const referencedModels = collectReferencedModels(model, modelFileMap, currentFileName);

  // Generate import statements for enums in different files
  if (enumFileMap && usedEnums.size > 0) {
    for (const enumName of usedEnums) {
      const enumFileName = enumFileMap.get(enumName);
      if (enumFileName && enumFileName !== currentFileName) {
        imports.add(`import type { ${enumName} } from "./${enumFileName}";`);
      }
    }
  }

  // Generate import statements for models referenced in relation types
  if (modelFileMap && referencedModels.size > 0) {
    for (const modelName of referencedModels) {
      const modelFileName = modelFileMap.get(modelName);
      if (modelFileName && modelFileName !== currentFileName) {
        imports.add(`import type { ${modelName} } from "./${modelFileName}";`);
      }
    }
  }

  return imports;
}

/**
 * Generate all utility types for a model in a namespace
 */
function generateUtilityTypes(
  model: DMMF.Model,
  dataModel: DMMF.Datamodel | undefined,
  omitDirective: { fields: string[]; typeName?: string } | null,
  jsonTypeMapping?: boolean,
  modelFileMap?: Map<string, string>, // Map model name to file name (without extension)
  currentFileName?: string, // Current file name (without extension)
  basicUtilityTypes: boolean = true // Whether to generate basic utility types (Partial, Required, etc.)
): string {
  // Check if we need to generate any utility types at all
  const hasOmitTypes = omitDirective && omitDirective.fields.length > 0;
  const pickDirective = parsePickDirective(model.documentation);
  const hasPickTypes = pickDirective && pickDirective.fields.length > 0;
  const inputTypes = parseInputDirective(model.documentation);
  const hasInputTypes = inputTypes && inputTypes.length > 0;
  const groups = parseGroupDirective(model.documentation);
  const hasGroupTypes = groups && groups.size > 0;
  const withDirective = parseWithDirective(model.documentation);
  const hasWithTypes = withDirective && withDirective.relations.length > 0;
  const hasSelectTypes = parseSelectDirective(model.documentation);
  const hasValidatedTypes = parseValidatedDirective(model.documentation);

  // Only generate namespace if there are any utility types to generate
  const hasAnyUtilityTypes =
    basicUtilityTypes ||
    hasOmitTypes ||
    hasPickTypes ||
    hasInputTypes ||
    hasGroupTypes ||
    hasWithTypes ||
    hasSelectTypes ||
    hasValidatedTypes;

  if (!hasAnyUtilityTypes) {
    return "";
  }

  let namespaceOutput = `/**\n * Utility types for ${model.name}\n */\n`;
  namespaceOutput += `export namespace ${model.name} {\n`;

  // Define type helpers at the beginning to avoid naming conflicts
  // These are used by other utility types (like UpdateInput) that need to reference
  // the built-in TypeScript utility types without conflicting with namespace types
  // Only generate helpers if they're needed (for basic utility types or UpdateInput/custom input types)
  const hasUpdateInputOrCustomInput = hasInputTypes && inputTypes?.some(name => name === "UpdateInput" || (name !== "CreateInput" && name !== "UpdateInput"));
  const needsPartialHelper = basicUtilityTypes || hasUpdateInputOrCustomInput;
  if (needsPartialHelper) {
    namespaceOutput += `  type _Partial<T> = { [P in keyof T]?: T[P] };\n`;
  }
  if (basicUtilityTypes) {
    namespaceOutput += `  type _Required<T> = { [P in keyof T]-?: T[P] };\n`;
    namespaceOutput += `  type _Readonly<T> = { readonly [P in keyof T]: T[P] };\n`;
  }
  if (needsPartialHelper || basicUtilityTypes) {
    namespaceOutput += `\n`;
  }

  const scalarAndEnumFields = model.fields.filter((field) =>
    ["scalar", "enum"].includes(field.kind)
  );
  const allFieldNames = scalarAndEnumFields.map((f) => f.name);
  const relationFields = model.fields.filter((field) =>
    field.kind !== "scalar" && field.kind !== "enum" && field.relationName !== undefined
  );

  // 1. Omit types
  if (omitDirective && omitDirective.fields.length > 0) {
    // Filter to only include fields that actually exist in the model
    const validOmitFields = omitDirective.fields.filter((fieldName) =>
      allFieldNames.includes(fieldName)
    );

    if (validOmitFields.length > 0) {
      const omitUnion = validOmitFields.map((f) => `"${f}"`).join(" | ");
      const typeName = omitDirective.typeName || generateOmitTypeName(validOmitFields);
      namespaceOutput += `  /**\n   * ${model.name} without ${validOmitFields.join(", ")}\n   */\n`;
      namespaceOutput += `  export type ${typeName} = Omit<${model.name}, ${omitUnion}>;\n\n`;
    }
  }

  // 2. Pick types
  if (hasPickTypes) {
    const pickUnion = pickDirective.fields.map((f) => `"${f}"`).join(" | ");
    const typeName = pickDirective.typeName || `Pick${pickDirective.fields.map((f) => f.charAt(0).toUpperCase() + f.slice(1)).join("")}`;
    namespaceOutput += `  /**\n   * ${model.name} with only ${pickDirective.fields.join(", ")}\n   */\n`;
    namespaceOutput += `  export type ${typeName} = Pick<${model.name}, ${pickUnion}>;\n\n`;
  }

  // 3. Input types (CreateInput, UpdateInput)
  if (hasInputTypes && inputTypes) {
    for (const inputTypeName of inputTypes) {
      if (inputTypeName === "CreateInput") {
        // CreateInput: omits id, createdAt, updatedAt
        const excludeFields = model.fields
          .filter((f) => {
            // Only exclude id, createdAt, and updatedAt
            return f.isId ||
              f.name === "createdAt" ||
              f.name === "updatedAt";
          })
          .map((f) => f.name)
          .filter((f) => allFieldNames.includes(f));

        if (excludeFields.length > 0) {
          const excludeUnion = excludeFields.map((f) => `"${f}"`).join(" | ");
          namespaceOutput += `  /**\n   * Input type for creating ${model.name} (omits id, createdAt, updatedAt)\n   */\n`;
          namespaceOutput += `  export type ${inputTypeName} = Omit<${model.name}, ${excludeUnion}>;\n\n`;
        } else {
          namespaceOutput += `  /**\n   * Input type for creating ${model.name}\n   */\n`;
          namespaceOutput += `  export type ${inputTypeName} = ${model.name};\n\n`;
        }
      } else if (inputTypeName === "UpdateInput") {
        // UpdateInput: makes all fields optional, omits id
        // Use _Partial helper to avoid conflict with namespace Partial type
        const excludeFields = model.fields
          .filter((f) => f.isId)
          .map((f) => f.name);
        if (excludeFields.length > 0) {
          const excludeUnion = excludeFields.map((f) => `"${f}"`).join(" | ");
          namespaceOutput += `  /**\n   * Input type for updating ${model.name} (all fields optional, omits id)\n   */\n`;
          namespaceOutput += `  export type ${inputTypeName} = _Partial<Omit<${model.name}, ${excludeUnion}>>;\n\n`;
        } else {
          namespaceOutput += `  /**\n   * Input type for updating ${model.name} (all fields optional)\n   */\n`;
          namespaceOutput += `  export type ${inputTypeName} = _Partial<${model.name}>;\n\n`;
        }
      } else {
        // Custom input type name
        // Use _Partial helper to avoid conflict with namespace Partial type
        namespaceOutput += `  /**\n   * Custom input type: ${inputTypeName}\n   */\n`;
        namespaceOutput += `  export type ${inputTypeName} = _Partial<Omit<${model.name}, "id">>;\n\n`;
      }
    }
  }

  // 4. Group types
  if (hasGroupTypes && groups) {
    for (const [groupName, fields] of groups.entries()) {
      const pickUnion = fields.map((f) => `"${f}"`).join(" | ");
      const typeName = `${groupName.charAt(0).toUpperCase() + groupName.slice(1)}Fields`;
      namespaceOutput += `  /**\n   * ${groupName} fields: ${fields.join(", ")}\n   */\n`;
      namespaceOutput += `  export type ${typeName} = Pick<${model.name}, ${pickUnion}>;\n\n`;
    }
  }

  // 5. With types (relation types)
  if (hasWithTypes && withDirective) {
    const relationTypes: string[] = [];
    for (const relationName of withDirective.relations) {
      const relationField = relationFields.find((f) => f.name === relationName);
      if (relationField) {
        const relationType = relationField.type;
        const isArray = relationField.isList;
        const typeStr = isArray ? `${relationType}[]` : relationType;
        relationTypes.push(`    ${relationName}: ${typeStr};`);
      }
    }
    if (relationTypes.length > 0) {
      const typeName = withDirective.typeName || `With${withDirective.relations.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join("")}`;
      namespaceOutput += `  /**\n   * ${model.name} with relations: ${withDirective.relations.join(", ")}\n   */\n`;
      namespaceOutput += `  export type ${typeName} = ${model.name} & {\n`;
      namespaceOutput += relationTypes.join("\n");
      namespaceOutput += `\n  };\n\n`;
    }
  }

  // 6. Select types
  if (hasSelectTypes) {
    const selectFields = allFieldNames.map((f) => `    ${f}?: boolean;`).join("\n");
    namespaceOutput += `  /**\n   * Select type for Prisma queries\n   */\n`;
    namespaceOutput += `  export type Select = {\n`;
    namespaceOutput += selectFields;
    namespaceOutput += `\n  };\n\n`;
  }

  // 7. Validation types
  if (hasValidatedTypes) {
    const validatedTypeName = parseValidatedDirective(model.documentation);
    if (validatedTypeName) {
      namespaceOutput += `  /**\n   * Validated ${model.name} type\n   */\n`;
      namespaceOutput += `  export type ${validatedTypeName} = ${model.name} & { __validated: true };\n\n`;
    }
  }

  // 8. Basic utility types (generate if enabled)
  if (basicUtilityTypes) {
    // Use type helpers defined at the beginning of the namespace
    namespaceOutput += `  /**\n   * Make all fields optional\n   */\n`;
    namespaceOutput += `  export type Partial = _Partial<${model.name}>;\n\n`;
    namespaceOutput += `  /**\n   * Make all fields required\n   */\n`;
    namespaceOutput += `  export type Required = _Required<${model.name}>;\n\n`;
    namespaceOutput += `  /**\n   * Make all fields readonly\n   */\n`;
    namespaceOutput += `  export type Readonly = _Readonly<${model.name}>;\n\n`;

    // 9. Deep utility types
    namespaceOutput += `  /**\n   * Deep partial (recursive)\n   */\n`;
    namespaceOutput += `  export type DeepPartial<T = ${model.name}> = {\n`;
    namespaceOutput += `    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];\n`;
    namespaceOutput += `  };\n\n`;
    namespaceOutput += `  /**\n   * Deep required (recursive)\n   */\n`;
    namespaceOutput += `  export type DeepRequired<T = ${model.name}> = {\n`;
    namespaceOutput += `    [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];\n`;
    namespaceOutput += `  };\n\n`;
  }

  namespaceOutput += `}\n\n`;
  return namespaceOutput;
}

/**
 * Generate types for a single enum
 */
export function generateEnumType(
  enumType: DMMF.Datamodel["enums"][number],
  options: {
    jsDocComments?: boolean;
    jsonTypeMapping?: boolean;
    namespaceName?: string;
    skipModuleHeader?: boolean;
  }
): string {
  const { jsDocComments = false, jsonTypeMapping = false, namespaceName = "PrismaType", skipModuleHeader = false } = options;
  let output = "";

  // Add global namespace declaration if jsonTypeMapping is enabled and header not already added
  if (jsonTypeMapping && !skipModuleHeader) {
    output += `// This file must be a module, so we include an empty export.\n`;
    output += `export {};\n\n`;
    output += `/// <reference path="./prisma-json.d.ts" />\n\n`;
  }

  const comment = jsDocComments ? extractJSDoc(enumType.documentation) : "";
  const jsDoc = comment ? `/**\n * ${comment}\n */\n` : "";

  output += `${jsDoc}export type ${enumType.name} = ${enumType.values
    .map((v: { name: string }) => `"${v.name}"`)
    .join(" | ")};\n\n`;

  output += `export declare const ${enumType.name}: {\n`;
  for (const enumValue of enumType.values) {
    output += `  readonly ${enumValue.name}: "${enumValue.name}";\n`;
  }
  output += "};\n\n";

  return output;
}

/**
 * Generate types for a single model
 */
export function generateModelType(
  model: DMMF.Model,
  options: {
    typeMappings?: TypeMapping;
    jsDocComments?: boolean;
    jsonTypeMapping?: boolean;
    namespaceName?: string;
    dataModel?: DMMF.Datamodel;
    enumFileMap?: Map<string, string>; // Map enum name to file name (without extension)
    modelFileMap?: Map<string, string>; // Map model name to file name (without extension)
    currentFileName?: string; // Current file name (without extension)
    skipModuleHeader?: boolean;
    basicUtilityTypes?: boolean;
    skipImports?: boolean; // Skip generating imports (for file-level import collection)
  }
): string {
  const {
    typeMappings,
    jsDocComments = false,
    jsonTypeMapping = false,
    namespaceName = "PrismaType",
    dataModel,
    enumFileMap,
    modelFileMap,
    currentFileName,
    skipModuleHeader = false,
    basicUtilityTypes = true,
    skipImports = false,
  } = options;

  const mappings = parseTypeMappings(undefined, typeMappings, jsonTypeMapping, namespaceName);
  let output = "";

  // Add global namespace declaration if jsonTypeMapping is enabled and header not already added
  if (jsonTypeMapping && !skipModuleHeader) {
    output += `// This file must be a module, so we include an empty export.\n`;
    output += `export {};\n\n`;
    output += `/// <reference path="./prisma-json.d.ts" />\n\n`;
  }

  // Collect enum types used by this model
  const usedEnums = new Set<string>();
  const scalarAndEnumFields = model.fields.filter((field) =>
    ["scalar", "enum"].includes(field.kind)
  );

  // Build a set of all enum names for quick lookup
  const allEnumNames = new Set<string>();
  if (dataModel?.enums) {
    for (const enumType of dataModel.enums) {
      allEnumNames.add(enumType.name);
    }
  }

  for (const field of scalarAndEnumFields) {
    // Check if field is an enum type
    if (field.kind === "enum") {
      // field.type is the enum name when kind is "enum"
      usedEnums.add(field.type);
    }
    // For scalar fields, check if the type name matches an enum (shouldn't happen normally, but be safe)
    else if (field.kind === "scalar") {
      const looseEnum = parseLooseEnumFromComment(field.documentation);
      // Only check if it's not a loose enum and the type matches an enum name
      if (!looseEnum && field.type && allEnumNames.has(field.type)) {
        // This shouldn't normally happen (scalars shouldn't have enum names), but handle it
        usedEnums.add(field.type);
      }
    }
  }

  // Collect model types referenced in relation types (@with directive)
  const referencedModels = collectReferencedModels(model, modelFileMap, currentFileName);

  // Generate import statements for enums in different files (skip if skipImports is true)
  if (!skipImports) {
    const imports: string[] = [];
    if (enumFileMap && currentFileName && usedEnums.size > 0) {
      for (const enumName of usedEnums) {
        const enumFileName = enumFileMap.get(enumName);
        // Only add import if enum is in a different file
        // If enumFileName is undefined, the enum might be in the same file or not generated
        if (enumFileName && enumFileName !== currentFileName) {
          imports.push(`import type { ${enumName} } from "./${enumFileName}";`);
        }
        // If enumFileName is undefined, log a warning (but don't break generation)
        // This could happen if the enum wasn't included in the enumFileMap
      }
    }

    // Generate import statements for models referenced in relation types
    if (modelFileMap && currentFileName && referencedModels.size > 0) {
      for (const modelName of referencedModels) {
        const modelFileName = modelFileMap.get(modelName);
        if (modelFileName && modelFileName !== currentFileName) {
          imports.push(`import type { ${modelName} } from "./${modelFileName}";`);
        }
      }
    }

    if (imports.length > 0) {
      output += imports.join("\n") + "\n\n";
    }
  }

  const comment = jsDocComments ? extractJSDoc(model.documentation) : "";
  const jsDoc = comment ? `/**\n * ${comment}\n */\n` : "";

  // Parse @omit directive from model documentation (for utility type generation)
  const omitDirective = parseOmitDirective(model.documentation);
  const omitFields = omitDirective?.fields || [];
  const customTypeName = omitDirective?.typeName;

  output += `${jsDoc}export interface ${model.name} {\n`;

  // Include all fields in the base interface
  for (const field of scalarAndEnumFields) {
    const fieldComment = jsDocComments
      ? extractJSDoc(field.documentation)
      : "";

    let typeScriptType: string;

    // Check for loose enum type first (for String fields)
    const looseEnum = parseLooseEnumFromComment(field.documentation);
    if (looseEnum && field.type === "String") {
      if (looseEnum.strict) {
        // Strict: literal union type (e.g., "email" | "google")
        typeScriptType = looseEnum.values.map((v) => `"${v}"`).join(" | ");
      } else {
        // Loose: autocomplete-friendly but allows other strings
        // Use a pattern that preserves autocomplete: "email" | "google" | (string & {})
        // The (string & {}) prevents TypeScript from collapsing to just string
        // This provides autocomplete for the literals while accepting any string
        const literalUnion = looseEnum.values.map((v) => `"${v}"`).join(" | ");
        typeScriptType = `${literalUnion} | (string & {})`;
      }
    } else {
      // Check for custom type mapping in comment
      const customType = parseTypeMappingFromComment(field.documentation, jsonTypeMapping, namespaceName);
      if (customType) {
        typeScriptType = customType;
      } else {
        typeScriptType = getTypeScriptType(field.type, mappings);
      }
    }

    const nullability = field.isRequired ? "" : "| null";
    const list = field.isList ? "[]" : "";
    const fieldJsDoc = fieldComment
      ? `  /**\n   * ${fieldComment}\n   */\n`
      : "";

    output += `${fieldJsDoc}  ${field.name}: ${typeScriptType}${nullability}${list};\n`;
  }

  output += "}\n\n";

  // Generate all utility types in a namespace
  // dataModel is optional and not currently used in generateUtilityTypes
  const utilityTypes = generateUtilityTypes(
    model,
    dataModel,
    omitDirective,
    jsonTypeMapping,
    modelFileMap,
    currentFileName,
    basicUtilityTypes
  );
  if (utilityTypes) {
    output += utilityTypes;
  }

  return output;
}
