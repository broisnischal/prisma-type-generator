import type { GeneratorManifest } from "@prisma/generator-helper";

export function onManifest(): GeneratorManifest {
  return {
    defaultOutput: "../generated/types",
    prettyName: "Prisma Type Generator",
  };
}
