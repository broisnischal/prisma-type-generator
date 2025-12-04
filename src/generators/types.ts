import type { DMMF } from "@prisma/generator-helper";
import {
  getTypeScriptType,
  extractJSDoc,
  parseTypeMappingFromComment,
  parseLooseEnumFromComment,
  parseTypeMappings,
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

  // Add import for PrismaType namespace if jsonTypeMapping is enabled
  if (jsonTypeMapping) {
    output += `import { PrismaType } from "./prisma-type";\n\n`;
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

    output += `${jsDoc}export interface ${model.name} {\n`;

    const scalarAndEnumFields = model.fields.filter((field) =>
      ["scalar", "enum"].includes(field.kind)
    );

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
  }

  return output;
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

  // Add import for PrismaType namespace if jsonTypeMapping is enabled
  if (jsonTypeMapping) {
    output += `import { PrismaType } from "./prisma-type";\n\n`;
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
  }
): string {
  const {
    typeMappings,
    jsDocComments = false,
    jsonTypeMapping = false,
  } = options;

  const mappings = parseTypeMappings(undefined, typeMappings, jsonTypeMapping);
  let output = "";

  // Add import for PrismaType namespace if jsonTypeMapping is enabled
  if (jsonTypeMapping) {
    output += `import { PrismaType } from "./prisma-type";\n\n`;
  }

  const comment = jsDocComments ? extractJSDoc(model.documentation) : "";
  const jsDoc = comment ? `/**\n * ${comment}\n */\n` : "";

  output += `${jsDoc}export interface ${model.name} {\n`;

  const scalarAndEnumFields = model.fields.filter((field) =>
    ["scalar", "enum"].includes(field.kind)
  );

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

  return output;
}
