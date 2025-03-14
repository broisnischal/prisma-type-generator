# Prisma Type Generator

<!-- [![Build Status](https://travis-ci.org/broisnischal/prisma-type-generator.svg?branch=master)](https://travis-ci.org/broisnischal/prisma-type-generator) -->

[![npm version](https://img.shields.io/npm/v/prisma-type-generator.svg)](https://www.npmjs.com/package/prisma-type-generator)
![GitHub Repo stars](https://img.shields.io/github/stars/broisnischal/prisma-type-generator?style=social)
![GitHub top language](https://img.shields.io/github/languages/top/broisnischal/prisma-type-generator?style=plastic)
[![License](https://img.shields.io/npm/l/prisma-type-generator.svg)](https://opensource.org/licenses/MIT)

Prisma type generator is a package that generates the type and interface that are available in your schema.

## Installation

```bash
npm install prisma-type-generator
```

## Usage

```prisma
generator types {
  provider = "prisma-type-generator"
}

// output = "path"
// global = true || false
```

# Example

```ts

generator client {
  provider = "prisma-client-js"
}

generator types {
  provider = "prisma-type-generator"
  global = true
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id       String    @unique @default(uuid())
  name     String
  username String
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

#### Generates

```sh
  npx prisma generate
```

> It will generate the following file, prisma/types/index.ts with the following code

```ts
export interface User {
  id: string;
  name: string;
  username: string;
}

export interface Profile {
  id: string;
  contact: number;
  userId: string;
}

export const UserType = { pro: "pro", best: "best" } as const;
export type UserType = (typeof UserType)[keyof typeof UserType];
```

### Global Types

If you want to generate global types, you can use the `global` option.

```prisma
generator types {
  provider = "prisma-type-generator"
  global = true // default is false
}
```

> It will generate the following file, types/prisma.d.ts with the following code

```ts

// generates in types/prisma.d.ts
declare global {
  export type TUser = User;
  export type TProfile = Profile;
  export type TUserType = UserType;
}

```

Use the `global` option to generate global types.

```tsx

// use the generated types in your code, with the `T` prefix

const data : TUser = {
    // Add properties here if needed
};

```


### Todo

- [x] Add support for custom output path
- [ ] Add support for custom type validator
- [ ] Add support for custom type formatter



### Contributing

If you'd like to contribute, please follow our contribution guidelines.

## Support

If you like the project, please consider supporting us by giving a ⭐️ on Github.

### Bugs

If you find a bug, please file an issue on [our issue tracker on GitHub](https://github.com/broisnischal/prisma-fns/issues)

### License

prisma-fns is open-source software licensed under the MIT [license](LICENSE).


