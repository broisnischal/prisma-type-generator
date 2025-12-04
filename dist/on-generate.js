"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/on-generate.ts
var on_generate_exports = {};
__export(on_generate_exports, {
  onGenerate: () => onGenerate
});
module.exports = __toCommonJS(on_generate_exports);
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");

// src/config.ts
function parseConfig(config) {
  const splitFiles = parseBoolean(config.splitFiles, false);
  const splitBySchema = parseBoolean(config.splitBySchema, false);
  if (splitFiles && splitBySchema) {
    throw new Error(
      "Cannot use 'splitFiles' and 'splitBySchema' together. These options are mutually exclusive. Please use only one of them."
    );
  }
  return {
    global: parseBoolean(config.global, false),
    clear: parseBoolean(config.clear, false),
    enumOnly: parseBoolean(config.enumOnly, false),
    include: config.include ? String(config.include).trim() : void 0,
    exclude: config.exclude ? String(config.exclude).trim() : void 0,
    typeMappings: config.typeMappings ? String(config.typeMappings).trim() : void 0,
    jsonTypeMapping: parseBoolean(config.jsonTypeMapping, false),
    jsDocComments: parseBoolean(config.jsDocComments, false),
    splitFiles,
    barrelExports: parseBoolean(config.barrelExports, true),
    splitBySchema
  };
}
function parseBoolean(value, defaultValue) {
  if (!value) return defaultValue;
  return String(value).toLowerCase().trim() === "true";
}

