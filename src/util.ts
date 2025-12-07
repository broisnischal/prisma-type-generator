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
  jsonTypeMapping?: boolean,
  namespaceName: string = "PrismaType"
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
    result.Json = `${namespaceName}.Json`;
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
  return comment
    .replace(/^\/\/\/\s*/gm, "")
    .replace(/^\/\/\s*/gm, "")
    .trim();
}


export function parseOmitDirective(
  comment?: string | null
): { fields: string[]; typeName?: string } | null {
  if (!comment) return null;

  const cleanComment = comment
    .replace(/^\/\/\/\s*/gm, "")
    .replace(/^\/\/\s*/gm, "")
    .trim();

  // Match @omit followed by comma-separated field names and optional type name
  // Examples:
  // @omit createdAt,updatedAt
  // @omit createdAt,updatedAt WithoutTimestamps
  // @omit password WithoutPassword
  // Handle multiple directives by matching until next @ or end of string
  const match = cleanComment.match(/@omit\s+(.+?)(?:\s+([A-Z][a-zA-Z0-9]*))?(?=\s*@|\s*$)/);
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
 * Parse @pick directive from Prisma model comment
 * Format: /// @pick id,name,email
 * Format: /// @pick id,name,email UserBasic
 * Returns object with fields to pick and optional type name, or null if not found
 */
export function parsePickDirective(
  comment?: string | null
): { fields: string[]; typeName?: string } | null {
  if (!comment) return null;

  const cleanComment = comment
    .replace(/^\/\/\/\s*/gm, "")
    .replace(/^\/\/\s*/gm, "")
    .trim();

  // Handle multiple directives by matching until next @ or end of string
  const match = cleanComment.match(/@pick\s+(.+?)(?:\s+([A-Z][a-zA-Z0-9]*))?(?=\s*@|\s*$)/);
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
 * Parse @input or @inputmodel directive from Prisma model comment
 * Format: /// @input
 * Format: /// @input CreateInput,UpdateInput
 * Format: /// @inputmodel
 * Format: /// @inputmodel CreateInput,UpdateInput
 * Returns array of input type names to generate, or null if not found
 */
export function parseInputDirective(comment?: string | null): string[] | null {
  if (!comment) return null;

  const cleanComment = comment
    .replace(/^\/\/\/\s*/gm, "")
    .replace(/^\/\/\s*/gm, "")
    .trim();

  // Support both @input and @inputmodel directives
  // Handle multiple directives by matching until next @ or end of string
  const match = cleanComment.match(/@input(?:model)?(?:\s+(.+?))?(?=\s*@|\s*$)/);
  if (match) {
    if (match[1]) {
      // Custom input type names
      const names = match[1]
        .split(",")
        .map((n) => n.trim())
        .filter((n) => n.length > 0);
      return names.length > 0 ? names : null;
    }
    // Default: generate CreateInput and UpdateInput
    return ["CreateInput", "UpdateInput"];
  }

  return null;
}

/** 
 * Parse @group directive from Prisma model comment
 * Format: /// @group timestamps createdAt,updatedAt
 * Format: /// @group auth password,email
 * Returns map of group names to field arrays, or null if not found
 */
export function parseGroupDirective(
  comment?: string | null
): Map<string, string[]> | null {
  if (!comment) return null;

  const cleanComment = comment
    .replace(/^\/\/\/\s*/gm, "")
    .replace(/^\/\/\s*/gm, "")
    .trim();

  const groups = new Map<string, string[]>();
  const matches = Array.from(
    cleanComment.matchAll(/@group\s+(\w+)\s+(.+?)(?=\s*@|\s*$)/g)
  );

  for (const match of matches) {
    const groupName = match[1].trim();
    const fieldsStr = match[2].trim();
    const fields = fieldsStr
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    if (groupName && fields.length > 0) {
      groups.set(groupName, fields);
    }
  }

  return groups.size > 0 ? groups : null;
}

/**
 * Parse @with directive from Prisma model comment (for relation types)
 * Format: /// @with posts
 * Format: /// @with posts,profile
 * Format: /// @with posts WithPosts
 * Returns object with relations to include and optional type name, or null if not found
 */
export function parseWithDirective(
  comment?: string | null
): { relations: string[]; typeName?: string } | null {
  if (!comment) return null;

  const cleanComment = comment
    .replace(/^\/\/\/\s*/gm, "")
    .replace(/^\/\/\s*/gm, "")
    .trim();

  // Match @with followed by comma-separated relation names and optional type name
  // Handle multiple directives by matching until next @ or end of string
  const match = cleanComment.match(/@with\s+(.+?)(?:\s+([A-Z][a-zA-Z0-9]*))?(?=\s*@|\s*$)/);
  if (match && match[1]) {
    const relationsStr = match[1].trim();
    const typeName = match[2]?.trim();

    const relations = relationsStr
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    if (relations.length > 0) {
      return {
        relations,
        typeName: typeName || undefined,
      };
    }
  }

  return null;
}

/**
 * Parse @select directive from Prisma model comment
 * Format: /// @select
 * Returns true if select types should be generated, false otherwise
 */
export function parseSelectDirective(comment?: string | null): boolean {
  if (!comment) return false;

  const cleanComment = comment
    .replace(/^\/\/\/\s*/gm, "")
    .replace(/^\/\/\s*/gm, "")
    .trim();

  // Match @select followed by whitespace, end of string, or before next @
  return /@select(?=\s|$|@)/.test(cleanComment);
}

/**
 * Parse @validated directive from Prisma model comment
 * Format: /// @validated
 * Format: /// @validated Validated
 * Returns type name or null
 */
export function parseValidatedDirective(
  comment?: string | null
): string | null {
  if (!comment) return null;

  const cleanComment = comment
    .replace(/^\/\/\/\s*/gm, "")
    .replace(/^\/\/\s*/gm, "")
    .trim();

  // Handle multiple directives by matching until next @ or end of string
  const match = cleanComment.match(/@validated(?:\s+([A-Z][a-zA-Z0-9]*))?(?=\s*@|\s*$)/);
  if (match) {
    return match[1]?.trim() || "Validated";
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
 * Format: /// @type Json=!{ width: number; height: number }  (inline object type with @type)
 * Format: /// !{ width: number; height: number }  (standalone inline object type)
 * Format: /// ![{ width: number; height: number }]  (inline array/tuple type)
 * Supports any TypeScript type/interface name from your project
 */
export function parseTypeMappingFromComment(
  comment?: string | null,
  jsonTypeMapping?: boolean,
  namespaceName: string = "PrismaType"
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
  // - Inline object: ![{ width: number; height: number }]

  const cleanComment = comment
    .replace(/^\/\/\/\s*/gm, "")
    .replace(/^\/\/\s*/gm, "")
    .trim();

  // Check if this is a string array literal (should be handled by parseLooseEnumFromComment)
  // Format: ["value1", "value2"] or !["value1", "value2"] - skip this, it's for union literal types
  if (cleanComment.startsWith("[") && /^\[["']/.test(cleanComment)) {
    // This looks like a standalone string array literal, let parseLooseEnumFromComment handle it
    return null;
  }

  // Check for inline type definition: !{ ... } or ![{ ... }] or !TypeName
  // This format allows defining types directly in the comment
  // Examples:
  //   /// !{ width: number; height: number }
  //   /// ![{ width: number; height: number }]
  //   /// !Record<string, number>
  // Note: !["string1", "string2"] is handled by parseLooseEnumFromComment, not here
  if (cleanComment.startsWith("!")) {
    // Extract the type definition after the !
    const typeDef = cleanComment.substring(1).trim();

    // Check if this is a string array literal (should be handled by parseLooseEnumFromComment)
    // Format: !["value1", "value2"] - skip this, it's for union literal types
    if (typeDef.startsWith("[") && /^\[["']/.test(typeDef)) {
      // This looks like a string array literal, let parseLooseEnumFromComment handle it
      return null;
    }

    // If it starts with {, match balanced braces
    if (typeDef.startsWith("{")) {
      let braceCount = 0;
      let endIndex = -1;
      for (let i = 0; i < typeDef.length; i++) {
        if (typeDef[i] === "{") braceCount++;
        if (typeDef[i] === "}") {
          braceCount--;
          if (braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }
      if (endIndex > 0) {
        return typeDef.substring(0, endIndex).trim();
      }
    }

    // If it starts with [, match balanced brackets (for array types, but not string literals)
    if (typeDef.startsWith("[")) {
      let bracketCount = 0;
      let endIndex = -1;
      for (let i = 0; i < typeDef.length; i++) {
        if (typeDef[i] === "[") bracketCount++;
        if (typeDef[i] === "]") {
          bracketCount--;
          if (bracketCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }
      if (endIndex > 0) {
        return typeDef.substring(0, endIndex).trim();
      }
    }

    // Otherwise, return the entire type definition (for simple types like Record<string, number>)
    return typeDef;
  }

  const match = cleanComment.match(/@type\s+(\S+)\s*=\s*(.+)/);

  if (match && match[1] && match[2]) {
    const prismaType = match[1].trim();
    let typeName = match[2].trim();

    typeName = typeName.replace(/\s*\/\/.*$/, "").trim();

    // Check if typeName is an inline type definition (starts with !)
    if (typeName.startsWith("!")) {
      const inlineType = typeName.substring(1).trim();

      // Handle inline object types: !{ ... }
      if (inlineType.startsWith("{")) {
        let braceCount = 0;
        let endIndex = -1;
        for (let i = 0; i < inlineType.length; i++) {
          if (inlineType[i] === "{") braceCount++;
          if (inlineType[i] === "}") {
            braceCount--;
            if (braceCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
        if (endIndex > 0) {
          return inlineType.substring(0, endIndex).trim();
        }
      }

      // Handle inline array/tuple types: ![{ ... }]
      if (inlineType.startsWith("[")) {
        let bracketCount = 0;
        let endIndex = -1;
        for (let i = 0; i < inlineType.length; i++) {
          if (inlineType[i] === "[") bracketCount++;
          if (inlineType[i] === "]") {
            bracketCount--;
            if (bracketCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
        if (endIndex > 0) {
          return inlineType.substring(0, endIndex).trim();
        }
      }

      // Otherwise return the inline type as-is
      return inlineType;
    }

    if (prismaType === "Json" && jsonTypeMapping) {
      if (typeName === "any" || typeName === "Json") {
        return `${namespaceName}.Json`;
      }
      if (typeName.startsWith(`${namespaceName}.`)) {
        return typeName;
      }
      const isSimpleIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(typeName);
      if (isSimpleIdentifier) {
        return `${namespaceName}.${typeName}`;
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
      const namespacePrefix = `${namespaceName}.`;
      const namespacePrefixLength = namespacePrefix.length;
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
          Math.max(0, matchIndex + offset - namespacePrefixLength),
          matchIndex + offset
        );
        if (beforeMatch === namespacePrefix) {
          continue;
        }

        const before = result.substring(0, matchIndex + offset);
        const after = result.substring(matchIndex + offset + identifier.length);
        result = before + `${namespacePrefix}${identifier}` + after;
        offset += namespacePrefixLength;
      }
      return result;
    }

    return typeName;
  }

  const simpleMatch = cleanComment.match(/@type\s+(\S+)=(\S+)/);
  if (simpleMatch) {
    const prismaType = simpleMatch[1];
    let typeName = simpleMatch[2];

    // Check if typeName is an inline type definition (starts with !)
    if (typeName.startsWith("!")) {
      const inlineType = typeName.substring(1).trim();

      // Handle inline object types: !{ ... }
      if (inlineType.startsWith("{")) {
        let braceCount = 0;
        let endIndex = -1;
        for (let i = 0; i < inlineType.length; i++) {
          if (inlineType[i] === "{") braceCount++;
          if (inlineType[i] === "}") {
            braceCount--;
            if (braceCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
        if (endIndex > 0) {
          return inlineType.substring(0, endIndex).trim();
        }
      }

      // Handle inline array/tuple types: ![{ ... }]
      if (inlineType.startsWith("[")) {
        let bracketCount = 0;
        let endIndex = -1;
        for (let i = 0; i < inlineType.length; i++) {
          if (inlineType[i] === "[") bracketCount++;
          if (inlineType[i] === "]") {
            bracketCount--;
            if (bracketCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
        if (endIndex > 0) {
          return inlineType.substring(0, endIndex).trim();
        }
      }

      // Otherwise return the inline type as-is
      return inlineType;
    }

    if (prismaType === "Json" && jsonTypeMapping) {
      if (typeName === "any" || typeName === "Json") {
        return `${namespaceName}.Json`;
      }
      if (typeName.startsWith(`${namespaceName}.`)) {
        return typeName;
      }
      const isSimpleIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(typeName);
      if (isSimpleIdentifier) {
        return `${namespaceName}.${typeName}`;
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
      const namespacePrefix = `${namespaceName}.`;
      const namespacePrefixLength = namespacePrefix.length;
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

        // Skip if already prefixed with namespace.
        const beforeMatch = result.substring(
          Math.max(0, matchIndex + offset - namespacePrefixLength),
          matchIndex + offset
        );
        if (beforeMatch === namespacePrefix) {
          continue;
        }

        // Replace with namespace prefix
        const before = result.substring(0, matchIndex + offset);
        const after = result.substring(matchIndex + offset + identifier.length);
        result = before + `${namespacePrefix}${identifier}` + after;
        offset += namespacePrefixLength;
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
 * Format: /// !["email", "google"]  (standalone strict literal union)
 * Format: /// ["email", "google"]  (standalone loose autocomplete)
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

  // Match standalone !["..."] format (strict literal union)
  // Format: !["value1", "value2"] (strict)
  const standaloneStrictMatch = cleanComment.match(/^!\s*\[(.*?)\]$/);

  // Match standalone ["..."] format (loose autocomplete)
  // Format: ["value1", "value2"] (loose)
  const standaloneLooseMatch = cleanComment.match(/^\[(.*?)\]$/);

  if (strictMatch) {
    // Strict mode: literal union type
    const valuesStr = strictMatch[1];
    const values = valuesStr
      .split(",")
      .map((v) => v.trim().replace(/^["']|["']$/g, ""))
      .filter((v) => v.length > 0);
    return { strict: true, values };
  }

  if (standaloneStrictMatch) {
    // Standalone strict mode: literal union type
    const valuesStr = standaloneStrictMatch[1];
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

  if (standaloneLooseMatch) {
    // Standalone loose mode: autocomplete-friendly but allows other strings
    const valuesStr = standaloneLooseMatch[1];
    const values = valuesStr
      .split(",")
      .map((v) => v.trim().replace(/^["']|["']$/g, ""))
      .filter((v) => v.length > 0);
    // Only return if it looks like a string array (contains quoted strings)
    if (values.length > 0 && /["']/.test(valuesStr)) {
      return { strict: false, values };
    }
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
 * Check if enum should be included based on include/exclude filters
 */
export function shouldIncludeEnum(
  enumName: string,
  include?: string,
  exclude?: string
): boolean {
  // If exclude is specified and enum is in exclude list, exclude it
  if (exclude) {
    const excludeList = exclude.split(",").map((s) => s.trim());
    if (excludeList.includes(enumName)) {
      return false;
    }
  }

  // If include is specified, only include enums in the list
  if (include) {
    const includeList = include.split(",").map((s) => s.trim());
    return includeList.includes(enumName);
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
 * Infer schema file names from model/enum names
 * Collects all unique prefixes from models/enums to determine schema files
 */
export function inferSchemaFileNames<T extends { name: string }>(
  items: readonly T[]
): Set<string> {
  const schemaNames = new Set<string>();
  for (const item of items) {
    const match = item.name.match(/^([A-Z][a-z]+)/);
    if (match) {
      const prefix = match[1].toLowerCase();
      schemaNames.add(prefix);
    }
  }
  return schemaNames;
}

/**
 * Map model to schema file name based on naming convention
 * Post* -> post.ts, User* -> user.ts, Like* -> like.ts
 * Everything else -> null (will be handled separately for enums -> enums.ts)
 */
export function getSchemaFileNameForModel(
  modelName: string,
  schemaFiles?: string[],
  inferredSchemaNames?: Set<string>
): string | null {
  // Extract base names from schema files if provided (post.prisma -> post)
  const baseNames: string[] = [];
  if (schemaFiles && schemaFiles.length > 0) {
    schemaFiles
      .map((file) => file.replace(/\.prisma$/, "").toLowerCase())
      .filter((name) => name !== "schema") // Exclude schema.prisma
      .forEach((name) => baseNames.push(name));
  }

  // Use inferred schema names if provided (from all models/enums)
  const allSchemaNames = inferredSchemaNames || new Set<string>();
  if (allSchemaNames.size > 0) {
    for (const schemaName of allSchemaNames) {
      baseNames.push(schemaName);
    }
  }

  // Try to match model name prefix to schema file
  // Post* -> post, User* -> user, Like* -> like
  for (const baseName of baseNames) {
    const prefix = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    if (modelName.startsWith(prefix)) {
      return baseName;
    }
  }

  // Fallback: use naming convention based on model name
  // Extract the first capitalized word from model name
  // Post -> post, User -> user, PostComment -> post, UserProfile -> user, Like -> like
  const match = modelName.match(/^([A-Z][a-z]+)/);
  if (match) {
    const prefix = match[1].toLowerCase();
    // Only return the prefix if it matches a known schema file name
    if (baseNames.length > 0 && baseNames.includes(prefix)) {
      return prefix;
    }
    // Check if any schema file name matches this prefix
    if (baseNames.length > 0) {
      for (const baseName of baseNames) {
        if (baseName === prefix || baseName.startsWith(prefix) || prefix.startsWith(baseName)) {
          return baseName;
        }
      }
    }
    // If we have inferred schema names, only return prefix if it's in the set
    if (allSchemaNames.size > 0 && allSchemaNames.has(prefix)) {
      return prefix;
    }
  }

  // Return null to indicate it doesn't match any schema file
  // This will be handled by the caller (enums -> enums.ts, models -> index.ts only if from schema.prisma)
  return null;
}

/**
 * Group models by schema file
 */
export function groupModelsBySchemaFile<T extends { name: string }>(
  models: readonly T[],
  schemaFiles?: string[],
  inferredSchemaNames?: Set<string>
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const model of models) {
    const fileName = getSchemaFileNameForModel(model.name, schemaFiles, inferredSchemaNames);
    // Use "index" for models that don't match any schema file (from schema.prisma)
    const fileKey = fileName || "index";
    if (!groups.has(fileKey)) {
      groups.set(fileKey, []);
    }
    groups.get(fileKey)!.push(model);
  }

  return groups;
}

/**
 * Group enums by schema file (similar logic)
 * Enums that don't match any schema file go to "enums" instead of "index"
 */
export function groupEnumsBySchemaFile<T extends { name: string }>(
  enums: readonly T[],
  schemaFiles?: string[],
  inferredSchemaNames?: Set<string>
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const enumType of enums) {
    const fileName = getSchemaFileNameForModel(enumType.name, schemaFiles, inferredSchemaNames);
    // Use "enums" for enums that don't match any schema file
    const fileKey = fileName || "enums";
    if (!groups.has(fileKey)) {
      groups.set(fileKey, []);
    }
    groups.get(fileKey)!.push(enumType);
  }

  return groups;
}

/**
 * Generate PrismaType namespace with Json interface
 * Uses global namespace declaration so it can be extended without imports
 */
export function generatePrismaTypeNamespace(namespaceName: string = "PrismaType"): string {
  return `/**
 * ${namespaceName} namespace for custom type mappings
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
 *   namespace ${namespaceName} {
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
 * preferences Json  // Will use ${namespaceName}.UserPreferences via namespace merging
 * 
 * Or use inline types:
 * /// @type Json=any
 * metadata Json  // Uses ${namespaceName}.Json
 */
// This file must be a module, so we include an empty export.
export {};

declare global {
  namespace ${namespaceName} {
    interface Json {
      [key: string]: any;
    }
  }
}
`;
}
