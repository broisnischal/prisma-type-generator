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

### Core Features

**Basic Type Generation**

- Generate TypeScript interfaces from Prisma models
- Generate enum types with const objects
- Support for optional/nullable fields
- Compatible with Prisma 6.x and 7.x

**Output Options**

- `output` - Custom output directory (default: `"../generated/types"`)
- `clear` - Clear output directory before generating
- `enumOnly` - Only generate enum types (skip models)
- `global` - Generate global types with `T` prefix (e.g., `TUser`)

**Model Filtering**

- `include` - Only generate specified models (e.g., `"User,Post"`)
- `exclude` - Skip specified models (e.g., `"InternalModel"`)

**File Organization**

- `splitFiles` - Separate file per model/enum
- `splitBySchema` - Split by schema file names
- `barrelExports` - Generate `index.ts` for easier imports (default: `true`)

### Type Customization

**Custom Type Mappings**

```prisma
generator types {
  typeMappings = "DateTime=string,Bytes=Uint8Array"
}
```

**JSON Type Mapping**

```prisma
generator types {
  jsonTypeMapping = true  // Uses PrismaType namespace
}
```

**Field-Level Overrides**

```prisma
model User {
  /// @type DateTime=string
  createdAt DateTime

  /// @type Json=UserPreferences
  preferences Json
}
```

**Loose Autocomplete Enums**

```prisma
model User {
  /// @type !["email", "google"]     // Strict: only these values
  kind String

  /// @type ["email", "google"]      // Loose: autocomplete suggests these
  authProvider String
}
```

**JSDoc Comments**

```prisma
generator types {
  jsDocComments = true
}

/// User model represents a user account
model User {
  /// Unique identifier
  id String @id
}
```

### Utility Types (Always Generated)

Every model automatically gets these utility types in a namespace:

```ts
export namespace User {
  // Basic utilities
  export type Partial = Partial<User>;
  export type Required = Required<User>;
  export type Readonly = Readonly<User>;

  // Deep utilities (recursive)
  export type DeepPartial<T = User> = { ... };
  export type DeepRequired<T = User> = { ... };
}
```

### Directive-Based Utility Types

Add directives to your Prisma models to generate additional utility types:

**Input Types** (`@input`)

```prisma
/// @input
model User {
  id String @id @default(uuid())
  name String
  createdAt DateTime @default(now())
}
```

Generates: `User.CreateInput`, `User.UpdateInput`

**Select Types** (`@select`)

```prisma
/// @select
model User { ... }
```

Generates: `User.Select` for Prisma query select clauses

**Relation Types** (`@with`)

```prisma
/// @with posts,profile
model User {
  posts Post[]
  profile Profile?
}
```

Generates: `User.WithPostsAndProfile`

**Field Groups** (`@group`)

```prisma
/// @group timestamps createdAt,updatedAt
model User { ... }
```

Generates: `User.TimestampsFields`

**Validation Types** (`@validated`)

```prisma
/// @validated
model User { ... }
```

Generates: `User.Validated` (marked with `__validated: true`)

**Omit Types** (`@omit`)

```prisma
/// @omit createdAt,updatedAt
model User { ... }
```

Generates: `User.WithoutTimestamps`

**Pick Types** (`@pick`)

```prisma
/// @pick id,name,email
model User { ... }
```

Generates: `User.PickIdNameEmail`

📖 **[See Complete Features Documentation →](./FEATURES.md)** - Detailed examples for all utility types

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
