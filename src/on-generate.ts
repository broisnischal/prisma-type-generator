import type { GeneratorOptions } from "@prisma/generator-helper";
import { rmSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { parseConfig } from "./config";
import {
  parseTypeMappings,
  shouldIncludeModel,
  shouldIncludeEnum,
  groupModelsBySchemaFile,
  groupEnumsBySchemaFile,
  generatePrismaTypeNamespace,
  modelToFileName,
  inferSchemaFileNames,
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

  const namespaceName = config.namespaceName || "PrismaType";

  // Parse type mappings (pass jsonTypeMapping to handle Json type separately)
  const typeMappings =
    config.typeMappings || config.jsonTypeMapping
      ? parseTypeMappings(
        config.typeMappings,
        undefined,
        config.jsonTypeMapping,
        namespaceName
      )
      : undefined;

  // Generate PrismaType namespace file if jsonTypeMapping is enabled
  if (config.jsonTypeMapping) {
    const prismaTypeContent = generatePrismaTypeNamespace(namespaceName);
    const prismaTypePath = join(outputDir, "prisma-json.d.ts");
    writeFileSync(prismaTypePath, prismaTypeContent);
  }

  // Filter models based on include/exclude
  const filteredModels = dataModel.models.filter((model) =>
    shouldIncludeModel(model.name, config.include, config.exclude)
  );

  // Filter enums based on include/exclude
  const filteredEnums = dataModel.enums.filter((enumType) =>
    shouldIncludeEnum(enumType.name, config.include, config.exclude)
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
    // Infer schema file names from all models and enums
    // This helps us match models/enums to their schema files
    const allItems = [
      ...(config.enumOnly ? [] : filteredModels),
      ...filteredEnums,
    ];
    const inferredSchemaNames = inferSchemaFileNames(allItems);

    // Group models and enums by schema file using naming convention
    const modelGroups = config.enumOnly
      ? new Map<string, typeof filteredModels>()
      : groupModelsBySchemaFile(filteredModels, schemaFiles, inferredSchemaNames);
    const enumGroups = groupEnumsBySchemaFile(filteredEnums, schemaFiles, inferredSchemaNames);

    // Build enum file map: enum name -> file name
    // Include ALL enums (not just filtered ones) so models can import enums from other files
    // Note: We use dataModel.enums here (not filteredEnums) to ensure imports work correctly
    // even if an enum is filtered out from generation but used by a model
    const enumFileMap = new Map<string, string>();
    for (const [fileName, fileEnums] of enumGroups.entries()) {
      for (const enumType of fileEnums) {
        // Always add to map, even if filtered out, so imports work correctly
        enumFileMap.set(enumType.name, fileName);
      }
    }
    // Also include enums that might not be in any group (shouldn't happen, but be safe)
    // Use dataModel.enums to ensure all enums are mapped for import purposes
    for (const enumType of dataModel.enums) {
      if (!enumFileMap.has(enumType.name)) {
        // Default to enums if not found in any group
        enumFileMap.set(enumType.name, "enums");
      }
    }

    // Build model file map: model name -> file name
    const modelFileMap = new Map<string, string>();
    for (const [fileName, fileModels] of modelGroups.entries()) {
      for (const model of fileModels) {
        modelFileMap.set(model.name, fileName);
      }
    }

    // Generate a file for each schema file group
    const allFileNames = new Set<string>();
    if (!config.enumOnly) {
      modelGroups.forEach((_, fileName) => allFileNames.add(fileName));
    }
    enumGroups.forEach((_, fileName) => allFileNames.add(fileName));

    for (const fileName of allFileNames) {
      const fileModels = config.enumOnly ? [] : modelGroups.get(fileName) || [];
      const fileEnums = enumGroups.get(fileName) || [];

      // Skip generating index.ts when barrelExports is false, unless it has actual content from schema.prisma
      // Only generate index.ts if barrelExports is true OR if there are models/enums in the index group
      if (fileName === "index" && !config.barrelExports && fileModels.length === 0 && fileEnums.length === 0) {
        continue;
      }

      const currentFileName = fileName;

      // Generate types for this schema file
      // If we have models, we need to generate them with enum imports
      let typesContent = "";

      // Add jsonTypeMapping reference once at the top if enabled
      if (config.jsonTypeMapping && (fileEnums.length > 0 || fileModels.length > 0)) {
        typesContent += `// This file must be a module, so we include an empty export.\n`;
        typesContent += `export {};\n\n`;
        typesContent += `/// <reference path="./prisma-json.d.ts" />\n\n`;
      }

      // Generate enums first
      // Skip module header since it's already added at the file level if jsonTypeMapping is enabled
      const skipModuleHeader = config.jsonTypeMapping && (fileEnums.length > 0 || fileModels.length > 0);
      // fileEnums are already filtered, so we can generate them directly
      for (const enumType of fileEnums) {
        const enumContent = generateEnumType(enumType, {
          jsDocComments: config.jsDocComments ?? false,
          jsonTypeMapping: config.jsonTypeMapping ?? false, // Need true to apply namespace prefix
          namespaceName,
          skipModuleHeader,
        });
        typesContent += enumContent;
      }

      // Generate models with enum and model imports
      for (const model of fileModels) {
        const modelContent = generateModelType(model, {
          typeMappings,
          jsDocComments: config.jsDocComments ?? false,
          jsonTypeMapping: config.jsonTypeMapping ?? false, // Need true to apply namespace prefix
          namespaceName,
          dataModel,
          enumFileMap,
          modelFileMap,
          currentFileName,
          skipModuleHeader,
        });
        typesContent += modelContent;
      }

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

      // Only add file if it has content
      if (finalContent.trim().length > 0) {
        files.push({
          name: currentFileName,
          content: finalContent,
        });
      }
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
      // Only export files that were actually generated (have content)
      const generatedFileNames = files.map(f => f.name).filter(name => {
        // Don't export index.ts itself in the barrel export
        return name !== "index";
      });
      for (const fileName of generatedFileNames.sort()) {
        exports.push(`export * from "./${fileName}";`);
      }
      if (exports.length > 0) {
        const indexContent = exports.join("\n") + "\n";
        writeFileSync(join(outputDir, "index.ts"), indexContent);
      }
    }

    return;
  }

  // Standard generation (not split by schema)
  // Handle splitFiles: generate separate file for each model/enum
  if (config.splitFiles) {
    // Build enum file map: enum name -> file name
    const enumFileMap = new Map<string, string>();
    for (const enumType of dataModel.enums) {
      if (shouldIncludeEnum(enumType.name, config.include, config.exclude)) {
        enumFileMap.set(enumType.name, modelToFileName(enumType.name));
      }
    }

    // Build model file map: model name -> file name
    const modelFileMap = new Map<string, string>();
    for (const model of filteredModels) {
      modelFileMap.set(model.name, modelToFileName(model.name));
    }

    // Generate a file for each model
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
          currentFileName: modelFileName,
        });

        // Add global types if requested
        if (config.global) {
          modelContent += "declare global {\n";
          modelContent += `  export type T${model.name} = ${model.name};\n`;
          modelContent += "}\n\n";
        }

        files.push({
          name: modelFileName,
          content: modelContent,
        });
      }
    }

    // Generate a file for each enum (already filtered)
    for (const enumType of filteredEnums) {
      let enumContent = generateEnumType(enumType, {
        jsDocComments: config.jsDocComments ?? false,
        jsonTypeMapping: config.jsonTypeMapping ?? false,
        namespaceName,
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
          enums: filteredEnums,
        },
        typeMappings,
        jsDocComments: config.jsDocComments ?? false,
        include: config.include,
        exclude: config.exclude,
        jsonTypeMapping: config.jsonTypeMapping ?? false,
        namespaceName,
      });

      // Add global types if requested
      let finalTypesContent = typesContent;
      if (config.global) {
        finalTypesContent += "declare global {\n";

        // Add type aliases with T prefix for models
        for (const model of filteredModels) {
          finalTypesContent += `  export type T${model.name} = ${model.name};\n`;
        }

        // Add type aliases with T prefix for enums (use filtered enums)
        for (const enumType of filteredEnums) {
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
          enums: filteredEnums,
        },
        typeMappings,
        jsDocComments: config.jsDocComments ?? false,
        include: config.include,
        exclude: config.exclude,
        jsonTypeMapping: config.jsonTypeMapping ?? false,
        namespaceName,
      });

      if (config.global) {
        let globalContent = enumContent;
        globalContent += "declare global {\n";
        // Use filtered enums instead of all dataModel.enums
        for (const enumType of filteredEnums) {
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
    // Replace extensions in reverse order (longest first) to correctly handle .d.ts files
    const fileExports = files
      .map((f) => {
        let baseName = f.name;
        // Replace .d.ts first (longest extension), then .ts
        if (baseName.endsWith(".d.ts")) {
          baseName = baseName.slice(0, -5); // Remove ".d.ts"
        } else if (baseName.endsWith(".ts")) {
          baseName = baseName.slice(0, -3); // Remove ".ts"
        }
        return `export * from "./${baseName}";`;
      })
      .join("\n");
    exports.push(fileExports);
    writeFileSync(join(outputDir, "index.ts"), exports.join("\n") + "\n");
  }
}
