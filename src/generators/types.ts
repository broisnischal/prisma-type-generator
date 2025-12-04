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
  } = options;

  const mappings = parseTypeMappings(undefined, typeMappings, jsonTypeMapping);
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
  const enumsToGenerate = enums || dataModel.enums;

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
        const customType = parseTypeMappingFromComment(field.documentation, jsonTypeMapping);
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
      jsonTypeMapping
    );
    if (utilityTypes) {
      output += utilityTypes;
    }
  }

  return output;
}

/**
 * Generate all utility types for a model in a namespace
 */
function generateUtilityTypes(
  model: DMMF.Model,
  dataModel: DMMF.Datamodel | undefined,
  omitDirective: { fields: string[]; typeName?: string } | null,
  jsonTypeMapping?: boolean
): string {
  // Always generate namespace with basic utility types
  let namespaceOutput = `/**\n * Utility types for ${model.name}\n */\n`;
  namespaceOutput += `export namespace ${model.name} {\n`;

  const scalarAndEnumFields = model.fields.filter((field) =>
    ["scalar", "enum"].includes(field.kind)
  );
  const allFieldNames = scalarAndEnumFields.map((f) => f.name);
  const relationFields = model.fields.filter((field) => 
    field.kind !== "scalar" && field.kind !== "enum" && field.relationName !== undefined
  );

  // 1. Omit types
  if (omitDirective && omitDirective.fields.length > 0) {
    const omitUnion = omitDirective.fields.map((f) => `"${f}"`).join(" | ");
    const typeName = omitDirective.typeName || generateOmitTypeName(omitDirective.fields);
    namespaceOutput += `  /**\n   * ${model.name} without ${omitDirective.fields.join(", ")}\n   */\n`;
    namespaceOutput += `  export type ${typeName} = Omit<${model.name}, ${omitUnion}>;\n\n`;
  }

  // 2. Pick types
  const pickDirective = parsePickDirective(model.documentation);
  if (pickDirective && pickDirective.fields.length > 0) {
    const pickUnion = pickDirective.fields.map((f) => `"${f}"`).join(" | ");
    const typeName = pickDirective.typeName || `Pick${pickDirective.fields.map((f) => f.charAt(0).toUpperCase() + f.slice(1)).join("")}`;
    namespaceOutput += `  /**\n   * ${model.name} with only ${pickDirective.fields.join(", ")}\n   */\n`;
    namespaceOutput += `  export type ${typeName} = Pick<${model.name}, ${pickUnion}>;\n\n`;
  }

  // 3. Input types (CreateInput, UpdateInput)
  const inputTypes = parseInputDirective(model.documentation);
  if (inputTypes) {
    for (const inputTypeName of inputTypes) {
      if (inputTypeName === "CreateInput") {
        // CreateInput: omits id, createdAt, updatedAt (and other auto-generated fields)
        const excludeFields = model.fields
          .filter((f) => {
            // Exclude id, createdAt, updatedAt, and any field with default value
            return f.isId || 
                   f.name === "createdAt" || 
                   f.name === "updatedAt" || 
                   (f.hasDefaultValue && f.name !== "createdAt" && f.name !== "updatedAt");
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
        const excludeFields = model.fields
          .filter((f) => f.isId)
          .map((f) => f.name);
        if (excludeFields.length > 0) {
          const excludeUnion = excludeFields.map((f) => `"${f}"`).join(" | ");
          namespaceOutput += `  /**\n   * Input type for updating ${model.name} (all fields optional, omits id)\n   */\n`;
          namespaceOutput += `  export type ${inputTypeName} = Partial<Omit<${model.name}, ${excludeUnion}>>;\n\n`;
        } else {
          namespaceOutput += `  /**\n   * Input type for updating ${model.name} (all fields optional)\n   */\n`;
          namespaceOutput += `  export type ${inputTypeName} = Partial<${model.name}>;\n\n`;
        }
      } else {
        // Custom input type name
        namespaceOutput += `  /**\n   * Custom input type: ${inputTypeName}\n   */\n`;
        namespaceOutput += `  export type ${inputTypeName} = Partial<Omit<${model.name}, "id">>;\n\n`;
      }
    }
  }

  // 4. Group types
  const groups = parseGroupDirective(model.documentation);
  if (groups) {
    for (const [groupName, fields] of groups.entries()) {
      const pickUnion = fields.map((f) => `"${f}"`).join(" | ");
      const typeName = `${groupName.charAt(0).toUpperCase() + groupName.slice(1)}Fields`;
      namespaceOutput += `  /**\n   * ${groupName} fields: ${fields.join(", ")}\n   */\n`;
      namespaceOutput += `  export type ${typeName} = Pick<${model.name}, ${pickUnion}>;\n\n`;
    }
  }

  // 5. With types (relation types)
  const withDirective = parseWithDirective(model.documentation);
  if (withDirective && withDirective.relations.length > 0) {
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
  if (parseSelectDirective(model.documentation)) {
    const selectFields = allFieldNames.map((f) => `    ${f}?: boolean;`).join("\n");
    namespaceOutput += `  /**\n   * Select type for Prisma queries\n   */\n`;
    namespaceOutput += `  export type Select = {\n`;
    namespaceOutput += selectFields;
    namespaceOutput += `\n  };\n\n`;
  }

  // 7. Validation types
  const validatedTypeName = parseValidatedDirective(model.documentation);
  if (validatedTypeName) {
    namespaceOutput += `  /**\n   * Validated ${model.name} type\n   */\n`;
    namespaceOutput += `  export type ${validatedTypeName} = ${model.name} & { __validated: true };\n\n`;
  }

  // 8. Basic utility types (always generate)
  namespaceOutput += `  /**\n   * Make all fields optional\n   */\n`;
  namespaceOutput += `  export type Partial = Partial<${model.name}>;\n\n`;
  namespaceOutput += `  /**\n   * Make all fields required\n   */\n`;
  namespaceOutput += `  export type Required = Required<${model.name}>;\n\n`;
  namespaceOutput += `  /**\n   * Make all fields readonly\n   */\n`;
  namespaceOutput += `  export type Readonly = Readonly<${model.name}>;\n\n`;

  // 9. Deep utility types (always generate)
  namespaceOutput += `  /**\n   * Deep partial (recursive)\n   */\n`;
  namespaceOutput += `  export type DeepPartial<T = ${model.name}> = {\n`;
  namespaceOutput += `    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];\n`;
  namespaceOutput += `  };\n\n`;
  namespaceOutput += `  /**\n   * Deep required (recursive)\n   */\n`;
  namespaceOutput += `  export type DeepRequired<T = ${model.name}> = {\n`;
  namespaceOutput += `    [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];\n`;
  namespaceOutput += `  };\n\n`;

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
  }
): string {
  const { jsDocComments = false, jsonTypeMapping = false } = options;
  let output = "";

  // Add global namespace declaration if jsonTypeMapping is enabled
  if (jsonTypeMapping) {
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
    dataModel?: DMMF.Datamodel;
  }
): string {
  const {
    typeMappings,
    jsDocComments = false,
    jsonTypeMapping = false,
    dataModel,
  } = options;

  const mappings = parseTypeMappings(undefined, typeMappings, jsonTypeMapping);
  let output = "";

  // Add global namespace declaration if jsonTypeMapping is enabled
  if (jsonTypeMapping) {
    output += `// This file must be a module, so we include an empty export.\n`;
    output += `export {};\n\n`;
    output += `/// <reference path="./prisma-json.d.ts" />\n\n`;
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
      const customType = parseTypeMappingFromComment(field.documentation, jsonTypeMapping);
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
    jsonTypeMapping
  );
  if (utilityTypes) {
    output += utilityTypes;
  }

  return output;
}
