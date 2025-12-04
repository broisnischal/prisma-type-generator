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
    var import_util3 = __toESM2(require("util"));
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
    import_util3.default.inherits(LineStream, import_stream.default.Transform);
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

// node_modules/@prisma/generator-helper/dist/chunk-KEYE2GFS.js
var require_chunk_KEYE2GFS = __commonJS({
  "node_modules/@prisma/generator-helper/dist/chunk-KEYE2GFS.js"(exports2, module2) {
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
    var chunk_KEYE2GFS_exports = {};
    __export(chunk_KEYE2GFS_exports, {
      isErrorResponse: () => isErrorResponse
    });
    module2.exports = __toCommonJS(chunk_KEYE2GFS_exports);
    function isErrorResponse(response) {
      return response.error !== void 0;
    }
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
    var index_exports = {};
    __export(index_exports, {
      Debug: () => Debug,
      clearLogs: () => clearLogs,
      default: () => index_default,
      getLogs: () => getLogs
    });
    module2.exports = __toCommonJS(index_exports);
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
    var index_default = Debug;
  }
});

// node_modules/@prisma/generator-helper/dist/chunk-MXZE5TCU.js
var require_chunk_MXZE5TCU = __commonJS({
  "node_modules/@prisma/generator-helper/dist/chunk-MXZE5TCU.js"(exports2, module2) {
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
    var chunk_MXZE5TCU_exports = {};
    __export(chunk_MXZE5TCU_exports, {
      GeneratorError: () => GeneratorError,
      GeneratorProcess: () => GeneratorProcess
    });
    module2.exports = __toCommonJS(chunk_MXZE5TCU_exports);
    var import_chunk_EOPVK4AE = require_chunk_EOPVK4AE();
    var import_chunk_KEYE2GFS = require_chunk_KEYE2GFS();
    var import_chunk_QGM4M3NI = require_chunk_QGM4M3NI();
    var import_node_child_process = require("node:child_process");
    var import_debug = require_dist();
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
    var debug = (0, import_debug.Debug)("prisma:GeneratorProcess");
    var globalMessageId = 1;
    var GeneratorError = class extends Error {
      constructor(message, code, data) {
        super(message);
        this.code = code;
        this.data = data;
        if (data?.stack) {
          this.stack = data.stack;
        }
      }
      name = "GeneratorError";
    };
    var GeneratorProcess = class {
      constructor(pathOrCommand, { isNode = false } = {}) {
        this.pathOrCommand = pathOrCommand;
        this.isNode = isNode;
      }
      child;
      handlers = {};
      initPromise;
      isNode;
      errorLogs = "";
      pendingError;
      exited = false;
      async init() {
        if (!this.initPromise) {
          this.initPromise = this.initSingleton();
        }
        return this.initPromise;
      }
      initSingleton() {
        return new Promise((resolve, reject) => {
          if (this.isNode) {
            this.child = (0, import_node_child_process.fork)(this.pathOrCommand, [], {
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
            if ((0, import_chunk_KEYE2GFS.isErrorResponse)(data)) {
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
      getManifest = this.rpcMethod(
        "getManifest",
        (result) => result.manifest ?? null
      );
      generate = this.rpcMethod("generate");
    };
  }
});

// node_modules/@prisma/generator-helper/dist/chunk-IH6S2YZX.js
var require_chunk_IH6S2YZX = __commonJS({
  "node_modules/@prisma/generator-helper/dist/chunk-IH6S2YZX.js"(exports2, module2) {
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
    var chunk_IH6S2YZX_exports = {};
    __export(chunk_IH6S2YZX_exports, {
      generatorHandler: () => generatorHandler2
    });
    module2.exports = __toCommonJS(chunk_IH6S2YZX_exports);
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
              const manifest = await handler.onManifest(json.params);
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
      process.stderr.write(JSON.stringify(response) + "\n");
    }
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
    var index_exports = {};
    __export(index_exports, {
      GeneratorError: () => import_chunk_MXZE5TCU.GeneratorError,
      GeneratorProcess: () => import_chunk_MXZE5TCU.GeneratorProcess,
      generatorHandler: () => import_chunk_IH6S2YZX.generatorHandler
    });
    module2.exports = __toCommonJS(index_exports);
    var import_chunk_MXZE5TCU = require_chunk_MXZE5TCU();
    var import_chunk_IH6S2YZX = require_chunk_IH6S2YZX();
    var import_chunk_EOPVK4AE = require_chunk_EOPVK4AE();
    var import_chunk_KEYE2GFS = require_chunk_KEYE2GFS();
    var import_chunk_QGM4M3NI = require_chunk_QGM4M3NI();
  }
});

// src/generator.ts
var import_generator_helper = __toESM(require_dist2());

// src/on-manifest.ts
function onManifest() {
  return {
    defaultOutput: "../generated/types",
    prettyName: "Prisma Type Generator"
  };
}

// src/on-generate.ts
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");

// src/config.ts
function parseConfig(config) {
  const splitFiles = parseBoolean(config.splitFiles, false);
  const splitBySchema = parseBoolean(config.splitBySchema, false);
  if (splitFiles && splitBySchema) {
    throw new Error(
      "Cannot use 'splitFiles' and 'splitBySchema' together. These options are mutually exclusive. Please use only one of them."
    );
  }
  return {
    global: parseBoolean(config.global, true),
    clear: parseBoolean(config.clear, true),
    enumOnly: parseBoolean(config.enumOnly, false),
    include: config.include ? String(config.include).trim() : void 0,
    exclude: config.exclude ? String(config.exclude).trim() : void 0,
    typeMappings: config.typeMappings ? String(config.typeMappings).trim() : void 0,
    jsonTypeMapping: parseBoolean(config.jsonTypeMapping, false),
    namespaceName: config.namespaceName ? String(config.namespaceName).trim() : "PrismaType",
    jsDocComments: parseBoolean(config.jsDocComments, false),
    splitFiles,
    barrelExports: parseBoolean(config.barrelExports, true),
    splitBySchema
  };
}
function parseBoolean(value, defaultValue) {
  if (!value) return defaultValue;
  return String(value).toLowerCase().trim() === "true";
}

// src/util.ts
function parseTypeMappings(mappings, defaultMappings, jsonTypeMapping, namespaceName = "PrismaType") {
  const result = {
    Decimal: "number",
    Int: "number",
    Float: "number",
    BigInt: "number",
    DateTime: "Date",
    Boolean: "boolean",
    String: "string",
    Bytes: "Buffer",
    ...defaultMappings
  };
  if (jsonTypeMapping) {
    result.Json = `${namespaceName}.Json`;
  } else {
    result.Json = "Record<string, unknown>";
  }
  if (!mappings) return result;
  const pairs = mappings.split(",");
  for (const pair of pairs) {
    const [key, value] = pair.split("=").map((s) => s.trim());
    if (key && value) {
      if (key === "Json" && jsonTypeMapping) {
        continue;
      }
      result[key] = value;
    }
  }
  return result;
}
function getTypeScriptType(type, typeMappings) {
  const mappings = typeMappings || parseTypeMappings();
  return mappings[type] || type;
}
function extractJSDoc(comment) {
  if (!comment) return "";
  return comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
}
function parseOmitDirective(comment) {
  if (!comment) return null;
  const cleanComment = comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
  const match = cleanComment.match(/@omit\s+(.+?)(?:\s+([A-Z][a-zA-Z0-9]*))?(?=\s*@|\s*$)/);
  if (match && match[1]) {
    const fieldsStr = match[1].trim();
    const typeName = match[2]?.trim();
    const fields = fieldsStr.split(",").map((f) => f.trim()).filter((f) => f.length > 0);
    if (fields.length > 0) {
      return {
        fields,
        typeName: typeName || void 0
      };
    }
  }
  return null;
}
function parsePickDirective(comment) {
  if (!comment) return null;
  const cleanComment = comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
  const match = cleanComment.match(/@pick\s+(.+?)(?:\s+([A-Z][a-zA-Z0-9]*))?(?=\s*@|\s*$)/);
  if (match && match[1]) {
    const fieldsStr = match[1].trim();
    const typeName = match[2]?.trim();
    const fields = fieldsStr.split(",").map((f) => f.trim()).filter((f) => f.length > 0);
    if (fields.length > 0) {
      return {
        fields,
        typeName: typeName || void 0
      };
    }
  }
  return null;
}
function parseInputDirective(comment) {
  if (!comment) return null;
  const cleanComment = comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
  const match = cleanComment.match(/@input(?:model)?(?:\s+(.+?))?(?=\s*@|\s*$)/);
  if (match) {
    if (match[1]) {
      const names = match[1].split(",").map((n) => n.trim()).filter((n) => n.length > 0);
      return names.length > 0 ? names : null;
    }
    return ["CreateInput", "UpdateInput"];
  }
  return null;
}
function parseGroupDirective(comment) {
  if (!comment) return null;
  const cleanComment = comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
  const groups = /* @__PURE__ */ new Map();
  const matches = Array.from(
    cleanComment.matchAll(/@group\s+(\w+)\s+(.+?)(?=\s*@|\s*$)/g)
  );
  for (const match of matches) {
    const groupName = match[1].trim();
    const fieldsStr = match[2].trim();
    const fields = fieldsStr.split(",").map((f) => f.trim()).filter((f) => f.length > 0);
    if (groupName && fields.length > 0) {
      groups.set(groupName, fields);
    }
  }
  return groups.size > 0 ? groups : null;
}
function parseWithDirective(comment) {
  if (!comment) return null;
  const cleanComment = comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
  const match = cleanComment.match(/@with\s+(.+?)(?:\s+([A-Z][a-zA-Z0-9]*))?(?=\s*@|\s*$)/);
  if (match && match[1]) {
    const relationsStr = match[1].trim();
    const typeName = match[2]?.trim();
    const relations = relationsStr.split(",").map((r) => r.trim()).filter((r) => r.length > 0);
    if (relations.length > 0) {
      return {
        relations,
        typeName: typeName || void 0
      };
    }
  }
  return null;
}
function parseSelectDirective(comment) {
  if (!comment) return false;
  const cleanComment = comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
  return /@select(?=\s|$|@)/.test(cleanComment);
}
function parseValidatedDirective(comment) {
  if (!comment) return null;
  const cleanComment = comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
  const match = cleanComment.match(/@validated(?:\s+([A-Z][a-zA-Z0-9]*))?(?=\s*@|\s*$)/);
  if (match) {
    return match[1]?.trim() || "Validated";
  }
  return null;
}
function generateOmitTypeName(omitFields) {
  const timestampFields = /* @__PURE__ */ new Set(["createdAt", "updatedAt"]);
  const isTimestamps = omitFields.every((f) => timestampFields.has(f));
  if (isTimestamps && omitFields.length === 2) {
    return "WithoutTimestamps";
  }
  if (omitFields.length === 1) {
    const field = omitFields[0];
    const semanticNames = {
      password: "WithoutPassword",
      deletedAt: "WithoutDeletedAt",
      id: "WithoutId"
    };
    return semanticNames[field] || `Without${field.charAt(0).toUpperCase() + field.slice(1)}`;
  }
  const timestamps = omitFields.filter((f) => timestampFields.has(f));
  const others = omitFields.filter((f) => !timestampFields.has(f));
  const parts = [];
  if (timestamps.length === 2) {
    parts.push("Timestamps");
  } else if (timestamps.length > 0) {
    parts.push(
      ...timestamps.map((f) => f.charAt(0).toUpperCase() + f.slice(1))
    );
  }
  if (others.length > 0) {
    parts.push(...others.map((f) => f.charAt(0).toUpperCase() + f.slice(1)));
  }
  const connector = parts.length > 1 ? "And" : "";
  return `Without${parts.join(connector)}`;
}
function parseTypeMappingFromComment(comment, jsonTypeMapping, namespaceName = "PrismaType") {
  if (!comment) return null;
  const cleanComment = comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
  if (cleanComment.startsWith("!")) {
    const typeDef = cleanComment.substring(1).trim();
    if (typeDef.startsWith("{")) {
      let braceCount = 0;
      let endIndex = -1;
      for (let i = 0; i < typeDef.length; i++) {
        if (typeDef[i] === "{") braceCount++;
        if (typeDef[i] === "}") {
          braceCount--;
          if (braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }
      if (endIndex > 0) {
        return typeDef.substring(0, endIndex).trim();
      }
    }
    if (typeDef.startsWith("[")) {
      let bracketCount = 0;
      let endIndex = -1;
      for (let i = 0; i < typeDef.length; i++) {
        if (typeDef[i] === "[") bracketCount++;
        if (typeDef[i] === "]") {
          bracketCount--;
          if (bracketCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }
      if (endIndex > 0) {
        return typeDef.substring(0, endIndex).trim();
      }
    }
    return typeDef;
  }
  const match = cleanComment.match(/@type\s+(\S+)\s*=\s*(.+)/);
  if (match && match[1] && match[2]) {
    const prismaType = match[1].trim();
    let typeName = match[2].trim();
    typeName = typeName.replace(/\s*\/\/.*$/, "").trim();
    if (typeName.startsWith("!")) {
      const inlineType = typeName.substring(1).trim();
      if (inlineType.startsWith("{")) {
        let braceCount = 0;
        let endIndex = -1;
        for (let i = 0; i < inlineType.length; i++) {
          if (inlineType[i] === "{") braceCount++;
          if (inlineType[i] === "}") {
            braceCount--;
            if (braceCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
        if (endIndex > 0) {
          return inlineType.substring(0, endIndex).trim();
        }
      }
      if (inlineType.startsWith("[")) {
        let bracketCount = 0;
        let endIndex = -1;
        for (let i = 0; i < inlineType.length; i++) {
          if (inlineType[i] === "[") bracketCount++;
          if (inlineType[i] === "]") {
            bracketCount--;
            if (bracketCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
        if (endIndex > 0) {
          return inlineType.substring(0, endIndex).trim();
        }
      }
      return inlineType;
    }
    if (prismaType === "Json" && jsonTypeMapping) {
      if (typeName === "any" || typeName === "Json") {
        return `${namespaceName}.Json`;
      }
      if (typeName.startsWith(`${namespaceName}.`)) {
        return typeName;
      }
      const isSimpleIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(typeName);
      if (isSimpleIdentifier) {
        return `${namespaceName}.${typeName}`;
      }
      const typeKeywords = /* @__PURE__ */ new Set([
        "string",
        "number",
        "boolean",
        "any",
        "unknown",
        "never",
        "void",
        "Record",
        "Array",
        "Promise",
        "Partial",
        "Required",
        "Readonly",
        "Pick",
        "Omit"
      ]);
      let result = typeName;
      let offset = 0;
      const namespacePrefix = `${namespaceName}.`;
      const namespacePrefixLength = namespacePrefix.length;
      const matches = Array.from(
        typeName.matchAll(/\b([A-Z][a-zA-Z0-9_$]*)\b/g)
      );
      for (const match2 of matches) {
        const identifier = match2[1];
        const matchIndex = match2.index;
        if (typeKeywords.has(identifier)) {
          continue;
        }
        const beforeMatch = result.substring(
          Math.max(0, matchIndex + offset - namespacePrefixLength),
          matchIndex + offset
        );
        if (beforeMatch === namespacePrefix) {
          continue;
        }
        const before = result.substring(0, matchIndex + offset);
        const after = result.substring(matchIndex + offset + identifier.length);
        result = before + `${namespacePrefix}${identifier}` + after;
        offset += namespacePrefixLength;
      }
      return result;
    }
    return typeName;
  }
  const simpleMatch = cleanComment.match(/@type\s+(\S+)=(\S+)/);
  if (simpleMatch) {
    const prismaType = simpleMatch[1];
    let typeName = simpleMatch[2];
    if (typeName.startsWith("!")) {
      const inlineType = typeName.substring(1).trim();
      if (inlineType.startsWith("{")) {
        let braceCount = 0;
        let endIndex = -1;
        for (let i = 0; i < inlineType.length; i++) {
          if (inlineType[i] === "{") braceCount++;
          if (inlineType[i] === "}") {
            braceCount--;
            if (braceCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
        if (endIndex > 0) {
          return inlineType.substring(0, endIndex).trim();
        }
      }
      if (inlineType.startsWith("[")) {
        let bracketCount = 0;
        let endIndex = -1;
        for (let i = 0; i < inlineType.length; i++) {
          if (inlineType[i] === "[") bracketCount++;
          if (inlineType[i] === "]") {
            bracketCount--;
            if (bracketCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
        if (endIndex > 0) {
          return inlineType.substring(0, endIndex).trim();
        }
      }
      return inlineType;
    }
    if (prismaType === "Json" && jsonTypeMapping) {
      if (typeName === "any" || typeName === "Json") {
        return `${namespaceName}.Json`;
      }
      if (typeName.startsWith(`${namespaceName}.`)) {
        return typeName;
      }
      const isSimpleIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(typeName);
      if (isSimpleIdentifier) {
        return `${namespaceName}.${typeName}`;
      }
      const typeKeywords = /* @__PURE__ */ new Set([
        "string",
        "number",
        "boolean",
        "any",
        "unknown",
        "never",
        "void",
        "Record",
        "Array",
        "Promise",
        "Partial",
        "Required",
        "Readonly",
        "Pick",
        "Omit"
      ]);
      let result = typeName;
      let offset = 0;
      const namespacePrefix = `${namespaceName}.`;
      const namespacePrefixLength = namespacePrefix.length;
      const matches = Array.from(
        typeName.matchAll(/\b([A-Z][a-zA-Z0-9_$]*)\b/g)
      );
      for (const match2 of matches) {
        const identifier = match2[1];
        const matchIndex = match2.index;
        if (typeKeywords.has(identifier)) {
          continue;
        }
        const beforeMatch = result.substring(
          Math.max(0, matchIndex + offset - namespacePrefixLength),
          matchIndex + offset
        );
        if (beforeMatch === namespacePrefix) {
          continue;
        }
        const before = result.substring(0, matchIndex + offset);
        const after = result.substring(matchIndex + offset + identifier.length);
        result = before + `${namespacePrefix}${identifier}` + after;
        offset += namespacePrefixLength;
      }
      return result;
    }
    return typeName;
  }
  return null;
}
function parseLooseEnumFromComment(comment) {
  if (!comment) return null;
  const cleanComment = comment.replace(/^\/\/\/\s*/gm, "").replace(/^\/\/\s*/gm, "").trim();
  const strictMatch = cleanComment.match(/@type\s+!\s*\[(.*?)\]/);
  const looseMatch = cleanComment.match(/@type\s+\[(.*?)\]/);
  if (strictMatch) {
    const valuesStr = strictMatch[1];
    const values = valuesStr.split(",").map((v) => v.trim().replace(/^["']|["']$/g, "")).filter((v) => v.length > 0);
    return { strict: true, values };
  }
  if (looseMatch) {
    const valuesStr = looseMatch[1];
    const values = valuesStr.split(",").map((v) => v.trim().replace(/^["']|["']$/g, "")).filter((v) => v.length > 0);
    return { strict: false, values };
  }
  return null;
}
function shouldIncludeModel(modelName, include, exclude) {
  if (exclude) {
    const excludeList = exclude.split(",").map((s) => s.trim());
    if (excludeList.includes(modelName)) {
      return false;
    }
  }
  if (include) {
    const includeList = include.split(",").map((s) => s.trim());
    return includeList.includes(modelName);
  }
  return true;
}
function shouldIncludeEnum(enumName, include, exclude) {
  if (exclude) {
    const excludeList = exclude.split(",").map((s) => s.trim());
    if (excludeList.includes(enumName)) {
      return false;
    }
  }
  if (include) {
    const includeList = include.split(",").map((s) => s.trim());
    return includeList.includes(enumName);
  }
  return true;
}
function modelToFileName(modelName) {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}
function inferSchemaFileNames(items) {
  const schemaNames = /* @__PURE__ */ new Set();
  for (const item of items) {
    const match = item.name.match(/^([A-Z][a-z]+)/);
    if (match) {
      const prefix = match[1].toLowerCase();
      schemaNames.add(prefix);
    }
  }
  return schemaNames;
}
function getSchemaFileNameForModel(modelName, schemaFiles, inferredSchemaNames) {
  const baseNames = [];
  if (schemaFiles && schemaFiles.length > 0) {
    schemaFiles.map((file) => file.replace(/\.prisma$/, "").toLowerCase()).filter((name) => name !== "schema").forEach((name) => baseNames.push(name));
  }
  const allSchemaNames = inferredSchemaNames || /* @__PURE__ */ new Set();
  if (allSchemaNames.size > 0) {
    for (const schemaName of allSchemaNames) {
      baseNames.push(schemaName);
    }
  }
  for (const baseName of baseNames) {
    const prefix = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    if (modelName.startsWith(prefix)) {
      return baseName;
    }
  }
  const match = modelName.match(/^([A-Z][a-z]+)/);
  if (match) {
    const prefix = match[1].toLowerCase();
    if (baseNames.length > 0 && baseNames.includes(prefix)) {
      return prefix;
    }
    if (baseNames.length > 0) {
      for (const baseName of baseNames) {
        if (baseName === prefix || baseName.startsWith(prefix) || prefix.startsWith(baseName)) {
          return baseName;
        }
      }
    }
    if (allSchemaNames.size > 0 && allSchemaNames.has(prefix)) {
      return prefix;
    }
  }
  return null;
}
function groupModelsBySchemaFile(models, schemaFiles, inferredSchemaNames) {
  const groups = /* @__PURE__ */ new Map();
  for (const model of models) {
    const fileName = getSchemaFileNameForModel(model.name, schemaFiles, inferredSchemaNames);
    const fileKey = fileName || "index";
    if (!groups.has(fileKey)) {
      groups.set(fileKey, []);
    }
    groups.get(fileKey).push(model);
  }
  return groups;
}
function groupEnumsBySchemaFile(enums, schemaFiles, inferredSchemaNames) {
  const groups = /* @__PURE__ */ new Map();
  for (const enumType of enums) {
    const fileName = getSchemaFileNameForModel(enumType.name, schemaFiles, inferredSchemaNames);
    const fileKey = fileName || "enums";
    if (!groups.has(fileKey)) {
      groups.set(fileKey, []);
    }
    groups.get(fileKey).push(enumType);
  }
  return groups;
}
function generatePrismaTypeNamespace(namespaceName = "PrismaType") {
  return `/**
 * ${namespaceName} namespace for custom type mappings
 * This namespace is used when jsonTypeMapping is enabled
 * 
 * IMPORTANT: To extend this namespace with your own interfaces (like UserPreferences),
 * create a file named 'prisma-json.ts' in your project and extend the global namespace:
 * 
 * // prisma-json.ts
 * // This file must be a module, so we include an empty export.
 * export {};
 * 
 * declare global {
 *   namespace ${namespaceName} {
 *     interface Json {
 *       [key: string]: any; // Customize as needed
 *     }
 *     interface UserPreferences {
 *       theme: "light" | "dark";
 *       language: "en" | "es";
 *     }
 *   }
 * }
 * 
 * Make sure your prisma-json.ts file is included in your tsconfig.json 'include' array.
 * 
 * Then in your Prisma schema:
 * /// @type Json=UserPreferences
 * preferences Json  // Will use ${namespaceName}.UserPreferences via namespace merging
 * 
 * Or use inline types:
 * /// @type Json=any
 * metadata Json  // Uses ${namespaceName}.Json
 */
// This file must be a module, so we include an empty export.
export {};

declare global {
  namespace ${namespaceName} {
    interface Json {
      [key: string]: any;
    }
  }
}
`;
}

// src/generators/types.ts
function generateTypes(options) {
  const {
    dataModel,
    typeMappings,
    jsDocComments = false,
    include,
    exclude,
    models,
    enums,
    jsonTypeMapping = false,
    namespaceName = "PrismaType"
  } = options;
  const mappings = parseTypeMappings(void 0, typeMappings, jsonTypeMapping, namespaceName);
  let output = "";
  if (jsonTypeMapping) {
    output += `// This file must be a module, so we include an empty export.
`;
    output += `export {};

`;
    output += `/// <reference path="./prisma-json.d.ts" />

`;
  }
  const modelsToGenerate = models || dataModel.models;
  let enumsToGenerate = enums || dataModel.enums;
  if (!enums && (include || exclude)) {
    enumsToGenerate = enumsToGenerate.filter((enumType) => {
      if (exclude) {
        const excludeList = exclude.split(",").map((s) => s.trim());
        if (excludeList.includes(enumType.name)) {
          return false;
        }
      }
      if (include) {
        const includeList = include.split(",").map((s) => s.trim());
        return includeList.includes(enumType.name);
      }
      return true;
    });
  }
  for (const enumType of enumsToGenerate) {
    const comment = jsDocComments ? extractJSDoc(enumType.documentation) : "";
    const jsDoc = comment ? `/**
 * ${comment}
 */
` : "";
    output += `${jsDoc}export type ${enumType.name} = ${enumType.values.map((v) => `"${v.name}"`).join(" | ")};

`;
    output += `export declare const ${enumType.name}: {
`;
    for (const enumValue of enumType.values) {
      output += `  readonly ${enumValue.name}: "${enumValue.name}";
`;
    }
    output += "};\n\n";
  }
  for (const model of modelsToGenerate) {
    if (include && !include.split(",").map((s) => s.trim()).includes(model.name)) {
      continue;
    }
    if (exclude && exclude.split(",").map((s) => s.trim()).includes(model.name)) {
      continue;
    }
    const comment = jsDocComments ? extractJSDoc(model.documentation) : "";
    const jsDoc = comment ? `/**
 * ${comment}
 */
` : "";
    const omitDirective = parseOmitDirective(model.documentation);
    const omitFields = omitDirective?.fields || [];
    const customTypeName = omitDirective?.typeName;
    output += `${jsDoc}export interface ${model.name} {
`;
    const scalarAndEnumFields = model.fields.filter(
      (field) => ["scalar", "enum"].includes(field.kind)
    );
    for (const field of scalarAndEnumFields) {
      const fieldComment = jsDocComments ? extractJSDoc(field.documentation) : "";
      let typeScriptType;
      const looseEnum = parseLooseEnumFromComment(field.documentation);
      if (looseEnum && field.type === "String") {
        if (looseEnum.strict) {
          typeScriptType = looseEnum.values.map((v) => `"${v}"`).join(" | ");
        } else {
          const literalUnion = looseEnum.values.map((v) => `"${v}"`).join(" | ");
          typeScriptType = `${literalUnion} | (string & {})`;
        }
      } else {
        const customType = parseTypeMappingFromComment(field.documentation, jsonTypeMapping, namespaceName);
        if (customType) {
          typeScriptType = customType;
        } else {
          typeScriptType = getTypeScriptType(field.type, mappings);
        }
      }
      const nullability = field.isRequired ? "" : "| null";
      const list = field.isList ? "[]" : "";
      const fieldJsDoc = fieldComment ? `  /**
   * ${fieldComment}
   */
` : "";
      output += `${fieldJsDoc}  ${field.name}: ${typeScriptType}${nullability}${list};
`;
    }
    output += "}\n\n";
    const utilityTypes = generateUtilityTypes(
      model,
      dataModel,
      omitDirective,
      jsonTypeMapping
    );
    if (utilityTypes) {
      output += utilityTypes;
    }
  }
  return output;
}
function collectReferencedModels(model, modelFileMap, currentFileName) {
  const referencedModels = /* @__PURE__ */ new Set();
  if (!modelFileMap || !currentFileName) {
    return referencedModels;
  }
  const relationFields = model.fields.filter(
    (field) => field.kind !== "scalar" && field.kind !== "enum" && field.relationName !== void 0
  );
  const withDirective = parseWithDirective(model.documentation);
  if (withDirective && withDirective.relations.length > 0) {
    for (const relationName of withDirective.relations) {
      const relationField = relationFields.find((f) => f.name === relationName);
      if (relationField) {
        const relationType = relationField.type;
        if (relationType) {
          const relationModelFile = modelFileMap.get(relationType);
          if (relationModelFile && relationModelFile !== currentFileName) {
            referencedModels.add(relationType);
          }
        }
      }
    }
  }
  return referencedModels;
}
function generateUtilityTypes(model, dataModel, omitDirective, jsonTypeMapping, modelFileMap, currentFileName) {
  let namespaceOutput = `/**
 * Utility types for ${model.name}
 */
`;
  namespaceOutput += `export namespace ${model.name} {
`;
  namespaceOutput += `  type _Partial<T> = { [P in keyof T]?: T[P] };
`;
  namespaceOutput += `  type _Required<T> = { [P in keyof T]-?: T[P] };
`;
  namespaceOutput += `  type _Readonly<T> = { readonly [P in keyof T]: T[P] };

`;
  const scalarAndEnumFields = model.fields.filter(
    (field) => ["scalar", "enum"].includes(field.kind)
  );
  const allFieldNames = scalarAndEnumFields.map((f) => f.name);
  const relationFields = model.fields.filter(
    (field) => field.kind !== "scalar" && field.kind !== "enum" && field.relationName !== void 0
  );
  if (omitDirective && omitDirective.fields.length > 0) {
    const validOmitFields = omitDirective.fields.filter(
      (fieldName) => allFieldNames.includes(fieldName)
    );
    if (validOmitFields.length > 0) {
      const omitUnion = validOmitFields.map((f) => `"${f}"`).join(" | ");
      const typeName = omitDirective.typeName || generateOmitTypeName(validOmitFields);
      namespaceOutput += `  /**
   * ${model.name} without ${validOmitFields.join(", ")}
   */
`;
      namespaceOutput += `  export type ${typeName} = Omit<${model.name}, ${omitUnion}>;

`;
    }
  }
  const pickDirective = parsePickDirective(model.documentation);
  if (pickDirective && pickDirective.fields.length > 0) {
    const pickUnion = pickDirective.fields.map((f) => `"${f}"`).join(" | ");
    const typeName = pickDirective.typeName || `Pick${pickDirective.fields.map((f) => f.charAt(0).toUpperCase() + f.slice(1)).join("")}`;
    namespaceOutput += `  /**
   * ${model.name} with only ${pickDirective.fields.join(", ")}
   */
`;
    namespaceOutput += `  export type ${typeName} = Pick<${model.name}, ${pickUnion}>;

`;
  }
  const inputTypes = parseInputDirective(model.documentation);
  if (inputTypes) {
    for (const inputTypeName of inputTypes) {
      if (inputTypeName === "CreateInput") {
        const excludeFields = model.fields.filter((f) => {
          return f.isId || f.name === "createdAt" || f.name === "updatedAt";
        }).map((f) => f.name).filter((f) => allFieldNames.includes(f));
        if (excludeFields.length > 0) {
          const excludeUnion = excludeFields.map((f) => `"${f}"`).join(" | ");
          namespaceOutput += `  /**
   * Input type for creating ${model.name} (omits id, createdAt, updatedAt)
   */
`;
          namespaceOutput += `  export type ${inputTypeName} = Omit<${model.name}, ${excludeUnion}>;

`;
        } else {
          namespaceOutput += `  /**
   * Input type for creating ${model.name}
   */
`;
          namespaceOutput += `  export type ${inputTypeName} = ${model.name};

`;
        }
      } else if (inputTypeName === "UpdateInput") {
        const excludeFields = model.fields.filter((f) => f.isId).map((f) => f.name);
        if (excludeFields.length > 0) {
          const excludeUnion = excludeFields.map((f) => `"${f}"`).join(" | ");
          namespaceOutput += `  /**
   * Input type for updating ${model.name} (all fields optional, omits id)
   */
`;
          namespaceOutput += `  export type ${inputTypeName} = _Partial<Omit<${model.name}, ${excludeUnion}>>;

`;
        } else {
          namespaceOutput += `  /**
   * Input type for updating ${model.name} (all fields optional)
   */
`;
          namespaceOutput += `  export type ${inputTypeName} = _Partial<${model.name}>;

`;
        }
      } else {
        namespaceOutput += `  /**
   * Custom input type: ${inputTypeName}
   */
`;
        namespaceOutput += `  export type ${inputTypeName} = _Partial<Omit<${model.name}, "id">>;

`;
      }
    }
  }
  const groups = parseGroupDirective(model.documentation);
  if (groups) {
    for (const [groupName, fields] of groups.entries()) {
      const pickUnion = fields.map((f) => `"${f}"`).join(" | ");
      const typeName = `${groupName.charAt(0).toUpperCase() + groupName.slice(1)}Fields`;
      namespaceOutput += `  /**
   * ${groupName} fields: ${fields.join(", ")}
   */
`;
      namespaceOutput += `  export type ${typeName} = Pick<${model.name}, ${pickUnion}>;

`;
    }
  }
  const withDirective = parseWithDirective(model.documentation);
  if (withDirective && withDirective.relations.length > 0) {
    const relationTypes = [];
    for (const relationName of withDirective.relations) {
      const relationField = relationFields.find((f) => f.name === relationName);
      if (relationField) {
        const relationType = relationField.type;
        const isArray = relationField.isList;
        const typeStr = isArray ? `${relationType}[]` : relationType;
        relationTypes.push(`    ${relationName}: ${typeStr};`);
      }
    }
    if (relationTypes.length > 0) {
      const typeName = withDirective.typeName || `With${withDirective.relations.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join("")}`;
      namespaceOutput += `  /**
   * ${model.name} with relations: ${withDirective.relations.join(", ")}
   */
`;
      namespaceOutput += `  export type ${typeName} = ${model.name} & {
`;
      namespaceOutput += relationTypes.join("\n");
      namespaceOutput += `
  };

`;
    }
  }
  if (parseSelectDirective(model.documentation)) {
    const selectFields = allFieldNames.map((f) => `    ${f}?: boolean;`).join("\n");
    namespaceOutput += `  /**
   * Select type for Prisma queries
   */
`;
    namespaceOutput += `  export type Select = {
`;
    namespaceOutput += selectFields;
    namespaceOutput += `
  };

`;
  }
  const validatedTypeName = parseValidatedDirective(model.documentation);
  if (validatedTypeName) {
    namespaceOutput += `  /**
   * Validated ${model.name} type
   */
`;
    namespaceOutput += `  export type ${validatedTypeName} = ${model.name} & { __validated: true };

`;
  }
  namespaceOutput += `  /**
   * Make all fields optional
   */
`;
  namespaceOutput += `  export type Partial = _Partial<${model.name}>;

`;
  namespaceOutput += `  /**
   * Make all fields required
   */
`;
  namespaceOutput += `  export type Required = _Required<${model.name}>;

`;
  namespaceOutput += `  /**
   * Make all fields readonly
   */
`;
  namespaceOutput += `  export type Readonly = _Readonly<${model.name}>;

`;
  namespaceOutput += `  /**
   * Deep partial (recursive)
   */
`;
  namespaceOutput += `  export type DeepPartial<T = ${model.name}> = {
`;
  namespaceOutput += `    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
`;
  namespaceOutput += `  };

`;
  namespaceOutput += `  /**
   * Deep required (recursive)
   */
`;
  namespaceOutput += `  export type DeepRequired<T = ${model.name}> = {
`;
  namespaceOutput += `    [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
`;
  namespaceOutput += `  };

`;
  namespaceOutput += `}

`;
  return namespaceOutput;
}
function generateEnumType(enumType, options) {
  const { jsDocComments = false, jsonTypeMapping = false, namespaceName = "PrismaType", skipModuleHeader = false } = options;
  let output = "";
  if (jsonTypeMapping && !skipModuleHeader) {
    output += `// This file must be a module, so we include an empty export.
`;
    output += `export {};

`;
    output += `/// <reference path="./prisma-json.d.ts" />

`;
  }
  const comment = jsDocComments ? extractJSDoc(enumType.documentation) : "";
  const jsDoc = comment ? `/**
 * ${comment}
 */
` : "";
  output += `${jsDoc}export type ${enumType.name} = ${enumType.values.map((v) => `"${v.name}"`).join(" | ")};

`;
  output += `export declare const ${enumType.name}: {
`;
  for (const enumValue of enumType.values) {
    output += `  readonly ${enumValue.name}: "${enumValue.name}";
`;
  }
  output += "};\n\n";
  return output;
}
function generateModelType(model, options) {
  const {
    typeMappings,
    jsDocComments = false,
    jsonTypeMapping = false,
    namespaceName = "PrismaType",
    dataModel,
    enumFileMap,
    modelFileMap,
    currentFileName,
    skipModuleHeader = false
  } = options;
  const mappings = parseTypeMappings(void 0, typeMappings, jsonTypeMapping, namespaceName);
  let output = "";
  if (jsonTypeMapping && !skipModuleHeader) {
    output += `// This file must be a module, so we include an empty export.
`;
    output += `export {};

`;
    output += `/// <reference path="./prisma-json.d.ts" />

`;
  }
  const usedEnums = /* @__PURE__ */ new Set();
  const scalarAndEnumFields = model.fields.filter(
    (field) => ["scalar", "enum"].includes(field.kind)
  );
  const allEnumNames = /* @__PURE__ */ new Set();
  if (dataModel?.enums) {
    for (const enumType of dataModel.enums) {
      allEnumNames.add(enumType.name);
    }
  }
  for (const field of scalarAndEnumFields) {
    if (field.kind === "enum") {
      usedEnums.add(field.type);
    } else if (field.kind === "scalar") {
      const looseEnum = parseLooseEnumFromComment(field.documentation);
      if (!looseEnum && field.type && allEnumNames.has(field.type)) {
        usedEnums.add(field.type);
      }
    }
  }
  const referencedModels = collectReferencedModels(model, modelFileMap, currentFileName);
  const imports = [];
  if (enumFileMap && currentFileName && usedEnums.size > 0) {
    for (const enumName of usedEnums) {
      const enumFileName = enumFileMap.get(enumName);
      if (enumFileName && enumFileName !== currentFileName) {
        imports.push(`import type { ${enumName} } from "./${enumFileName}";`);
      }
    }
  }
  if (modelFileMap && currentFileName && referencedModels.size > 0) {
    for (const modelName of referencedModels) {
      const modelFileName = modelFileMap.get(modelName);
      if (modelFileName && modelFileName !== currentFileName) {
        imports.push(`import type { ${modelName} } from "./${modelFileName}";`);
      }
    }
  }
  if (imports.length > 0) {
    output += imports.join("\n") + "\n\n";
  }
  const comment = jsDocComments ? extractJSDoc(model.documentation) : "";
  const jsDoc = comment ? `/**
 * ${comment}
 */
` : "";
  const omitDirective = parseOmitDirective(model.documentation);
  const omitFields = omitDirective?.fields || [];
  const customTypeName = omitDirective?.typeName;
  output += `${jsDoc}export interface ${model.name} {
`;
  for (const field of scalarAndEnumFields) {
    const fieldComment = jsDocComments ? extractJSDoc(field.documentation) : "";
    let typeScriptType;
    const looseEnum = parseLooseEnumFromComment(field.documentation);
    if (looseEnum && field.type === "String") {
      if (looseEnum.strict) {
        typeScriptType = looseEnum.values.map((v) => `"${v}"`).join(" | ");
      } else {
        const literalUnion = looseEnum.values.map((v) => `"${v}"`).join(" | ");
        typeScriptType = `${literalUnion} | (string & {})`;
      }
    } else {
      const customType = parseTypeMappingFromComment(field.documentation, jsonTypeMapping, namespaceName);
      if (customType) {
        typeScriptType = customType;
      } else {
        typeScriptType = getTypeScriptType(field.type, mappings);
      }
    }
    const nullability = field.isRequired ? "" : "| null";
    const list = field.isList ? "[]" : "";
    const fieldJsDoc = fieldComment ? `  /**
   * ${fieldComment}
   */
` : "";
    output += `${fieldJsDoc}  ${field.name}: ${typeScriptType}${nullability}${list};
`;
  }
  output += "}\n\n";
  const utilityTypes = generateUtilityTypes(
    model,
    dataModel,
    omitDirective,
    jsonTypeMapping,
    modelFileMap,
    currentFileName
  );
  if (utilityTypes) {
    output += utilityTypes;
  }
  return output;
}

// src/on-generate.ts
async function onGenerate(options) {
  const config = parseConfig(options.generator.config);
  const outputDir = options.generator.output?.value ?? "../generated/types";
  if (config.clear && (0, import_node_fs.existsSync)(outputDir)) {
    (0, import_node_fs.rmSync)(outputDir, { recursive: true, force: true });
  }
  (0, import_node_fs.mkdirSync)(outputDir, { recursive: true });
  const dataModel = options.dmmf.datamodel;
  const namespaceName = config.namespaceName || "PrismaType";
  const typeMappings = config.typeMappings || config.jsonTypeMapping ? parseTypeMappings(
    config.typeMappings,
    void 0,
    config.jsonTypeMapping,
    namespaceName
  ) : void 0;
  if (config.jsonTypeMapping) {
    const prismaTypeContent = generatePrismaTypeNamespace(namespaceName);
    const prismaTypePath = (0, import_node_path.join)(outputDir, "prisma-json.d.ts");
    (0, import_node_fs.writeFileSync)(prismaTypePath, prismaTypeContent);
  }
  const filteredModels = dataModel.models.filter(
    (model) => shouldIncludeModel(model.name, config.include, config.exclude)
  );
  const filteredEnums = dataModel.enums.filter(
    (enumType) => shouldIncludeEnum(enumType.name, config.include, config.exclude)
  );
  const schemaPath = options.schemaPath || "";
  const schemaFiles = [];
  const files = [];
  if (config.splitBySchema) {
    const allItems = [
      ...config.enumOnly ? [] : filteredModels,
      ...filteredEnums
    ];
    const inferredSchemaNames = inferSchemaFileNames(allItems);
    const modelGroups = config.enumOnly ? /* @__PURE__ */ new Map() : groupModelsBySchemaFile(filteredModels, schemaFiles, inferredSchemaNames);
    const enumGroups = groupEnumsBySchemaFile(filteredEnums, schemaFiles, inferredSchemaNames);
    const enumFileMap = /* @__PURE__ */ new Map();
    for (const [fileName, fileEnums] of enumGroups.entries()) {
      for (const enumType of fileEnums) {
        enumFileMap.set(enumType.name, fileName);
      }
    }
    for (const enumType of dataModel.enums) {
      if (!enumFileMap.has(enumType.name)) {
        enumFileMap.set(enumType.name, "enums");
      }
    }
    const modelFileMap = /* @__PURE__ */ new Map();
    for (const [fileName, fileModels] of modelGroups.entries()) {
      for (const model of fileModels) {
        modelFileMap.set(model.name, fileName);
      }
    }
    const allFileNames = /* @__PURE__ */ new Set();
    if (!config.enumOnly) {
      modelGroups.forEach((_, fileName) => allFileNames.add(fileName));
    }
    enumGroups.forEach((_, fileName) => allFileNames.add(fileName));
    for (const fileName of allFileNames) {
      const fileModels = config.enumOnly ? [] : modelGroups.get(fileName) || [];
      const fileEnums = enumGroups.get(fileName) || [];
      if (fileName === "index" && !config.barrelExports && fileModels.length === 0 && fileEnums.length === 0) {
        continue;
      }
      const currentFileName = fileName;
      let typesContent = "";
      if (config.jsonTypeMapping && (fileEnums.length > 0 || fileModels.length > 0)) {
        typesContent += `// This file must be a module, so we include an empty export.
`;
        typesContent += `export {};

`;
        typesContent += `/// <reference path="./prisma-json.d.ts" />

`;
      }
      const skipModuleHeader = config.jsonTypeMapping && (fileEnums.length > 0 || fileModels.length > 0);
      for (const enumType of fileEnums) {
        const enumContent = generateEnumType(enumType, {
          jsDocComments: config.jsDocComments ?? false,
          jsonTypeMapping: config.jsonTypeMapping ?? false,
          // Need true to apply namespace prefix
          namespaceName,
          skipModuleHeader
        });
        typesContent += enumContent;
      }
      for (const model of fileModels) {
        const modelContent = generateModelType(model, {
          typeMappings,
          jsDocComments: config.jsDocComments ?? false,
          jsonTypeMapping: config.jsonTypeMapping ?? false,
          // Need true to apply namespace prefix
          namespaceName,
          dataModel,
          enumFileMap,
          modelFileMap,
          currentFileName,
          skipModuleHeader
        });
        typesContent += modelContent;
      }
      let finalContent = typesContent;
      if (config.global) {
        finalContent += "declare global {\n";
        for (const model of fileModels) {
          finalContent += `  export type T${model.name} = ${model.name};
`;
        }
        for (const enumType of fileEnums) {
          finalContent += `  export type T${enumType.name} = ${enumType.name};
`;
        }
        finalContent += "}\n\n";
      }
      if (finalContent.trim().length > 0) {
        files.push({
          name: currentFileName,
          content: finalContent
        });
      }
    }
    for (const file of files) {
      const filePath = (0, import_node_path.join)(outputDir, `${file.name}.ts`);
      (0, import_node_fs.writeFileSync)(filePath, file.content);
    }
    if (config.barrelExports && !config.global) {
      const exports2 = [];
      const generatedFileNames = files.map((f) => f.name).filter((name) => {
        return name !== "index";
      });
      for (const fileName of generatedFileNames.sort()) {
        exports2.push(`export * from "./${fileName}";`);
      }
      if (exports2.length > 0) {
        const indexContent = exports2.join("\n") + "\n";
        (0, import_node_fs.writeFileSync)((0, import_node_path.join)(outputDir, "index.ts"), indexContent);
      }
    }
    return;
  }
  if (config.splitFiles) {
    const enumFileMap = /* @__PURE__ */ new Map();
    for (const enumType of dataModel.enums) {
      if (shouldIncludeEnum(enumType.name, config.include, config.exclude)) {
        enumFileMap.set(enumType.name, modelToFileName(enumType.name));
      }
    }
    const modelFileMap = /* @__PURE__ */ new Map();
    for (const model of filteredModels) {
      modelFileMap.set(model.name, modelToFileName(model.name));
    }
    if (!config.enumOnly) {
      for (const model of filteredModels) {
        const modelFileName = modelToFileName(model.name);
        let modelContent = generateModelType(model, {
          typeMappings,
          jsDocComments: config.jsDocComments ?? false,
          jsonTypeMapping: config.jsonTypeMapping ?? false,
          namespaceName,
          dataModel,
          enumFileMap,
          modelFileMap,
          currentFileName: modelFileName
        });
        if (config.global) {
          modelContent += "declare global {\n";
          modelContent += `  export type T${model.name} = ${model.name};
`;
          modelContent += "}\n\n";
        }
        files.push({
          name: modelFileName,
          content: modelContent
        });
      }
    }
    for (const enumType of filteredEnums) {
      let enumContent = generateEnumType(enumType, {
        jsDocComments: config.jsDocComments ?? false,
        jsonTypeMapping: config.jsonTypeMapping ?? false,
        namespaceName
      });
      if (config.global) {
        enumContent += "declare global {\n";
        enumContent += `  export type T${enumType.name} = ${enumType.name};
`;
        enumContent += "}\n\n";
      }
      files.push({
        name: modelToFileName(enumType.name),
        content: enumContent
      });
    }
  } else {
    if (!config.enumOnly) {
      const typesContent = generateTypes({
        dataModel: {
          ...dataModel,
          models: filteredModels,
          enums: filteredEnums
        },
        typeMappings,
        jsDocComments: config.jsDocComments ?? false,
        include: config.include,
        exclude: config.exclude,
        jsonTypeMapping: config.jsonTypeMapping ?? false,
        namespaceName
      });
      let finalTypesContent = typesContent;
      if (config.global) {
        finalTypesContent += "declare global {\n";
        for (const model of filteredModels) {
          finalTypesContent += `  export type T${model.name} = ${model.name};
`;
        }
        for (const enumType of filteredEnums) {
          finalTypesContent += `  export type T${enumType.name} = ${enumType.name};
`;
        }
        finalTypesContent += "}\n\n";
      }
      files.push({
        name: "prisma.d.ts",
        content: finalTypesContent
      });
    } else {
      const enumContent = generateTypes({
        dataModel: {
          ...dataModel,
          models: [],
          enums: filteredEnums
        },
        typeMappings,
        jsDocComments: config.jsDocComments ?? false,
        include: config.include,
        exclude: config.exclude,
        jsonTypeMapping: config.jsonTypeMapping ?? false,
        namespaceName
      });
      if (config.global) {
        let globalContent = enumContent;
        globalContent += "declare global {\n";
        for (const enumType of filteredEnums) {
          globalContent += `  export type T${enumType.name} = ${enumType.name};
`;
        }
        globalContent += "}\n\n";
        files.push({
          name: "prisma.d.ts",
          content: globalContent
        });
      } else {
        files.push({
          name: "prisma.d.ts",
          content: enumContent
        });
      }
    }
  }
  for (const file of files) {
    const fileName = file.name.endsWith(".ts") || file.name.endsWith(".d.ts") ? file.name : `${file.name}.ts`;
    const filePath = (0, import_node_path.join)(outputDir, fileName);
    (0, import_node_fs.writeFileSync)(filePath, file.content);
  }
  if (config.barrelExports && !config.global && files.length > 1) {
    const exports2 = [];
    const fileExports = files.map((f) => {
      let baseName = f.name;
      if (baseName.endsWith(".d.ts")) {
        baseName = baseName.slice(0, -5);
      } else if (baseName.endsWith(".ts")) {
        baseName = baseName.slice(0, -3);
      }
      return `export * from "./${baseName}";`;
    }).join("\n");
    exports2.push(fileExports);
    (0, import_node_fs.writeFileSync)((0, import_node_path.join)(outputDir, "index.ts"), exports2.join("\n") + "\n");
  }
}

// src/generator.ts
(0, import_generator_helper.generatorHandler)({
  onManifest,
  onGenerate
});
