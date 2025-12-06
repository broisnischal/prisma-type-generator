# Prisma Type Generator

[![npm version](https://img.shields.io/npm/v/prisma-type-generator.svg)](https://www.npmjs.com/package/prisma-type-generator)
![GitHub Repo stars](https://img.shields.io/github/stars/broisnischal/prisma-type-generator?style=social)
![GitHub top language](https://img.shields.io/github/languages/top/broisnischal/prisma-type-generator?style=plastic)
[![License](https://img.shields.io/npm/l/prisma-type-generator.svg)](https://opensource.org/licenses/MIT)

Generate lightweight TypeScript types from your Prisma schema. Perfect for frontend type sharing without importing heavy Prisma Client. Make sure to not add/edit the generated files as they vanishes after the new generate.

## Quick Start

**1. Installation :**

```bash
npm install prisma-type-generator

# ni prisma-type-generator (@antfu/ni)
```

**2. Add generator to `schema.prisma`:**

```ts
generator types {
  provider = "prisma-type-generator"
  output   = "../generated/types"
}
```

**3. Generate:**

```bash
npx prisma generate --no-hints
```

**4. Use:**

```ts
import type { User, Profile } from "../generated/types/prisma";

const user: User = {
  id: "123",
  name: "John Doe",
  email: "john@example.com",
};
```

## Why Use This?

**Problem:** Prisma Client is heavy (~2MB+) and includes runtime code. You don't want it in your frontend bundle.

**Solution:** Generate lightweight TypeScript interfaces that are perfect for:

- ✅ **Frontend/Client-Side** - Type-safe API responses without Prisma Client
- ✅ **API Response Types** - Clean interfaces for REST/GraphQL APIs
- ✅ **Monorepo Sharing** - Share types between packages without Prisma Client
- ✅ **Form Validation** - Use types for form schemas and validation
- ✅ **Type-Only Imports** - Zero runtime code, types only

**Example:**

```ts
// ❌ Don't do this in frontend - Prisma Client is too heavy!
import { Prisma } from "@prisma/client";

// ✅ Do this instead - lightweight types only!
import type { User, Profile } from "../generated/types/prisma";
```

## Features

### Core Type Generation

Generates TypeScript interfaces from Prisma models and enum types with const objects.

**Example:**

```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  email     String?  @unique
  createdAt DateTime @default(now())
}

enum UserRole {
  ADMIN
  USER
}
```

**Generated TypeScript:**

```ts
export type UserRole = "ADMIN" | "USER";

export declare const UserRole: {
  readonly ADMIN: "ADMIN";
  readonly USER: "USER";
};

export interface User {
  id: string;
  name: string;
  email: string | null;
  createdAt: Date;
}
```

---

## Configuration Options

### `output`

where to have your generated files, to be in ( ie: generated/types, ) or in your shared `monorepo` lib.

**Example:**

```prisma
generator types {
  provider = "prisma-type-generator"
  output   = "../shared/types"  // Custom output path
}
```

---

### `clear`

Clears the output directory before generating new types. CI/CD `pipelines`, ensuring clean builds, or when debugging type generation issues. Prevents `stale files` from previous generations, ensures consistency, and helps catch issues early.

**Example:**

```prisma
generator types {
  provider = "prisma-type-generator"
  output   = "../generated/types"
  clear    = true  // Remove old files first
}
```

---

### `enumOnly`

Generates only enum types, skipping all model types. Faster generation, smaller output size, and focused type generation for enum-only use cases.

**Example:**

```prisma
generator types {
  provider = "prisma-type-generator"
  output   = "../generated/types"
  enumOnly = true  // Only generate enums
}
```

---

### `global`

Generates types in the global namespace with a `T` prefix (e.g., `TUser` instead of `User`). No imports needed - types are available globally. Works well with global type declaration files.

**Example:**

```prisma
generator types {
  provider = "prisma-type-generator"
  output   = "../generated/types"
  global   = true  // Generate global types
}

model User {
  id   String @id
  name String
}
```

**Generated TypeScript:**

```ts
// Types are in global namespace with T prefix
declare type TUser = {
  id: string;
  name: string;
};
```

**Usage:**

```ts
// No import needed!
const user: TUser = { id: "1", name: "John" };
```

---

### `include`

Generates types only for the specified models (comma-separated list). Selective type generation. Make sure to select the referential enums, models as well.

**Example:**

```prisma
generator types {
  provider = "prisma-type-generator"
  output   = "../generated/types"
  include  = "User,UserTypeEnum"
}
```

---

### `exclude`

Skips specified models during type generation (comma-separated list).
**Example:**

```prisma
generator types {
  provider = "prisma-type-generator"
  output   = "../generated/types"
  exclude  = "InternalModel,AdminUser,AuditLog"  // Skip these
}
```

---

### `splitFiles`

Splits output into separate files - one file per model and enum. Faster IDE performance, better tree-shaking, easier navigation, and selective imports reduce bundle size.

**Example:**

```prisma
generator types {
  provider   = "prisma-type-generator"
  output     = "../generated/types"
  splitFiles = true  // One file per model/enum
}

model User {
  id   String @id
  name String
}

model Post {
  id    String @id
  title String
}

enum UserRole {
  ADMIN
  USER
}
```

**Generated File Structure:**

```
generated/types/
  ├── User.ts
  ├── Post.ts
  ├── UserRole.ts
  └── index.ts  // Barrel export (if barrelExports = true)
```

---

### `splitBySchema` ( prisma multi file schema feature )

Splits types by Prisma schema file names. Models are matched by name prefix (e.g., `User*` → `user.ts`).

**Schema Files:**

```
prisma/
  ├── schema.prisma
  ├── user.prisma
  └── post.prisma
```

**Generator Config:**

```prisma
generator types {
  provider      = "prisma-type-generator"
  output        = "../generated/types"
  splitBySchema = true  // Split by schema files
}
```

**Generated File Structure:**

```
generated/types/
  ├── user.ts      // User, UserProfile (from user.prisma)
  ├── post.ts      // Post (from post.prisma)
  └── index.ts     // Exports everything (from schema.prisma)
```

---

### `barrelExports`

Generates `index.ts` barrel exports for easier imports (enabled by default).

**Example:**

**With `barrelExports = true` (default):**

```ts
// generated/types/index.ts
export * from "./User";
export * from "./Post";
export * from "./UserRole";
```

---

### `basicUtilityTypes`

Generates basic utility types (`Partial`, `Required`, `Readonly`, `DeepPartial`, `DeepRequired`) for every model (enabled by default).

**Example:**

```prisma
model User {
  id        String   @id
  name      String
  email     String?
  createdAt DateTime
}
```

**Generated Types:**

```ts
export interface User {
  id: string;
  name: string;
  email: string | null;
  createdAt: Date;
}

export namespace User {
  // Always generated (unless basicUtilityTypes = false)
  export type Partial = Partial<User>;
  export type Required = Required<User>;
  export type Readonly = Readonly<User>;
  export type DeepPartial<T = User> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
  };
  export type DeepRequired<T = User> = {
    [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
  };
}
```

---

## Type Customization

### `typeMappings`

Maps Prisma types to custom TypeScript types globally (e.g., `DateTime` → `string`).

**Example:**

```prisma
generator types {
  provider     = "prisma-type-generator"
  output       = "../generated/types"
  typeMappings = "DateTime=string,Bytes=Uint8Array"
}

model User {
  id        String   @id
  createdAt DateTime  // Will be generated as string
  avatar    Bytes     // Will be generated as Uint8Array
}
```

**Generated TypeScript:**

```ts
export interface User {
  id: string;
  createdAt: string; // Mapped from DateTime
  avatar: Uint8Array; // Mapped from Bytes
}
```

---

### `jsonTypeMapping`

Enables `PrismaType` namespace for JSON types, allowing you to extend JSON field types. you can even provide the namespaceName `PrismaJson` or anything you would like to use, and it's cross compatible with `prisma-json-types-generator`.

`namespaceName` Sets a custom namespace name for JSON type mapping (default: `PrismaType`).

**Example:**

**schema.prisma:**

```prisma
generator types {
  provider       = "prisma-type-generator"
  output         = "../generated/types"
  jsonTypeMapping = true  // Enable PrismaType namespace
}

model User {
  id         String @id
  preferences Json   // Will use PrismaType.Json
  metadata    Json
}
```

**prisma-json.d.ts (create this file):**

```ts
// Extend PrismaType namespace with your JSON types
declare namespace PrismaType {
  interface Json {
    // Define your JSON structure here
  }

  // Or use specific types
  interface UserPreferences {
    theme: "light" | "dark";
    notifications: boolean;
  }

  interface UserMetadata {
    lastLogin: string;
    ipAddress: string;
  }
}
```

**Generated TypeScript:**

```ts
export interface User {
  id: string;
  preferences: PrismaType.Json | null;
  metadata: PrismaType.Json | null;
}
```

**Usage with Field-Level Override:**

```prisma
model User {
  /// @type Json=UserPreferences
  preferences Json  // Will use PrismaType.UserPreferences
}
```

---

### `jsDocComments`

Generates JSDoc comments from Prisma schema comments in the generated TypeScript.

**Example:**

```prisma
generator types {
  provider      = "prisma-type-generator"
  output        = "../generated/types"
  jsDocComments = true  // Generate JSDoc comments
}

/// User model represents a user account in the system
model User {
  /// Unique identifier for the user
  id        String   @id @default(uuid())
  /// User's full name
  name      String
  /// User's email address (optional)
  email     String?  @unique
  /// Account creation timestamp
  createdAt DateTime @default(now())
}
```

**Generated TypeScript:**

```ts
/**
 * User model represents a user account in the system
 */
export interface User {
  /**
   * Unique identifier for the user
   */
  id: string;
  /**
   * User's full name
   */
  name: string;
  /**
   * User's email address (optional)
   */
  email: string | null;
  /**
   * Account creation timestamp
   */
  createdAt: Date;
}
```

---

## Field-Level Customization

### Field-Level Type Overrides (`@type`)

Override the TypeScript type for specific fields using comments. Per-field customization, API compatibility, or when different fields need different type representations.

**Example:**

```prisma
model User {
  id        String   @id
  /// @type DateTime=string
  createdAt DateTime  // This field will be string, not Date

  /// @type Json=UserPreferences
  preferences Json     // This field will be UserPreferences, not Record<string, unknown>
}

// Define UserPreferences in namespace
```

**Generated TypeScript:**

```ts
export interface User {
  id: string;
  createdAt: string; // Overridden to string
  preferences: UserPreferences | null; // Overridden to UserPreferences
}
```

---

### Loose Autocomplete Enums

Creates string fields with autocomplete suggestions while still allowing other values (flexible enums).

**Example:**

**Strict Enum (only allowed values):**

```prisma
model User {
  /// @type !["email", "google"]
  authProvider String  // Only "email" or "google" allowed
}
```

**Generated TypeScript:**

```ts
export interface User {
  authProvider: "email" | "google"; // Strict - only these values
}
```

**Loose Enum (autocomplete + flexibility):**

```prisma
model User {
  /// @type ["email", "google"]
  authProvider String  // Autocomplete suggests these, but accepts any string
}
```

**Generated TypeScript:**

```ts
export interface User {
  // Autocomplete suggests "email" | "google", but accepts any string
  authProvider: "email" | "google" | (string & {});
}
```

---

## Directive-Based Utility Types

Add directives to your Prisma models to generate additional utility types. These are opt-in features that give you powerful type transformations.

### `@input` - Input Types (Create/Update DTOs)

Generates `CreateInput` and `UpdateInput` types that automatically exclude auto-generated fields.

**Example:**

```prisma
/// @input
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Generated Types:**

```ts
export namespace User {
  /**
   * Input type for creating User (omits id, createdAt, updatedAt)
   */
  export type CreateInput = Omit<User, "id" | "createdAt" | "updatedAt">;

  /**
   * Input type for updating User (all fields optional, omits id)
   */
  export type UpdateInput = Partial<Omit<User, "id">>;
}
```

---

### `@select` - Select Types for Prisma Queries

Generates a `Select` type for type-safe Prisma query select clauses.

**Example:**

```prisma
/// @select
model User {
  id        String   @id
  name      String
  email     String
  createdAt DateTime
}
```

**Generated Types:**

```ts
export namespace User {
  /**
   * Select type for Prisma queries
   */
  export type Select = {
    id?: boolean;
    name?: boolean;
    email?: boolean;
    createdAt?: boolean;
  };
}
```

**Usage:**

```ts
// Type-safe Prisma select // like: Prisma.UserSelectInput
const selectClause: User.Select = {
  id: true,
  name: true,
  // email and createdAt are optional
};

// Use with Prisma Client
const user = await prisma.user.findUnique({
  where: { id: "123" },
  select: selectClause, // Type-safe!
});
```

---

### `@with` - Relation Types

Generates types that include related models (e.g., `WithPosts`, `WithProfile`). Type-safe relations, better autocomplete, and ensures included relations match your schema.

**Example:**

```prisma
/// @with posts,profile
model User {
  id      String   @id
  name    String
  posts   Post[]
  profile Profile?
}

model Post {
  id       String @id
  title    String
  authorId String
  author   User   @relation(fields: [authorId], references: [id])
}

model Profile {
  id     String @id
  bio    String
  userId String @unique
  user   User   @relation(fields: [userId], references: [id])
}
```

**Generated Types:**

```ts
export namespace User {
  /**
   * User with relations: posts, profile
   */
  export type WithPostsAndProfile = User & {
    posts: Post[];
    profile: Profile;
  };
}
```

---

### `@group` - Field Groups

Groups related fields together into reusable types. Logical field grouping, reusable field sets, or when you want to organize related fields.

**Example:**

```prisma
/// @group timestamps createdAt,updatedAt
/// @group auth password,email
model User {
  id        String   @id
  name      String
  email     String
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Generated Types:**

```ts
export namespace User {
  /**
   * timestamps fields: createdAt, updatedAt
   */
  export type TimestampsFields = Pick<User, "createdAt" | "updatedAt">;

  /**
   * auth fields: password, email
   */
  export type AuthFields = Pick<User, "password" | "email">;
}
```

**Usage:**

```ts
// Access auth fields
const authData: User.AuthFields = {
  email: "john@example.com",
  password: "hashed_password",
};
```

---

### `@validated` - Validation Types

Generates a `Validated` type that marks data as validated with a `__validated: true` marker. Runtime validation, type guards, or when you need to distinguish validated from unvalidated data. Type-safe validation, compile-time safety, and clear distinction between validated and unvalidated data.

**Example:**

```prisma
/// @validated
model User {
  id        String   @id
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
}
```

**Generated Types:**

```ts
export namespace User {
  /**
   * Validated User type
   */
  export type Validated = User & { __validated: true };
}
```

**Usage:**

```ts
// Validation function
function validateUser(user: User): User.Validated | null {
  if (!user.email || !user.name) {
    return null;
  }
  return { ...user, __validated: true as const };
}

// Use validated type
function processUser(user: User.Validated) {
  // TypeScript knows this user is validated
  console.log(user.name, user.email);
}

// Usage
const user: User = {
  id: "123",
  name: "John",
  email: "john@example.com",
  createdAt: new Date(),
};
const validated = validateUser(user);
if (validated) {
  processUser(validated); // ✅ Type-safe!
}
```

---

### `@omit` - Omit Types

Generates types that exclude specific fields from a model.

**Example:**

```prisma
/// @omit createdAt,updatedAt WithoutTimestamps
model User {
  id        String   @id
  name      String
  email     String
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Generated Types:**

```ts
export namespace User {
  /**
   * User without createdAt, updatedAt
   */
  export type WithoutTimestamps = Omit<User, "createdAt" | "updatedAt">;
}
```

**Custom Type Name:**

```prisma
/// @omit password UserPublic
model User {
  // ...
}
```

**Generated:**

```ts
export type UserPublic = Omit<User, "password">;
```

---

### `@pick` - Pick Types

Generates types that include only specific fields from a model. Type-safe field selection, minimal types, and clean public APIs with only necessary fields.

**Example:**

```prisma
/// @pick id,name,email
model User {
  id        String   @id
  name      String
  email     String
  password  String
  createdAt DateTime @default(now())
}
```

**Generated Types:**

```ts
export namespace User {
  /**
   * User with only id, name, email
   */
  export type PickIdNameEmail = Pick<User, "id" | "name" | "email">;
}
```

**Usage:**

```ts
// User with only basic fields
const basicUser: User.PickIdNameEmail = {
  id: "123",
  name: "John",
  email: "john@example.com",
  // password and createdAt are excluded
};
```

**Custom Type Name:**

```prisma
/// @pick id,name,email UserBasic
model User {
  // ...
}
```

**Generated:**

```ts
export type UserBasic = Pick<User, "id" | "name" | "email">;
```

---

📖 **[See Complete Features Documentation →](./FEATURES.md)** - Even more detailed examples and advanced usage patterns

## Configuration Options

| Option              | Type    | Default                | Description                                         |
| ------------------- | ------- | ---------------------- | --------------------------------------------------- |
| `output`            | string  | `"../generated/types"` | Output directory for generated types                |
| `global`            | boolean | `false`                | Generate global types with `T` prefix               |
| `clear`             | boolean | `false`                | Clear output directory before generating            |
| `enumOnly`          | boolean | `false`                | Only generate enum types (skip models)              |
| `include`           | string  | -                      | Include only these models (comma-separated)         |
| `exclude`           | string  | -                      | Exclude these models (comma-separated)              |
| `typeMappings`      | string  | -                      | Custom type mappings (e.g., `"DateTime=string"`)    |
| `jsonTypeMapping`   | boolean | `false`                | Enable PrismaType namespace for JSON types          |
| `namespaceName`     | string  | `PrismaType`           | namespace for the jsonTypeMapping                   |
| `jsDocComments`     | boolean | `false`                | Generate JSDoc comments from Prisma schema comments |
| `splitFiles`        | boolean | `false`                | Split output into separate files per model/enum     |
| `splitBySchema`     | boolean | `false`                | Split types by schema file names                    |
| `barrelExports`     | boolean | `true`                 | Generate barrel exports (index.ts)                  |
| `basicUtilityTypes` | boolean | `true`                 | Generate basics utility types (default=true)        |

basicUtilityTypes

## Complete Example

```prisma
generator client {
  provider = "prisma-client-js"
}

generator types {
  provider       = "prisma-type-generator"
  output         = "../generated/types"
  jsonTypeMapping = true
  jsDocComments  = true
}

/// @input
/// @with posts
model User {
  id        String   @id @default(uuid())
  name      String
  email     String?  @unique

  /// @type DateTime=string
  createdAt DateTime @default(now())

  /// @type Json=UserPreferences
  preferences Json

  posts     Post[]
}

model Post {
  id       String @id @default(uuid())
  title    String
  authorId String
  author   User   @relation(fields: [authorId], references: [id])
}

enum UserRole {
  ADMIN
  USER
}
```

**Generated Output:**

```ts
// generated/types/prisma.d.ts
export type UserRole = "ADMIN" | "USER";

export interface User {
  id: string;
  name: string;
  email: string | null;
  createdAt: string; // Custom mapped
  preferences: UserPreferences | null; // Custom type
}

export namespace User {
  export type CreateInput = Omit<User, "id" | "createdAt">;
  export type UpdateInput = Partial<Omit<User, "id">>;
  export type WithPosts = User & { posts: Post[] };
  export type Partial = Partial<User>;
  export type Required = Required<User>;
  // ... more utility types
}
```

## Contributing

Contributions are welcome! Please follow our contribution guidelines.

## Support

If you like the project, please consider giving a ⭐️ on GitHub.

### Bugs

If you find a bug, please file an issue on [GitHub](https://github.com/broisnischal/prisma-fns/issues)

### License

MIT License - see [LICENSE](LICENSE) file for details.
