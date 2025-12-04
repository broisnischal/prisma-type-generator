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

## Configuration Options

| Option     | Type    | Default                | Description                              |
| ---------- | ------- | ---------------------- | ---------------------------------------- |
| `output`   | string  | `"../generated/types"` | Output directory for generated types     |
| `global`   | boolean | `false`                | Generate global types with `T` prefix    |
| `clear`    | boolean | `false`                | Clear output directory before generating |
| `enumOnly` | boolean | `false`                | Only generate enum types (skip models)   |

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

## Features

- ✅ Generate TypeScript interfaces from Prisma models
- ✅ Generate TypeScript types and const objects from Prisma enums
- ✅ Support for optional/nullable fields
- ✅ Support for array/list fields
- ✅ Global type declarations (with `T` prefix)
- ✅ Custom output directory
- ✅ Clear output directory option
- ✅ Enum-only generation mode
- ✅ Compatible with Prisma 6.x and 7.x

### Contributing

If you'd like to contribute, please follow our contribution guidelines.

## Support

If you like the project, please consider supporting us by giving a ⭐️ on Github.

### Bugs

If you find a bug, please file an issue on [our issue tracker on GitHub](https://github.com/broisnischal/prisma-fns/issues)

### License

prisma-fns is open-source software licensed under the MIT [license](LICENSE).
