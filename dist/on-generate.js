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

// src/util.ts
function getTypeScriptType(type) {
  switch (type) {
    case "Decimal":
    case "Int":
    case "Float":
    case "BigInt":
      return "number";
    case "DateTime":
      return "Date";
    case "Boolean":
      return "boolean";
    case "Json":
      return "Record<string, unknown>";
    case "String":
      return "string";
    default:
      return type;
  }
}

// src/config.ts
function parseConfig(config) {
  return {
    global: config.global ? String(config.global).toLowerCase().trim() === "true" : true,
    clear: config.clear ? String(config.clear).toLowerCase().trim() === "true" : true,
    enumOnly: config.enumOnly ? String(config.enumOnly).toLowerCase().trim() === "true" : false
  };
}

// src/on-generate.ts
async function onGenerate(options) {
  const config = parseConfig(options.generator.config);
  const global = config.global ?? false;
  const clear = config.clear ?? false;
  const enumOnly = config.enumOnly ?? false;
  let exportedTypes = "";
  const dataModel = options.dmmf.datamodel;
  if (enumOnly) {
    for (const enumType of dataModel.enums) {
      exportedTypes += `export const ${enumType.name} = {`;
    }
  }
  for (const model of dataModel.models) {
    exportedTypes += `export interface ${model.name} {
`;
    const scalarAndEnumFields = model.fields.filter(
      (field) => ["scalar", "enum"].includes(field.kind)
    );
    for (const field of scalarAndEnumFields) {
      const typeScriptType = getTypeScriptType(field.type);
      const nullability = field.isRequired ? "" : "| null";
      const list = field.isList ? "[]" : "";
      exportedTypes += `  ${field.name}: ${typeScriptType}${nullability}${list};
`;
    }
    exportedTypes += "}\n\n";
  }
  for (const enumType of dataModel.enums) {
    exportedTypes += `export type ${enumType.name} = ${enumType.values.map((v) => `"${v.name}"`).join(" | ")};

`;
    exportedTypes += `export declare const ${enumType.name}: {
`;
    for (const enumValue of enumType.values) {
      exportedTypes += `  readonly ${enumValue.name}: "${enumValue.name}";
`;
    }
    exportedTypes += "};\n\n";
  }
  if (global) {
    exportedTypes += "declare global {\n";
    for (const model of dataModel.models) {
      exportedTypes += `  export type T${model.name} = ${model.name};
`;
    }
    for (const enumType of dataModel.enums) {
      exportedTypes += `  export type T${enumType.name} = ${enumType.name};
`;
    }
    exportedTypes += "}\n\n";
  }
  const outputDir = options.generator.output?.value ?? "./types";
  const fullLocaltion = `${outputDir}/prisma.d.ts`;
  (0, import_node_fs.mkdirSync)(outputDir, { recursive: true });
  const formattedCode = exportedTypes;
  (0, import_node_fs.writeFileSync)(fullLocaltion, formattedCode);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  onGenerate
});
