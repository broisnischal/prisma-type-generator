import type { GeneratorManifest } from "@prisma/generator-helper";

export function onManifest(): GeneratorManifest {
  return {
    defaultOutput: "./types",
    prettyName: "My Type Generator",
  };
}
