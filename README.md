# Prisma Type Generator

<!-- [![Build Status](https://travis-ci.org/broisnischal/prisma-type-generator.svg?branch=master)](https://travis-ci.org/broisnischal/prisma-type-generator) -->

[![npm version](https://img.shields.io/npm/v/prisma-type-generator.svg)](https://www.npmjs.com/package/prisma-type-generator)
![GitHub Repo stars](https://img.shields.io/github/stars/broisnischal/prisma-type-generator?style=social)
![GitHub top language](https://img.shields.io/github/languages/top/broisnischal/prisma-type-generator?style=plastic)
[![License](https://img.shields.io/npm/l/prisma-type-generator.svg)](https://opensource.org/licenses/MIT)

Prisma type generator is a package that generates TypeScript types and interfaces from your Prisma schema. It's compatible with **Prisma 6.x and 7.x**.

## Installation

```bash
npm install prisma-type-generator
```

## Usage

Add the generator to your `schema.prisma` file:

```prisma
generator types {
  provider = "prisma-type-generator"
  output   = "../generated/types"  // Optional: output directory (default: "../generated/types")
  global   = false                 // Optional: generate global types (default: false)
  clear    = false                 // Optional: clear output directory before generating (default: false)
  enumOnly = false                 // Optional: only generate enum types (default: false)
}
```

## Example

### Basic Usage

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

generator types {
  provider = "prisma-type-generator"
  // output defaults to "../generated/types" if not specified
}

datasource db {
  provider = "postgresql"
}

model User {
  id       String    @unique @default(uuid())
  name     String
  username String
  email    String?
  Profile  Profile[]
}

enum UserType {
  pro
  best
}

model Profile {
  id      String @unique @default(uuid())
  contact Int
  user    User   @relation(fields: [userId], references: [id])
  userId  String
}
```

### Generate Types

Run Prisma generate to create the types:

```bash
npx prisma generate
```

This will generate the file `generated/types/prisma.d.ts` with the following code:

```ts
export type UserType = "pro" | "best";

export declare const UserType: {
  readonly pro: "pro";
  readonly best: "best";
};

export interface User {
  id: string;
  name: string;
  username: string;
  email: string | null;
}

export interface Profile {
  id: string;
  contact: number;
  userId: string;
}
```

### Using Generated Types

```ts
import type { User, Profile, UserType } from "../generated/types/prisma";

const user: User = {
  id: "123",
  name: "John Doe",
  username: "johndoe",
  email: "john@example.com",
};

const userType: UserType = UserType.pro;
```

### Complete Next.js Example

Here's a full example showing how to use this in a Next.js app:

**1. Setup `schema.prisma`:**

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

generator types {
  provider = "prisma-type-generator"
  output   = "../generated/types"
}

model User {
  id    String @id @default(uuid())
  name  String
  email String
}
```

**2. Backend API Route (`app/api/users/route.ts`):**

```ts
import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/types/prisma";

export async function GET(): Promise<Response> {
  const users: User[] = await prisma.user.findMany();
  return Response.json(users);
}
```

**3. Frontend Component (`app/users/page.tsx`):**

```ts
import type { User } from "@/generated/types/prisma";

async function getUsers(): Promise<User[]> {
  const res = await fetch("http://localhost:3000/api/users");
  return res.json();
}

export default async function UsersPage() {
  const users = await getUsers(); // Type-safe!

  return (
    <div>
      {users.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

**Benefits:**

- ✅ Frontend doesn't need Prisma Client (saves ~2MB+)
- ✅ Type-safe API responses
- ✅ Simple, clean interfaces
- ✅ Works with any framework (Next.js, Remix, SvelteKit, etc.)

### Global Types

Enable global types to use them without imports. Types will be prefixed with `T`.

```prisma
generator types {
  provider = "prisma-type-generator"
  global = true  // default is false
}
```

This generates global type aliases:

```ts
declare global {
  export type TUser = User;
  export type TProfile = Profile;
  export type TUserType = UserType;
}
```

Now you can use types without importing:

```ts
// No import needed!
const user: TUser = {
  id: "123",
  name: "John Doe",
  username: "johndoe",
  email: null,
};
```

### Enum Only Mode

Generate only enum types (useful for shared enum definitions):

```prisma
generator types {
  provider = "prisma-type-generator"
  enumOnly = true
}
```

### Clear Output Directory

Clear the output directory before generating new types:

```prisma
generator types {
  provider = "prisma-type-generator"
  clear = true  // default is false
}
```

### Generate Zod Schemas

Generate Zod validation schemas from your Prisma models:

```prisma
generator types {
  provider = "prisma-type-generator"
  generateZod = true
}
```

**Output:**

```ts
import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  createdAt: z.date(),
});
```

### Generate Utility Types

### Generate Type Guards (Optional)

Generate runtime type guard functions:

```prisma
generator types {
  provider = "prisma-type-generator"
  generateGuards = true
}
```

**Output:**

```ts
export function isUser(obj: unknown): obj is User {
  if (typeof obj !== "object" || obj === null) return false;
  if (typeof (obj as any).id !== "string") return false;
  if (typeof (obj as any).name !== "string") return false;
  return true;
}
```

### Include/Exclude Models

Filter which models to generate:

```prisma
generator types {
  provider = "prisma-type-generator"
  include = "User,Post"  // Only generate these models
  // OR
  exclude = "InternalModel"  // Skip these models
}
```

### Custom Type Mappings

Override default type mappings:

```prisma
generator types {
  provider = "prisma-type-generator"
  typeMappings = "DateTime=string,Bytes=Uint8Array"
}
```

**Default Type Mappings:**

- `DateTime` → `Date` (can be customized to `string`)
- `Bytes` → `Buffer` (can be customized)
- `Decimal`, `Int`, `Float`, `BigInt` → `number`
- `Boolean` → `boolean`
- `String` → `string`
- `Json` → `Record<string, unknown>` (can be customized via `jsonTypeMapping`)

### JSON Type Mapping with PrismaType Namespace

Enable `jsonTypeMapping` to use a `PrismaType` namespace for JSON types. This creates a `prisma-type.ts` file that you can extend:

```prisma
generator types {
  provider = "prisma-type-generator"
  jsonTypeMapping = true
}
```

**Generated `prisma-type.ts`:**

```ts
export namespace PrismaType {
  export interface Json {
    [key: string]: any;
  }
}
```

**Usage in Prisma Schema:**

```prisma
model User {
  /// @type Json=any
  metadata Json  // Uses PrismaType.Json when jsonTypeMapping is enabled

  /// @type Json=UserPreferences
  preferences Json  // Uses custom UserPreferences type

  /// @type Json=Record<string, UserPreferences>
  userSettings Json  // Uses complex generic types
}
```

**Generated Output:**

```ts
import { PrismaType } from "./prisma-type";

export interface User {
  metadata: PrismaType.Json | null;
  preferences: UserPreferences | null; // Your custom type!
  userSettings: Record<string, UserPreferences> | null;
}
```

**Extending PrismaType.Json:**

You can extend the `PrismaType.Json` interface in your own files:

```ts
// In your project file (e.g., types/prisma-extensions.ts)
declare namespace PrismaType {
  interface Json {
    [key: string]: any; // Customize as needed
  }
}
```

### Loose Autocomplete Enum Feature

For String fields, you can create enum-like types with autocomplete support:

```prisma
model User {
  /// @type !["email", "google"]
  kind String  // Strict: only "email" | "google" allowed

  /// @type ["email", "google"]
  authProvider String  // Loose: autocomplete suggests "email" | "google" but accepts any string
}
```

**Generated Output:**

```ts
export interface User {
  kind: "email" | "google"; // Strict literal union
  authProvider: "email" | "google" | (string & {}); // Loose autocomplete
}
```

**Syntax:**

- `/// @type !["value1", "value2"]` - **Strict mode**: Only the specified values are allowed (literal union type)
- `/// @type ["value1", "value2"]` - **Loose mode**: Autocomplete suggests these values, but accepts any string

### Field-Level Type Overrides

You can also use comments in your Prisma schema for field-level overrides. **You can reference any TypeScript type or interface from your project:**

```prisma
model User {
  /// @type DateTime=string
  createdAt DateTime

  /// @type Json=any
  metadata Json

  /// @type Json=UserPreferences
  preferences Json  // Uses your existing UserPreferences interface

  /// @type Json=Record<string, UserPreferences>
  userSettings Json  // Uses complex generic types

  /// @type Json=UserPreferences[]
  preferencesList Json  // Uses array types

  /// @type !["email", "google"]
  kind String  // Strict enum-like type

  /// @type ["email", "google"]
  authProvider String  // Loose autocomplete enum
}
```

**Where to define `UserPreferences`?**

You define `UserPreferences` in your own TypeScript files, anywhere in your project. Here's a typical project structure:

```
my-project/
├── prisma/
│   └── schema.prisma          # Your Prisma schema
├── src/
│   ├── types/
│   │   └── preferences.ts    # Define UserPreferences here
│   └── app/
│       └── page.tsx           # Use generated types here
└── generated/
    └── types/
        └── prisma.d.ts        # Generated types (references UserPreferences)
```

**1. Define your custom type** (`src/types/preferences.ts`):

```ts
export interface UserPreferences {
  theme: "light" | "dark";
  language: string;
  notifications: boolean;
  fontSize?: number;
}
```

**2. Use it in your Prisma schema** (`prisma/schema.prisma`):

```prisma
model User {
  id String @id

  /// @type Json=UserPreferences
  preferences Json
}
```

**3. Import both when using** (`src/app/page.tsx`):

```ts
// Import your custom type
import type { UserPreferences } from "@/types/preferences";

// Import generated Prisma types
import type { User } from "@/generated/types/prisma";

// Now you can use both!
const user: User = {
  id: "123",
  preferences: {
    theme: "dark",
    language: "en",
    notifications: true,
  },
};
```

**Important Notes:**

- The generator doesn't create the `UserPreferences` type - you define it yourself
- The generator just references it by name in the generated types
- You must import `UserPreferences` yourself where you use the generated types
- The type name must match exactly (case-sensitive)

**Example with JSON type:**

```prisma
model User {
  id       String @id
  name     String
  metadata Json   // Generated as: metadata: Record<string, unknown> | null (or PrismaType.Json if jsonTypeMapping is enabled)
  settings Json?  // Generated as: settings: Record<string, unknown> | null (or PrismaType.Json if jsonTypeMapping is enabled)
}
```

**Using your existing TypeScript types/interfaces:**

```prisma
// In your Prisma schema
model User {
  id         String @id
  name       String

  /// @type Json=UserPreferences
  preferences Json  // Uses your UserPreferences interface

  /// @type Json=Record<string, UserPreferences>
  settings   Json  // Uses complex generic types

  /// @type Json=UserPreferences[]
  preferencesList Json  // Uses array types
}
```

**Your existing TypeScript file (e.g., `types/preferences.ts`):**

```ts
export interface UserPreferences {
  theme: "light" | "dark";
  language: string;
  notifications: boolean;
}
```

**Generated output:**

```ts
export interface User {
  id: string;
  name: string;
  preferences: UserPreferences | null; // Your custom type!
  settings: Record<string, UserPreferences> | null;
  preferencesList: UserPreferences[] | null;
}
```

**Usage:**

```ts
import type { User } from "../generated/types/prisma";
import type { UserPreferences } from "./types/preferences";

const user: User = {
  id: "123",
  name: "John",
  preferences: {
    theme: "dark",
    language: "en",
    notifications: true,
  },
};
```

**Where to define `UserPreferences`?**

`UserPreferences` is **your own TypeScript type** that you create in your project. Here's where it goes:

**File Structure:**

```
my-project/
├── prisma/
│   └── schema.prisma              ← Reference it here with /// @type
├── src/
│   └── types/
│       └── preferences.ts        ← Define UserPreferences here
└── generated/
    └── types/
        └── prisma.d.ts            ← Generated file (references UserPreferences)
```

**1. Create the type file** (`src/types/preferences.ts`):

```ts
export interface UserPreferences {
  theme: "light" | "dark";
  language: string;
  notifications: boolean;
}
```

**2. Reference it in Prisma** (`prisma/schema.prisma`):

```prisma
model User {
  /// @type Json=UserPreferences
  preferences Json
}
```

**3. Import both when using** (anywhere in your code):

```ts
import type { UserPreferences } from "@/types/preferences"; // Your type
import type { User } from "@/generated/types/prisma"; // Generated type
```

**Important:**

- ✅ You define `UserPreferences` yourself (the generator doesn't create it)
- ✅ Put it in any `.ts` file in your project (common locations: `src/types/`, `src/lib/types/`, etc.)
- ✅ The generator just uses the name - you must import it yourself
- ✅ Type name must match exactly (case-sensitive)

### JSDoc Comments

Generate JSDoc comments from Prisma schema documentation:

```prisma
generator types {
  provider = "prisma-type-generator"
  jsDocComments = true
}
```

**Prisma Schema:**

```prisma
/// User model represents a user in the system
model User {
  /// Unique identifier for the user
  id String @id
  /// User's full name
  name String
}
```

**Generated Output:**

```ts
/**
 * User model represents a user in the system
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
}
```

### Split Files

Split output into separate files per model/enum:

```prisma
generator types {
  provider = "prisma-type-generator"
  splitFiles = true
}
```

**Output Structure:**

```
generated/types/
├── user.ts       # User model types
├── post.ts       # Post model types
├── userRole.ts   # UserRole enum types
└── index.ts      # Barrel exports
```

### Barrel Exports

Generate `index.ts` for easier imports (enabled by default):

```prisma
generator types {
  provider = "prisma-type-generator"
  barrelExports = true  // default is true
}
```

**Usage:**

```ts
// Instead of:
import { User } from "./generated/types/types";
import { UserSchema } from "./generated/types/zod";

// You can do:
import { User, UserSchema } from "./generated/types";
```

## Configuration Options

| Option            | Type    | Default                | Description                                                     |
| ----------------- | ------- | ---------------------- | --------------------------------------------------------------- |
| `output`          | string  | `"../generated/types"` | Output directory for generated types                            |
| `global`          | boolean | `false`                | Generate global types with `T` prefix                           |
| `clear`           | boolean | `false`                | Clear output directory before generating                        |
| `enumOnly`        | boolean | `false`                | Only generate enum types (skip models)                          |
| `generateZod`     | boolean | `false`                | Generate Zod schemas from Prisma models                         |
| `generateGuards`  | boolean | `false`                | Generate runtime type guard functions                           |
| `include`         | string  | -                      | Include only these models (comma-separated, e.g., "User,Post")  |
| `exclude`         | string  | -                      | Exclude these models (comma-separated, e.g., "InternalModel")   |
| `typeMappings`    | string  | -                      | Custom type mappings (e.g., "DateTime=string,Bytes=Uint8Array") |
| `jsonTypeMapping` | boolean | `false`                | Enable PrismaType namespace for JSON types                      |
| `jsDocComments`   | boolean | `false`                | Generate JSDoc comments from Prisma schema comments             |
| `splitFiles`      | boolean | `false`                | Split output into separate files per model/enum                 |
| `splitBySchema`   | boolean | `false`                | Split types by schema file names                                |
| `barrelExports`   | boolean | `true`                 | Generate barrel exports (index.ts)                              |

## Why Use This Generator?

**Prisma Client already generates types, so why do you need this?**

While Prisma Client provides types like `User`, `Prisma.UserCreateInput`, etc., this generator creates **simple, lightweight interfaces** that are perfect for:

### 1. **Frontend/Client-Side Type Sharing** (Next.js, React, Remix, etc.)

When building a frontend that needs to know your database schema types **without importing Prisma Client**:

**Problem**: Prisma Client is heavy (~2MB+) and includes runtime code. You don't want it in your frontend bundle.

**Solution**: Use lightweight generated types:

```ts
// ❌ Don't do this in frontend - Prisma Client is too heavy!
import { Prisma } from "@prisma/client";

// ✅ Do this instead - lightweight types only!
import type { User, Profile } from "../generated/types/prisma";

// In your API route (Next.js)
export async function GET() {
  const users = await prisma.user.findMany();
  return Response.json(users); // TypeScript knows this is User[]
}
```

### 2. **API Response Types**

Define clean API response types without Prisma's complex utility types:

```ts
// api/users/route.ts (Next.js App Router)
import type { User } from "../generated/types/prisma";
import { prisma } from "@/lib/prisma";

export async function GET(): Promise<Response> {
  const users: User[] = await prisma.user.findMany();
  return Response.json(users);
}

// Frontend component
async function UsersList() {
  const res = await fetch("/api/users");
  const users: User[] = await res.json(); // Type-safe!
  return <div>{users.map((u) => u.name)}</div>;
}
```

### 3. **Monorepo Type Sharing**

Share types between packages in a monorepo without sharing Prisma Client:

```
my-monorepo/
├── packages/
│   ├── backend/          # Has Prisma Client
│   │   └── prisma/
│   │       └── schema.prisma
│   ├── frontend/         # Only needs types
│   │   └── src/
│   │       └── components.tsx
│   └── shared-types/     # Generated types here
│       └── generated/
│           └── types/
│               └── prisma.d.ts
```

```ts
// packages/frontend/src/components.tsx
import type { User } from "@my-monorepo/shared-types/generated/types/prisma";
// No Prisma Client dependency needed!
```

### 4. **GraphQL/API Schema Types**

Use clean interfaces for GraphQL resolvers or REST API schemas:

```ts
// GraphQL resolver
import type { User } from "../generated/types/prisma";

const resolvers = {
  Query: {
    users: async (): Promise<User[]> => {
      return prisma.user.findMany();
    },
  },
};
```

### 5. **Form Validation & Serialization**

Use types for form validation, API request/response validation:

```ts
// Form component
import type { User } from "../generated/types/prisma";
import { z } from "zod";

// Create Zod schema from generated type
const userSchema = z.object({
  name: z.string(),
  email: z.string().email().nullable(),
  // ... matches User interface
});

type UserFormData = z.infer<typeof userSchema>;
```

### 6. **Type-Only Imports (No Runtime Code)**

Import types without any runtime code - perfect for type checking:

```ts
// This is a type-only import - no code is bundled!
import type { User, Profile, UserType } from "../generated/types/prisma";

// Use in function signatures, type guards, etc.
function processUser(user: User): void {
  // Type-safe without Prisma Client
}
```

## Prisma Client Types vs Generated Types

| Feature             | Prisma Client Types      | Generated Types             |
| ------------------- | ------------------------ | --------------------------- |
| **Size**            | ~2MB+ (includes runtime) | ~few KB (types only)        |
| **Use in Frontend** | ❌ Too heavy             | ✅ Perfect                  |
| **Complexity**      | Complex utility types    | Simple interfaces           |
| **Runtime Code**    | ✅ Includes runtime      | ❌ Types only               |
| **Use Cases**       | Database operations      | Type definitions, API types |

**When to use Prisma Client types:**

- Backend database operations
- Complex queries with `Prisma.UserCreateInput`, etc.

**When to use Generated types:**

- Frontend components
- API response types
- Type sharing across packages
- Form validation
- Anywhere you need types without Prisma Client

## Prisma 7 Compatibility

This generator is fully compatible with **Prisma 7.x**. Make sure you have Prisma 7 installed:

```bash
npm install prisma@^7.0.0 @prisma/client@^7.0.0
```

The generator uses the standard `@prisma/generator-helper` API, which is stable across Prisma 6 and 7.

## Complete Example

Here's a complete example using all features:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

generator types {
  provider       = "prisma-type-generator"
  output         = "../generated/types"
  jsonTypeMapping = true
  jsDocComments  = true
  splitFiles     = true
  barrelExports  = true
}

/// User model represents a user account
model User {
  /// Unique identifier
  id        String   @id @default(uuid())
  /// User's full name
  name      String
  /// User's email address
  email     String?  @unique

  /// Account creation timestamp
  /// @type DateTime=string
  createdAt DateTime @default(now())

  /// @type Json=any
  metadata Json  // Uses PrismaType.Json when jsonTypeMapping is enabled

  /// @type Json=UserPreferences
  preferences Json  // Uses custom UserPreferences type

  /// @type !["email", "google"]
  kind String  // Strict: only "email" | "google" allowed

  /// @type ["email", "google"]
  authProvider String  // Loose: autocomplete suggests "email" | "google" but accepts any string

  posts     Post[]
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}

enum UserRole {
  ADMIN
  USER
  GUEST
}
```

After running `npx prisma generate`, you'll get:

**generated/types/prisma-type.ts** - PrismaType namespace (when jsonTypeMapping is enabled)
**generated/types/prisma.d.ts** - Base types (or types.ts if splitFiles is enabled)
**generated/types/index.ts** - Barrel exports

## Features

### Core Features

- ✅ Generate TypeScript interfaces from Prisma models
- ✅ Generate TypeScript types and const objects from Prisma enums
- ✅ Support for optional/nullable fields
- ✅ Support for array/list fields
- ✅ Global type declarations (with `T` prefix)
- ✅ Custom output directory
- ✅ Clear output directory option
- ✅ Enum-only generation mode
- ✅ Compatible with Prisma 6.x and 7.x

### Advanced Features

- ✅ **Input Types (DTOs)** - Generate `CreateInput` and `UpdateInput` types with `@input` or `@inputmodel` directive
- ✅ **Basic Utility Types** - Always generated: `Partial`, `Required`, `Readonly` for each model
- ✅ **Select Types** - Generate Prisma query select types with `@select` directive
- ✅ **Deep Utility Types** - Always generated: `DeepPartial` and `DeepRequired` for nested objects
- ✅ **Relation Types** - Generate types with relations using `@with` directive (e.g., `WithPosts`, `WithProfile`)
- ✅ **Field Groups** - Group related fields together with `@group` directive
- ✅ **Validation Types** - Generate validated types with `@validated` directive
- ✅ **Omit Types** - Generate types excluding specific fields with `@omit` directive
- ✅ **Pick Types** - Generate types with only specific fields with `@pick` directive
- ✅ **JSON Type Support** - Full support for Prisma Json type with `PrismaType` namespace support
- ✅ **Loose Autocomplete Enums** - Create enum-like String types with autocomplete support (strict or loose mode)
- ✅ **Model Filtering** - Include/exclude specific models
- ✅ **Custom Type Mappings** - Override default type mappings (DateTime, Bytes, etc.)
- ✅ **Field-Level Type Overrides** - Use `@type` comments to customize individual field types
- ✅ **JSDoc Comments** - Generate documentation from Prisma comments
- ✅ **Split Files** - Separate files per feature
- ✅ **Barrel Exports** - Auto-generated index.ts files
- ✅ **Comment-based Type Mapping** - Use `/// @type` comments in schema

📖 **[See Complete Features Documentation →](./FEATURES.md)** - Detailed guide with examples for all utility types and directives

### Contributing

If you'd like to contribute, please follow our contribution guidelines.

## Support

If you like the project, please consider supporting us by giving a ⭐️ on Github.

### Bugs

If you find a bug, please file an issue on [our issue tracker on GitHub](https://github.com/broisnischal/prisma-fns/issues)

### License

prisma-fns is open-source software licensed under the MIT [license](LICENSE).
