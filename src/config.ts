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
}

export function parseConfig(
  config: Record<string, string | string[] | undefined>
): PrismaTypeGeneratorOptions {
  return {
    global: config.global
      ? String(config.global).toLowerCase().trim() === "true"
      : false,
    clear: config.clear
      ? String(config.clear).toLowerCase().trim() === "true"
      : false,
    enumOnly: config.enumOnly
      ? String(config.enumOnly).toLowerCase().trim() === "true"
      : false,
  };
}
