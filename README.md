# Prisma Type Generator

[![npm version](https://img.shields.io/npm/v/prisma-type-generator.svg)](https://www.npmjs.com/package/prisma-type-generator)
![GitHub Repo stars](https://img.shields.io/github/stars/broisnischal/prisma-type-generator?style=social)
![GitHub top language](https://img.shields.io/github/languages/top/broisnischal/prisma-type-generator?style=plastic)
[![License](https://img.shields.io/npm/l/prisma-type-generator.svg)](https://opensource.org/licenses/MIT)

Generate lightweight TypeScript types from your Prisma schema. Perfect for frontend type sharing without importing heavy Prisma Client.

## Quick Start

**1. Install:**

```bash
npm install prisma-type-generator
// ni prisma-type-generator
```

**2. Add to `schema.prisma`:**

```prisma
generator types {
  provider = "prisma-type-generator"
  output   = "../generated/types"
}
```

**3. Generate:**

```bash
npx prisma generate
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

**What it does:** Generates TypeScript interfaces from Prisma models and enum types with const objects.

**When to use:** Always - this is the core functionality that runs by default.

**Why use it:** Get lightweight, type-safe interfaces perfect for frontend code, API responses, and type sharing without the heavy Prisma Client runtime.

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

**Use Case:** Perfect for typing API responses in your frontend without importing Prisma Client.

---

## Configuration Options

### `output`

**What it does:** Sets a custom output directory for generated types.

**When to use:** Monorepos, custom project structures, or when you need types in a specific location.

**Why use it:** Organize generated files, avoid conflicts with other generators, and match your project's structure.

**Example:**

```prisma
generator types {
  provider = "prisma-type-generator"
  output   = "../shared/types"  // Custom output path
}
```

**Use Case:** In a monorepo, generate types in a shared package: `output = "../../packages/shared-types/src/generated"`

---

### `clear`

**What it does:** Clears the output directory before generating new types.

**When to use:** CI/CD pipelines, ensuring clean builds, or when debugging type generation issues.

**Why use it:** Prevents stale files from previous generations, ensures consistency, and helps catch issues early.

**Example:**

```prisma
generator types {
  provider = "prisma-type-generator"
  output   = "../generated/types"
  clear    = true  // Remove old files first
}
```

**Use Case:** In CI/CD, ensure each build starts with a clean slate to catch any generation issues.

---

### `enumOnly`

**What it does:** Generates only enum types, skipping all model types.

**When to use:** Sharing enums across projects, frontend-only enum needs, or when models are generated elsewhere.

**Why use it:** Faster generation, smaller output size, and focused type generation for enum-only use cases.

**Example:**

```prisma
generator types {
  provider = "prisma-type-generator"
  output   = "../generated/types"
  enumOnly = true  // Only generate enums
}

enum UserRole {
  ADMIN
  USER
  MODERATOR
}

model User {
  // This model will be skipped
  id String @id
}
```

**Generated Output:**

```ts
// Only enums are generated, no models
export type UserRole = "ADMIN" | "USER" | "MODERATOR";
export declare const UserRole: {
  /* ... */
};
```

**Use Case:** Frontend app that only needs enum values for dropdowns or validation, not full model types.

---

### `global`

**What it does:** Generates types in the global namespace with a `T` prefix (e.g., `TUser` instead of `User`).

**When to use:** Legacy codebases, avoiding imports, or when you need global type access.

**Why use it:** No imports needed - types are available globally. Works well with global type declaration files.

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

**Use Case:** Legacy TypeScript projects that rely on global types or when you want to avoid import statements.

---

### `include`

**What it does:** Generates types only for the specified models (comma-separated list).

**When to use:** Selective type generation, frontend-only types, microservices with shared schemas, or reducing bundle size.

**Why use it:** Smaller output, faster generation, and focused types - only generate what you need.

**Example:**

```prisma
generator types {
  provider = "prisma-type-generator"
  output   = "../generated/types"
  include  = "User,Post"  // Only generate these models
}

model User {
  id   String @id
  name String
}

model Post {
  id    String @id
  title String
}

model InternalLog {
  // This will be skipped
  id String @id
}
```

**Generated Output:**

```ts
// Only User and Post are generated
export interface User {
  /* ... */
}
export interface Post {
  /* ... */
}
// InternalLog is not generated
```

**Use Case:** Frontend app that only needs public-facing models, excluding internal admin or logging models.

---

### `exclude`

**What it does:** Skips specified models during type generation (comma-separated list).

**When to use:** Hiding internal models, admin-only models, sensitive data models, or reducing bundle size.

**Why use it:** Hide internal types from frontend, reduce bundle size, and improve security by not exposing internal models.

**Example:**

```prisma
generator types {
  provider = "prisma-type-generator"
  output   = "../generated/types"
  exclude  = "InternalModel,AdminUser,AuditLog"  // Skip these
}

model User {
  id   String @id
  name String
}

model InternalModel {
  // This will be excluded
  id String @id
}
```

**Generated Output:**

```ts
// User is generated, InternalModel is excluded
export interface User {
  /* ... */
}
```

**Use Case:** Generate types for frontend while excluding internal admin models, audit logs, or sensitive data models.

---

### `splitFiles`

**What it does:** Splits output into separate files - one file per model and enum.

**When to use:** Large schemas, better IDE performance, selective imports, or when you want tree-shaking benefits.

**Why use it:** Faster IDE performance, better tree-shaking, easier navigation, and selective imports reduce bundle size.

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

**Usage:**

```ts
// Import only what you need
import type { User } from "../generated/types/User";
import type { UserRole } from "../generated/types/UserRole";
```

**Use Case:** Large monorepo with many models where you want to import only specific types to reduce bundle size.

---

### `splitBySchema`

**What it does:** Splits types by Prisma schema file names. Models are matched by name prefix (e.g., `User*` → `user.ts`).

**When to use:** Multi-file Prisma schemas, domain-driven design, or when your schema is organized into multiple files.

**Why use it:** Matches your schema organization, better maintainability, and logical grouping of related types.

**Example:**

**Schema Files:**

```
prisma/
  ├── schema.prisma
  ├── user.prisma
  └── post.prisma
```

**user.prisma:**

```prisma
model User {
  id   String @id
  name String
}

model UserProfile {
  id     String @id
  userId String
}
```

**post.prisma:**

```prisma
model Post {
  id    String @id
  title String
}
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

**Use Case:** Domain-driven design where each domain has its own schema file, and you want generated types to match that organization.

---

### `barrelExports`

**What it does:** Generates `index.ts` barrel exports for easier imports (enabled by default).

**When to use:** Always recommended - makes imports cleaner and provides a single entry point.

**Why use it:** Clean imports, single entry point, and easier refactoring. Can be disabled if you prefer direct imports.

**Example:**

**With `barrelExports = true` (default):**

```ts
// generated/types/index.ts
export * from "./User";
export * from "./Post";
export * from "./UserRole";
```

**Usage:**

```ts
// Clean import from single entry point
import type { User, Post, UserRole } from "../generated/types";
```

**With `barrelExports = false`:**

```ts
// No index.ts generated
// Must import directly
import type { User } from "../generated/types/User";
import type { Post } from "../generated/types/Post";
```

**Use Case:** Standard use case - keep it enabled for cleaner imports. Disable only if you have specific import requirements.

---

### `basicUtilityTypes`

**What it does:** Generates basic utility types (`Partial`, `Required`, `Readonly`, `DeepPartial`, `DeepRequired`) for every model (enabled by default).

**When to use:** Always recommended - these are commonly used utility types. Disable only if you don't need them to reduce output size.

**Why use it:** Common utility types that are always available, no directives needed, and useful for form handling, updates, and transformations.

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

**Usage:**

```ts
// Partial - all fields optional
const partialUser: User.Partial = {
  name: "John", // email and createdAt are optional
};

// Required - all fields required (even nullable ones)
const requiredUser: User.Required = {
  id: "1",
  name: "John",
  email: "john@example.com", // Required even if nullable in schema
  createdAt: new Date(),
};

// DeepPartial - works with nested objects too
const deepPartial: User.DeepPartial = {
  name: "John",
  // Nested objects are also partial
};
```

**Use Case:** Form handling where fields are optional, API updates with partial data, or when you need to make all fields required for validation.

---

## Type Customization

### `typeMappings`

**What it does:** Maps Prisma types to custom TypeScript types globally (e.g., `DateTime` → `string`).

**When to use:** Serialization needs, API compatibility, or when you need consistent type representation across your app.

**Why use it:** Control how Prisma types are represented in TypeScript, match API contracts, and ensure consistency.

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

**Use Case:** API that serializes dates as ISO strings, or when working with binary data as `Uint8Array` instead of `Buffer`.

---

### `jsonTypeMapping`

**What it does:** Enables `PrismaType` namespace for JSON types, allowing you to extend JSON field types.

**When to use:** Strongly-typed JSON fields, when you need type safety for JSON data, or when JSON structure is known.

**Why use it:** Type-safe JSON fields, better autocomplete, and the ability to define JSON structure in a separate file.

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

**Use Case:** User preferences stored as JSON where you know the structure and want type safety and autocomplete.

---

### `namespaceName`

**What it does:** Sets a custom namespace name for JSON type mapping (default: `PrismaType`).

**When to use:** Naming conflicts, custom conventions, or when you prefer a different namespace name.

**Why use it:** Avoid conflicts with existing types, match team conventions, or use a more descriptive name.

**Example:**

```prisma
generator types {
  provider       = "prisma-type-generator"
  output         = "../generated/types"
  jsonTypeMapping = true
  namespaceName  = "AppTypes"  // Custom namespace name
}

model User {
  preferences Json
}
```

**Generated TypeScript:**

```ts
// Uses AppTypes instead of PrismaType
export interface User {
  preferences: AppTypes.Json | null;
}
```

**Use Case:** When `PrismaType` conflicts with existing types in your codebase, or you prefer a more descriptive namespace name.

---

### `jsDocComments`

**What it does:** Generates JSDoc comments from Prisma schema comments in the generated TypeScript.

**When to use:** Documentation needs, IDE hints, API documentation generation, or when you want self-documenting types.

**Why use it:** Better developer experience with inline documentation, IDE tooltips, and automatic API documentation.

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

**Use Case:** API documentation generation, better IDE experience with tooltips, or when you want types to be self-documenting.

---

## Field-Level Customization

### Field-Level Type Overrides (`@type`)

**What it does:** Override the TypeScript type for specific fields using comments.

**When to use:** Per-field customization, API compatibility, or when different fields need different type representations.

**Why use it:** Fine-grained control over individual fields, perfect for cases where global mappings don't fit all fields.

**Example:**

```prisma
model User {
  id        String   @id
  /// @type DateTime=string
  createdAt DateTime  // This field will be string, not Date

  /// @type Json=UserPreferences
  preferences Json     // This field will be UserPreferences, not Record<string, unknown>
}

// Define UserPreferences elsewhere
interface UserPreferences {
  theme: "light" | "dark";
  notifications: boolean;
}
```

**Generated TypeScript:**

```ts
export interface User {
  id: string;
  createdAt: string; // Overridden to string
  preferences: UserPreferences | null; // Overridden to UserPreferences
}
```

**Use Case:** API that returns dates as ISO strings, or JSON fields with known structure that you want strongly typed.

---

### Loose Autocomplete Enums

**What it does:** Creates string fields with autocomplete suggestions while still allowing other values (flexible enums).

**When to use:** Extensible string fields, when you want autocomplete but need flexibility, or future-proof enums.

**Why use it:** Best of both worlds - autocomplete suggestions for common values, but still accepts any string for extensibility.

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

**Usage:**

```ts
const user1: User = {
  authProvider: "email", // ✅ Autocomplete works
  // ...
};

const user2: User = {
  authProvider: "github", // ✅ Also allowed (flexible)
  // ...
};
```

**Use Case:** Auth providers where you have common ones (email, google) but may add more in the future (github, apple, etc.).

---

## Utility Types

### Always-Generated Utility Types

Every model automatically gets these utility types in a namespace (unless `basicUtilityTypes = false`):

- `Partial` - Makes all fields optional
- `Required` - Makes all fields required
- `Readonly` - Makes all fields readonly
- `DeepPartial` - Recursive partial (works with nested objects)
- `DeepRequired` - Recursive required (works with nested objects)

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
export namespace User {
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

**Use Case:** Form handling, API updates, validation, or when you need to transform types.

---

## Directive-Based Utility Types

Add directives to your Prisma models to generate additional utility types. These are opt-in features that give you powerful type transformations.

### `@input` - Input Types (Create/Update DTOs)

**What it does:** Generates `CreateInput` and `UpdateInput` types that automatically exclude auto-generated fields.

**When to use:** API endpoints, form handling, DTOs, or when creating/updating entities.

**Why use it:** Type-safe creation and updates, automatically excludes `id`, `createdAt`, `updatedAt`, and other auto-generated fields.

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

**Usage:**

```ts
// Creating a user
const newUser: User.CreateInput = {
  name: "John Doe",
  email: "john@example.com",
  // id, createdAt, updatedAt are automatically excluded
};

// Updating a user
const userUpdate: User.UpdateInput = {
  name: "Jane Doe", // All fields are optional
  // id cannot be included
};
```

**Use Case:** REST API endpoints for creating and updating users, form validation schemas, or DTOs for API requests.

---

### `@select` - Select Types for Prisma Queries

**What it does:** Generates a `Select` type for type-safe Prisma query select clauses.

**When to use:** Type-safe Prisma queries, when you want autocomplete for select fields, or building query builders.

**Why use it:** Autocomplete for select fields, type safety for Prisma queries, and better developer experience.

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
// Type-safe Prisma select
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

**Use Case:** Building type-safe query builders, ensuring select clauses are correct, or when you want autocomplete for Prisma select operations.

---

### `@with` - Relation Types

**What it does:** Generates types that include related models (e.g., `WithPosts`, `WithProfile`).

**When to use:** Typing Prisma `include` operations, API responses with relations, or when you need type-safe related data.

**Why use it:** Type-safe relations, better autocomplete, and ensures included relations match your schema.

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

**Usage:**

```ts
// Type-safe Prisma include
const userWithPosts: User.WithPostsAndProfile = await prisma.user.findUnique({
  where: { id: "123" },
  include: {
    posts: true,
    profile: true,
  },
});

// Access related data with type safety
console.log(userWithPosts.posts[0].title); // ✅ Type-safe!
console.log(userWithPosts.profile.bio); // ✅ Type-safe!
```

**Use Case:** API endpoints that return users with their posts and profile, or when you need type-safe access to related data.

---

### `@group` - Field Groups

**What it does:** Groups related fields together into reusable types.

**When to use:** Logical field grouping, reusable field sets, or when you want to organize related fields.

**Why use it:** Better organization, reusable types, and easier to work with related fields as a group.

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
// Access timestamp fields
const timestamps: User.TimestampsFields = {
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Access auth fields
const authData: User.AuthFields = {
  email: "john@example.com",
  password: "hashed_password",
};
```

**Use Case:** Reusable field sets, form sections, or when you want to work with related fields as a group.

---

### `@validated` - Validation Types

**What it does:** Generates a `Validated` type that marks data as validated with a `__validated: true` marker.

**When to use:** Runtime validation, type guards, or when you need to distinguish validated from unvalidated data.

**Why use it:** Type-safe validation, compile-time safety, and clear distinction between validated and unvalidated data.

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

**Use Case:** API validation where you want to ensure data is validated before processing, or type guards that mark data as validated.

---

### `@omit` - Omit Types

**What it does:** Generates types that exclude specific fields from a model.

**When to use:** Public APIs, DTOs, hiding sensitive data, or when you need types without certain fields.

**Why use it:** Type-safe field exclusion, security (hiding sensitive fields), and clean public APIs.

**Example:**

```prisma
/// @omit createdAt,updatedAt
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

**Usage:**

```ts
// User without timestamps
const publicUser: User.WithoutTimestamps = {
  id: "123",
  name: "John",
  email: "john@example.com",
  password: "hashed",
  // createdAt and updatedAt are excluded
};
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

**Use Case:** Public API responses that exclude internal timestamps, or DTOs that hide sensitive fields like passwords.

---

### `@pick` - Pick Types

**What it does:** Generates types that include only specific fields from a model.

**When to use:** Public APIs, minimal DTOs, selective field exposure, or when you need lightweight types.

**Why use it:** Type-safe field selection, minimal types, and clean public APIs with only necessary fields.

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

**Use Case:** Public API responses with minimal user data, user lists that only show basic info, or lightweight DTOs.

---

📖 **[See Complete Features Documentation →](./FEATURES.md)** - Even more detailed examples and advanced usage patterns

## Configuration Options

| Option            | Type    | Default                | Description                                         |
| ----------------- | ------- | ---------------------- | --------------------------------------------------- |
| `output`          | string  | `"../generated/types"` | Output directory for generated types                |
| `global`          | boolean | `false`                | Generate global types with `T` prefix               |
| `clear`           | boolean | `false`                | Clear output directory before generating            |
| `enumOnly`        | boolean | `false`                | Only generate enum types (skip models)              |
| `include`         | string  | -                      | Include only these models (comma-separated)         |
| `exclude`         | string  | -                      | Exclude these models (comma-separated)              |
| `typeMappings`    | string  | -                      | Custom type mappings (e.g., `"DateTime=string"`)    |
| `jsonTypeMapping` | boolean | `false`                | Enable PrismaType namespace for JSON types          |
| `jsDocComments`   | boolean | `false`                | Generate JSDoc comments from Prisma schema comments |
| `splitFiles`      | boolean | `false`                | Split output into separate files per model/enum     |
| `splitBySchema`   | boolean | `false`                | Split types by schema file names                    |
| `barrelExports`   | boolean | `true`                 | Generate barrel exports (index.ts)                  |

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

## Prisma Client vs Generated Types

| Feature             | Prisma Client Types      | Generated Types             |
| ------------------- | ------------------------ | --------------------------- |
| **Size**            | ~2MB+ (includes runtime) | ~few KB (types only)        |
| **Use in Frontend** | ❌ Too heavy             | ✅ Perfect                  |
| **Complexity**      | Complex utility types    | Simple interfaces           |
| **Runtime Code**    | ✅ Includes runtime      | ❌ Types only               |
| **Use Cases**       | Database operations      | Type definitions, API types |

**When to use Prisma Client types:** Backend database operations, complex queries

**When to use Generated types:** Frontend components, API response types, type sharing, form validation

## Next.js Example

**Backend API Route:**

```ts
// app/api/users/route.ts
import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/types/prisma";

export async function GET(): Promise<Response> {
  const users: User[] = await prisma.user.findMany();
  return Response.json(users);
}
```

**Frontend Component:**

```ts
// app/users/page.tsx
import type { User } from "@/generated/types/prisma";

async function getUsers(): Promise<User[]> {
  const res = await fetch("/api/users");
  return res.json();
}

export default async function UsersPage() {
  const users = await getUsers(); // Type-safe!
  return (
    <div>
      {users.map((u) => (
        <div key={u.id}>{u.name}</div>
      ))}
    </div>
  );
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
