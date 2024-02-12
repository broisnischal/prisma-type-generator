import { generatorHandler } from "@prisma/generator-helper";
import { onManifest } from "./on-manifest";
import { onGenerate } from "./on-generate";

generatorHandler({
  onManifest: onManifest,
  onGenerate: onGenerate,
});
