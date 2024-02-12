"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generator_helper_1 = require("@prisma/generator-helper");
const on_manifest_1 = require("./on-manifest");
const on_generate_1 = require("./on-generate");
(0, generator_helper_1.generatorHandler)({
    onManifest: on_manifest_1.onManifest,
    onGenerate: on_generate_1.onGenerate,
});
