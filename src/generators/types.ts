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


  if (jsonTypeMapping) {
    output += `// This file must be a module, so we include an empty export.\n`;
    output += `export {};\n\n`;
    output += `/// <reference path="./prisma-json.d.ts" />\n\n`;
  }

  const modelsToGenerate = models || dataModel.models;
  let enumsToGenerate = enums || dataModel.enums;

  if (!enums && (include || exclude)) {
    enumsToGenerate = enumsToGenerate.filter((enumType) => {
      if (exclude) {
        const excludeList = exclude.split(",").map((s) => s.trim());
        if (excludeList.includes(enumType.name)) {
          return false;
        }
      }
      if (include) {
        const includeList = include.split(",").map((s) => s.trim());
        return includeList.includes(enumType.name);
      }
      return true;
    });
  }

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

  for (const model of modelsToGenerate) {
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

    const omitDirective = parseOmitDirective(model.documentation);
    const omitFields = omitDirective?.fields || [];
    const customTypeName = omitDirective?.typeName;

    output += `${jsDoc}export interface ${model.name} {\n`;

    const scalarAndEnumFields = model.fields.filter((field) =>
      ["scalar", "enum"].includes(field.kind)
    );

    for (const field of scalarAndEnumFields) {
      const fieldComment = jsDocComments
        ? extractJSDoc(field.documentation)
        : "";

      let typeScriptType: string;

      const looseEnum = parseLooseEnumFromComment(field.documentation);
      if (looseEnum && field.type === "String") {
        if (looseEnum.strict) {
          typeScriptType = looseEnum.values.map((v) => `"${v}"`).join(" | ");
        } else {

          const literalUnion = looseEnum.values.map((v) => `"${v}"`).join(" | ");
          typeScriptType = `${literalUnion} | (string & {})`;
        }
      } else {
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

  const usedEnums = new Set<string>();
  const scalarAndEnumFields = model.fields.filter((field) =>
    ["scalar", "enum"].includes(field.kind)
  );

  const allEnumNames = new Set<string>();
  if (dataModel?.enums) {
    for (const enumType of dataModel.enums) {
      allEnumNames.add(enumType.name);
    }
  }

  for (const field of scalarAndEnumFields) {
    if (field.kind === "enum") {
      usedEnums.add(field.type);
    }
  }

  const referencedModels = collectReferencedModels(model, modelFileMap, currentFileName);

  if (enumFileMap && usedEnums.size > 0) {
    for (const enumName of usedEnums) {
      const enumFileName = enumFileMap.get(enumName);
      if (enumFileName && enumFileName !== currentFileName) {
        imports.add(`import type { ${enumName} } from "./${enumFileName}";`);
      }
    }
  }

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

function generateUtilityTypes(
  model: DMMF.Model,
  dataModel: DMMF.Datamodel | undefined,
  omitDirective: { fields: string[]; typeName?: string } | null,
  jsonTypeMapping?: boolean,
  modelFileMap?: Map<string, string>,
  currentFileName?: string,
  basicUtilityTypes: boolean = true
): string {

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


  if (omitDirective && omitDirective.fields.length > 0) {
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

  if (hasPickTypes) {
    const pickUnion = pickDirective.fields.map((f) => `"${f}"`).join(" | ");
    const typeName = pickDirective.typeName || `Pick${pickDirective.fields.map((f) => f.charAt(0).toUpperCase() + f.slice(1)).join("")}`;
    namespaceOutput += `  /**\n   * ${model.name} with only ${pickDirective.fields.join(", ")}\n   */\n`;
    namespaceOutput += `  export type ${typeName} = Pick<${model.name}, ${pickUnion}>;\n\n`;
  }

  if (hasInputTypes && inputTypes) {
    for (const inputTypeName of inputTypes) {
      if (inputTypeName === "CreateInput") {
        const excludeFields = model.fields
          .filter((f) => {
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
        namespaceOutput += `  /**\n   * Custom input type: ${inputTypeName}\n   */\n`;
        namespaceOutput += `  export type ${inputTypeName} = _Partial<Omit<${model.name}, "id">>;\n\n`;
      }
    }
  }


  if (hasGroupTypes && groups) {
    for (const [groupName, fields] of groups.entries()) {
      const pickUnion = fields.map((f) => `"${f}"`).join(" | ");
      const typeName = `${groupName.charAt(0).toUpperCase() + groupName.slice(1)}Fields`;
      namespaceOutput += `  /**\n   * ${groupName} fields: ${fields.join(", ")}\n   */\n`;
      namespaceOutput += `  export type ${typeName} = Pick<${model.name}, ${pickUnion}>;\n\n`;
    }
  }

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

  if (hasSelectTypes) {
    const selectFields = allFieldNames.map((f) => `    ${f}?: boolean;`).join("\n");
    namespaceOutput += `  /**\n   * Select type for Prisma queries\n   */\n`;
    namespaceOutput += `  export type Select = {\n`;
    namespaceOutput += selectFields;
    namespaceOutput += `\n  };\n\n`;
  }

  if (hasValidatedTypes) {
    const validatedTypeName = parseValidatedDirective(model.documentation);
    if (validatedTypeName) {
      namespaceOutput += `  /**\n   * Validated ${model.name} type\n   */\n`;
      namespaceOutput += `  export type ${validatedTypeName} = ${model.name} & { __validated: true };\n\n`;
    }
  }

  if (basicUtilityTypes) {
    namespaceOutput += `  /**\n   * Make all fields optional\n   */\n`;
    namespaceOutput += `  export type Partial = _Partial<${model.name}>;\n\n`;
    namespaceOutput += `  /**\n   * Make all fields required\n   */\n`;
    namespaceOutput += `  export type Required = _Required<${model.name}>;\n\n`;
    namespaceOutput += `  /**\n   * Make all fields readonly\n   */\n`;
    namespaceOutput += `  export type Readonly = _Readonly<${model.name}>;\n\n`;

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
    enumFileMap?: Map<string, string>;
    modelFileMap?: Map<string, string>;
    currentFileName?: string;
    skipModuleHeader?: boolean;
    basicUtilityTypes?: boolean;
    skipImports?: boolean;
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

  if (jsonTypeMapping && !skipModuleHeader) {
    output += `// This file must be a module, so we include an empty export.\n`;
    output += `export {};\n\n`;
    output += `/// <reference path="./prisma-json.d.ts" />\n\n`;
  }

  const usedEnums = new Set<string>();
  const scalarAndEnumFields = model.fields.filter((field) =>
    ["scalar", "enum"].includes(field.kind)
  );

  const allEnumNames = new Set<string>();
  if (dataModel?.enums) {
    for (const enumType of dataModel.enums) {
      allEnumNames.add(enumType.name);
    }
  }

  for (const field of scalarAndEnumFields) {
    if (field.kind === "enum") {
      usedEnums.add(field.type);
    }
    else if (field.kind === "scalar") {
      const looseEnum = parseLooseEnumFromComment(field.documentation);
      if (!looseEnum && field.type && allEnumNames.has(field.type)) {
        usedEnums.add(field.type);
      }
    }
  }

  const referencedModels = collectReferencedModels(model, modelFileMap, currentFileName);

  if (!skipImports) {
    const imports: string[] = [];
    if (enumFileMap && currentFileName && usedEnums.size > 0) {
      for (const enumName of usedEnums) {
        const enumFileName = enumFileMap.get(enumName);

        if (enumFileName && enumFileName !== currentFileName) {
          imports.push(`import type { ${enumName} } from "./${enumFileName}";`);
        }

      }
    }

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

  const omitDirective = parseOmitDirective(model.documentation);
  const omitFields = omitDirective?.fields || [];
  const customTypeName = omitDirective?.typeName;

  output += `${jsDoc}export interface ${model.name} {\n`;

  for (const field of scalarAndEnumFields) {
    const fieldComment = jsDocComments
      ? extractJSDoc(field.documentation)
      : "";

    let typeScriptType: string;

    const looseEnum = parseLooseEnumFromComment(field.documentation);
    if (looseEnum && field.type === "String") {
      if (looseEnum.strict) {
        typeScriptType = looseEnum.values.map((v) => `"${v}"`).join(" | ");
      } else {

        const literalUnion = looseEnum.values.map((v) => `"${v}"`).join(" | ");
        typeScriptType = `${literalUnion} | (string & {})`;
      }
    } else {
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
