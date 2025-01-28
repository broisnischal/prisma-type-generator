import type { GeneratorOptions } from "@prisma/generator-helper";
import { mkdirSync, writeFileSync } from "node:fs";
import { getTypeScriptType } from "./util";
import { parseConfig } from "./config";

export async function onGenerate(options: GeneratorOptions) {
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
    exportedTypes += `export interface ${model.name} {\n`;

    const scalarAndEnumFields = model.fields.filter((field) =>
      ["scalar", "enum"].includes(field.kind)
    );

    for (const field of scalarAndEnumFields) {
      const typeScriptType = getTypeScriptType(field.type);
      const nullability = field.isRequired ? "" : "| null";
      const list = field.isList ? "[]" : "";

      exportedTypes += `  ${field.name}: ${typeScriptType}${nullability}${list};\n`;
    }

    exportedTypes += "}\n\n";
  }

  // As const not supported for declaration file

  // for (const enumType of dataModel.enums) {
  //   exportedTypes += `export const ${enumType.name} = {`;

  //   for (const enumValue of enumType.values) {
  //     exportedTypes += `${enumValue.name}: "${enumValue.name}",\n`;
  //   }

  //   exportedTypes += "} as const;\n";

  //   exportedTypes += `export type ${enumType.name} = (typeof ${enumType.name})[keyof typeof ${enumType.name}];\n\n`;
  // }

  for (const enumType of dataModel.enums) {
    // Generate the type first
    exportedTypes += `export type ${enumType.name} = ${enumType.values
      .map((v) => `"${v.name}"`)
      .join(" | ")};\n\n`;

    // Then generate the const object
    exportedTypes += `export declare const ${enumType.name}: {\n`;

    for (const enumValue of enumType.values) {
      exportedTypes += `  readonly ${enumValue.name}: "${enumValue.name}";\n`;
    }

    exportedTypes += "};\n\n";
  }

  if (global) {
    exportedTypes += "declare global {\n";

    // Add type aliases with T prefix
    for (const model of dataModel.models) {
      exportedTypes += `  export type T${model.name} = ${model.name};\n`;
    }

    for (const enumType of dataModel.enums) {
      exportedTypes += `  export type T${enumType.name} = ${enumType.name};\n`;
    }

    exportedTypes += "}\n\n";
  }

  const outputDir = options.generator.output?.value ?? "./types";
  const fullLocaltion = `${outputDir}/prisma.d.ts`;

  mkdirSync(outputDir, { recursive: true });

  const formattedCode = exportedTypes;

  writeFileSync(fullLocaltion, formattedCode);
}
