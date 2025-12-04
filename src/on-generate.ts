import type { GeneratorOptions } from "@prisma/generator-helper";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { getTypeScriptType } from "./util";
import { parseConfig } from "./config";

export async function onGenerate(options: GeneratorOptions) {
  const config = parseConfig(options.generator.config);

  const global = config.global ?? false;
  const clear = config.clear ?? false;
  const enumOnly = config.enumOnly ?? false;

  const outputDir = options.generator.output?.value ?? "../generated/types";
  const fullLocation = `${outputDir}/prisma.d.ts`;

  // Clear output directory if requested
  if (clear && existsSync(outputDir)) {
    rmSync(outputDir, { recursive: true, force: true });
  }

  let exportedTypes = "";

  const dataModel = options.dmmf.datamodel;

  // Generate enums
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

  // Generate models (skip if enumOnly is true)
  if (!enumOnly) {
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
  }

  // Generate global types if requested
  if (global) {
    exportedTypes += "declare global {\n";

    // Add type aliases with T prefix for models
    if (!enumOnly) {
      for (const model of dataModel.models) {
        exportedTypes += `  export type T${model.name} = ${model.name};\n`;
      }
    }

    // Add type aliases with T prefix for enums
    for (const enumType of dataModel.enums) {
      exportedTypes += `  export type T${enumType.name} = ${enumType.name};\n`;
    }

    exportedTypes += "}\n\n";
  }

  // Ensure output directory exists
  mkdirSync(outputDir, { recursive: true });

  // Write the generated types to file
  writeFileSync(fullLocation, exportedTypes);
}
