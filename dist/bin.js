#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/@prisma/generator-helper/dist/chunk-EOPVK4AE.js
var require_chunk_EOPVK4AE = __commonJS({
  "node_modules/@prisma/generator-helper/dist/chunk-EOPVK4AE.js"(exports2, module2) {
    "use strict";
    var __create2 = Object.create;
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf2 = Object.getPrototypeOf;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var chunk_EOPVK4AE_exports = {};
    __export(chunk_EOPVK4AE_exports, {
      LineStream: () => LineStream,
      byline: () => byline,
      createLineStream: () => createLineStream,
      createStream: () => createStream
    });
    module2.exports = __toCommonJS(chunk_EOPVK4AE_exports);
    var import_stream = __toESM2(require("stream"));
    var import_util2 = __toESM2(require("util"));
    function byline(readStream, options) {
      return createStream(readStream, options);
    }
    function createStream(readStream, options) {
      if (readStream) {
        return createLineStream(readStream, options);
      } else {
        return new LineStream(options);
      }
    }
    function createLineStream(readStream, options) {
      if (!readStream) {
        throw new Error("expected readStream");
      }
      if (!readStream.readable) {
        throw new Error("readStream must be readable");
      }
      const ls = new LineStream(options);
      readStream.pipe(ls);
      return ls;
    }
    function LineStream(options) {
      import_stream.default.Transform.call(this, options);
      options = options || {};
      this._readableState.objectMode = true;
      this._lineBuffer = [];
      this._keepEmptyLines = options.keepEmptyLines || false;
      this._lastChunkEndedWithCR = false;
      this.on("pipe", function(src) {
        if (!this.encoding) {
          if (src instanceof import_stream.default.Readable) {
            this.encoding = src._readableState.encoding;
          }
        }
      });
    }
    import_util2.default.inherits(LineStream, import_stream.default.Transform);
    LineStream.prototype._transform = function(chunk, encoding, done) {
      encoding = encoding || "utf8";
      if (Buffer.isBuffer(chunk)) {
        if (encoding == "buffer") {
          chunk = chunk.toString();
          encoding = "utf8";
        } else {
          chunk = chunk.toString(encoding);
        }
      }
      this._chunkEncoding = encoding;
      const lines = chunk.split(/\r\n|\r|\n/g);
      if (this._lastChunkEndedWithCR && chunk[0] == "\n") {
        lines.shift();
      }
      if (this._lineBuffer.length > 0) {
        this._lineBuffer[this._lineBuffer.length - 1] += lines[0];
        lines.shift();
      }
      this._lastChunkEndedWithCR = chunk[chunk.length - 1] == "\r";
      this._lineBuffer = this._lineBuffer.concat(lines);
      this._pushBuffer(encoding, 1, done);
    };
    LineStream.prototype._pushBuffer = function(encoding, keep, done) {
      while (this._lineBuffer.length > keep) {
        const line = this._lineBuffer.shift();
        if (this._keepEmptyLines || line.length > 0) {
          if (!this.push(this._reencode(line, encoding))) {
            const self = this;
            setImmediate(function() {
              self._pushBuffer(encoding, keep, done);
            });
            return;
          }
        }
      }
      done();
    };
    LineStream.prototype._flush = function(done) {
      this._pushBuffer(this._chunkEncoding, 0, done);
    };
    LineStream.prototype._reencode = function(line, chunkEncoding) {
      if (this.encoding && this.encoding != chunkEncoding) {
        return Buffer.from(line, chunkEncoding).toString(this.encoding);
      } else if (this.encoding) {
        return line;
      } else {
        return Buffer.from(line, chunkEncoding);
      }
    };
  }
});

