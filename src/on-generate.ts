import type { GeneratorOptions } from "@prisma/generator-helper";
import { mkdirSync, writeFileSync } from "node:fs";
import { format } from "prettier";
import { getTypeScriptType } from "./util";

export async function onGenerate(options: GeneratorOptions) {
  let exportedTypes = "";
  const dataModel = options.dmmf.datamodel;

  for (const model of dataModel.models) {
    exportedTypes += `export interface ${model.name} {\n`;

    const scalarAndEnumFields = model.fields.filter((field) =>
      ["scalar", "enum"].includes(field.kind)
    );

    for (const field of scalarAndEnumFields) {
      const typeScriptType = getTypeScriptType(field.type);
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

  mkdirSync(outputDir, { recursive: true });

  const formattedCode = await format(exportedTypes, {
    parser: "typescript",
  });

  writeFileSync(fullLocaltion, formattedCode);
}
