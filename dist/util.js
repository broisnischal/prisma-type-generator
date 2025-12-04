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

// src/util.ts
var util_exports = {};
__export(util_exports, {
  extractJSDoc: () => extractJSDoc,
  generatePrismaTypeNamespace: () => generatePrismaTypeNamespace,
  getSchemaFileNameForModel: () => getSchemaFileNameForModel,
  getTypeScriptType: () => getTypeScriptType,
  groupEnumsBySchemaFile: () => groupEnumsBySchemaFile,
  groupModelsBySchemaFile: () => groupModelsBySchemaFile,
  modelToFileName: () => modelToFileName,
  parseTypeMappingFromComment: () => parseTypeMappingFromComment,
  parseTypeMappings: () => parseTypeMappings,
  shouldIncludeModel: () => shouldIncludeModel
});
module.exports = __toCommonJS(util_exports);
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
function parseTypeMappingFromComment(comment) {
  if (!comment) return null;
  const cleanComment = comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
  const match = cleanComment.match(/@type\s+\S+\s*=\s*(.+)/);
  if (match && match[1]) {
    const typeName = match[1].trim();
    return typeName.replace(/\s*\/\/.*$/, "").trim();
  }
  const simpleMatch = cleanComment.match(/@type\s+(\S+)=(\S+)/);
  return simpleMatch ? simpleMatch[2] : null;
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
 */
export namespace PrismaType {
  /**
   * JSON type interface
   * Extend this interface to customize the JSON type used throughout your application
   * 
   * @example
   * // In your project, create a file that extends this:
   * declare namespace PrismaType {
   *   interface Json {
   *     [key: string]: any;
   *   }
   * }
   */
  export interface Json {
    [key: string]: unknown;
  }
}
`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  extractJSDoc,
  generatePrismaTypeNamespace,
  getSchemaFileNameForModel,
  getTypeScriptType,
  groupEnumsBySchemaFile,
  groupModelsBySchemaFile,
  modelToFileName,
  parseTypeMappingFromComment,
  parseTypeMappings,
  shouldIncludeModel
});