// node_modules/@prisma/generator-helper/dist/chunk-QGM4M3NI.js
var require_chunk_QGM4M3NI = __commonJS({
  "node_modules/@prisma/generator-helper/dist/chunk-QGM4M3NI.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var chunk_QGM4M3NI_exports = {};
    __export(chunk_QGM4M3NI_exports, {
      __commonJS: () => __commonJS2,
      __require: () => __require,
      __toESM: () => __toESM2
    });
    module2.exports = __toCommonJS(chunk_QGM4M3NI_exports);
    var __create2 = Object.create;
    var __defProp22 = Object.defineProperty;
    var __getOwnPropDesc22 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames22 = Object.getOwnPropertyNames;
    var __getProtoOf2 = Object.getPrototypeOf;
    var __hasOwnProp22 = Object.prototype.hasOwnProperty;
    var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
      get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
    }) : x)(function(x) {
      if (typeof require !== "undefined") return require.apply(this, arguments);
      throw Error('Dynamic require of "' + x + '" is not supported');
    });
    var __commonJS2 = (cb, mod) => function __require2() {
      return mod || (0, cb[__getOwnPropNames22(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    };
    var __copyProps22 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames22(from))
          if (!__hasOwnProp22.call(to, key) && key !== except)
            __defProp22(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc22(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps22(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp22(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
  }
});

// node_modules/@prisma/debug/dist/index.js
var require_dist = __commonJS({
  "node_modules/@prisma/debug/dist/index.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export(src_exports, {
      Debug: () => Debug,
      clearLogs: () => clearLogs,
      default: () => src_default,
      getLogs: () => getLogs
    });
    module2.exports = __toCommonJS(src_exports);
    var colors_exports = {};
    __export(colors_exports, {
      $: () => $,
      bgBlack: () => bgBlack,
      bgBlue: () => bgBlue,
      bgCyan: () => bgCyan,
      bgGreen: () => bgGreen,
      bgMagenta: () => bgMagenta,
      bgRed: () => bgRed,
      bgWhite: () => bgWhite,
      bgYellow: () => bgYellow,
      black: () => black,
      blue: () => blue,
      bold: () => bold,
      cyan: () => cyan,
      dim: () => dim,
      gray: () => gray,
      green: () => green,
      grey: () => grey,
      hidden: () => hidden,
      inverse: () => inverse,
      italic: () => italic,
      magenta: () => magenta,
      red: () => red,
      reset: () => reset,
      strikethrough: () => strikethrough,
      underline: () => underline,
      white: () => white,
      yellow: () => yellow
    });
    var FORCE_COLOR;
    var NODE_DISABLE_COLORS;
    var NO_COLOR;
    var TERM;
    var isTTY = true;
    if (typeof process !== "undefined") {
      ({ FORCE_COLOR, NODE_DISABLE_COLORS, NO_COLOR, TERM } = process.env || {});
      isTTY = process.stdout && process.stdout.isTTY;
    }
    var $ = {
      enabled: !NODE_DISABLE_COLORS && NO_COLOR == null && TERM !== "dumb" && (FORCE_COLOR != null && FORCE_COLOR !== "0" || isTTY)
    };
    function init(x, y) {
      let rgx = new RegExp(`\\x1b\\[${y}m`, "g");
      let open = `\x1B[${x}m`, close = `\x1B[${y}m`;
      return function(txt) {
        if (!$.enabled || txt == null) return txt;
        return open + (!!~("" + txt).indexOf(close) ? txt.replace(rgx, close + open) : txt) + close;
      };
    }
    var reset = init(0, 0);
    var bold = init(1, 22);
    var dim = init(2, 22);
    var italic = init(3, 23);
    var underline = init(4, 24);
    var inverse = init(7, 27);
    var hidden = init(8, 28);
    var strikethrough = init(9, 29);
    var black = init(30, 39);
    var red = init(31, 39);
    var green = init(32, 39);
    var yellow = init(33, 39);
    var blue = init(34, 39);
    var magenta = init(35, 39);
    var cyan = init(36, 39);
    var white = init(37, 39);
    var gray = init(90, 39);
    var grey = init(90, 39);
    var bgBlack = init(40, 49);
    var bgRed = init(41, 49);
    var bgGreen = init(42, 49);
    var bgYellow = init(43, 49);
    var bgBlue = init(44, 49);
    var bgMagenta = init(45, 49);
    var bgCyan = init(46, 49);
    var bgWhite = init(47, 49);
    var MAX_ARGS_HISTORY = 100;
    var COLORS = ["green", "yellow", "blue", "magenta", "cyan", "red"];
    var argsHistory = [];
    var lastTimestamp = Date.now();
    var lastColor = 0;
    var processEnv = typeof process !== "undefined" ? process.env : {};
    globalThis.DEBUG ??= processEnv.DEBUG ?? "";
    globalThis.DEBUG_COLORS ??= processEnv.DEBUG_COLORS ? processEnv.DEBUG_COLORS === "true" : true;
    var topProps = {
      enable(namespace) {
        if (typeof namespace === "string") {
          globalThis.DEBUG = namespace;
        }
      },
      disable() {
        const prev = globalThis.DEBUG;
        globalThis.DEBUG = "";
        return prev;
      },
      // this is the core logic to check if logging should happen or not
      enabled(namespace) {
        const listenedNamespaces = globalThis.DEBUG.split(",").map((s) => {
          return s.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
        });
        const isListened = listenedNamespaces.some((listenedNamespace) => {
          if (listenedNamespace === "" || listenedNamespace[0] === "-") return false;
          return namespace.match(RegExp(listenedNamespace.split("*").join(".*") + "$"));
        });
        const isExcluded = listenedNamespaces.some((listenedNamespace) => {
          if (listenedNamespace === "" || listenedNamespace[0] !== "-") return false;
          return namespace.match(RegExp(listenedNamespace.slice(1).split("*").join(".*") + "$"));
        });
        return isListened && !isExcluded;
      },
      log: (...args) => {
        const [namespace, format, ...rest] = args;
        const logWithFormatting = console.warn ?? console.log;
        logWithFormatting(`${namespace} ${format}`, ...rest);
      },
      formatters: {}
      // not implemented
    };
    function debugCreate(namespace) {
      const instanceProps = {
        color: COLORS[lastColor++ % COLORS.length],
        enabled: topProps.enabled(namespace),
        namespace,
        log: topProps.log,
        extend: () => {
        }
        // not implemented
      };
      const debugCall = (...args) => {
        const { enabled, namespace: namespace2, color, log } = instanceProps;
        if (args.length !== 0) {
          argsHistory.push([namespace2, ...args]);
        }
        if (argsHistory.length > MAX_ARGS_HISTORY) {
          argsHistory.shift();
        }
        if (topProps.enabled(namespace2) || enabled) {
          const stringArgs = args.map((arg) => {
            if (typeof arg === "string") {
              return arg;
            }
            return safeStringify(arg);
          });
          const ms = `+${Date.now() - lastTimestamp}ms`;
          lastTimestamp = Date.now();
          if (globalThis.DEBUG_COLORS) {
            log(colors_exports[color](bold(namespace2)), ...stringArgs, colors_exports[color](ms));
          } else {
            log(namespace2, ...stringArgs, ms);
          }
        }
      };
      return new Proxy(debugCall, {
        get: (_, prop) => instanceProps[prop],
        set: (_, prop, value) => instanceProps[prop] = value
      });
    }
    var Debug = new Proxy(debugCreate, {
      get: (_, prop) => topProps[prop],
      set: (_, prop, value) => topProps[prop] = value
    });
    function safeStringify(value, indent = 2) {
      const cache = /* @__PURE__ */ new Set();
      return JSON.stringify(
        value,
        (key, value2) => {
          if (typeof value2 === "object" && value2 !== null) {
            if (cache.has(value2)) {
              return `[Circular *]`;
            }
            cache.add(value2);
          } else if (typeof value2 === "bigint") {
            return value2.toString();
          }
          return value2;
        },
        indent
      );
    }
    function getLogs(numChars = 7500) {
      const logs = argsHistory.map(([namespace, ...args]) => {
        return `${namespace} ${args.map((arg) => {
          if (typeof arg === "string") {
            return arg;
          } else {
            return JSON.stringify(arg);
          }
        }).join(" ")}`;
      }).join("\n");
      if (logs.length < numChars) {
        return logs;
      }
      return logs.slice(-numChars);
    }
    function clearLogs() {
      argsHistory.length = 0;
    }
    var src_default = Debug;
  }
});

