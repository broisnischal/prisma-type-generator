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
  calculatePrismaJsonPath: () => calculatePrismaJsonPath,
  extractJSDoc: () => extractJSDoc,
  generateOmitTypeName: () => generateOmitTypeName,
  generatePrismaTypeNamespace: () => generatePrismaTypeNamespace,
  getSchemaFileNameForModel: () => getSchemaFileNameForModel,
  getTypeScriptType: () => getTypeScriptType,
  groupEnumsBySchemaFile: () => groupEnumsBySchemaFile,
  groupModelsBySchemaFile: () => groupModelsBySchemaFile,
  modelToFileName: () => modelToFileName,
  parseGroupDirective: () => parseGroupDirective,
  parseInputDirective: () => parseInputDirective,
  parseLooseEnumFromComment: () => parseLooseEnumFromComment,
  parseOmitDirective: () => parseOmitDirective,
  parsePickDirective: () => parsePickDirective,
  parseSelectDirective: () => parseSelectDirective,
  parseTypeMappingFromComment: () => parseTypeMappingFromComment,
  parseTypeMappings: () => parseTypeMappings,
  parseValidatedDirective: () => parseValidatedDirective,
  parseWithDirective: () => parseWithDirective,
  shouldIncludeModel: () => shouldIncludeModel
});
module.exports = __toCommonJS(util_exports);
function calculatePrismaJsonPath(outputDir) {
  const normalized = outputDir.replace(/\\/g, "/");
  const segments = normalized.split("/").filter((s) => s && s !== ".");
  const leadingDots = normalized.match(/^\.\.\//g);
  const dotDotCount = leadingDots ? leadingDots.length : 0;
  const totalDepth = dotDotCount + segments.length;
  if (totalDepth === 0) {
    return "./prisma-json.ts";
  }
  const upPath = "../".repeat(totalDepth);
  return `${upPath}prisma-json.ts`;
}
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
function parseOmitDirective(comment) {
  if (!comment) return null;
  const cleanComment = comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
  const match = cleanComment.match(/@omit\s+(.+?)(?:\s+([A-Z][a-zA-Z0-9]*))?$/);
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
  const match = cleanComment.match(/@pick\s+(.+?)(?:\s+([A-Z][a-zA-Z0-9]*))?$/);
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
  const match = cleanComment.match(/@input(?:model)?(?:\s+(.+))?$/);
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
  const match = cleanComment.match(/@with\s+(.+?)(?:\s+([A-Z][a-zA-Z0-9]*))?$/);
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
  return /@select(?:\s|$)/.test(cleanComment);
}
function parseValidatedDirective(comment) {
  if (!comment) return null;
  const cleanComment = comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
  const match = cleanComment.match(/@validated(?:\s+([A-Z][a-zA-Z0-9]*))?$/);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  calculatePrismaJsonPath,
  extractJSDoc,
  generateOmitTypeName,
  generatePrismaTypeNamespace,
  getSchemaFileNameForModel,
  getTypeScriptType,
  groupEnumsBySchemaFile,
  groupModelsBySchemaFile,
  modelToFileName,
  parseGroupDirective,
  parseInputDirective,
  parseLooseEnumFromComment,
  parseOmitDirective,
  parsePickDirective,
  parseSelectDirective,
  parseTypeMappingFromComment,
  parseTypeMappings,
  parseValidatedDirective,
  parseWithDirective,
  shouldIncludeModel
});
