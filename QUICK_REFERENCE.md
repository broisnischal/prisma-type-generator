# Quick Reference Guide - Prisma Type Generator Directives

A quick reference for all available directives and their usage.

## Directives Cheat Sheet

| Directive | Usage | Generated Types | Always Generated? |
|-----------|-------|----------------|-------------------|
| `@input` / `@inputmodel` | `/// @input` | `CreateInput`, `UpdateInput` | ❌ No |
| `@select` | `/// @select` | `Select` | ❌ No |
| `@with` | `/// @with posts,profile` | `WithPostsAndProfile` | ❌ No |
| `@group` | `/// @group timestamps createdAt,updatedAt` | `TimestampsFields` | ❌ No |
| `@validated` | `/// @validated` | `Validated` | ❌ No |
| `@omit` | `/// @omit createdAt,updatedAt` | `WithoutTimestamps` | ❌ No |
| `@pick` | `/// @pick id,name,email` | `PickIdNameEmail` | ❌ No |
| - | (none) | `Partial`, `Required`, `Readonly` | ✅ Yes |
| - | (none) | `DeepPartial`, `DeepRequired` | ✅ Yes |

## Examples

### 1. Input Types
```prisma
/// @input
model User {
  id String @id @default(uuid())
  name String
  createdAt DateTime @default(now())
}
```
**Generates:** `User.CreateInput`, `User.UpdateInput`

### 2. Select Types
```prisma
/// @select
model User {
  id String @id
  name String
}
```
**Generates:** `User.Select`

### 3. Relation Types
```prisma
/// @with posts,profile
model User {
  id String @id
  posts Post[]
  profile Profile?
}
```
**Generates:** `User.WithPostsAndProfile`

### 4. Field Groups
```prisma
/// @group timestamps createdAt,updatedAt
/// @group auth password,email
model User {
  id String @id
  createdAt DateTime
  updatedAt DateTime
  password String
  email String
}
```
**Generates:** `User.TimestampsFields`, `User.AuthFields`

### 5. Validation Types
```prisma
/// @validated
model User {
  id String @id
  name String
}
```
**Generates:** `User.Validated`

### 6. Omit Types
```prisma
/// @omit createdAt,updatedAt
model User {
  id String @id
  name String
  createdAt DateTime
  updatedAt DateTime
}
```
**Generates:** `User.WithoutTimestamps`

### 7. Pick Types
```prisma
/// @pick id,name,email
model User {
  id String @id
  name String
  email String
  password String
}
```
**Generates:** `User.PickIdNameEmail`

## Complete Example

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
  email     String
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  posts     Post[]
  profile   Profile?
}
```

**All Generated Types:**
- `User.CreateInput` - For creating users
- `User.UpdateInput` - For updating users
- `User.Select` - For Prisma select queries
- `User.Validated` - For validated user data
- `User.WithoutPassword` - User without password field
- `User.UserPublic` - Only public fields
- `User.TimestampsFields` - Timestamp fields group
- `User.AuthFields` - Auth fields group
- `User.WithPostsAndProfile` - User with relations
- `User.Partial` - All fields optional (always generated)
- `User.Required` - All fields required (always generated)
- `User.Readonly` - All fields readonly (always generated)
- `User.DeepPartial` - Recursive partial (always generated)
- `User.DeepRequired` - Recursive required (always generated)

## Custom Type Names

Most directives support custom type names:

```prisma
/// @input CreateUserDto,UpdateUserDto
/// @omit createdAt,updatedAt UserPublic
/// @pick id,name UserBasic
/// @with posts UserWithPosts
/// @validated ValidatedUser
model User {
  // ...
}
```

## See Also

- **[Complete Features Documentation](./FEATURES.md)** - Detailed guide with examples
- **[Main README](./README.md)** - Installation and basic usage