// node_modules/@prisma/generator-helper/dist/chunk-YCVAQFCS.js
var require_chunk_YCVAQFCS = __commonJS({
  "node_modules/@prisma/generator-helper/dist/chunk-YCVAQFCS.js"(exports2, module2) {
    "use strict";
    var __create2 = Object.create;
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf2 = Object.getPrototypeOf;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var chunk_YCVAQFCS_exports = {};
    __export(chunk_YCVAQFCS_exports, {
      GeneratorError: () => GeneratorError,
      GeneratorProcess: () => GeneratorProcess
    });
    module2.exports = __toCommonJS(chunk_YCVAQFCS_exports);
    var import_chunk_EOPVK4AE = require_chunk_EOPVK4AE();
    var import_chunk_QGM4M3NI = require_chunk_QGM4M3NI();
    var import_debug = __toESM2(require_dist());
    var import_child_process = require("child_process");
    var require_windows = (0, import_chunk_QGM4M3NI.__commonJS)({
      "../../node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/windows.js"(exports3, module22) {
        "use strict";
        module22.exports = isexe;
        isexe.sync = sync;
        var fs = (0, import_chunk_QGM4M3NI.__require)("fs");
        function checkPathExt(path, options) {
          var pathext = options.pathExt !== void 0 ? options.pathExt : process.env.PATHEXT;
          if (!pathext) {
            return true;
          }
          pathext = pathext.split(";");
          if (pathext.indexOf("") !== -1) {
            return true;
          }
          for (var i = 0; i < pathext.length; i++) {
            var p = pathext[i].toLowerCase();
            if (p && path.substr(-p.length).toLowerCase() === p) {
              return true;
            }
          }
          return false;
        }
        function checkStat(stat, path, options) {
          if (!stat.isSymbolicLink() && !stat.isFile()) {
            return false;
          }
          return checkPathExt(path, options);
        }
        function isexe(path, options, cb) {
          fs.stat(path, function(er, stat) {
            cb(er, er ? false : checkStat(stat, path, options));
          });
        }
        function sync(path, options) {
          return checkStat(fs.statSync(path), path, options);
        }
      }
    });
    var require_mode = (0, import_chunk_QGM4M3NI.__commonJS)({
      "../../node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/mode.js"(exports3, module22) {
        "use strict";
        module22.exports = isexe;
        isexe.sync = sync;
        var fs = (0, import_chunk_QGM4M3NI.__require)("fs");
        function isexe(path, options, cb) {
          fs.stat(path, function(er, stat) {
            cb(er, er ? false : checkStat(stat, options));
          });
        }
        function sync(path, options) {
          return checkStat(fs.statSync(path), options);
        }
        function checkStat(stat, options) {
          return stat.isFile() && checkMode(stat, options);
        }
        function checkMode(stat, options) {
          var mod = stat.mode;
          var uid = stat.uid;
          var gid = stat.gid;
          var myUid = options.uid !== void 0 ? options.uid : process.getuid && process.getuid();
          var myGid = options.gid !== void 0 ? options.gid : process.getgid && process.getgid();
          var u = parseInt("100", 8);
          var g = parseInt("010", 8);
          var o = parseInt("001", 8);
          var ug = u | g;
          var ret = mod & o || mod & g && gid === myGid || mod & u && uid === myUid || mod & ug && myUid === 0;
          return ret;
        }
      }
    });
    var require_isexe = (0, import_chunk_QGM4M3NI.__commonJS)({
      "../../node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/index.js"(exports3, module22) {
        "use strict";
        var fs = (0, import_chunk_QGM4M3NI.__require)("fs");
        var core;
        if (process.platform === "win32" || global.TESTING_WINDOWS) {
          core = require_windows();
        } else {
          core = require_mode();
        }
        module22.exports = isexe;
        isexe.sync = sync;
        function isexe(path, options, cb) {
          if (typeof options === "function") {
            cb = options;
            options = {};
          }
          if (!cb) {
            if (typeof Promise !== "function") {
              throw new TypeError("callback not provided");
            }
            return new Promise(function(resolve, reject) {
              isexe(path, options || {}, function(er, is) {
                if (er) {
                  reject(er);
                } else {
                  resolve(is);
                }
              });
            });
          }
          core(path, options || {}, function(er, is) {
            if (er) {
              if (er.code === "EACCES" || options && options.ignoreErrors) {
                er = null;
                is = false;
              }
            }
            cb(er, is);
          });
        }
        function sync(path, options) {
          try {
            return core.sync(path, options || {});
          } catch (er) {
            if (options && options.ignoreErrors || er.code === "EACCES") {
              return false;
            } else {
              throw er;
            }
          }
        }
      }
    });
    var require_which = (0, import_chunk_QGM4M3NI.__commonJS)({
      "../../node_modules/.pnpm/which@2.0.2/node_modules/which/which.js"(exports3, module22) {
        "use strict";
        var isWindows = process.platform === "win32" || process.env.OSTYPE === "cygwin" || process.env.OSTYPE === "msys";
        var path = (0, import_chunk_QGM4M3NI.__require)("path");
        var COLON = isWindows ? ";" : ":";
        var isexe = require_isexe();
        var getNotFoundError = (cmd) => Object.assign(new Error(`not found: ${cmd}`), { code: "ENOENT" });
        var getPathInfo = (cmd, opt) => {
          const colon = opt.colon || COLON;
          const pathEnv = cmd.match(/\//) || isWindows && cmd.match(/\\/) ? [""] : [
            // windows always checks the cwd first
            ...isWindows ? [process.cwd()] : [],
            ...(opt.path || process.env.PATH || /* istanbul ignore next: very unusual */
            "").split(colon)
          ];
          const pathExtExe = isWindows ? opt.pathExt || process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM" : "";
          const pathExt = isWindows ? pathExtExe.split(colon) : [""];
          if (isWindows) {
            if (cmd.indexOf(".") !== -1 && pathExt[0] !== "")
              pathExt.unshift("");
          }
          return {
            pathEnv,
            pathExt,
            pathExtExe
          };
        };
        var which = (cmd, opt, cb) => {
          if (typeof opt === "function") {
            cb = opt;
            opt = {};
          }
          if (!opt)
            opt = {};
          const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
          const found = [];
          const step = (i) => new Promise((resolve, reject) => {
            if (i === pathEnv.length)
              return opt.all && found.length ? resolve(found) : reject(getNotFoundError(cmd));
            const ppRaw = pathEnv[i];
            const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
            const pCmd = path.join(pathPart, cmd);
            const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
            resolve(subStep(p, i, 0));
          });
          const subStep = (p, i, ii) => new Promise((resolve, reject) => {
            if (ii === pathExt.length)
              return resolve(step(i + 1));
            const ext = pathExt[ii];
            isexe(p + ext, { pathExt: pathExtExe }, (er, is) => {
              if (!er && is) {
                if (opt.all)
                  found.push(p + ext);
                else
                  return resolve(p + ext);
              }
              return resolve(subStep(p, i, ii + 1));
            });
          });
          return cb ? step(0).then((res) => cb(null, res), cb) : step(0);
        };
        var whichSync = (cmd, opt) => {
          opt = opt || {};
          const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
          const found = [];
          for (let i = 0; i < pathEnv.length; i++) {
            const ppRaw = pathEnv[i];
            const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
            const pCmd = path.join(pathPart, cmd);
            const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
            for (let j = 0; j < pathExt.length; j++) {
              const cur = p + pathExt[j];
              try {
                const is = isexe.sync(cur, { pathExt: pathExtExe });
                if (is) {
                  if (opt.all)
                    found.push(cur);
                  else
                    return cur;
                }
              } catch (ex) {
              }
            }
          }
          if (opt.all && found.length)
            return found;
          if (opt.nothrow)
            return null;
          throw getNotFoundError(cmd);
        };
        module22.exports = which;
        which.sync = whichSync;
      }
    });
    var require_path_key = (0, import_chunk_QGM4M3NI.__commonJS)({
      "../../node_modules/.pnpm/path-key@3.1.1/node_modules/path-key/index.js"(exports3, module22) {
        "use strict";
        var pathKey = (options = {}) => {
          const environment = options.env || process.env;
          const platform = options.platform || process.platform;
          if (platform !== "win32") {
            return "PATH";
          }
          return Object.keys(environment).reverse().find((key) => key.toUpperCase() === "PATH") || "Path";
        };
        module22.exports = pathKey;
        module22.exports.default = pathKey;
      }
    });
    var require_resolveCommand = (0, import_chunk_QGM4M3NI.__commonJS)({
      "../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/util/resolveCommand.js"(exports3, module22) {
        "use strict";
        var path = (0, import_chunk_QGM4M3NI.__require)("path");
        var which = require_which();
        var getPathKey = require_path_key();
        function resolveCommandAttempt(parsed, withoutPathExt) {
          const env = parsed.options.env || process.env;
          const cwd = process.cwd();
          const hasCustomCwd = parsed.options.cwd != null;
          const shouldSwitchCwd = hasCustomCwd && process.chdir !== void 0 && !process.chdir.disabled;
          if (shouldSwitchCwd) {
            try {
              process.chdir(parsed.options.cwd);
            } catch (err) {
            }
          }
          let resolved;
          try {
            resolved = which.sync(parsed.command, {
              path: env[getPathKey({ env })],
              pathExt: withoutPathExt ? path.delimiter : void 0
            });
          } catch (e) {
          } finally {
            if (shouldSwitchCwd) {
              process.chdir(cwd);
            }
          }
          if (resolved) {
            resolved = path.resolve(hasCustomCwd ? parsed.options.cwd : "", resolved);
          }
          return resolved;
        }
        function resolveCommand(parsed) {
          return resolveCommandAttempt(parsed) || resolveCommandAttempt(parsed, true);
        }
        module22.exports = resolveCommand;
      }
    });
    var require_escape = (0, import_chunk_QGM4M3NI.__commonJS)({
      "../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/util/escape.js"(exports3, module22) {
        "use strict";
        var metaCharsRegExp = /([()\][%!^"`<>&|;, *?])/g;
        function escapeCommand(arg) {
          arg = arg.replace(metaCharsRegExp, "^$1");
          return arg;
        }
        function escapeArgument(arg, doubleEscapeMetaChars) {
          arg = `${arg}`;
          arg = arg.replace(/(?=(\\+?)?)\1"/g, '$1$1\\"');
          arg = arg.replace(/(?=(\\+?)?)\1$/, "$1$1");
          arg = `"${arg}"`;
          arg = arg.replace(metaCharsRegExp, "^$1");
          if (doubleEscapeMetaChars) {
            arg = arg.replace(metaCharsRegExp, "^$1");
          }
          return arg;
        }
        module22.exports.command = escapeCommand;
        module22.exports.argument = escapeArgument;
      }
    });
    var require_shebang_regex = (0, import_chunk_QGM4M3NI.__commonJS)({
      "../../node_modules/.pnpm/shebang-regex@3.0.0/node_modules/shebang-regex/index.js"(exports3, module22) {
        "use strict";
        module22.exports = /^#!(.*)/;
      }
    });
    var require_shebang_command = (0, import_chunk_QGM4M3NI.__commonJS)({
      "../../node_modules/.pnpm/shebang-command@2.0.0/node_modules/shebang-command/index.js"(exports3, module22) {
        "use strict";
        var shebangRegex = require_shebang_regex();
        module22.exports = (string = "") => {
          const match = string.match(shebangRegex);
          if (!match) {
            return null;
          }
          const [path, argument] = match[0].replace(/#! ?/, "").split(" ");
          const binary = path.split("/").pop();
          if (binary === "env") {
            return argument;
          }
          return argument ? `${binary} ${argument}` : binary;
        };
      }
    });
    var require_readShebang = (0, import_chunk_QGM4M3NI.__commonJS)({
      "../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/util/readShebang.js"(exports3, module22) {
        "use strict";
        var fs = (0, import_chunk_QGM4M3NI.__require)("fs");
        var shebangCommand = require_shebang_command();
        function readShebang(command) {
          const size = 150;
          const buffer = Buffer.alloc(size);
          let fd;
          try {
            fd = fs.openSync(command, "r");
            fs.readSync(fd, buffer, 0, size, 0);
            fs.closeSync(fd);
          } catch (e) {
          }
          return shebangCommand(buffer.toString());
        }
        module22.exports = readShebang;
      }
    });
    var require_parse = (0, import_chunk_QGM4M3NI.__commonJS)({
      "../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/parse.js"(exports3, module22) {
        "use strict";
        var path = (0, import_chunk_QGM4M3NI.__require)("path");
        var resolveCommand = require_resolveCommand();
        var escape = require_escape();
        var readShebang = require_readShebang();
        var isWin = process.platform === "win32";
        var isExecutableRegExp = /\.(?:com|exe)$/i;
        var isCmdShimRegExp = /node_modules[\\/].bin[\\/][^\\/]+\.cmd$/i;
        function detectShebang(parsed) {
          parsed.file = resolveCommand(parsed);
          const shebang = parsed.file && readShebang(parsed.file);
          if (shebang) {
            parsed.args.unshift(parsed.file);
            parsed.command = shebang;
            return resolveCommand(parsed);
          }
          return parsed.file;
        }
        function parseNonShell(parsed) {
          if (!isWin) {
            return parsed;
          }
          const commandFile = detectShebang(parsed);
          const needsShell = !isExecutableRegExp.test(commandFile);
          if (parsed.options.forceShell || needsShell) {
            const needsDoubleEscapeMetaChars = isCmdShimRegExp.test(commandFile);
            parsed.command = path.normalize(parsed.command);
            parsed.command = escape.command(parsed.command);
            parsed.args = parsed.args.map((arg) => escape.argument(arg, needsDoubleEscapeMetaChars));
            const shellCommand = [parsed.command].concat(parsed.args).join(" ");
            parsed.args = ["/d", "/s", "/c", `"${shellCommand}"`];
            parsed.command = process.env.comspec || "cmd.exe";
            parsed.options.windowsVerbatimArguments = true;
          }
          return parsed;
        }
        function parse(command, args, options) {
          if (args && !Array.isArray(args)) {
            options = args;
            args = null;
          }
          args = args ? args.slice(0) : [];
          options = Object.assign({}, options);
          const parsed = {
            command,
            args,
            options,
            file: void 0,
            original: {
              command,
              args
            }
          };
          return options.shell ? parsed : parseNonShell(parsed);
        }
        module22.exports = parse;
      }
    });
    var require_enoent = (0, import_chunk_QGM4M3NI.__commonJS)({
      "../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/enoent.js"(exports3, module22) {
        "use strict";
        var isWin = process.platform === "win32";
        function notFoundError(original, syscall) {
          return Object.assign(new Error(`${syscall} ${original.command} ENOENT`), {
            code: "ENOENT",
            errno: "ENOENT",
            syscall: `${syscall} ${original.command}`,
            path: original.command,
            spawnargs: original.args
          });
        }
        function hookChildProcess(cp, parsed) {
          if (!isWin) {
            return;
          }
          const originalEmit = cp.emit;
          cp.emit = function(name, arg1) {
            if (name === "exit") {
              const err = verifyENOENT(arg1, parsed);
              if (err) {
                return originalEmit.call(cp, "error", err);
              }
            }
            return originalEmit.apply(cp, arguments);
          };
        }
        function verifyENOENT(status, parsed) {
          if (isWin && status === 1 && !parsed.file) {
            return notFoundError(parsed.original, "spawn");
          }
          return null;
        }
        function verifyENOENTSync(status, parsed) {
          if (isWin && status === 1 && !parsed.file) {
            return notFoundError(parsed.original, "spawnSync");
          }
          return null;
        }
        module22.exports = {
          hookChildProcess,
          verifyENOENT,
          verifyENOENTSync,
          notFoundError
        };
      }
    });
    var require_cross_spawn = (0, import_chunk_QGM4M3NI.__commonJS)({
      "../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/index.js"(exports3, module22) {
        "use strict";
        var cp = (0, import_chunk_QGM4M3NI.__require)("child_process");
        var parse = require_parse();
        var enoent = require_enoent();
        function spawn2(command, args, options) {
          const parsed = parse(command, args, options);
          const spawned = cp.spawn(parsed.command, parsed.args, parsed.options);
          enoent.hookChildProcess(spawned, parsed);
          return spawned;
        }
        function spawnSync(command, args, options) {
          const parsed = parse(command, args, options);
          const result = cp.spawnSync(parsed.command, parsed.args, parsed.options);
          result.error = result.error || enoent.verifyENOENTSync(result.status, parsed);
          return result;
        }
        module22.exports = spawn2;
        module22.exports.spawn = spawn2;
        module22.exports.sync = spawnSync;
        module22.exports._parse = parse;
        module22.exports._enoent = enoent;
      }
    });
    var import_cross_spawn = (0, import_chunk_QGM4M3NI.__toESM)(require_cross_spawn());
    var FORCE_COLOR;
    var NODE_DISABLE_COLORS;
    var NO_COLOR;
    var TERM;
    var isTTY = true;
    if (typeof process !== "undefined") {
      ({ FORCE_COLOR, NODE_DISABLE_COLORS, NO_COLOR, TERM } = process.env || {});
      isTTY = process.stdout && process.stdout.isTTY;
    }
    var $ = {
      enabled: !NODE_DISABLE_COLORS && NO_COLOR == null && TERM !== "dumb" && (FORCE_COLOR != null && FORCE_COLOR !== "0" || isTTY)
    };
    function init(x, y) {
      let rgx = new RegExp(`\\x1b\\[${y}m`, "g");
      let open = `\x1B[${x}m`, close = `\x1B[${y}m`;
      return function(txt) {
        if (!$.enabled || txt == null) return txt;
        return open + (!!~("" + txt).indexOf(close) ? txt.replace(rgx, close + open) : txt) + close;
      };
    }
    var reset = init(0, 0);
    var bold = init(1, 22);
    var dim = init(2, 22);
    var italic = init(3, 23);
    var underline = init(4, 24);
    var inverse = init(7, 27);
    var hidden = init(8, 28);
    var strikethrough = init(9, 29);
    var black = init(30, 39);
    var red = init(31, 39);
    var green = init(32, 39);
    var yellow = init(33, 39);
    var blue = init(34, 39);
    var magenta = init(35, 39);
    var cyan = init(36, 39);
    var white = init(37, 39);
    var gray = init(90, 39);
    var grey = init(90, 39);
    var bgBlack = init(40, 49);
    var bgRed = init(41, 49);
    var bgGreen = init(42, 49);
    var bgYellow = init(43, 49);
    var bgBlue = init(44, 49);
    var bgMagenta = init(45, 49);
    var bgCyan = init(46, 49);
    var bgWhite = init(47, 49);
    var debug = (0, import_debug.default)("prisma:GeneratorProcess");
    var globalMessageId = 1;
    var GeneratorError = class extends Error {
      constructor(message, code, data) {
        super(message);
        this.code = code;
        this.data = data;
        this.name = "GeneratorError";
        if (data?.stack) {
          this.stack = data.stack;
        }
      }
    };
    var GeneratorProcess = class {
      constructor(pathOrCommand, { isNode = false } = {}) {
        this.pathOrCommand = pathOrCommand;
        this.handlers = {};
        this.errorLogs = "";
        this.exited = false;
        this.getManifest = this.rpcMethod(
          "getManifest",
          (result) => result.manifest ?? null
        );
        this.generate = this.rpcMethod("generate");
        this.isNode = isNode;
      }
      async init() {
        if (!this.initPromise) {
          this.initPromise = this.initSingleton();
        }
        return this.initPromise;
      }
      initSingleton() {
        return new Promise((resolve, reject) => {
          if (this.isNode) {
            this.child = (0, import_child_process.fork)(this.pathOrCommand, [], {
              stdio: ["pipe", "inherit", "pipe", "ipc"],
              env: {
                ...process.env,
                PRISMA_GENERATOR_INVOCATION: "true"
              },
              // TODO: this assumes the host has at least 8 GB of RAM which may not be the case.
              execArgv: ["--max-old-space-size=8096"]
            });
          } else {
            this.child = (0, import_cross_spawn.spawn)(this.pathOrCommand, {
              stdio: ["pipe", "inherit", "pipe"],
              env: {
                ...process.env,
                PRISMA_GENERATOR_INVOCATION: "true"
              },
              shell: true
            });
          }
          this.child.on("exit", (code, signal) => {
            debug(`child exited with code ${code} on signal ${signal}`);
            this.exited = true;
            if (code) {
              const error = new GeneratorError(
                `Generator ${JSON.stringify(this.pathOrCommand)} failed:

${this.errorLogs}`
              );
              this.pendingError = error;
              this.rejectAllHandlers(error);
            }
          });
          this.child.stdin.on("error", () => {
          });
          this.child.on("error", (error) => {
            debug(error);
            this.pendingError = error;
            if (error.code === "EACCES") {
              reject(
                new Error(
                  `The executable at ${this.pathOrCommand} lacks the right permissions. Please use ${bold(
                    `chmod +x ${this.pathOrCommand}`
                  )}`
                )
              );
            } else {
              reject(error);
            }
            this.rejectAllHandlers(error);
          });
          (0, import_chunk_EOPVK4AE.byline)(this.child.stderr).on("data", (line) => {
            const response = String(line);
            let data;
            try {
              data = JSON.parse(response);
            } catch (e) {
              this.errorLogs += response + "\n";
              debug(response);
            }
            if (data) {
              this.handleResponse(data);
            }
          });
          this.child.on("spawn", resolve);
        });
      }
      rejectAllHandlers(error) {
        for (const id of Object.keys(this.handlers)) {
          this.handlers[id].reject(error);
          delete this.handlers[id];
        }
      }
      handleResponse(data) {
        if (data.jsonrpc && data.id) {
          if (typeof data.id !== "number") {
            throw new Error(`message.id has to be a number. Found value ${data.id}`);
          }
          if (this.handlers[data.id]) {
            if (isErrorResponse(data)) {
              const error = new GeneratorError(data.error.message, data.error.code, data.error.data);
              this.handlers[data.id].reject(error);
            } else {
              this.handlers[data.id].resolve(data.result);
            }
            delete this.handlers[data.id];
          }
        }
      }
      sendMessage(message, callback) {
        if (!this.child) {
          callback(new GeneratorError("Generator process has not started yet"));
          return;
        }
        if (!this.child.stdin.writable) {
          callback(new GeneratorError("Cannot send data to the generator process, process already exited"));
          return;
        }
        this.child.stdin.write(JSON.stringify(message) + "\n", (error) => {
          if (!error) {
            return callback();
          }
          if (error.code === "EPIPE") {
            return callback();
          }
          callback(error);
        });
      }
      getMessageId() {
        return globalMessageId++;
      }
      stop() {
        if (this.child && !this.child?.killed) {
          this.child.kill("SIGTERM");
          const timeoutMs = 2e3;
          const intervalMs = 200;
          let interval;
          let timeout;
          Promise.race([
            new Promise((resolve) => {
              timeout = setTimeout(resolve, timeoutMs);
            }),
            new Promise((resolve) => {
              interval = setInterval(() => {
                if (this.exited) {
                  return resolve("exited");
                }
              }, intervalMs);
            })
          ]).then((result) => {
            if (result !== "exited") {
              this.child?.kill("SIGKILL");
            }
          }).finally(() => {
            clearInterval(interval);
            clearTimeout(timeout);
          });
        }
      }
      rpcMethod(method, mapResult = (x) => x) {
        return (params) => new Promise((resolve, reject) => {
          if (this.pendingError) {
            reject(this.pendingError);
            return;
          }
          const messageId = this.getMessageId();
          this.handlers[messageId] = {
            resolve: (result) => resolve(mapResult(result)),
            reject
          };
          this.sendMessage(
            {
              jsonrpc: "2.0",
              method,
              params,
              id: messageId
            },
            (error) => {
              if (error) reject(error);
            }
          );
        });
      }
    };
    function isErrorResponse(response) {
      return response.error !== void 0;
    }
  }
});

// node_modules/@prisma/generator-helper/dist/chunk-JU65QD3H.js
var require_chunk_JU65QD3H = __commonJS({
  "node_modules/@prisma/generator-helper/dist/chunk-JU65QD3H.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var chunk_JU65QD3H_exports = {};
    __export(chunk_JU65QD3H_exports, {
      DMMF: () => DMMF,
      datamodelEnumToSchemaEnum: () => datamodelEnumToSchemaEnum
    });
    module2.exports = __toCommonJS(chunk_JU65QD3H_exports);
    function datamodelEnumToSchemaEnum(datamodelEnum) {
      return {
        name: datamodelEnum.name,
        values: datamodelEnum.values.map((v) => v.name)
      };
    }
    var DMMF;
    ((DMMF2) => {
      let ModelAction;
      ((ModelAction2) => {
        ModelAction2["findUnique"] = "findUnique";
        ModelAction2["findUniqueOrThrow"] = "findUniqueOrThrow";
        ModelAction2["findFirst"] = "findFirst";
        ModelAction2["findFirstOrThrow"] = "findFirstOrThrow";
        ModelAction2["findMany"] = "findMany";
        ModelAction2["create"] = "create";
        ModelAction2["createMany"] = "createMany";
        ModelAction2["createManyAndReturn"] = "createManyAndReturn";
        ModelAction2["update"] = "update";
        ModelAction2["updateMany"] = "updateMany";
        ModelAction2["updateManyAndReturn"] = "updateManyAndReturn";
        ModelAction2["upsert"] = "upsert";
        ModelAction2["delete"] = "delete";
        ModelAction2["deleteMany"] = "deleteMany";
        ModelAction2["groupBy"] = "groupBy";
        ModelAction2["count"] = "count";
        ModelAction2["aggregate"] = "aggregate";
        ModelAction2["findRaw"] = "findRaw";
        ModelAction2["aggregateRaw"] = "aggregateRaw";
      })(ModelAction = DMMF2.ModelAction || (DMMF2.ModelAction = {}));
    })(DMMF || (DMMF = {}));
  }
});

// node_modules/@prisma/generator-helper/dist/chunk-NAG6CCUN.js
var require_chunk_NAG6CCUN = __commonJS({
  "node_modules/@prisma/generator-helper/dist/chunk-NAG6CCUN.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var chunk_NAG6CCUN_exports = {};
    __export(chunk_NAG6CCUN_exports, {
      generatorHandler: () => generatorHandler2
    });
    module2.exports = __toCommonJS(chunk_NAG6CCUN_exports);
    var import_chunk_EOPVK4AE = require_chunk_EOPVK4AE();
    function generatorHandler2(handler) {
      (0, import_chunk_EOPVK4AE.byline)(process.stdin).on("data", async (line) => {
        const json = JSON.parse(String(line));
        if (json.method === "generate" && json.params) {
          try {
            const result = await handler.onGenerate(json.params);
            respond({
              jsonrpc: "2.0",
              result,
              id: json.id
            });
          } catch (_e) {
            const e = _e;
            respond({
              jsonrpc: "2.0",
              error: {
                code: -32e3,
                message: e.message,
                data: {
                  stack: e.stack
                }
              },
              id: json.id
            });
          }
        }
        if (json.method === "getManifest") {
          if (handler.onManifest) {
            try {
              const manifest = handler.onManifest(json.params);
              respond({
                jsonrpc: "2.0",
                result: {
                  manifest
                },
                id: json.id
              });
            } catch (_e) {
              const e = _e;
              respond({
                jsonrpc: "2.0",
                error: {
                  code: -32e3,
                  message: e.message,
                  data: {
                    stack: e.stack
                  }
                },
                id: json.id
              });
            }
          } else {
            respond({
              jsonrpc: "2.0",
              result: {
                manifest: null
              },
              id: json.id
            });
          }
        }
      });
      process.stdin.resume();
    }
    function respond(response) {
      console.error(JSON.stringify(response));
    }
  }
});

// node_modules/@prisma/generator-helper/dist/chunk-6F4PWJZI.js
var require_chunk_6F4PWJZI = __commonJS({
  "node_modules/@prisma/generator-helper/dist/chunk-6F4PWJZI.js"() {
    "use strict";
  }
});

// node_modules/@prisma/generator-helper/dist/index.js
var require_dist2 = __commonJS({
  "node_modules/@prisma/generator-helper/dist/index.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var dist_exports = {};
    __export(dist_exports, {
      DMMF: () => import_chunk_JU65QD3H.DMMF,
      GeneratorError: () => import_chunk_YCVAQFCS.GeneratorError,
      GeneratorProcess: () => import_chunk_YCVAQFCS.GeneratorProcess,
      datamodelEnumToSchemaEnum: () => import_chunk_JU65QD3H.datamodelEnumToSchemaEnum,
      generatorHandler: () => import_chunk_NAG6CCUN.generatorHandler
    });
    module2.exports = __toCommonJS(dist_exports);
    var import_chunk_YCVAQFCS = require_chunk_YCVAQFCS();
    var import_chunk_JU65QD3H = require_chunk_JU65QD3H();
    var import_chunk_NAG6CCUN = require_chunk_NAG6CCUN();
    var import_chunk_EOPVK4AE = require_chunk_EOPVK4AE();
    var import_chunk_QGM4M3NI = require_chunk_QGM4M3NI();
    var import_chunk_6F4PWJZI = require_chunk_6F4PWJZI();
  }
});

// src/generator.ts
var import_generator_helper = __toESM(require_dist2());

// src/on-manifest.ts
function onManifest() {
  return {
    defaultOutput: "../types",
    prettyName: "Prisma Type Generator"
  };
}

// src/on-generate.ts
var import_node_fs = require("node:fs");

// src/util.ts
function getTypeScriptType(type) {
  switch (type) {
    case "Decimal":
    case "Int":
    case "Float":
    case "BigInt":
      return "number";
    case "DateTime":
      return "Date";
    case "Boolean":
      return "boolean";
    case "Json":
      return "Record<string, unknown>";
    case "String":
      return "string";
    default:
      return type;
  }
}

// src/config.ts
function parseConfig(config) {
  return {
    global: config.global ? String(config.global).toLowerCase().trim() === "true" : true,
    clear: config.clear ? String(config.clear).toLowerCase().trim() === "true" : true,
    enumOnly: config.enumOnly ? String(config.enumOnly).toLowerCase().trim() === "true" : false
  };
}

// src/on-generate.ts
async function onGenerate(options) {
  const config = parseConfig(options.generator.config);
  const global2 = config.global ?? false;
  const clear = config.clear ?? false;
  const enumOnly = config.enumOnly ?? false;
  let exportedTypes = "";
  const dataModel = options.dmmf.datamodel;
  if (enumOnly) {
    for (const enumType of dataModel.enums) {
      exportedTypes += `export const ${enumType.name} = {`;
    }
  }
  for (const model of dataModel.models) {
    exportedTypes += `export interface ${model.name} {
`;
    const scalarAndEnumFields = model.fields.filter(
      (field) => ["scalar", "enum"].includes(field.kind)
    );
    for (const field of scalarAndEnumFields) {
      const typeScriptType = getTypeScriptType(field.type);
      const nullability = field.isRequired ? "" : "| null";
      const list = field.isList ? "[]" : "";
      exportedTypes += `  ${field.name}: ${typeScriptType}${nullability}${list};
`;
    }
    exportedTypes += "}\n\n";
  }
  for (const enumType of dataModel.enums) {
    exportedTypes += `export type ${enumType.name} = ${enumType.values.map((v) => `"${v.name}"`).join(" | ")};

`;
    exportedTypes += `export declare const ${enumType.name}: {
`;
    for (const enumValue of enumType.values) {
      exportedTypes += `  readonly ${enumValue.name}: "${enumValue.name}";
`;
    }
    exportedTypes += "};\n\n";
  }
  if (global2) {
    exportedTypes += "declare global {\n";
    for (const model of dataModel.models) {
      exportedTypes += `  export type T${model.name} = ${model.name};
`;
    }
    for (const enumType of dataModel.enums) {
      exportedTypes += `  export type T${enumType.name} = ${enumType.name};
`;
    }
    exportedTypes += "}\n\n";
  }
  const outputDir = options.generator.output?.value ?? "./types";
  const fullLocaltion = `${outputDir}/prisma.d.ts`;
  (0, import_node_fs.mkdirSync)(outputDir, { recursive: true });
  const formattedCode = exportedTypes;
  (0, import_node_fs.writeFileSync)(fullLocaltion, formattedCode);
}

// src/generator.ts
(0, import_generator_helper.generatorHandler)({
  onManifest,
  onGenerate
});