// src/util.ts
function parseTypeMappings(mappings, defaultMappings, jsonTypeMapping) {
  const result = {
    Decimal: "number",
    Int: "number",
    Float: "number",
    BigInt: "number",
    DateTime: "Date",
    Boolean: "boolean",
    String: "string",
    Bytes: "Buffer",
    ...defaultMappings
  };
  if (jsonTypeMapping) {
    result.Json = "PrismaType.Json";
  } else {
    result.Json = "Record<string, unknown>";
  }
  if (!mappings) return result;
  const pairs = mappings.split(",");
  for (const pair of pairs) {
    const [key, value] = pair.split("=").map((s) => s.trim());
    if (key && value) {
      if (key === "Json" && jsonTypeMapping) {
        continue;
      }
      result[key] = value;
    }
  }
  return result;
}
function getTypeScriptType(type, typeMappings) {
  const mappings = typeMappings || parseTypeMappings();
  return mappings[type] || type;
}
function extractJSDoc(comment) {
  if (!comment) return "";
  return comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
}
function parseTypeMappingFromComment(comment, jsonTypeMapping) {
  if (!comment) return null;
  const cleanComment = comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
  const match = cleanComment.match(/@type\s+(\S+)\s*=\s*(.+)/);
  if (match && match[1] && match[2]) {
    const prismaType = match[1].trim();
    let typeName = match[2].trim();
    typeName = typeName.replace(/\s*\/\/.*$/, "").trim();
    if (prismaType === "Json" && jsonTypeMapping) {
      if (typeName === "any" || typeName === "Json") {
        return "PrismaType.Json";
      }
      if (typeName.startsWith("PrismaType.")) {
        return typeName;
      }
      const isSimpleIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(typeName);
      if (isSimpleIdentifier) {
        return `PrismaType.${typeName}`;
      }
      const typeKeywords = /* @__PURE__ */ new Set([
        "string",
        "number",
        "boolean",
        "any",
        "unknown",
        "never",
        "void",
        "Record",
        "Array",
        "Promise",
        "Partial",
        "Required",
        "Readonly",
        "Pick",
        "Omit"
      ]);
      let result = typeName;
      let offset = 0;
      const matches = Array.from(
        typeName.matchAll(/\b([A-Z][a-zA-Z0-9_$]*)\b/g)
      );
      for (const match2 of matches) {
        const identifier = match2[1];
        const matchIndex = match2.index;
        if (typeKeywords.has(identifier)) {
          continue;
        }
        const beforeMatch = result.substring(
          Math.max(0, matchIndex + offset - 11),
          matchIndex + offset
        );
        if (beforeMatch === "PrismaType.") {
          continue;
        }
        const before = result.substring(0, matchIndex + offset);
        const after = result.substring(matchIndex + offset + identifier.length);
        result = before + `PrismaType.${identifier}` + after;
        offset += 11;
      }
      return result;
    }
    return typeName;
  }
  const simpleMatch = cleanComment.match(/@type\s+(\S+)=(\S+)/);
  if (simpleMatch) {
    const prismaType = simpleMatch[1];
    const typeName = simpleMatch[2];
    if (prismaType === "Json" && jsonTypeMapping) {
      if (typeName === "any" || typeName === "Json") {
        return "PrismaType.Json";
      }
      if (typeName.startsWith("PrismaType.")) {
        return typeName;
      }
      const isSimpleIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(typeName);
      if (isSimpleIdentifier) {
        return `PrismaType.${typeName}`;
      }
      const typeKeywords = /* @__PURE__ */ new Set([
        "string",
        "number",
        "boolean",
        "any",
        "unknown",
        "never",
        "void",
        "Record",
        "Array",
        "Promise",
        "Partial",
        "Required",
        "Readonly",
        "Pick",
        "Omit"
      ]);
      let result = typeName;
      let offset = 0;
      const matches = Array.from(
        typeName.matchAll(/\b([A-Z][a-zA-Z0-9_$]*)\b/g)
      );
      for (const match2 of matches) {
        const identifier = match2[1];
        const matchIndex = match2.index;
        if (typeKeywords.has(identifier)) {
          continue;
        }
        const beforeMatch = result.substring(
          Math.max(0, matchIndex + offset - 11),
          matchIndex + offset
        );
        if (beforeMatch === "PrismaType.") {
          continue;
        }
        const before = result.substring(0, matchIndex + offset);
        const after = result.substring(matchIndex + offset + identifier.length);
        result = before + `PrismaType.${identifier}` + after;
        offset += 11;
      }
      return result;
    }
    return typeName;
  }
  return null;
}
function parseLooseEnumFromComment(comment) {
  if (!comment) return null;
  const cleanComment = comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
  const strictMatch = cleanComment.match(/@type\s+!\s*\[(.*?)\]/);
  const looseMatch = cleanComment.match(/@type\s+\[(.*?)\]/);
  if (strictMatch) {
    const valuesStr = strictMatch[1];
    const values = valuesStr.split(",").map((v) => v.trim().replace(/^["']|["']$/g, "")).filter((v) => v.length > 0);
    return { strict: true, values };
  }
  if (looseMatch) {
    const valuesStr = looseMatch[1];
    const values = valuesStr.split(",").map((v) => v.trim().replace(/^["']|["']$/g, "")).filter((v) => v.length > 0);
    return { strict: false, values };
  }
  return null;
}
function shouldIncludeModel(modelName, include, exclude) {
  if (exclude) {
    const excludeList = exclude.split(",").map((s) => s.trim());
    if (excludeList.includes(modelName)) {
      return false;
    }
  }
  if (include) {
    const includeList = include.split(",").map((s) => s.trim());
    return includeList.includes(modelName);
  }
  return true;
}
function modelToFileName(modelName) {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}
function getSchemaFileNameForModel(modelName, schemaFiles) {
  const baseNames = [];
  if (schemaFiles && schemaFiles.length > 0) {
    schemaFiles.map((file) => file.replace(/\.prisma$/, "").toLowerCase()).filter((name) => name !== "schema").forEach((name) => baseNames.push(name));
  }
  for (const baseName of baseNames) {
    const prefix = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    if (modelName.startsWith(prefix)) {
      return baseName;
    }
  }
  const match = modelName.match(/^([A-Z][a-z]+)/);
  if (match) {
    const prefix = match[1].toLowerCase();
    if (baseNames.length > 0 && baseNames.includes(prefix)) {
      return prefix;
    }
    if (["post", "user", "test"].includes(prefix)) {
      return prefix;
    }
  }
  return "index";
}
function groupModelsBySchemaFile(models, schemaFiles) {
  const groups = /* @__PURE__ */ new Map();
  for (const model of models) {
    const fileName = getSchemaFileNameForModel(model.name, schemaFiles);
    if (!groups.has(fileName)) {
      groups.set(fileName, []);
    }
    groups.get(fileName).push(model);
  }
  return groups;
}
function groupEnumsBySchemaFile(enums, schemaFiles) {
  const groups = /* @__PURE__ */ new Map();
  for (const enumType of enums) {
    const fileName = getSchemaFileNameForModel(enumType.name, schemaFiles);
    if (!groups.has(fileName)) {
      groups.set(fileName, []);
    }
    groups.get(fileName).push(enumType);
  }
  return groups;
}
function generatePrismaTypeNamespace() {
  return `/**
 * PrismaType namespace for custom type mappings
 * This namespace is used when jsonTypeMapping is enabled
 * 
 * IMPORTANT: To extend this namespace with your own interfaces (like UserPreferences),
 * create a file named 'prisma-json.ts' in your project and extend the global namespace:
 * 
 * // prisma-json.ts
 * // This file must be a module, so we include an empty export.
 * export {};
 * 
 * declare global {
 *   namespace PrismaType {
 *     interface Json {
 *       [key: string]: any; // Customize as needed
 *     }
 *     interface UserPreferences {
 *       theme: "light" | "dark";
 *       language: "en" | "es";
 *     }
 *   }
 * }
 * 
 * Make sure your prisma-json.ts file is included in your tsconfig.json 'include' array.
 * 
 * Then in your Prisma schema:
 * /// @type Json=UserPreferences
 * preferences Json  // Will use PrismaType.UserPreferences via namespace merging
 * 
 * Or use inline types:
 * /// @type Json=any
 * metadata Json  // Uses PrismaType.Json
 */
// This file must be a module, so we include an empty export.
export {};

declare global {
  namespace PrismaType {
    interface Json {
      [key: string]: any;
    }
  }
}
`;
}

// src/generators/types.ts
function generateTypes(options) {
  const {
    dataModel,
    typeMappings,
    jsDocComments = false,
    include,
    exclude,
    models,
    enums,
    jsonTypeMapping = false
  } = options;
  const mappings = parseTypeMappings(void 0, typeMappings, jsonTypeMapping);
  let output = "";
  if (jsonTypeMapping) {
    output += `// This file must be a module, so we include an empty export.
`;
    output += `export {};

`;
    output += `/// <reference path="./prisma-json.d.ts" />

`;
  }
  const modelsToGenerate = models || dataModel.models;
  const enumsToGenerate = enums || dataModel.enums;
  for (const enumType of enumsToGenerate) {
    const comment = jsDocComments ? extractJSDoc(enumType.documentation) : "";
    const jsDoc = comment ? `/**
 * ${comment}
 */
` : "";
    output += `${jsDoc}export type ${enumType.name} = ${enumType.values.map((v) => `"${v.name}"`).join(" | ")};

`;
    output += `export declare const ${enumType.name}: {
`;
    for (const enumValue of enumType.values) {
      output += `  readonly ${enumValue.name}: "${enumValue.name}";
`;
    }
    output += "};\n\n";
  }
  for (const model of modelsToGenerate) {
    if (include && !include.split(",").map((s) => s.trim()).includes(model.name)) {
      continue;
    }
    if (exclude && exclude.split(",").map((s) => s.trim()).includes(model.name)) {
      continue;
    }
    const comment = jsDocComments ? extractJSDoc(model.documentation) : "";
    const jsDoc = comment ? `/**
 * ${comment}
 */
` : "";
    output += `${jsDoc}export interface ${model.name} {
`;
    const scalarAndEnumFields = model.fields.filter(
      (field) => ["scalar", "enum"].includes(field.kind)
    );
    for (const field of scalarAndEnumFields) {
      const fieldComment = jsDocComments ? extractJSDoc(field.documentation) : "";
      let typeScriptType;
      const looseEnum = parseLooseEnumFromComment(field.documentation);
      if (looseEnum && field.type === "String") {
        if (looseEnum.strict) {
          typeScriptType = looseEnum.values.map((v) => `"${v}"`).join(" | ");
        } else {
          const literalUnion = looseEnum.values.map((v) => `"${v}"`).join(" | ");
          typeScriptType = `${literalUnion} | (string & {})`;
        }
      } else {
        const customType = parseTypeMappingFromComment(field.documentation, jsonTypeMapping);
        if (customType) {
          typeScriptType = customType;
        } else {
          typeScriptType = getTypeScriptType(field.type, mappings);
        }
      }
      const nullability = field.isRequired ? "" : "| null";
      const list = field.isList ? "[]" : "";
      const fieldJsDoc = fieldComment ? `  /**
   * ${fieldComment}
   */
` : "";
      output += `${fieldJsDoc}  ${field.name}: ${typeScriptType}${nullability}${list};
`;
    }
    output += "}\n\n";
  }
  return output;
}
function generateEnumType(enumType, options) {
  const { jsDocComments = false, jsonTypeMapping = false } = options;
  let output = "";
  if (jsonTypeMapping) {
    output += `// This file must be a module, so we include an empty export.
`;
    output += `export {};

`;
    output += `/// <reference path="./prisma-json.d.ts" />

`;
  }
  const comment = jsDocComments ? extractJSDoc(enumType.documentation) : "";
  const jsDoc = comment ? `/**
 * ${comment}
 */
` : "";
  output += `${jsDoc}export type ${enumType.name} = ${enumType.values.map((v) => `"${v.name}"`).join(" | ")};

`;
  output += `export declare const ${enumType.name}: {
`;
  for (const enumValue of enumType.values) {
    output += `  readonly ${enumValue.name}: "${enumValue.name}";
`;
  }
  output += "};\n\n";
  return output;
}
function generateModelType(model, options) {
  const {
    typeMappings,
    jsDocComments = false,
    jsonTypeMapping = false
  } = options;
  const mappings = parseTypeMappings(void 0, typeMappings, jsonTypeMapping);
  let output = "";
  if (jsonTypeMapping) {
    output += `// This file must be a module, so we include an empty export.
`;
    output += `export {};

`;
    output += `/// <reference path="./prisma-json.d.ts" />

`;
  }
  const comment = jsDocComments ? extractJSDoc(model.documentation) : "";
  const jsDoc = comment ? `/**
 * ${comment}
 */
` : "";
  output += `${jsDoc}export interface ${model.name} {
`;
  const scalarAndEnumFields = model.fields.filter(
    (field) => ["scalar", "enum"].includes(field.kind)
  );
  for (const field of scalarAndEnumFields) {
    const fieldComment = jsDocComments ? extractJSDoc(field.documentation) : "";
    let typeScriptType;
    const looseEnum = parseLooseEnumFromComment(field.documentation);
    if (looseEnum && field.type === "String") {
      if (looseEnum.strict) {
        typeScriptType = looseEnum.values.map((v) => `"${v}"`).join(" | ");
      } else {
        const literalUnion = looseEnum.values.map((v) => `"${v}"`).join(" | ");
        typeScriptType = `${literalUnion} | (string & {})`;
      }
    } else {
      const customType = parseTypeMappingFromComment(field.documentation, jsonTypeMapping);
      if (customType) {
        typeScriptType = customType;
      } else {
        typeScriptType = getTypeScriptType(field.type, mappings);
      }
    }
    const nullability = field.isRequired ? "" : "| null";
    const list = field.isList ? "[]" : "";
    const fieldJsDoc = fieldComment ? `  /**
   * ${fieldComment}
   */
` : "";
    output += `${fieldJsDoc}  ${field.name}: ${typeScriptType}${nullability}${list};
`;
  }
  output += "}\n\n";
  return output;
}

// src/on-generate.ts
async function onGenerate(options) {
  const config = parseConfig(options.generator.config);
  const outputDir = options.generator.output?.value ?? "../generated/types";
  if (config.clear && (0, import_node_fs.existsSync)(outputDir)) {
    (0, import_node_fs.rmSync)(outputDir, { recursive: true, force: true });
  }
  (0, import_node_fs.mkdirSync)(outputDir, { recursive: true });
  const dataModel = options.dmmf.datamodel;
  const typeMappings = config.typeMappings || config.jsonTypeMapping ? parseTypeMappings(config.typeMappings, void 0, config.jsonTypeMapping) : void 0;
  if (config.jsonTypeMapping) {
    const prismaTypeContent = generatePrismaTypeNamespace();
    const prismaTypePath = (0, import_node_path.join)(outputDir, "prisma-json.d.ts");
    (0, import_node_fs.writeFileSync)(prismaTypePath, prismaTypeContent);
  }
  const filteredModels = dataModel.models.filter(
    (model) => shouldIncludeModel(model.name, config.include, config.exclude)
  );
  const schemaPath = options.schemaPath || "";
  const schemaFiles = [];
  const files = [];
  if (config.splitBySchema) {
    const modelGroups = config.enumOnly ? /* @__PURE__ */ new Map() : groupModelsBySchemaFile(filteredModels, schemaFiles);
    const enumGroups = groupEnumsBySchemaFile(dataModel.enums, schemaFiles);
    const allFileNames = /* @__PURE__ */ new Set();
    if (!config.enumOnly) {
      modelGroups.forEach((_, fileName) => allFileNames.add(fileName));
    }
    enumGroups.forEach((_, fileName) => allFileNames.add(fileName));
    for (const fileName of allFileNames) {
      const fileModels = config.enumOnly ? [] : modelGroups.get(fileName) || [];
      const fileEnums = enumGroups.get(fileName) || [];
      const typesContent = generateTypes({
        dataModel,
        typeMappings,
        jsDocComments: config.jsDocComments ?? false,
        models: fileModels,
        enums: fileEnums,
        jsonTypeMapping: config.jsonTypeMapping ?? false
      });
      let finalContent = typesContent;
      if (config.global) {
        finalContent += "declare global {\n";
        for (const model of fileModels) {
          finalContent += `  export type T${model.name} = ${model.name};
`;
        }
        for (const enumType of fileEnums) {
          finalContent += `  export type T${enumType.name} = ${enumType.name};
`;
        }
        finalContent += "}\n\n";
      }
      files.push({
        name: fileName === "index" ? "index" : fileName,
        content: finalContent
      });
    }
    for (const file of files) {
      const filePath = (0, import_node_path.join)(outputDir, `${file.name}.ts`);
      (0, import_node_fs.writeFileSync)(filePath, file.content);
    }
    if (config.barrelExports && !config.global) {
      const exports2 = [];
      for (const fileName of Array.from(allFileNames).sort()) {
        exports2.push(`export * from "./${fileName}";`);
      }
      const indexContent = exports2.join("\n") + "\n";
      (0, import_node_fs.writeFileSync)((0, import_node_path.join)(outputDir, "index.ts"), indexContent);
    }
    return;
  }
  if (config.splitFiles) {
    if (!config.enumOnly) {
      for (const model of filteredModels) {
        let modelContent = generateModelType(model, {
          typeMappings,
          jsDocComments: config.jsDocComments ?? false,
          jsonTypeMapping: config.jsonTypeMapping ?? false
        });
        if (config.global) {
          modelContent += "declare global {\n";
          modelContent += `  export type T${model.name} = ${model.name};
`;
          modelContent += "}\n\n";
        }
        files.push({
          name: modelToFileName(model.name),
          content: modelContent
        });
      }
    }
    for (const enumType of dataModel.enums) {
      let enumContent = generateEnumType(enumType, {
        jsDocComments: config.jsDocComments ?? false,
        jsonTypeMapping: config.jsonTypeMapping ?? false
      });
      if (config.global) {
        enumContent += "declare global {\n";
        enumContent += `  export type T${enumType.name} = ${enumType.name};
`;
        enumContent += "}\n\n";
      }
      files.push({
        name: modelToFileName(enumType.name),
        content: enumContent
      });
    }
  } else {
    if (!config.enumOnly) {
      const typesContent = generateTypes({
        dataModel: {
          ...dataModel,
          models: filteredModels
        },
        typeMappings,
        jsDocComments: config.jsDocComments ?? false,
        include: config.include,
        exclude: config.exclude,
        jsonTypeMapping: config.jsonTypeMapping ?? false
      });
      let finalTypesContent = typesContent;
      if (config.global) {
        finalTypesContent += "declare global {\n";
        for (const model of filteredModels) {
          finalTypesContent += `  export type T${model.name} = ${model.name};
`;
        }
        for (const enumType of dataModel.enums) {
          finalTypesContent += `  export type T${enumType.name} = ${enumType.name};
`;
        }
        finalTypesContent += "}\n\n";
      }
      files.push({
        name: "prisma.d.ts",
        content: finalTypesContent
      });
    } else {
      const enumContent = generateTypes({
        dataModel: {
          ...dataModel,
          models: []
        },
        typeMappings,
        jsDocComments: config.jsDocComments ?? false,
        include: config.include,
        exclude: config.exclude,
        jsonTypeMapping: config.jsonTypeMapping ?? false
      });
      if (config.global) {
        let globalContent = enumContent;
        globalContent += "declare global {\n";
        for (const enumType of dataModel.enums) {
          globalContent += `  export type T${enumType.name} = ${enumType.name};
`;
        }
        globalContent += "}\n\n";
        files.push({
          name: "prisma.d.ts",
          content: globalContent
        });
      } else {
        files.push({
          name: "prisma.d.ts",
          content: enumContent
        });
      }
    }
  }
  for (const file of files) {
    const fileName = file.name.endsWith(".ts") || file.name.endsWith(".d.ts") ? file.name : `${file.name}.ts`;
    const filePath = (0, import_node_path.join)(outputDir, fileName);
    (0, import_node_fs.writeFileSync)(filePath, file.content);
  }
  if (config.barrelExports && !config.global && files.length > 1) {
    const exports2 = [];
    const fileExports = files.map((f) => {
      const baseName = f.name.replace(".ts", "").replace(".d.ts", "");
      return `export * from "./${baseName}";`;
    }).join("\n");
    exports2.push(fileExports);
    (0, import_node_fs.writeFileSync)((0, import_node_path.join)(outputDir, "index.ts"), exports2.join("\n") + "\n");
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  onGenerate
});
