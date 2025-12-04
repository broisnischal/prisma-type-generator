export interface TypeMapping {
  [prismaType: string]: string;
}

export function calculatePrismaJsonPath(outputDir: string): string {
  const normalized = outputDir.replace(/\\/g, "/");

  const segments = normalized.split("/").filter((s) => s && s !== ".");

  const leadingDots = normalized.match(/^\.\.\//g);
  const dotDotCount = leadingDots ? leadingDots.length : 0;

  const totalDepth = dotDotCount + segments.length;

  if (totalDepth === 0) {
    return "./prisma-json.ts";
  }
  const upPath = "../".repeat(totalDepth);
  return `${upPath}prisma-json.ts`;
}

export function parseTypeMappings(
  mappings?: string,
  defaultMappings?: TypeMapping,
  jsonTypeMapping?: boolean
): TypeMapping {
  const result: TypeMapping = {
    Decimal: "number",
    Int: "number",
    Float: "number",
    BigInt: "number",
    DateTime: "Date",
    Boolean: "boolean",
    String: "string",
    Bytes: "Buffer",
    ...defaultMappings,
  };

  if (jsonTypeMapping) {
    result.Json = "PrismaType.Json";
  } else {
    result.Json = "Record<string, unknown>";
  }

  if (!mappings) return result;

  const pairs = mappings.split(",");
  for (const pair of pairs) {
    const [key, value] = pair.split("=").map((s) => s.trim());
    if (key && value) {
      if (key === "Json" && jsonTypeMapping) {
        continue;
      }
      result[key] = value;
    }
  }

  return result;
}

export function getTypeScriptType(
  type: string,
  typeMappings?: TypeMapping
): string {
  const mappings = typeMappings || parseTypeMappings();
  return mappings[type] || type;
}

export function extractJSDoc(comment?: string | null): string {
  if (!comment) return "";
  // Remove Prisma comment markers (/// or //)
  return comment
    .replace(/^\/\/\/\s*/gm, "")
    .replace(/^\/\/\s*/gm, "")
    .trim();
}

/**
 * Parse @omit directive from Prisma model comment
 * Format: /// @omit createdAt,updatedAt
 * Format: /// @omit createdAt,updatedAt WithoutTimestamps
 * Returns object with fields to omit and optional type name, or null if not found
 */
export function parseOmitDirective(
  comment?: string | null
): { fields: string[]; typeName?: string } | null {
  if (!comment) return null;

  // Extract the comment text (remove /// markers)
  const cleanComment = comment
    .replace(/^\/\/\/\s*/gm, "")
    .replace(/^\/\/\s*/gm, "")
    .trim();

  // Match @omit followed by comma-separated field names and optional type name
  // Examples:
  // @omit createdAt,updatedAt
  // @omit createdAt,updatedAt WithoutTimestamps
  // @omit password WithoutPassword
  const match = cleanComment.match(/@omit\s+(.+?)(?:\s+([A-Z][a-zA-Z0-9]*))?$/);
  if (match && match[1]) {
    const fieldsStr = match[1].trim();
    const typeName = match[2]?.trim();

    const fields = fieldsStr
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    if (fields.length > 0) {
      return {
        fields,
        typeName: typeName || undefined,
      };
    }
  }

  return null;
}

/**
 * Generate a semantic type name for omitted fields
 * Examples:
 * - ["createdAt", "updatedAt"] -> "WithoutTimestamps"
 * - ["password"] -> "WithoutPassword"
 * - ["deletedAt"] -> "WithoutDeletedAt"
 * - ["createdAt", "updatedAt", "deletedAt"] -> "WithoutTimestampsAndDeletedAt"
 */
export function generateOmitTypeName(omitFields: string[]): string {
  // Common patterns for semantic naming
  const timestampFields = new Set(["createdAt", "updatedAt"]);
  const isTimestamps = omitFields.every((f) => timestampFields.has(f));

  if (isTimestamps && omitFields.length === 2) {
    return "WithoutTimestamps";
  }

  // Single field - use semantic name if common
  if (omitFields.length === 1) {
    const field = omitFields[0];
    const semanticNames: Record<string, string> = {
      password: "WithoutPassword",
      deletedAt: "WithoutDeletedAt",
      id: "WithoutId",
    };
    return (
      semanticNames[field] ||
      `Without${field.charAt(0).toUpperCase() + field.slice(1)}`
    );
  }

  // Multiple fields - combine intelligently
  const timestamps = omitFields.filter((f) => timestampFields.has(f));
  const others = omitFields.filter((f) => !timestampFields.has(f));

  const parts: string[] = [];
  if (timestamps.length === 2) {
    parts.push("Timestamps");
  } else if (timestamps.length > 0) {
    parts.push(
      ...timestamps.map((f) => f.charAt(0).toUpperCase() + f.slice(1))
    );
  }

  if (others.length > 0) {
    parts.push(...others.map((f) => f.charAt(0).toUpperCase() + f.slice(1)));
  }

  const connector = parts.length > 1 ? "And" : "";
  return `Without${parts.join(connector)}`;
}

/**
 * Parse type mapping from Prisma comment
 * Format: /// @type Json=UserPreferences
 * Format: /// @type Json=Record<string, UserPreferences>
 * Format: /// @type Json=any
 * Format: /// @type Json=UserPreferences[]
 * Format: /// @type Json=Array<UserPreferences>
 * Supports any TypeScript type/interface name from your project
 */
export function parseTypeMappingFromComment(
  comment?: string | null,
  jsonTypeMapping?: boolean
): string | null {
  if (!comment) return null;

  // Match @type PrismaType=TypeScriptType
  // The TypeScript type can be:
  // - Simple: UserPreferences
  // - Generic: Record<string, UserPreferences>
  // - Array: UserPreferences[]
  // - Complex: Array<Record<string, UserPreferences>>
  // - Union: UserPreferences | OtherType (though nullability is handled separately)
  // - Special: Json=any or Json=SomeType (when jsonTypeMapping is enabled)

  const cleanComment = comment
    .replace(/^\/\/\/\s*/gm, "")
    .replace(/^\/\/\s*/gm, "")
    .trim();

  const match = cleanComment.match(/@type\s+(\S+)\s*=\s*(.+)/);

  if (match && match[1] && match[2]) {
    const prismaType = match[1].trim();
    let typeName = match[2].trim();

    typeName = typeName.replace(/\s*\/\/.*$/, "").trim();

    if (prismaType === "Json" && jsonTypeMapping) {
      if (typeName === "any" || typeName === "Json") {
        return "PrismaType.Json";
      }
      if (typeName.startsWith("PrismaType.")) {
        return typeName;
      }
      const isSimpleIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(typeName);
      if (isSimpleIdentifier) {
        return `PrismaType.${typeName}`;
      }
      const typeKeywords = new Set([
        "string",
        "number",
        "boolean",
        "any",
        "unknown",
        "never",
        "void",
        "Record",
        "Array",
        "Promise",
        "Partial",
        "Required",
        "Readonly",
        "Pick",
        "Omit",
      ]);
      let result = typeName;
      let offset = 0;
      const matches = Array.from(
        typeName.matchAll(/\b([A-Z][a-zA-Z0-9_$]*)\b/g)
      );
      for (const match of matches) {
        const identifier = match[1];
        const matchIndex = match.index!;

        if (typeKeywords.has(identifier)) {
          continue;
        }

        const beforeMatch = result.substring(
          Math.max(0, matchIndex + offset - 11),
          matchIndex + offset
        );
        if (beforeMatch === "PrismaType.") {
          continue;
        }

        const before = result.substring(0, matchIndex + offset);
        const after = result.substring(matchIndex + offset + identifier.length);
        result = before + `PrismaType.${identifier}` + after;
        offset += 11;
      }
      return result;
    }

    return typeName;
  }

  const simpleMatch = cleanComment.match(/@type\s+(\S+)=(\S+)/);
  if (simpleMatch) {
    const prismaType = simpleMatch[1];
    const typeName = simpleMatch[2];

    if (prismaType === "Json" && jsonTypeMapping) {
      if (typeName === "any" || typeName === "Json") {
        return "PrismaType.Json";
      }
      if (typeName.startsWith("PrismaType.")) {
        return typeName;
      }
      const isSimpleIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(typeName);
      if (isSimpleIdentifier) {
        return `PrismaType.${typeName}`;
      }
      const typeKeywords = new Set([
        "string",
        "number",
        "boolean",
        "any",
        "unknown",
        "never",
        "void",
        "Record",
        "Array",
        "Promise",
        "Partial",
        "Required",
        "Readonly",
        "Pick",
        "Omit",
      ]);
      let result = typeName;
      let offset = 0;
      const matches = Array.from(
        typeName.matchAll(/\b([A-Z][a-zA-Z0-9_$]*)\b/g)
      );
      for (const match of matches) {
        const identifier = match[1];
        const matchIndex = match.index!;

        // Skip if it's a TypeScript keyword or built-in type
        if (typeKeywords.has(identifier)) {
          continue;
        }

        // Skip if already prefixed with PrismaType.
        const beforeMatch = result.substring(
          Math.max(0, matchIndex + offset - 11),
          matchIndex + offset
        );
        if (beforeMatch === "PrismaType.") {
          continue;
        }

        // Replace with PrismaType. prefix
        const before = result.substring(0, matchIndex + offset);
        const after = result.substring(matchIndex + offset + identifier.length);
        result = before + `PrismaType.${identifier}` + after;
        offset += 11; // "PrismaType." is 11 characters longer
      }
      return result;
    }

    return typeName;
  }

  return null;
}

/**
 * Parse loose enum type from Prisma comment
 * Format: /// @type !["email", "google"]  (strict literal union)
 * Format: /// @type ["email", "google"]   (loose autocomplete)
 * Returns: { strict: boolean, values: string[] } | null
 */
export function parseLooseEnumFromComment(
  comment?: string | null
): { strict: boolean; values: string[] } | null {
  if (!comment) return null;

  // Extract the comment text (remove /// markers)
  const cleanComment = comment
    .replace(/^\/\/\/\s*/gm, "")
    .replace(/^\/\/\s*/gm, "")
    .trim();

  // Match @type followed by optional ! and array of strings
  // Format: @type !["value1", "value2"] (strict)
  // Format: @type ["value1", "value2"] (loose)
  const strictMatch = cleanComment.match(/@type\s+!\s*\[(.*?)\]/);
  const looseMatch = cleanComment.match(/@type\s+\[(.*?)\]/);

  if (strictMatch) {
    // Strict mode: literal union type
    const valuesStr = strictMatch[1];
    const values = valuesStr
      .split(",")
      .map((v) => v.trim().replace(/^["']|["']$/g, ""))
      .filter((v) => v.length > 0);
    return { strict: true, values };
  }

  if (looseMatch) {
    // Loose mode: autocomplete-friendly but allows other strings
    const valuesStr = looseMatch[1];
    const values = valuesStr
      .split(",")
      .map((v) => v.trim().replace(/^["']|["']$/g, ""))
      .filter((v) => v.length > 0);
    return { strict: false, values };
  }

  return null;
}

/**
 * Check if model should be included based on include/exclude filters
 */
export function shouldIncludeModel(
  modelName: string,
  include?: string,
  exclude?: string
): boolean {
  // If exclude is specified and model is in exclude list, exclude it
  if (exclude) {
    const excludeList = exclude.split(",").map((s) => s.trim());
    if (excludeList.includes(modelName)) {
      return false;
    }
  }

  // If include is specified, only include models in the list
  if (include) {
    const includeList = include.split(",").map((s) => s.trim());
    return includeList.includes(modelName);
  }

  // If neither is specified, include all
  return true;
}

/**
 * Convert model name to file name
 */
export function modelToFileName(modelName: string): string {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}

/**
 * Map model to schema file name based on naming convention
 * Post* -> post.ts, User* -> user.ts, Test* -> test.ts
 * Everything else -> index.ts (from schema.prisma)
 */
export function getSchemaFileNameForModel(
  modelName: string,
  schemaFiles?: string[]
): string {
  // Extract base names from schema files if provided (post.prisma -> post)
  const baseNames: string[] = [];
  if (schemaFiles && schemaFiles.length > 0) {
    schemaFiles
      .map((file) => file.replace(/\.prisma$/, "").toLowerCase())
      .filter((name) => name !== "schema") // Exclude schema.prisma
      .forEach((name) => baseNames.push(name));
  }

  // Try to match model name prefix to schema file
  // Post* -> post, User* -> user, Test* -> test
  for (const baseName of baseNames) {
    const prefix = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    if (modelName.startsWith(prefix)) {
      return baseName;
    }
  }

  // Fallback: use naming convention based on model name
  // Extract the first capitalized word from model name
  // Post -> post, User -> user, PostComment -> post, UserProfile -> user
  const match = modelName.match(/^([A-Z][a-z]+)/);
  if (match) {
    const prefix = match[1].toLowerCase();
    // If we have schema files and this prefix matches one, use it
    if (baseNames.length > 0 && baseNames.includes(prefix)) {
      return prefix;
    }
    // Otherwise use the prefix (for common cases like Post, User, Test)
    if (["post", "user", "test"].includes(prefix)) {
      return prefix;
    }
  }

  // Default to index (from schema.prisma)
  return "index";
}

/**
 * Group models by schema file
 */
export function groupModelsBySchemaFile<T extends { name: string }>(
  models: readonly T[],
  schemaFiles?: string[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const model of models) {
    const fileName = getSchemaFileNameForModel(model.name, schemaFiles);
    if (!groups.has(fileName)) {
      groups.set(fileName, []);
    }
    groups.get(fileName)!.push(model);
  }

  return groups;
}

/**
 * Group enums by schema file (similar logic)
 */
export function groupEnumsBySchemaFile<T extends { name: string }>(
  enums: readonly T[],
  schemaFiles?: string[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const enumType of enums) {
    const fileName = getSchemaFileNameForModel(enumType.name, schemaFiles);
    if (!groups.has(fileName)) {
      groups.set(fileName, []);
    }
    groups.get(fileName)!.push(enumType);
  }

  return groups;
}

/**
 * Generate PrismaType namespace with Json interface
 * Uses global namespace declaration so it can be extended without imports
 */
export function generatePrismaTypeNamespace(): string {
  return `/**
 * PrismaType namespace for custom type mappings
 * This namespace is used when jsonTypeMapping is enabled
 * 
 * IMPORTANT: To extend this namespace with your own interfaces (like UserPreferences),
 * create a file named 'prisma-json.ts' in your project and extend the global namespace:
 * 
 * // prisma-json.ts
 * // This file must be a module, so we include an empty export.
 * export {};
 * 
 * declare global {
 *   namespace PrismaType {
 *     interface Json {
 *       [key: string]: any; // Customize as needed
 *     }
 *     interface UserPreferences {
 *       theme: "light" | "dark";
 *       language: "en" | "es";
 *     }
 *   }
 * }
 * 
 * Make sure your prisma-json.ts file is included in your tsconfig.json 'include' array.
 * 
 * Then in your Prisma schema:
 * /// @type Json=UserPreferences
 * preferences Json  // Will use PrismaType.UserPreferences via namespace merging
 * 
 * Or use inline types:
 * /// @type Json=any
 * metadata Json  // Uses PrismaType.Json
 */
// This file must be a module, so we include an empty export.
export {};

declare global {
  namespace PrismaType {
    interface Json {
      [key: string]: any;
    }
  }
}
`;
}
