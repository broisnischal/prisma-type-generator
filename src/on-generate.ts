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
  collectModelImports,
} from "./generators/types";

export async function onGenerate(options: GeneratorOptions) {
  const config = parseConfig(options.generator.config);

  const outputDir = options.generator.output?.value ?? "../generated/types";

  if (config.clear && existsSync(outputDir)) {
    rmSync(outputDir, { recursive: true, force: true });
  }

  mkdirSync(outputDir, { recursive: true });

  const dataModel = options.dmmf.datamodel;

  const namespaceName = config.namespaceName || "PrismaType";

  const typeMappings =
    config.typeMappings || config.jsonTypeMapping
      ? parseTypeMappings(
        config.typeMappings,
        undefined,
        config.jsonTypeMapping,
        namespaceName
      )
      : undefined;

  if (config.jsonTypeMapping) {
    const prismaTypeContent = generatePrismaTypeNamespace(namespaceName);
    const prismaTypePath = join(outputDir, "prisma-json.d.ts");
    writeFileSync(prismaTypePath, prismaTypeContent);
  }

  const filteredModels = dataModel.models.filter((model) =>
    shouldIncludeModel(model.name, config.include, config.exclude)
  );

  const filteredEnums = dataModel.enums.filter((enumType) =>
    shouldIncludeEnum(enumType.name, config.include, config.exclude)
  );

  const schemaPath = options.schemaPath || "";
  const schemaFiles: string[] = [];

  const files: Array<{ name: string; content: string }> = [];

  if (config.splitBySchema) {
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


    const enumFileMap = new Map<string, string>();
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

    const modelFileMap = new Map<string, string>();
    for (const [fileName, fileModels] of modelGroups.entries()) {
      for (const model of fileModels) {
        modelFileMap.set(model.name, fileName);
      }
    }

    const allFileNames = new Set<string>();
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
        typesContent += `// This file must be a module, so we include an empty export.\n`;
        typesContent += `export {};\n\n`;
        typesContent += `/// <reference path="./prisma-json.d.ts" />\n\n`;
      }

      const skipModuleHeader = config.jsonTypeMapping && (fileEnums.length > 0 || fileModels.length > 0);
      for (const enumType of fileEnums) {
        const enumContent = generateEnumType(enumType, {
          jsDocComments: config.jsDocComments ?? false,
          jsonTypeMapping: config.jsonTypeMapping ?? false,
          namespaceName,
          skipModuleHeader,
        });
        typesContent += enumContent;
      }

      const allImports = new Set<string>();
      for (const model of fileModels) {
        const modelImports = collectModelImports(model, {
          dataModel,
          enumFileMap,
          modelFileMap,
          currentFileName,
        });
        modelImports.forEach(imp => allImports.add(imp));
      }

      if (allImports.size > 0) {
        typesContent += Array.from(allImports).sort().join("\n") + "\n\n";
      }

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
          basicUtilityTypes: config.basicUtilityTypes ?? true,
          skipImports: true,
        });
        typesContent += modelContent;
      }

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

      if (finalContent.trim().length > 0) {
        files.push({
          name: currentFileName,
          content: finalContent,
        });
      }
    }

    for (const file of files) {
      const filePath = join(outputDir, `${file.name}.ts`);
      writeFileSync(filePath, file.content);
    }

    if (config.barrelExports && !config.global) {
      const exports: string[] = [];
      const generatedFileNames = files.map(f => f.name).filter(name => {
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

  if (config.splitFiles) {
    const enumFileMap = new Map<string, string>();
    for (const enumType of dataModel.enums) {
      if (shouldIncludeEnum(enumType.name, config.include, config.exclude)) {
        enumFileMap.set(enumType.name, modelToFileName(enumType.name));
      }
    }

    const modelFileMap = new Map<string, string>();
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
          currentFileName: modelFileName,
          basicUtilityTypes: config.basicUtilityTypes ?? true,
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

    for (const enumType of filteredEnums) {
      let enumContent = generateEnumType(enumType, {
        jsDocComments: config.jsDocComments ?? false,
        jsonTypeMapping: config.jsonTypeMapping ?? false,
        namespaceName,
      });

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
        basicUtilityTypes: config.basicUtilityTypes ?? true,
      });

      let finalTypesContent = typesContent;
      if (config.global) {
        finalTypesContent += "declare global {\n";

        for (const model of filteredModels) {
          finalTypesContent += `  export type T${model.name} = ${model.name};\n`;
        }

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
        basicUtilityTypes: config.basicUtilityTypes ?? true,
      });

      if (config.global) {
        let globalContent = enumContent;
        globalContent += "declare global {\n";
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

  for (const file of files) {
    const fileName =
      file.name.endsWith(".ts") || file.name.endsWith(".d.ts")
        ? file.name
        : `${file.name}.ts`;
    const filePath = join(outputDir, fileName);
    writeFileSync(filePath, file.content);
  }

  if (config.barrelExports && !config.global && files.length > 1) {
    const exports: string[] = [];
    const fileExports = files
      .map((f) => {
        let baseName = f.name;
        // Replace .d.ts first (longest extension), then .ts
        if (baseName.endsWith(".d.ts")) {
          baseName = baseName.slice(0, -5);
        } else if (baseName.endsWith(".ts")) {
          baseName = baseName.slice(0, -3);
        }
        return `export * from "./${baseName}";`;
      })
      .join("\n");
    exports.push(fileExports);
    writeFileSync(join(outputDir, "index.ts"), exports.join("\n") + "\n");
  }
}
