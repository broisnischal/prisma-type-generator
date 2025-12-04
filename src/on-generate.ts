import type { GeneratorOptions } from "@prisma/generator-helper";
import { rmSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { parseConfig } from "./config";
import {
  parseTypeMappings,
  shouldIncludeModel,
  groupModelsBySchemaFile,
  groupEnumsBySchemaFile,
  generatePrismaTypeNamespace,
  modelToFileName,
  type TypeMapping,
} from "./util";
import {
  generateTypes,
  generateModelType,
  generateEnumType,
} from "./generators/types";

export async function onGenerate(options: GeneratorOptions) {
  const config = parseConfig(options.generator.config);

  const outputDir = options.generator.output?.value ?? "../generated/types";

  // Clear output directory if requested
  if (config.clear && existsSync(outputDir)) {
    rmSync(outputDir, { recursive: true, force: true });
  }

  // Ensure output directory exists
  mkdirSync(outputDir, { recursive: true });

  const dataModel = options.dmmf.datamodel;

  // Parse type mappings (pass jsonTypeMapping to handle Json type separately)
  const typeMappings =
    config.typeMappings || config.jsonTypeMapping
      ? parseTypeMappings(
          config.typeMappings,
          undefined,
          config.jsonTypeMapping
        )
      : undefined;

  // Generate PrismaType namespace file if jsonTypeMapping is enabled
  if (config.jsonTypeMapping) {
    const prismaTypeContent = generatePrismaTypeNamespace();
    const prismaTypePath = join(outputDir, "prisma-json.d.ts");
    writeFileSync(prismaTypePath, prismaTypeContent);
  }

  // Filter models based on include/exclude
  const filteredModels = dataModel.models.filter((model) =>
    shouldIncludeModel(model.name, config.include, config.exclude)
  );

  // Try to detect schema files from schema path
  // Prisma schema path format: "prisma/schema/post.prisma" or similar
  const schemaPath = options.schemaPath || "";
  const schemaFiles: string[] = [];

  // Extract schema file names if available (this is a best-effort approach)
  // Since Prisma merges all files, we'll use naming convention instead

  const files: Array<{ name: string; content: string }> = [];

  // Handle splitBySchema feature
  if (config.splitBySchema) {
    // Group models and enums by schema file using naming convention
    const modelGroups = config.enumOnly
      ? new Map<string, typeof filteredModels>()
      : groupModelsBySchemaFile(filteredModels, schemaFiles);
    const enumGroups = groupEnumsBySchemaFile(dataModel.enums, schemaFiles);

    // Generate a file for each schema file group
    const allFileNames = new Set<string>();
    if (!config.enumOnly) {
      modelGroups.forEach((_, fileName) => allFileNames.add(fileName));
    }
    enumGroups.forEach((_, fileName) => allFileNames.add(fileName));

    for (const fileName of allFileNames) {
      const fileModels = config.enumOnly ? [] : modelGroups.get(fileName) || [];
      const fileEnums = enumGroups.get(fileName) || [];

      // Generate types for this schema file
      const typesContent = generateTypes({
        dataModel,
        typeMappings,
        jsDocComments: config.jsDocComments ?? false,
        models: fileModels,
        enums: fileEnums,
        jsonTypeMapping: config.jsonTypeMapping ?? false,
      });

      // Add global types if requested (only for this file's models/enums)
      let finalContent = typesContent;
      if (config.global) {
        finalContent += "declare global {\n";
        for (const model of fileModels) {
          finalContent += `  export type T${model.name} = ${model.name};\n`;
        }
        for (const enumType of fileEnums) {
          finalContent += `  export type T${enumType.name} = ${enumType.name};\n`;
        }
        finalContent += "}\n\n";
      }

      files.push({
        name: fileName === "index" ? "index" : fileName,
        content: finalContent,
      });
    }

    // Write files
    for (const file of files) {
      const filePath = join(outputDir, `${file.name}.ts`);
      writeFileSync(filePath, file.content);
    }

    // Generate barrel export if enabled (skip if global is true since types are globally available)
    if (config.barrelExports && !config.global) {
      const exports: string[] = [];
      // Note: prisma-json.d.ts contains a global namespace declaration, no need to export it
      for (const fileName of Array.from(allFileNames).sort()) {
        exports.push(`export * from "./${fileName}";`);
      }
      const indexContent = exports.join("\n") + "\n";
      writeFileSync(join(outputDir, "index.ts"), indexContent);
    }

    return;
  }

  // Standard generation (not split by schema)
  // Handle splitFiles: generate separate file for each model/enum
  if (config.splitFiles) {
    // Generate a file for each model
    if (!config.enumOnly) {
      for (const model of filteredModels) {
        let modelContent = generateModelType(model, {
          typeMappings,
          jsDocComments: config.jsDocComments ?? false,
          jsonTypeMapping: config.jsonTypeMapping ?? false,
          dataModel,
        });

        // Add global types if requested
        if (config.global) {
          modelContent += "declare global {\n";
          modelContent += `  export type T${model.name} = ${model.name};\n`;
          modelContent += "}\n\n";
        }

        files.push({
          name: modelToFileName(model.name),
          content: modelContent,
        });
      }
    }

    // Generate a file for each enum
    for (const enumType of dataModel.enums) {
      let enumContent = generateEnumType(enumType, {
        jsDocComments: config.jsDocComments ?? false,
        jsonTypeMapping: config.jsonTypeMapping ?? false,
      });

      // Add global types if requested
      if (config.global) {
        enumContent += "declare global {\n";
        enumContent += `  export type T${enumType.name} = ${enumType.name};\n`;
        enumContent += "}\n\n";
      }

      files.push({
        name: modelToFileName(enumType.name),
        content: enumContent,
      });
    }
  } else {
    // Generate base types (always generate unless enumOnly)
    if (!config.enumOnly) {
      const typesContent = generateTypes({
        dataModel: {
          ...dataModel,
          models: filteredModels,
        },
        typeMappings,
        jsDocComments: config.jsDocComments ?? false,
        include: config.include,
        exclude: config.exclude,
        jsonTypeMapping: config.jsonTypeMapping ?? false,
      });

      // Add global types if requested
      let finalTypesContent = typesContent;
      if (config.global) {
        finalTypesContent += "declare global {\n";

        // Add type aliases with T prefix for models
        for (const model of filteredModels) {
          finalTypesContent += `  export type T${model.name} = ${model.name};\n`;
        }

        // Add type aliases with T prefix for enums
        for (const enumType of dataModel.enums) {
          finalTypesContent += `  export type T${enumType.name} = ${enumType.name};\n`;
        }

        finalTypesContent += "}\n\n";
      }

      files.push({
        name: "prisma.d.ts",
        content: finalTypesContent,
      });
    } else {
      // Generate only enums
      const enumContent = generateTypes({
        dataModel: {
          ...dataModel,
          models: [],
        },
        typeMappings,
        jsDocComments: config.jsDocComments ?? false,
        include: config.include,
        exclude: config.exclude,
        jsonTypeMapping: config.jsonTypeMapping ?? false,
      });

      if (config.global) {
        let globalContent = enumContent;
        globalContent += "declare global {\n";
        for (const enumType of dataModel.enums) {
          globalContent += `  export type T${enumType.name} = ${enumType.name};\n`;
        }
        globalContent += "}\n\n";
        files.push({
          name: "prisma.d.ts",
          content: globalContent,
        });
      } else {
        files.push({
          name: "prisma.d.ts",
          content: enumContent,
        });
      }
    }
  }

  // Write all files
  for (const file of files) {
    const fileName =
      file.name.endsWith(".ts") || file.name.endsWith(".d.ts")
        ? file.name
        : `${file.name}.ts`;
    const filePath = join(outputDir, fileName);
    writeFileSync(filePath, file.content);
  }

  // Generate barrel export if enabled (skip if global is true since types are globally available)
  // Create index.ts if there are multiple files
  if (config.barrelExports && !config.global && files.length > 1) {
    const exports: string[] = [];
    // Note: prisma-type.ts contains a global namespace declaration, no need to export it
    const fileExports = files
      .map((f) => {
        const baseName = f.name.replace(".ts", "").replace(".d.ts", "");
        return `export * from "./${baseName}";`;
      })
      .join("\n");
    exports.push(fileExports);
    writeFileSync(join(outputDir, "index.ts"), exports.join("\n") + "\n");
  }
}
