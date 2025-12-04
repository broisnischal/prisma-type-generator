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
    global: parseBoolean(config.global, true),
    clear: parseBoolean(config.clear, true),
    enumOnly: parseBoolean(config.enumOnly, false),
    include: config.include ? String(config.include).trim() : void 0,
    exclude: config.exclude ? String(config.exclude).trim() : void 0,
    typeMappings: config.typeMappings ? String(config.typeMappings).trim() : void 0,
    jsonTypeMapping: parseBoolean(config.jsonTypeMapping, false),
    namespaceName: config.namespaceName ? String(config.namespaceName).trim() : "PrismaType",
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
function parseTypeMappings(mappings, defaultMappings, jsonTypeMapping, namespaceName = "PrismaType") {
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
    result.Json = `${namespaceName}.Json`;
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
function parseOmitDirective(comment) {
  if (!comment) return null;
  const cleanComment = comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
  const match = cleanComment.match(/@omit\s+(.+?)(?:\s+([A-Z][a-zA-Z0-9]*))?(?=\s*@|\s*$)/);
  if (match && match[1]) {
    const fieldsStr = match[1].trim();
    const typeName = match[2]?.trim();
    const fields = fieldsStr.split(",").map((f) => f.trim()).filter((f) => f.length > 0);
    if (fields.length > 0) {
      return {
        fields,
        typeName: typeName || void 0
      };
    }
  }
  return null;
}
function parsePickDirective(comment) {
  if (!comment) return null;
  const cleanComment = comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
  const match = cleanComment.match(/@pick\s+(.+?)(?:\s+([A-Z][a-zA-Z0-9]*))?(?=\s*@|\s*$)/);
  if (match && match[1]) {
    const fieldsStr = match[1].trim();
    const typeName = match[2]?.trim();
    const fields = fieldsStr.split(",").map((f) => f.trim()).filter((f) => f.length > 0);
    if (fields.length > 0) {
      return {
        fields,
        typeName: typeName || void 0
      };
    }
  }
  return null;
}
function parseInputDirective(comment) {
  if (!comment) return null;
  const cleanComment = comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
  const match = cleanComment.match(/@input(?:model)?(?:\s+(.+?))?(?=\s*@|\s*$)/);
  if (match) {
    if (match[1]) {
      const names = match[1].split(",").map((n) => n.trim()).filter((n) => n.length > 0);
      return names.length > 0 ? names : null;
    }
    return ["CreateInput", "UpdateInput"];
  }
  return null;
}
function parseGroupDirective(comment) {
  if (!comment) return null;
  const cleanComment = comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
  const groups = /* @__PURE__ */ new Map();
  const matches = Array.from(
    cleanComment.matchAll(/@group\s+(\w+)\s+(.+?)(?=\s*@|\s*$)/g)
  );
  for (const match of matches) {
    const groupName = match[1].trim();
    const fieldsStr = match[2].trim();
    const fields = fieldsStr.split(",").map((f) => f.trim()).filter((f) => f.length > 0);
    if (groupName && fields.length > 0) {
      groups.set(groupName, fields);
    }
  }
  return groups.size > 0 ? groups : null;
}
function parseWithDirective(comment) {
  if (!comment) return null;
  const cleanComment = comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
  const match = cleanComment.match(/@with\s+(.+?)(?:\s+([A-Z][a-zA-Z0-9]*))?(?=\s*@|\s*$)/);
  if (match && match[1]) {
    const relationsStr = match[1].trim();
    const typeName = match[2]?.trim();
    const relations = relationsStr.split(",").map((r) => r.trim()).filter((r) => r.length > 0);
    if (relations.length > 0) {
      return {
        relations,
        typeName: typeName || void 0
      };
    }
  }
  return null;
}
function parseSelectDirective(comment) {
  if (!comment) return false;
  const cleanComment = comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
  return /@select(?=\s|$|@)/.test(cleanComment);
}
function parseValidatedDirective(comment) {
  if (!comment) return null;
  const cleanComment = comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
  const match = cleanComment.match(/@validated(?:\s+([A-Z][a-zA-Z0-9]*))?(?=\s*@|\s*$)/);
  if (match) {
    return match[1]?.trim() || "Validated";
  }
  return null;
}
function generateOmitTypeName(omitFields) {
  const timestampFields = /* @__PURE__ */ new Set(["createdAt", "updatedAt"]);
  const isTimestamps = omitFields.every((f) => timestampFields.has(f));
  if (isTimestamps && omitFields.length === 2) {
    return "WithoutTimestamps";
  }
  if (omitFields.length === 1) {
    const field = omitFields[0];
    const semanticNames = {
      password: "WithoutPassword",
      deletedAt: "WithoutDeletedAt",
      id: "WithoutId"
    };
    return semanticNames[field] || `Without${field.charAt(0).toUpperCase() + field.slice(1)}`;
  }
  const timestamps = omitFields.filter((f) => timestampFields.has(f));
  const others = omitFields.filter((f) => !timestampFields.has(f));
  const parts = [];
  if (timestamps.length === 2) {
    parts.push("Timestamps");
  } else if (timestamps.length > 0) {
    parts.push(
      ...timestamps.map((f) => f.charAt(0).toUpperCase() + f.slice(1))
    );
  }
  if (others.length > 0) {
    parts.push(...others.map((f) => f.charAt(0).toUpperCase() + f.slice(1)));
  }
  const connector = parts.length > 1 ? "And" : "";
  return `Without${parts.join(connector)}`;
}
function parseTypeMappingFromComment(comment, jsonTypeMapping, namespaceName = "PrismaType") {
  if (!comment) return null;
  const cleanComment = comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
  if (cleanComment.startsWith("!")) {
    const typeDef = cleanComment.substring(1).trim();
    if (typeDef.startsWith("{")) {
      let braceCount = 0;
      let endIndex = -1;
      for (let i = 0; i < typeDef.length; i++) {
        if (typeDef[i] === "{") braceCount++;
        if (typeDef[i] === "}") {
          braceCount--;
          if (braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }
      if (endIndex > 0) {
        return typeDef.substring(0, endIndex).trim();
      }
    }
    if (typeDef.startsWith("[")) {
      let bracketCount = 0;
      let endIndex = -1;
      for (let i = 0; i < typeDef.length; i++) {
        if (typeDef[i] === "[") bracketCount++;
        if (typeDef[i] === "]") {
          bracketCount--;
          if (bracketCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }
      if (endIndex > 0) {
        return typeDef.substring(0, endIndex).trim();
      }
    }
    return typeDef;
  }
  const match = cleanComment.match(/@type\s+(\S+)\s*=\s*(.+)/);
  if (match && match[1] && match[2]) {
    const prismaType = match[1].trim();
    let typeName = match[2].trim();
    typeName = typeName.replace(/\s*\/\/.*$/, "").trim();
    if (typeName.startsWith("!")) {
      const inlineType = typeName.substring(1).trim();
      if (inlineType.startsWith("{")) {
        let braceCount = 0;
        let endIndex = -1;
        for (let i = 0; i < inlineType.length; i++) {
          if (inlineType[i] === "{") braceCount++;
          if (inlineType[i] === "}") {
            braceCount--;
            if (braceCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
        if (endIndex > 0) {
          return inlineType.substring(0, endIndex).trim();
        }
      }
      if (inlineType.startsWith("[")) {
        let bracketCount = 0;
        let endIndex = -1;
        for (let i = 0; i < inlineType.length; i++) {
          if (inlineType[i] === "[") bracketCount++;
          if (inlineType[i] === "]") {
            bracketCount--;
            if (bracketCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
        if (endIndex > 0) {
          return inlineType.substring(0, endIndex).trim();
        }
      }
      return inlineType;
    }
    if (prismaType === "Json" && jsonTypeMapping) {
      if (typeName === "any" || typeName === "Json") {
        return `${namespaceName}.Json`;
      }
      if (typeName.startsWith(`${namespaceName}.`)) {
        return typeName;
      }
      const isSimpleIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(typeName);
      if (isSimpleIdentifier) {
        return `${namespaceName}.${typeName}`;
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
      const namespacePrefix = `${namespaceName}.`;
      const namespacePrefixLength = namespacePrefix.length;
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
          Math.max(0, matchIndex + offset - namespacePrefixLength),
          matchIndex + offset
        );
        if (beforeMatch === namespacePrefix) {
          continue;
        }
        const before = result.substring(0, matchIndex + offset);
        const after = result.substring(matchIndex + offset + identifier.length);
        result = before + `${namespacePrefix}${identifier}` + after;
        offset += namespacePrefixLength;
      }
      return result;
    }
    return typeName;
  }
  const simpleMatch = cleanComment.match(/@type\s+(\S+)=(\S+)/);
  if (simpleMatch) {
    const prismaType = simpleMatch[1];
    let typeName = simpleMatch[2];
    if (typeName.startsWith("!")) {
      const inlineType = typeName.substring(1).trim();
      if (inlineType.startsWith("{")) {
        let braceCount = 0;
        let endIndex = -1;
        for (let i = 0; i < inlineType.length; i++) {
          if (inlineType[i] === "{") braceCount++;
          if (inlineType[i] === "}") {
            braceCount--;
            if (braceCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
        if (endIndex > 0) {
          return inlineType.substring(0, endIndex).trim();
        }
      }
      if (inlineType.startsWith("[")) {
        let bracketCount = 0;
        let endIndex = -1;
        for (let i = 0; i < inlineType.length; i++) {
          if (inlineType[i] === "[") bracketCount++;
          if (inlineType[i] === "]") {
            bracketCount--;
            if (bracketCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
        if (endIndex > 0) {
          return inlineType.substring(0, endIndex).trim();
        }
      }
      return inlineType;
    }
    if (prismaType === "Json" && jsonTypeMapping) {
      if (typeName === "any" || typeName === "Json") {
        return `${namespaceName}.Json`;
      }
      if (typeName.startsWith(`${namespaceName}.`)) {
        return typeName;
      }
      const isSimpleIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(typeName);
      if (isSimpleIdentifier) {
        return `${namespaceName}.${typeName}`;
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
      const namespacePrefix = `${namespaceName}.`;
      const namespacePrefixLength = namespacePrefix.length;
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
          Math.max(0, matchIndex + offset - namespacePrefixLength),
          matchIndex + offset
        );
        if (beforeMatch === namespacePrefix) {
          continue;
        }
        const before = result.substring(0, matchIndex + offset);
        const after = result.substring(matchIndex + offset + identifier.length);
        result = before + `${namespacePrefix}${identifier}` + after;
        offset += namespacePrefixLength;
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
function shouldIncludeEnum(enumName, include, exclude) {
  if (exclude) {
    const excludeList = exclude.split(",").map((s) => s.trim());
    if (excludeList.includes(enumName)) {
      return false;
    }
  }
  if (include) {
    const includeList = include.split(",").map((s) => s.trim());
    return includeList.includes(enumName);
  }
  return true;
}
function modelToFileName(modelName) {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}
function inferSchemaFileNames(items) {
  const schemaNames = /* @__PURE__ */ new Set();
  for (const item of items) {
    const match = item.name.match(/^([A-Z][a-z]+)/);
    if (match) {
      const prefix = match[1].toLowerCase();
      schemaNames.add(prefix);
    }
  }
  return schemaNames;
}
function getSchemaFileNameForModel(modelName, schemaFiles, inferredSchemaNames) {
  const baseNames = [];
  if (schemaFiles && schemaFiles.length > 0) {
    schemaFiles.map((file) => file.replace(/\.prisma$/, "").toLowerCase()).filter((name) => name !== "schema").forEach((name) => baseNames.push(name));
  }
  const allSchemaNames = inferredSchemaNames || /* @__PURE__ */ new Set();
  if (allSchemaNames.size > 0) {
    for (const schemaName of allSchemaNames) {
      baseNames.push(schemaName);
    }
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
    if (baseNames.length > 0) {
      for (const baseName of baseNames) {
        if (baseName === prefix || baseName.startsWith(prefix) || prefix.startsWith(baseName)) {
          return baseName;
        }
      }
    }
    if (allSchemaNames.size > 0 && allSchemaNames.has(prefix)) {
      return prefix;
    }
  }
  return null;
}
function groupModelsBySchemaFile(models, schemaFiles, inferredSchemaNames) {
  const groups = /* @__PURE__ */ new Map();
  for (const model of models) {
    const fileName = getSchemaFileNameForModel(model.name, schemaFiles, inferredSchemaNames);
    const fileKey = fileName || "index";
    if (!groups.has(fileKey)) {
      groups.set(fileKey, []);
    }
    groups.get(fileKey).push(model);
  }
  return groups;
}
function groupEnumsBySchemaFile(enums, schemaFiles, inferredSchemaNames) {
  const groups = /* @__PURE__ */ new Map();
  for (const enumType of enums) {
    const fileName = getSchemaFileNameForModel(enumType.name, schemaFiles, inferredSchemaNames);
    const fileKey = fileName || "enums";
    if (!groups.has(fileKey)) {
      groups.set(fileKey, []);
    }
    groups.get(fileKey).push(enumType);
  }
  return groups;
}
function generatePrismaTypeNamespace(namespaceName = "PrismaType") {
  return `/**
 * ${namespaceName} namespace for custom type mappings
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
 *   namespace ${namespaceName} {
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
 * preferences Json  // Will use ${namespaceName}.UserPreferences via namespace merging
 * 
 * Or use inline types:
 * /// @type Json=any
 * metadata Json  // Uses ${namespaceName}.Json
 */
// This file must be a module, so we include an empty export.
export {};

declare global {
  namespace ${namespaceName} {
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
    jsonTypeMapping = false,
    namespaceName = "PrismaType"
  } = options;
  const mappings = parseTypeMappings(void 0, typeMappings, jsonTypeMapping, namespaceName);
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
    const omitDirective = parseOmitDirective(model.documentation);
    const omitFields = omitDirective?.fields || [];
    const customTypeName = omitDirective?.typeName;
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
        const customType = parseTypeMappingFromComment(field.documentation, jsonTypeMapping, namespaceName);
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
function collectReferencedModels(model, modelFileMap, currentFileName) {
  const referencedModels = /* @__PURE__ */ new Set();
  if (!modelFileMap || !currentFileName) {
    return referencedModels;
  }
  const relationFields = model.fields.filter(
    (field) => field.kind !== "scalar" && field.kind !== "enum" && field.relationName !== void 0
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
function generateUtilityTypes(model, dataModel, omitDirective, jsonTypeMapping, modelFileMap, currentFileName) {
  let namespaceOutput = `/**
 * Utility types for ${model.name}
 */
`;
  namespaceOutput += `export namespace ${model.name} {
`;
  namespaceOutput += `  type _Partial<T> = { [P in keyof T]?: T[P] };
`;
  namespaceOutput += `  type _Required<T> = { [P in keyof T]-?: T[P] };
`;
  namespaceOutput += `  type _Readonly<T> = { readonly [P in keyof T]: T[P] };

`;
  const scalarAndEnumFields = model.fields.filter(
    (field) => ["scalar", "enum"].includes(field.kind)
  );
  const allFieldNames = scalarAndEnumFields.map((f) => f.name);
  const relationFields = model.fields.filter(
    (field) => field.kind !== "scalar" && field.kind !== "enum" && field.relationName !== void 0
  );
  if (omitDirective && omitDirective.fields.length > 0) {
    const validOmitFields = omitDirective.fields.filter(
      (fieldName) => allFieldNames.includes(fieldName)
    );
    if (validOmitFields.length > 0) {
      const omitUnion = validOmitFields.map((f) => `"${f}"`).join(" | ");
      const typeName = omitDirective.typeName || generateOmitTypeName(validOmitFields);
      namespaceOutput += `  /**
   * ${model.name} without ${validOmitFields.join(", ")}
   */
`;
      namespaceOutput += `  export type ${typeName} = Omit<${model.name}, ${omitUnion}>;

`;
    }
  }
  const pickDirective = parsePickDirective(model.documentation);
  if (pickDirective && pickDirective.fields.length > 0) {
    const pickUnion = pickDirective.fields.map((f) => `"${f}"`).join(" | ");
    const typeName = pickDirective.typeName || `Pick${pickDirective.fields.map((f) => f.charAt(0).toUpperCase() + f.slice(1)).join("")}`;
    namespaceOutput += `  /**
   * ${model.name} with only ${pickDirective.fields.join(", ")}
   */
`;
    namespaceOutput += `  export type ${typeName} = Pick<${model.name}, ${pickUnion}>;

`;
  }
  const inputTypes = parseInputDirective(model.documentation);
  if (inputTypes) {
    for (const inputTypeName of inputTypes) {
      if (inputTypeName === "CreateInput") {
        const excludeFields = model.fields.filter((f) => {
          return f.isId || f.name === "createdAt" || f.name === "updatedAt";
        }).map((f) => f.name).filter((f) => allFieldNames.includes(f));
        if (excludeFields.length > 0) {
          const excludeUnion = excludeFields.map((f) => `"${f}"`).join(" | ");
          namespaceOutput += `  /**
   * Input type for creating ${model.name} (omits id, createdAt, updatedAt)
   */
`;
          namespaceOutput += `  export type ${inputTypeName} = Omit<${model.name}, ${excludeUnion}>;

`;
        } else {
          namespaceOutput += `  /**
   * Input type for creating ${model.name}
   */
`;
          namespaceOutput += `  export type ${inputTypeName} = ${model.name};

`;
        }
      } else if (inputTypeName === "UpdateInput") {
        const excludeFields = model.fields.filter((f) => f.isId).map((f) => f.name);
        if (excludeFields.length > 0) {
          const excludeUnion = excludeFields.map((f) => `"${f}"`).join(" | ");
          namespaceOutput += `  /**
   * Input type for updating ${model.name} (all fields optional, omits id)
   */
`;
          namespaceOutput += `  export type ${inputTypeName} = _Partial<Omit<${model.name}, ${excludeUnion}>>;

`;
        } else {
          namespaceOutput += `  /**
   * Input type for updating ${model.name} (all fields optional)
   */
`;
          namespaceOutput += `  export type ${inputTypeName} = _Partial<${model.name}>;

`;
        }
      } else {
        namespaceOutput += `  /**
   * Custom input type: ${inputTypeName}
   */
`;
        namespaceOutput += `  export type ${inputTypeName} = _Partial<Omit<${model.name}, "id">>;

`;
      }
    }
  }
  const groups = parseGroupDirective(model.documentation);
  if (groups) {
    for (const [groupName, fields] of groups.entries()) {
      const pickUnion = fields.map((f) => `"${f}"`).join(" | ");
      const typeName = `${groupName.charAt(0).toUpperCase() + groupName.slice(1)}Fields`;
      namespaceOutput += `  /**
   * ${groupName} fields: ${fields.join(", ")}
   */
`;
      namespaceOutput += `  export type ${typeName} = Pick<${model.name}, ${pickUnion}>;

`;
    }
  }
  const withDirective = parseWithDirective(model.documentation);
  if (withDirective && withDirective.relations.length > 0) {
    const relationTypes = [];
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
      namespaceOutput += `  /**
   * ${model.name} with relations: ${withDirective.relations.join(", ")}
   */
`;
      namespaceOutput += `  export type ${typeName} = ${model.name} & {
`;
      namespaceOutput += relationTypes.join("\n");
      namespaceOutput += `
  };

`;
    }
  }
  if (parseSelectDirective(model.documentation)) {
    const selectFields = allFieldNames.map((f) => `    ${f}?: boolean;`).join("\n");
    namespaceOutput += `  /**
   * Select type for Prisma queries
   */
`;
    namespaceOutput += `  export type Select = {
`;
    namespaceOutput += selectFields;
    namespaceOutput += `
  };

`;
  }
  const validatedTypeName = parseValidatedDirective(model.documentation);
  if (validatedTypeName) {
    namespaceOutput += `  /**
   * Validated ${model.name} type
   */
`;
    namespaceOutput += `  export type ${validatedTypeName} = ${model.name} & { __validated: true };

`;
  }
  namespaceOutput += `  /**
   * Make all fields optional
   */
`;
  namespaceOutput += `  export type Partial = _Partial<${model.name}>;

`;
  namespaceOutput += `  /**
   * Make all fields required
   */
`;
  namespaceOutput += `  export type Required = _Required<${model.name}>;

`;
  namespaceOutput += `  /**
   * Make all fields readonly
   */
`;
  namespaceOutput += `  export type Readonly = _Readonly<${model.name}>;

`;
  namespaceOutput += `  /**
   * Deep partial (recursive)
   */
`;
  namespaceOutput += `  export type DeepPartial<T = ${model.name}> = {
`;
  namespaceOutput += `    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
`;
  namespaceOutput += `  };

`;
  namespaceOutput += `  /**
   * Deep required (recursive)
   */
`;
  namespaceOutput += `  export type DeepRequired<T = ${model.name}> = {
`;
  namespaceOutput += `    [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
`;
  namespaceOutput += `  };

`;
  namespaceOutput += `}

`;
  return namespaceOutput;
}
function generateEnumType(enumType, options) {
  const { jsDocComments = false, jsonTypeMapping = false, namespaceName = "PrismaType", skipModuleHeader = false } = options;
  let output = "";
  if (jsonTypeMapping && !skipModuleHeader) {
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
    jsonTypeMapping = false,
    namespaceName = "PrismaType",
    dataModel,
    enumFileMap,
    modelFileMap,
    currentFileName,
    skipModuleHeader = false
  } = options;
  const mappings = parseTypeMappings(void 0, typeMappings, jsonTypeMapping, namespaceName);
  let output = "";
  if (jsonTypeMapping && !skipModuleHeader) {
    output += `// This file must be a module, so we include an empty export.
`;
    output += `export {};

`;
    output += `/// <reference path="./prisma-json.d.ts" />

`;
  }
  const usedEnums = /* @__PURE__ */ new Set();
  const scalarAndEnumFields = model.fields.filter(
    (field) => ["scalar", "enum"].includes(field.kind)
  );
  const allEnumNames = /* @__PURE__ */ new Set();
  if (dataModel?.enums) {
    for (const enumType of dataModel.enums) {
      allEnumNames.add(enumType.name);
    }
  }
  for (const field of scalarAndEnumFields) {
    if (field.kind === "enum") {
      usedEnums.add(field.type);
    } else if (field.kind === "scalar") {
      const looseEnum = parseLooseEnumFromComment(field.documentation);
      if (!looseEnum && field.type && allEnumNames.has(field.type)) {
        usedEnums.add(field.type);
      }
    }
  }
  const referencedModels = collectReferencedModels(model, modelFileMap, currentFileName);
  const imports = [];
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
  const comment = jsDocComments ? extractJSDoc(model.documentation) : "";
  const jsDoc = comment ? `/**
 * ${comment}
 */
` : "";
  const omitDirective = parseOmitDirective(model.documentation);
  const omitFields = omitDirective?.fields || [];
  const customTypeName = omitDirective?.typeName;
  output += `${jsDoc}export interface ${model.name} {
`;
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
      const customType = parseTypeMappingFromComment(field.documentation, jsonTypeMapping, namespaceName);
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
  const utilityTypes = generateUtilityTypes(
    model,
    dataModel,
    omitDirective,
    jsonTypeMapping,
    modelFileMap,
    currentFileName
  );
  if (utilityTypes) {
    output += utilityTypes;
  }
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
  const namespaceName = config.namespaceName || "PrismaType";
  const typeMappings = config.typeMappings || config.jsonTypeMapping ? parseTypeMappings(
    config.typeMappings,
    void 0,
    config.jsonTypeMapping,
    namespaceName
  ) : void 0;
  if (config.jsonTypeMapping) {
    const prismaTypeContent = generatePrismaTypeNamespace(namespaceName);
    const prismaTypePath = (0, import_node_path.join)(outputDir, "prisma-json.d.ts");
    (0, import_node_fs.writeFileSync)(prismaTypePath, prismaTypeContent);
  }
  const filteredModels = dataModel.models.filter(
    (model) => shouldIncludeModel(model.name, config.include, config.exclude)
  );
  const filteredEnums = dataModel.enums.filter(
    (enumType) => shouldIncludeEnum(enumType.name, config.include, config.exclude)
  );
  const schemaPath = options.schemaPath || "";
  const schemaFiles = [];
  const files = [];
  if (config.splitBySchema) {
    const allItems = [
      ...config.enumOnly ? [] : filteredModels,
      ...filteredEnums
    ];
    const inferredSchemaNames = inferSchemaFileNames(allItems);
    const modelGroups = config.enumOnly ? /* @__PURE__ */ new Map() : groupModelsBySchemaFile(filteredModels, schemaFiles, inferredSchemaNames);
    const enumGroups = groupEnumsBySchemaFile(filteredEnums, schemaFiles, inferredSchemaNames);
    const enumFileMap = /* @__PURE__ */ new Map();
    for (const [fileName, fileEnums] of enumGroups.entries()) {
      for (const enumType of fileEnums) {
        enumFileMap.set(enumType.name, fileName);
      }
    }
    for (const enumType of dataModel.enums) {
      if (!enumFileMap.has(enumType.name)) {
        enumFileMap.set(enumType.name, "enums");
      }
    }
    const modelFileMap = /* @__PURE__ */ new Map();
    for (const [fileName, fileModels] of modelGroups.entries()) {
      for (const model of fileModels) {
        modelFileMap.set(model.name, fileName);
      }
    }
    const allFileNames = /* @__PURE__ */ new Set();
    if (!config.enumOnly) {
      modelGroups.forEach((_, fileName) => allFileNames.add(fileName));
    }
    enumGroups.forEach((_, fileName) => allFileNames.add(fileName));
    for (const fileName of allFileNames) {
      const fileModels = config.enumOnly ? [] : modelGroups.get(fileName) || [];
      const fileEnums = enumGroups.get(fileName) || [];
      if (fileName === "index" && !config.barrelExports && fileModels.length === 0 && fileEnums.length === 0) {
        continue;
      }
      const currentFileName = fileName;
      let typesContent = "";
      if (config.jsonTypeMapping && (fileEnums.length > 0 || fileModels.length > 0)) {
        typesContent += `// This file must be a module, so we include an empty export.
`;
        typesContent += `export {};

`;
        typesContent += `/// <reference path="./prisma-json.d.ts" />

`;
      }
      const skipModuleHeader = config.jsonTypeMapping && (fileEnums.length > 0 || fileModels.length > 0);
      for (const enumType of fileEnums) {
        const enumContent = generateEnumType(enumType, {
          jsDocComments: config.jsDocComments ?? false,
          jsonTypeMapping: config.jsonTypeMapping ?? false,
          // Need true to apply namespace prefix
          namespaceName,
          skipModuleHeader
        });
        typesContent += enumContent;
      }
      for (const model of fileModels) {
        const modelContent = generateModelType(model, {
          typeMappings,
          jsDocComments: config.jsDocComments ?? false,
          jsonTypeMapping: config.jsonTypeMapping ?? false,
          // Need true to apply namespace prefix
          namespaceName,
          dataModel,
          enumFileMap,
          modelFileMap,
          currentFileName,
          skipModuleHeader
        });
        typesContent += modelContent;
      }
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
      if (finalContent.trim().length > 0) {
        files.push({
          name: currentFileName,
          content: finalContent
        });
      }
    }
    for (const file of files) {
      const filePath = (0, import_node_path.join)(outputDir, `${file.name}.ts`);
      (0, import_node_fs.writeFileSync)(filePath, file.content);
    }
    if (config.barrelExports && !config.global) {
      const exports2 = [];
      const generatedFileNames = files.map((f) => f.name).filter((name) => {
        return name !== "index";
      });
      for (const fileName of generatedFileNames.sort()) {
        exports2.push(`export * from "./${fileName}";`);
      }
      if (exports2.length > 0) {
        const indexContent = exports2.join("\n") + "\n";
        (0, import_node_fs.writeFileSync)((0, import_node_path.join)(outputDir, "index.ts"), indexContent);
      }
    }
    return;
  }
  if (config.splitFiles) {
    const enumFileMap = /* @__PURE__ */ new Map();
    for (const enumType of dataModel.enums) {
      if (shouldIncludeEnum(enumType.name, config.include, config.exclude)) {
        enumFileMap.set(enumType.name, modelToFileName(enumType.name));
      }
    }
    const modelFileMap = /* @__PURE__ */ new Map();
    for (const model of filteredModels) {
      modelFileMap.set(model.name, modelToFileName(model.name));
    }
    if (!config.enumOnly) {
      for (const model of filteredModels) {
        const modelFileName = modelToFileName(model.name);
        let modelContent = generateModelType(model, {
          typeMappings,
          jsDocComments: config.jsDocComments ?? false,
          jsonTypeMapping: config.jsonTypeMapping ?? false,
          namespaceName,
          dataModel,
          enumFileMap,
          modelFileMap,
          currentFileName: modelFileName
        });
        if (config.global) {
          modelContent += "declare global {\n";
          modelContent += `  export type T${model.name} = ${model.name};
`;
          modelContent += "}\n\n";
        }
        files.push({
          name: modelFileName,
          content: modelContent
        });
      }
    }
    for (const enumType of filteredEnums) {
      let enumContent = generateEnumType(enumType, {
        jsDocComments: config.jsDocComments ?? false,
        jsonTypeMapping: config.jsonTypeMapping ?? false,
        namespaceName
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
          models: filteredModels,
          enums: filteredEnums
        },
        typeMappings,
        jsDocComments: config.jsDocComments ?? false,
        include: config.include,
        exclude: config.exclude,
        jsonTypeMapping: config.jsonTypeMapping ?? false,
        namespaceName
      });
      let finalTypesContent = typesContent;
      if (config.global) {
        finalTypesContent += "declare global {\n";
        for (const model of filteredModels) {
          finalTypesContent += `  export type T${model.name} = ${model.name};
`;
        }
        for (const enumType of filteredEnums) {
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
          models: [],
          enums: filteredEnums
        },
        typeMappings,
        jsDocComments: config.jsDocComments ?? false,
        include: config.include,
        exclude: config.exclude,
        jsonTypeMapping: config.jsonTypeMapping ?? false,
        namespaceName
      });
      if (config.global) {
        let globalContent = enumContent;
        globalContent += "declare global {\n";
        for (const enumType of filteredEnums) {
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
      let baseName = f.name;
      if (baseName.endsWith(".d.ts")) {
        baseName = baseName.slice(0, -5);
      } else if (baseName.endsWith(".ts")) {
        baseName = baseName.slice(0, -3);
      }
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
