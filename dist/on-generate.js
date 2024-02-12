"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onGenerate = void 0;
const node_fs_1 = require("node:fs");
const prettier_1 = require("prettier");
const util_1 = require("./util");
async function onGenerate(options) {
    let exportedTypes = "";
    const dataModel = options.dmmf.datamodel;
    for (const model of dataModel.models) {
        exportedTypes += `export interface ${model.name} {\n`;
        const scalarAndEnumFields = model.fields.filter((field) => ["scalar", "enum"].includes(field.kind));
        for (const field of scalarAndEnumFields) {
            const typeScriptType = (0, util_1.getTypeScriptType)(field.type);
            const nullability = field.isRequired ? "" : "| null";
            const list = field.isList ? "[]" : "";
            exportedTypes += `${field.name}: ${typeScriptType}${nullability}${list};\n`;
        }
        exportedTypes += "}\n\n";
    }
    for (const enumType of dataModel.enums) {
        exportedTypes += `export const ${enumType.name} = {`;
        for (const enumValue of enumType.values) {
            exportedTypes += `${enumValue.name}: "${enumValue.name}",\n`;
        }
        exportedTypes += "} as const;\n";
        exportedTypes += `export type ${enumType.name} = (typeof ${enumType.name})[keyof typeof ${enumType.name}];\n\n`;
    }
    const outputDir = options.generator.output?.value ?? "./types";
    const fullLocaltion = `${outputDir}/index.ts`;
    (0, node_fs_1.mkdirSync)(outputDir, { recursive: true });
    const formattedCode = await (0, prettier_1.format)(exportedTypes, {
        parser: "typescript",
    });
    (0, node_fs_1.writeFileSync)(fullLocaltion, formattedCode);
}
exports.onGenerate = onGenerate;
