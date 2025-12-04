# Prisma Type Generator - Advanced Features Guide

This document provides a comprehensive guide to all advanced utility types and features available in the Prisma Type Generator.

## Table of Contents

1. [Input Types (Create/Update DTOs)](#1-input-types-createupdate-dtos)
2. [Basic Utility Types](#2-basic-utility-types)
3. [Select Types](#3-select-types-for-prisma-queries)
4. [Deep Utility Types](#4-deep-utility-types)
5. [Relation Types](#5-relation-types)
6. [Field Groups](#6-field-groups)
7. [Validation Types](#7-validation-types)
8. [Omit Types](#8-omit-types)
9. [Pick Types](#9-pick-types)

---

## 1. Input Types (Create/Update DTOs)

Generate input types for creating and updating models. These types automatically exclude auto-generated fields like `id`, `createdAt`, and `updatedAt`.

### Usage

Add the `@input` or `@inputmodel` directive to your Prisma model:

```prisma
/// @input
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
}
```

### Generated Types

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

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

### Custom Input Type Names

You can specify custom input type names:

```prisma
/// @input CreateUserDto,UpdateUserDto
model User {
  // ...
}
```

### Example Usage

```typescript
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

---

## 2. Basic Utility Types

Basic utility types (`Partial`, `Required`, `Readonly`) are **always generated** for every model in a namespace.

### Generated Types

```typescript
export namespace User {
  /**
   * Make all fields optional
   */
  export type Partial = Partial<User>;

  /**
   * Make all fields required
   */
  export type Required = Required<User>;

  /**
   * Make all fields readonly
   */
  export type Readonly = Readonly<User>;
}
```

### Example Usage

```typescript
// Partial - all fields optional
const partialUser: User.Partial = {
  name: "John", // email is optional
};

// Required - all fields required (even if nullable in schema)
const requiredUser: User.Required = {
  id: "123",
  name: "John",
  email: "john@example.com", // Required even if nullable
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Readonly - all fields readonly
const readonlyUser: User.Readonly = {
  id: "123",
  name: "John",
  // Cannot modify properties
};
```

---

## 3. Select Types (for Prisma Queries)

Generate select types for Prisma query operations. These types help you type-safe Prisma `select` clauses.

### Usage

Add the `@select` directive to your Prisma model:

```prisma
/// @select
model User {
  id        String   @id @default(uuid())
  name      String
  email     String
  createdAt DateTime @default(now())
}
```

### Generated Types

```typescript
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

### Example Usage

```typescript
// Type-safe Prisma select
const selectClause: User.Select = {
  id: true,
  name: true,
  // email and createdAt are optional
};

// Use with Prisma Client
const user = await prisma.user.findUnique({
  where: { id: "123" },
  select: selectClause,
});
```

---

## 4. Deep Utility Types

Deep utility types provide recursive versions of `Partial` and `Required` that work with nested objects.

### Generated Types

Deep utility types are **always generated** for every model:

```typescript
export namespace User {
  /**
   * Deep partial (recursive)
   */
  export type DeepPartial<T = User> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
  };

  /**
   * Deep required (recursive)
   */
  export type DeepRequired<T = User> = {
    [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
  };
}
```

### Example Usage

```typescript
// DeepPartial - makes nested objects optional too
const deepPartial: User.DeepPartial = {
  name: "John",
  // Nested objects are also partial
};

// DeepRequired - makes nested objects required too
const deepRequired: User.DeepRequired = {
  id: "123",
  name: "John",
  email: "john@example.com",
  // All nested properties are also required
};
```

---

## 5. Relation Types

Generate types that include related models. Useful for typing Prisma `include` operations.

### Usage

Add the `@with` directive to your Prisma model:

```prisma
/// @with posts
model User {
  id    String @id @default(uuid())
  name  String
  email String
  posts Post[]
}

model Post {
  id       String @id @default(uuid())
  title    String
  content  String
  authorId String
  author   User   @relation(fields: [authorId], references: [id])
}
```

### Generated Types

```typescript
export namespace User {
  /**
   * User with relations: posts
   */
  export type WithPosts = User & {
    posts: Post[];
  };
}
```

### Multiple Relations

You can specify multiple relations:

```prisma
/// @with posts,profile
model User {
  id      String   @id @default(uuid())
  name    String
  posts   Post[]
  profile Profile?
}
```

### Custom Type Names

You can specify a custom type name:

```prisma
/// @with posts,profile UserWithRelations
model User {
  // ...
}
```

### Generated Types (Multiple Relations)

```typescript
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

### Example Usage

```typescript
// Type-safe Prisma include
const userWithPosts: User.WithPosts = await prisma.user.findUnique({
  where: { id: "123" },
  include: {
    posts: true,
  },
});

// Access related data with type safety
console.log(userWithPosts.posts[0].title);
```

---

## 6. Field Groups

Group related fields together for easier access and organization.

### Usage

Add the `@group` directive to your Prisma model:

```prisma
/// @group timestamps createdAt,updatedAt
/// @group auth password,email
model User {
  id        String   @id @default(uuid())
  name      String
  email     String
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Generated Types

```typescript
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

### Example Usage

```typescript
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

---

## 7. Validation Types

Generate types that mark data as validated. Useful for runtime validation and type guards.

### Usage

Add the `@validated` directive to your Prisma model:

```prisma
/// @validated
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
}
```

### Generated Types

```typescript
export namespace User {
  /**
   * Validated User type
   */
  export type Validated = User & { __validated: true };
}
```

### Custom Type Names

You can specify a custom type name:

```prisma
/// @validated ValidatedUser
model User {
  // ...
}
```

### Example Usage

```typescript
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
const user: User = { id: "123", name: "John", email: "john@example.com", createdAt: new Date() };
const validated = validateUser(user);
if (validated) {
  processUser(validated); // Type-safe!
}
```

---

## 8. Omit Types

Generate types that exclude specific fields from a model.

### Usage

Add the `@omit` directive to your Prisma model:

```prisma
/// @omit createdAt,updatedAt
model User {
  id        String   @id @default(uuid())
  name      String
  email     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Generated Types

```typescript
export namespace User {
  /**
   * User without createdAt, updatedAt
   */
  export type WithoutTimestamps = Omit<User, "createdAt" | "updatedAt">;
}
```

### Custom Type Names

You can specify a custom type name:

```prisma
/// @omit createdAt,updatedAt UserPublic
model User {
  // ...
}
```

### Example Usage

```typescript
// User without timestamps
const publicUser: User.WithoutTimestamps = {
  id: "123",
  name: "John",
  email: "john@example.com",
  // createdAt and updatedAt are excluded
};
```

---

## 9. Pick Types

Generate types that include only specific fields from a model.

### Usage

Add the `@pick` directive to your Prisma model:

```prisma
/// @pick id,name,email
model User {
  id        String   @id @default(uuid())
  name      String
  email     String
  password  String
  createdAt DateTime @default(now())
}
```

### Generated Types

```typescript
export namespace User {
  /**
   * User with only id, name, email
   */
  export type PickIdNameEmail = Pick<User, "id" | "name" | "email">;
}
```

### Custom Type Names

You can specify a custom type name:

```prisma
/// @pick id,name,email UserBasic
model User {
  // ...
}
```

### Example Usage

```typescript
// User with only basic fields
const basicUser: User.PickIdNameEmail = {
  id: "123",
  name: "John",
  email: "john@example.com",
  // password and createdAt are excluded
};
```

---

## Complete Example

Here's a complete example using all features:

```prisma
/// @input
/// @select
/// @validated
/// @omit password WithoutPassword
/// @pick id,name,email UserPublic
/// @group timestamps createdAt,updatedAt
/// @group auth password,email
/// @with posts,profile
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  posts     Post[]
  profile   Profile?
}

model Post {
  id       String @id @default(uuid())
  title    String
  content  String
  authorId String
  author   User   @relation(fields: [authorId], references: [id])
}

model Profile {
  id     String @id @default(uuid())
  bio    String
  userId String @unique
  user   User   @relation(fields: [userId], references: [id])
}
```

### Generated Types

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export namespace User {
  // Input types
  export type CreateInput = Omit<User, "id" | "createdAt" | "updatedAt">;
  export type UpdateInput = Partial<Omit<User, "id">>;

  // Omit types
  export type WithoutPassword = Omit<User, "password">;

  // Pick types
  export type UserPublic = Pick<User, "id" | "name" | "email">;

  // Group types
  export type TimestampsFields = Pick<User, "createdAt" | "updatedAt">;
  export type AuthFields = Pick<User, "password" | "email">;

  // Relation types
  export type WithPostsAndProfile = User & {
    posts: Post[];
    profile: Profile;
  };

  // Select types
  export type Select = {
    id?: boolean;
    name?: boolean;
    email?: boolean;
    password?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
  };

  // Validation types
  export type Validated = User & { __validated: true };

  // Basic utility types (always generated)
  export type Partial = Partial<User>;
  export type Required = Required<User>;
  export type Readonly = Readonly<User>;

  // Deep utility types (always generated)
  export type DeepPartial<T = User> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
  };
  export type DeepRequired<T = User> = {
    [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
  };
}
```

---

## Summary

All utility types are organized in a namespace for each model, making them easy to discover and use:

- **Always Generated**: `Partial`, `Required`, `Readonly`, `DeepPartial`, `DeepRequired`
- **Directive-Based**: `CreateInput`, `UpdateInput`, `Select`, `With*`, `Validated`, `Omit*`, `Pick*`, `*Fields`

Use these types to create type-safe DTOs, query builders, validation functions, and more!

