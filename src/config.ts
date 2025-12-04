export interface PrismaTypeGeneratorOptions {
  /**
   * Generate types in the global namespace.
   *
   * @default false
   */
  global?: boolean;

  /**
   * Clear the output directory before generating types.
   *
   * @default false
   */
  clear?: boolean;

  /**
   * Only generate types for enums.
   *
   * @default false
   */
  enumOnly?: boolean;

  /**
   * Include only these models (comma-separated).
   * If specified, only these models will be generated.
   */
  include?: string;

  /**
   * Exclude these models (comma-separated).
   * These models will be skipped during generation.
   */
  exclude?: string;

  /**
   * Custom type mappings (format: "PrismaType=TypeScriptType,PrismaType2=TypeScriptType2").
   * Example: "DateTime=string,Bytes=Uint8Array"
   * Note: Json type is handled separately via jsonTypeMapping option.
   */
  typeMappings?: string;

  /**
   * Enable JSON type mapping using PrismaType namespace.
   * When enabled, creates a PrismaType namespace with Json interface.
   * Json fields will use PrismaType.Json instead of Record<string, unknown>.
   *
   * @default false
   */
  jsonTypeMapping?: boolean;

  /**
   * Generate JSDoc comments from Prisma schema comments.
   *
   * @default false
   */
  jsDocComments?: boolean;

  /**
   * Split output into separate files per model/enum.
   * Cannot be used together with splitBySchema.
   *
   * @default false
   */
  splitFiles?: boolean;

  /**
   * Generate barrel exports (index.ts).
   * When splitBySchema is enabled, this controls whether index.ts exports everything.
   *
   * @default true
   */
  barrelExports?: boolean;

  /**
   * Split types by schema file names.
   * When enabled, generates separate files for each schema file (post.ts, user.ts, etc.)
   * Models are matched by name prefix (Post* -> post.ts, User* -> user.ts)
   * schema.prisma generates index.ts
   * Cannot be used together with splitFiles.
   *
   * @default false
   */
  splitBySchema?: boolean;
}

export function parseConfig(
  config: Record<string, string | string[] | undefined>
): PrismaTypeGeneratorOptions {
  const splitFiles = parseBoolean(config.splitFiles, false);
  const splitBySchema = parseBoolean(config.splitBySchema, false);

  // Validate that splitFiles and splitBySchema are not both enabled
  if (splitFiles && splitBySchema) {
    throw new Error(
      "Cannot use 'splitFiles' and 'splitBySchema' together. These options are mutually exclusive. Please use only one of them."
    );
  }

  return {
    global: parseBoolean(config.global, false),
    clear: parseBoolean(config.clear, false),
    enumOnly: parseBoolean(config.enumOnly, false),
    include: config.include ? String(config.include).trim() : undefined,
    exclude: config.exclude ? String(config.exclude).trim() : undefined,
    typeMappings: config.typeMappings
      ? String(config.typeMappings).trim()
      : undefined,
    jsonTypeMapping: parseBoolean(config.jsonTypeMapping, false),
    jsDocComments: parseBoolean(config.jsDocComments, false),
    splitFiles,
    barrelExports: parseBoolean(config.barrelExports, true),
    splitBySchema,
  };
}

function parseBoolean(
  value: string | string[] | undefined,
  defaultValue: boolean
): boolean {
  if (!value) return defaultValue;
  return String(value).toLowerCase().trim() === "true";
}
