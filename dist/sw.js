/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };

/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};

/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};

/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_range_parser__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_range_parser___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_range_parser__);
/* harmony export (immutable) */ __webpack_exports__["a"] = handleAndCacheFile;
var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();



var DEFAULT_CHUNK_SIZE = 128 * 1024;

function handleAndCacheFile(request) {
  return ensureFileInfoCached(request.url).then(function (fileInfo) {
    var url = fileInfo.url,
        size = fileInfo.size,
        chunks = fileInfo.chunks;


    var rangeHeader = 'bytes=0-';
    var rangeRequest = false;
    if (request.headers.has('range')) {
      rangeHeader = request.headers.get('range');
      rangeRequest = true;
    }

    var start = void 0,
        end = void 0;
    try {
      var _parseRange = __WEBPACK_IMPORTED_MODULE_0_range_parser___default()(size, rangeHeader);

      var _parseRange2 = _slicedToArray(_parseRange, 1);

      var _parseRange2$ = _parseRange2[0];
      start = _parseRange2$.start;
      end = _parseRange2$.end;
    } catch (e) {
      console.error(e);
      return new Response('Invalid range', { status: 416 });
    }

    return ensureFileRange(url, start, end).then(function (bodyStream) {
      return new Response(bodyStream, {
        status: rangeRequest ? 206 : 200,
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Range': 'bytes ' + start + '-' + end + '/' + size,
          'Content-Length': end - start + 1,
          'Content-Type': 'audio/ogg'
        }
      });
    });
  });
}

// Returns a Promise of a ReadableStream
function ensureFileRange(url, start, end) {
  return ensureFileInfoCached(url).then(function (fileInfo) {
    var size = fileInfo.size,
        chunks = fileInfo.chunks;


    var conversionFactor = chunks.length / size;

    var startChunk = Math.floor(start * conversionFactor);
    var endChunk = Math.ceil(end * conversionFactor);

    var chunksToLoad = chunks.slice(startChunk, endChunk + 1);

    var streamNextChunk = function streamNextChunk(controller) {
      if (chunksToLoad.length === 0) {
        controller.close();
        return;
      }

      var chunkInfo = chunksToLoad.shift();

      return ensureChunkCached(url, chunkInfo).then(function (chunkBuffer) {
        if (chunkInfo.start < start) {
          chunkBuffer = chunkBuffer.slice(start - chunkInfo.start);
        } else if (chunkInfo.end > end) {
          chunkBuffer = chunkBuffer.slice(0, end - chunkInfo.start + 1);
        }

        controller.enqueue(new Uint8Array(chunkBuffer));
      });
    };

    return new ReadableStream({
      start: streamNextChunk,
      pull: streamNextChunk,
      cancel: function cancel() {}
    });
  });
}

function ensureFileInfoCached(url) {
  var chunkSize = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DEFAULT_CHUNK_SIZE;

  var cacheName = '_bs:' + url;

  return existsInCache(cacheName, '/').then(function (exists) {
    if (!exists) {
      return fetchFileInfo(url, chunkSize).then(function (fileInfo) {
        return storeInCache(cacheName, '/', JSON.stringify(fileInfo)).then(function () {
          return fileInfo;
        });
      });
    } else {
      return fetchFromCache(cacheName, '/', 'json');
    }
  });
}

function ensureChunkCached(url, chunkInfo) {
  var cacheName = '_bs:' + url;
  var cachePath = '/' + chunkInfo.index;

  return existsInCache(cacheName, cachePath).then(function (exists) {
    if (!exists) {
      return fetchChunk(url, chunkInfo).then(function (chunkData) {
        return storeInCache(cacheName, cachePath, chunkData);
      });
    } else {
      return fetchFromCache(cacheName, cachePath);
    }
  });
}

function existsInCache(cacheName, cachePath) {
  return caches.open(cacheName).then(function (cache) {
    return cache.match(cachePath);
  }).then(function (res) {
    return !!res;
  });
}

function fetchFromCache(cacheName, cachePath) {
  var type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'arrayBuffer';

  return caches.open(cacheName).then(function (cache) {
    return cache.match(cachePath);
  }).then(function (res) {
    return res[type]();
  });
}

function storeInCache(cacheName, cachePath, data) {
  return caches.open(cacheName).then(function (cache) {
    return cache.put(cachePath, new Response(data));
  }).then(function () {
    return data;
  });
}

function fetchChunk(url, chunkInfo) {
  return fetch(url, {
    headers: {
      Range: 'bytes=' + chunkInfo.start + '-' + chunkInfo.end
    }
  }).then(function (res) {
    return res.arrayBuffer();
  });
}

function fetchFileInfo(url, chunkSize) {
  return fetch(url, {
    method: 'HEAD',
    headers: {
      Range: 'bytes=0-0'
    }
  }).then(function (res) {
    var size = parseInt(res.headers.get('content-range').match(/\d+$/)[0]);

    return {
      url: url,
      size: size,
      chunks: getChunkInfos(size, chunkSize)
    };
  });
}

function getChunkInfos(size, chunkSize) {
  var chunkCount = Math.ceil(size / chunkSize);

  var r = [];

  for (var i = 0; i < chunkCount; i++) {
    var start = i * chunkSize;
    var end = Math.min(start + chunkSize - 1, size - 1);

    r.push({ index: i, start: start, end: end });
  }

  return r;
}

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module) {var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function webpackUniversalModuleDefinition(root, factory) {
    if (( false ? 'undefined' : _typeof(exports)) === 'object' && ( false ? 'undefined' : _typeof(module)) === 'object') module.exports = factory();else if (true) !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') exports["swkit"] = factory();else root["swkit"] = factory();
})(this, function () {
    return (/******/function (modules) {
            // webpackBootstrap
            /******/ // The module cache
            /******/var installedModules = {};

            /******/ // The require function
            /******/function __webpack_require__(moduleId) {

                /******/ // Check if module is in cache
                /******/if (installedModules[moduleId])
                    /******/return installedModules[moduleId].exports;

                /******/ // Create a new module (and put it into the cache)
                /******/var module = installedModules[moduleId] = {
                    /******/i: moduleId,
                    /******/l: false,
                    /******/exports: {}
                    /******/ };

                /******/ // Execute the module function
                /******/modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

                /******/ // Flag the module as loaded
                /******/module.l = true;

                /******/ // Return the exports of the module
                /******/return module.exports;
                /******/
            }

            /******/ // expose the modules object (__webpack_modules__)
            /******/__webpack_require__.m = modules;

            /******/ // expose the module cache
            /******/__webpack_require__.c = installedModules;

            /******/ // identity function for calling harmony imports with the correct context
            /******/__webpack_require__.i = function (value) {
                return value;
            };

            /******/ // define getter function for harmony exports
            /******/__webpack_require__.d = function (exports, name, getter) {
                /******/if (!__webpack_require__.o(exports, name)) {
                    /******/Object.defineProperty(exports, name, {
                        /******/configurable: false,
                        /******/enumerable: true,
                        /******/get: getter
                        /******/ });
                    /******/
                }
                /******/
            };

            /******/ // getDefaultExport function for compatibility with non-harmony modules
            /******/__webpack_require__.n = function (module) {
                /******/var getter = module && module.__esModule ?
                /******/function getDefault() {
                    return module['default'];
                } :
                /******/function getModuleExports() {
                    return module;
                };
                /******/__webpack_require__.d(getter, 'a', getter);
                /******/return getter;
                /******/
            };

            /******/ // Object.prototype.hasOwnProperty.call
            /******/__webpack_require__.o = function (object, property) {
                return Object.prototype.hasOwnProperty.call(object, property);
            };

            /******/ // __webpack_public_path__
            /******/__webpack_require__.p = "";

            /******/ // Load entry module and return exports
            /******/return __webpack_require__(__webpack_require__.s = 9);
            /******/
        }(
        /************************************************************************/
        /******/[
        /* 0 */
        /***/function (module, exports, __webpack_require__) {

            "use strict";

            /** @module route/nodes */

            /**
             * Create a node for use with the parser, giving it a constructor that takes
             * props, children, and returns an object with props, children, and a
             * displayName.
             * @param  {String} displayName The display name for the node
             * @return {{displayName: string, props: Object, children: Array}}
             */

            function createNode(displayName) {
                return function (props, children) {
                    return {
                        displayName: displayName,
                        props: props,
                        children: children || []
                    };
                };
            }

            module.exports = {
                Root: createNode('Root'),
                Concat: createNode('Concat'),
                Literal: createNode('Literal'),
                Splat: createNode('Splat'),
                Param: createNode('Param'),
                Optional: createNode('Optional')
            };

            /***/
        },
        /* 1 */
        /***/function (module, exports, __webpack_require__) {

            "use strict";

            /**
             * @module route/visitors/create_visitor
             */

            var nodeTypes = Object.keys(__webpack_require__(0));

            /**
             * Helper for creating visitors. Take an object of node name to handler
             * mappings, returns an object with a "visit" method that can be called
             * @param  {Object.<string,function(node,context)>} handlers A mapping of node
             * type to visitor functions
             * @return {{visit: function(node,context)}}  A visitor object with a "visit"
             * method that can be called on a node with a context
             */
            function createVisitor(handlers) {
                nodeTypes.forEach(function (nodeType) {
                    if (typeof handlers[nodeType] === 'undefined') {
                        throw new Error('No handler defined for ' + nodeType.displayName);
                    }
                });

                return {
                    /**
                     * Call the given handler for this node type
                     * @param  {Object} node    the AST node
                     * @param  {Object} context context to pass through to handlers
                     * @return {Object}
                     */
                    visit: function visit(node, context) {
                        return this.handlers[node.displayName].call(this, node, context);
                    },
                    handlers: handlers
                };
            }

            module.exports = createVisitor;

            /***/
        },,
        /* 2 */
        /* 3 */
        /***/function (module, exports, __webpack_require__) {

            "use strict";
            /**
             * @module Passage
             */

            var Route = __webpack_require__(4);

            module.exports = Route;

            /***/
        },
        /* 4 */
        /***/function (module, exports, __webpack_require__) {

            "use strict";

            var Parser = __webpack_require__(6),
                RegexpVisitor = __webpack_require__(7),
                ReverseVisitor = __webpack_require__(8);

            Route.prototype = Object.create(null);

            /**
             * Match a path against this route, returning the matched parameters if
             * it matches, false if not.
             * @example
             * var route = new Route('/this/is/my/route')
             * route.match('/this/is/my/route') // -> {}
             * @example
             * var route = new Route('/:one/:two')
             * route.match('/foo/bar/') // -> {one: 'foo', two: 'bar'}
             * @param  {string} path the path to match this route against
             * @return {(Object.<string,string>|false)} A map of the matched route
             * parameters, or false if matching failed
             */
            Route.prototype.match = function (path) {
                var re = RegexpVisitor.visit(this.ast),
                    matched = re.match(path);

                return matched ? matched : false;
            };

            /**
             * Reverse a route specification to a path, returning false if it can't be
             * fulfilled
             * @example
             * var route = new Route('/:one/:two')
             * route.reverse({one: 'foo', two: 'bar'}) -> '/foo/bar'
             * @param  {Object} params The parameters to fill in
             * @return {(String|false)} The filled in path
             */
            Route.prototype.reverse = function (params) {
                return ReverseVisitor.visit(this.ast, params);
            };

            /**
             * Represents a route
             * @example
             * var route = Route('/:foo/:bar');
             * @example
             * var route = Route('/:foo/:bar');
             * @param {string} spec -  the string specification of the route.
             *     use :param for single portion captures, *param for splat style captures,
             *     and () for optional route branches
             * @constructor
             */
            function Route(spec) {
                var route;
                if (this) {
                    // constructor called with new
                    route = this;
                } else {
                    // constructor called as a function
                    route = Object.create(Route.prototype);
                }
                if (typeof spec === 'undefined') {
                    throw new Error('A route spec is required');
                }
                route.spec = spec;
                route.ast = Parser.parse(spec);
                return route;
            }

            module.exports = Route;

            /***/
        },
        /* 5 */
        /***/function (module, exports, __webpack_require__) {

            /* parser generated by jison 0.4.17 */
            /*
              Returns a Parser object of the following structure:
            
              Parser: {
                yy: {}
              }
            
              Parser.prototype: {
                yy: {},
                trace: function(),
                symbols_: {associative list: name ==> number},
                terminals_: {associative list: number ==> name},
                productions_: [...],
                performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
                table: [...],
                defaultActions: {...},
                parseError: function(str, hash),
                parse: function(input),
            
                lexer: {
                    EOF: 1,
                    parseError: function(str, hash),
                    setInput: function(input),
                    input: function(),
                    unput: function(str),
                    more: function(),
                    less: function(n),
                    pastInput: function(),
                    upcomingInput: function(),
                    showPosition: function(),
                    test_match: function(regex_match_array, rule_index),
                    next: function(),
                    lex: function(),
                    begin: function(condition),
                    popState: function(),
                    _currentRules: function(),
                    topState: function(),
                    pushState: function(condition),
            
                    options: {
                        ranges: boolean           (optional: true ==> token location info will include a .range[] member)
                        flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
                        backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
                    },
            
                    performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
                    rules: [...],
                    conditions: {associative list: name ==> set},
                }
              }
            
            
              token location info (@$, _$, etc.): {
                first_line: n,
                last_line: n,
                first_column: n,
                last_column: n,
                range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
              }
            
            
              the parseError function receives a 'hash' object with these members for lexer and parser errors: {
                text:        (matched text)
                token:       (the produced terminal token, if any)
                line:        (yylineno)
              }
              while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
                loc:         (yylloc)
                expected:    (string describing the set of expected tokens)
                recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
              }
            */
            var parser = function () {
                var o = function o(k, v, _o, l) {
                    for (_o = _o || {}, l = k.length; l--; _o[k[l]] = v) {}return _o;
                },
                    $V0 = [1, 9],
                    $V1 = [1, 10],
                    $V2 = [1, 11],
                    $V3 = [1, 12],
                    $V4 = [5, 11, 12, 13, 14, 15];
                var parser = { trace: function trace() {},
                    yy: {},
                    symbols_: { "error": 2, "root": 3, "expressions": 4, "EOF": 5, "expression": 6, "optional": 7, "literal": 8, "splat": 9, "param": 10, "(": 11, ")": 12, "LITERAL": 13, "SPLAT": 14, "PARAM": 15, "$accept": 0, "$end": 1 },
                    terminals_: { 2: "error", 5: "EOF", 11: "(", 12: ")", 13: "LITERAL", 14: "SPLAT", 15: "PARAM" },
                    productions_: [0, [3, 2], [3, 1], [4, 2], [4, 1], [6, 1], [6, 1], [6, 1], [6, 1], [7, 3], [8, 1], [9, 1], [10, 1]],
                    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
                        /* this == yyval */

                        var $0 = $$.length - 1;
                        switch (yystate) {
                            case 1:
                                return new yy.Root({}, [$$[$0 - 1]]);
                                break;
                            case 2:
                                return new yy.Root({}, [new yy.Literal({ value: '' })]);
                                break;
                            case 3:
                                this.$ = new yy.Concat({}, [$$[$0 - 1], $$[$0]]);
                                break;
                            case 4:case 5:
                                this.$ = $$[$0];
                                break;
                            case 6:
                                this.$ = new yy.Literal({ value: $$[$0] });
                                break;
                            case 7:
                                this.$ = new yy.Splat({ name: $$[$0] });
                                break;
                            case 8:
                                this.$ = new yy.Param({ name: $$[$0] });
                                break;
                            case 9:
                                this.$ = new yy.Optional({}, [$$[$0 - 1]]);
                                break;
                            case 10:
                                this.$ = yytext;
                                break;
                            case 11:case 12:
                                this.$ = yytext.slice(1);
                                break;
                        }
                    },
                    table: [{ 3: 1, 4: 2, 5: [1, 3], 6: 4, 7: 5, 8: 6, 9: 7, 10: 8, 11: $V0, 13: $V1, 14: $V2, 15: $V3 }, { 1: [3] }, { 5: [1, 13], 6: 14, 7: 5, 8: 6, 9: 7, 10: 8, 11: $V0, 13: $V1, 14: $V2, 15: $V3 }, { 1: [2, 2] }, o($V4, [2, 4]), o($V4, [2, 5]), o($V4, [2, 6]), o($V4, [2, 7]), o($V4, [2, 8]), { 4: 15, 6: 4, 7: 5, 8: 6, 9: 7, 10: 8, 11: $V0, 13: $V1, 14: $V2, 15: $V3 }, o($V4, [2, 10]), o($V4, [2, 11]), o($V4, [2, 12]), { 1: [2, 1] }, o($V4, [2, 3]), { 6: 14, 7: 5, 8: 6, 9: 7, 10: 8, 11: $V0, 12: [1, 16], 13: $V1, 14: $V2, 15: $V3 }, o($V4, [2, 9])],
                    defaultActions: { 3: [2, 2], 13: [2, 1] },
                    parseError: function parseError(str, hash) {
                        if (hash.recoverable) {
                            this.trace(str);
                        } else {
                            var _parseError = function _parseError(msg, hash) {
                                this.message = msg;
                                this.hash = hash;
                            };

                            _parseError.prototype = Error;

                            throw new _parseError(str, hash);
                        }
                    },
                    parse: function parse(input) {
                        var self = this,
                            stack = [0],
                            tstack = [],
                            vstack = [null],
                            lstack = [],
                            table = this.table,
                            yytext = '',
                            yylineno = 0,
                            yyleng = 0,
                            recovering = 0,
                            TERROR = 2,
                            EOF = 1;
                        var args = lstack.slice.call(arguments, 1);
                        var lexer = Object.create(this.lexer);
                        var sharedState = { yy: {} };
                        for (var k in this.yy) {
                            if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
                                sharedState.yy[k] = this.yy[k];
                            }
                        }
                        lexer.setInput(input, sharedState.yy);
                        sharedState.yy.lexer = lexer;
                        sharedState.yy.parser = this;
                        if (typeof lexer.yylloc == 'undefined') {
                            lexer.yylloc = {};
                        }
                        var yyloc = lexer.yylloc;
                        lstack.push(yyloc);
                        var ranges = lexer.options && lexer.options.ranges;
                        if (typeof sharedState.yy.parseError === 'function') {
                            this.parseError = sharedState.yy.parseError;
                        } else {
                            this.parseError = Object.getPrototypeOf(this).parseError;
                        }
                        function popStack(n) {
                            stack.length = stack.length - 2 * n;
                            vstack.length = vstack.length - n;
                            lstack.length = lstack.length - n;
                        }
                        _token_stack: var lex = function lex() {
                            var token;
                            token = lexer.lex() || EOF;
                            if (typeof token !== 'number') {
                                token = self.symbols_[token] || token;
                            }
                            return token;
                        };
                        var symbol,
                            preErrorSymbol,
                            state,
                            action,
                            a,
                            r,
                            yyval = {},
                            p,
                            len,
                            newState,
                            expected;
                        while (true) {
                            state = stack[stack.length - 1];
                            if (this.defaultActions[state]) {
                                action = this.defaultActions[state];
                            } else {
                                if (symbol === null || typeof symbol == 'undefined') {
                                    symbol = lex();
                                }
                                action = table[state] && table[state][symbol];
                            }
                            if (typeof action === 'undefined' || !action.length || !action[0]) {
                                var errStr = '';
                                expected = [];
                                for (p in table[state]) {
                                    if (this.terminals_[p] && p > TERROR) {
                                        expected.push('\'' + this.terminals_[p] + '\'');
                                    }
                                }
                                if (lexer.showPosition) {
                                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                                } else {
                                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                                }
                                this.parseError(errStr, {
                                    text: lexer.match,
                                    token: this.terminals_[symbol] || symbol,
                                    line: lexer.yylineno,
                                    loc: yyloc,
                                    expected: expected
                                });
                            }
                            if (action[0] instanceof Array && action.length > 1) {
                                throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
                            }
                            switch (action[0]) {
                                case 1:
                                    stack.push(symbol);
                                    vstack.push(lexer.yytext);
                                    lstack.push(lexer.yylloc);
                                    stack.push(action[1]);
                                    symbol = null;
                                    if (!preErrorSymbol) {
                                        yyleng = lexer.yyleng;
                                        yytext = lexer.yytext;
                                        yylineno = lexer.yylineno;
                                        yyloc = lexer.yylloc;
                                        if (recovering > 0) {
                                            recovering--;
                                        }
                                    } else {
                                        symbol = preErrorSymbol;
                                        preErrorSymbol = null;
                                    }
                                    break;
                                case 2:
                                    len = this.productions_[action[1]][1];
                                    yyval.$ = vstack[vstack.length - len];
                                    yyval._$ = {
                                        first_line: lstack[lstack.length - (len || 1)].first_line,
                                        last_line: lstack[lstack.length - 1].last_line,
                                        first_column: lstack[lstack.length - (len || 1)].first_column,
                                        last_column: lstack[lstack.length - 1].last_column
                                    };
                                    if (ranges) {
                                        yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
                                    }
                                    r = this.performAction.apply(yyval, [yytext, yyleng, yylineno, sharedState.yy, action[1], vstack, lstack].concat(args));
                                    if (typeof r !== 'undefined') {
                                        return r;
                                    }
                                    if (len) {
                                        stack = stack.slice(0, -1 * len * 2);
                                        vstack = vstack.slice(0, -1 * len);
                                        lstack = lstack.slice(0, -1 * len);
                                    }
                                    stack.push(this.productions_[action[1]][0]);
                                    vstack.push(yyval.$);
                                    lstack.push(yyval._$);
                                    newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
                                    stack.push(newState);
                                    break;
                                case 3:
                                    return true;
                            }
                        }
                        return true;
                    } };
                /* generated by jison-lex 0.3.4 */
                var lexer = function () {
                    var lexer = {

                        EOF: 1,

                        parseError: function parseError(str, hash) {
                            if (this.yy.parser) {
                                this.yy.parser.parseError(str, hash);
                            } else {
                                throw new Error(str);
                            }
                        },

                        // resets the lexer, sets new input
                        setInput: function setInput(input, yy) {
                            this.yy = yy || this.yy || {};
                            this._input = input;
                            this._more = this._backtrack = this.done = false;
                            this.yylineno = this.yyleng = 0;
                            this.yytext = this.matched = this.match = '';
                            this.conditionStack = ['INITIAL'];
                            this.yylloc = {
                                first_line: 1,
                                first_column: 0,
                                last_line: 1,
                                last_column: 0
                            };
                            if (this.options.ranges) {
                                this.yylloc.range = [0, 0];
                            }
                            this.offset = 0;
                            return this;
                        },

                        // consumes and returns one char from the input
                        input: function input() {
                            var ch = this._input[0];
                            this.yytext += ch;
                            this.yyleng++;
                            this.offset++;
                            this.match += ch;
                            this.matched += ch;
                            var lines = ch.match(/(?:\r\n?|\n).*/g);
                            if (lines) {
                                this.yylineno++;
                                this.yylloc.last_line++;
                            } else {
                                this.yylloc.last_column++;
                            }
                            if (this.options.ranges) {
                                this.yylloc.range[1]++;
                            }

                            this._input = this._input.slice(1);
                            return ch;
                        },

                        // unshifts one char (or a string) into the input
                        unput: function unput(ch) {
                            var len = ch.length;
                            var lines = ch.split(/(?:\r\n?|\n)/g);

                            this._input = ch + this._input;
                            this.yytext = this.yytext.substr(0, this.yytext.length - len);
                            //this.yyleng -= len;
                            this.offset -= len;
                            var oldLines = this.match.split(/(?:\r\n?|\n)/g);
                            this.match = this.match.substr(0, this.match.length - 1);
                            this.matched = this.matched.substr(0, this.matched.length - 1);

                            if (lines.length - 1) {
                                this.yylineno -= lines.length - 1;
                            }
                            var r = this.yylloc.range;

                            this.yylloc = {
                                first_line: this.yylloc.first_line,
                                last_line: this.yylineno + 1,
                                first_column: this.yylloc.first_column,
                                last_column: lines ? (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length : this.yylloc.first_column - len
                            };

                            if (this.options.ranges) {
                                this.yylloc.range = [r[0], r[0] + this.yyleng - len];
                            }
                            this.yyleng = this.yytext.length;
                            return this;
                        },

                        // When called from action, caches matched text and appends it on next action
                        more: function more() {
                            this._more = true;
                            return this;
                        },

                        // When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
                        reject: function reject() {
                            if (this.options.backtrack_lexer) {
                                this._backtrack = true;
                            } else {
                                return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                                    text: "",
                                    token: null,
                                    line: this.yylineno
                                });
                            }
                            return this;
                        },

                        // retain first n characters of the match
                        less: function less(n) {
                            this.unput(this.match.slice(n));
                        },

                        // displays already matched input, i.e. for error messages
                        pastInput: function pastInput() {
                            var past = this.matched.substr(0, this.matched.length - this.match.length);
                            return (past.length > 20 ? '...' : '') + past.substr(-20).replace(/\n/g, "");
                        },

                        // displays upcoming input, i.e. for error messages
                        upcomingInput: function upcomingInput() {
                            var next = this.match;
                            if (next.length < 20) {
                                next += this._input.substr(0, 20 - next.length);
                            }
                            return (next.substr(0, 20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
                        },

                        // displays the character position where the lexing error occurred, i.e. for error messages
                        showPosition: function showPosition() {
                            var pre = this.pastInput();
                            var c = new Array(pre.length + 1).join("-");
                            return pre + this.upcomingInput() + "\n" + c + "^";
                        },

                        // test the lexed token: return FALSE when not a match, otherwise return token
                        test_match: function test_match(match, indexed_rule) {
                            var token, lines, backup;

                            if (this.options.backtrack_lexer) {
                                // save context
                                backup = {
                                    yylineno: this.yylineno,
                                    yylloc: {
                                        first_line: this.yylloc.first_line,
                                        last_line: this.last_line,
                                        first_column: this.yylloc.first_column,
                                        last_column: this.yylloc.last_column
                                    },
                                    yytext: this.yytext,
                                    match: this.match,
                                    matches: this.matches,
                                    matched: this.matched,
                                    yyleng: this.yyleng,
                                    offset: this.offset,
                                    _more: this._more,
                                    _input: this._input,
                                    yy: this.yy,
                                    conditionStack: this.conditionStack.slice(0),
                                    done: this.done
                                };
                                if (this.options.ranges) {
                                    backup.yylloc.range = this.yylloc.range.slice(0);
                                }
                            }

                            lines = match[0].match(/(?:\r\n?|\n).*/g);
                            if (lines) {
                                this.yylineno += lines.length;
                            }
                            this.yylloc = {
                                first_line: this.yylloc.last_line,
                                last_line: this.yylineno + 1,
                                first_column: this.yylloc.last_column,
                                last_column: lines ? lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length
                            };
                            this.yytext += match[0];
                            this.match += match[0];
                            this.matches = match;
                            this.yyleng = this.yytext.length;
                            if (this.options.ranges) {
                                this.yylloc.range = [this.offset, this.offset += this.yyleng];
                            }
                            this._more = false;
                            this._backtrack = false;
                            this._input = this._input.slice(match[0].length);
                            this.matched += match[0];
                            token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
                            if (this.done && this._input) {
                                this.done = false;
                            }
                            if (token) {
                                return token;
                            } else if (this._backtrack) {
                                // recover context
                                for (var k in backup) {
                                    this[k] = backup[k];
                                }
                                return false; // rule action called reject() implying the next rule should be tested instead.
                            }
                            return false;
                        },

                        // return next match in input
                        next: function next() {
                            if (this.done) {
                                return this.EOF;
                            }
                            if (!this._input) {
                                this.done = true;
                            }

                            var token, match, tempMatch, index;
                            if (!this._more) {
                                this.yytext = '';
                                this.match = '';
                            }
                            var rules = this._currentRules();
                            for (var i = 0; i < rules.length; i++) {
                                tempMatch = this._input.match(this.rules[rules[i]]);
                                if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                                    match = tempMatch;
                                    index = i;
                                    if (this.options.backtrack_lexer) {
                                        token = this.test_match(tempMatch, rules[i]);
                                        if (token !== false) {
                                            return token;
                                        } else if (this._backtrack) {
                                            match = false;
                                            continue; // rule action called reject() implying a rule MISmatch.
                                        } else {
                                            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                                            return false;
                                        }
                                    } else if (!this.options.flex) {
                                        break;
                                    }
                                }
                            }
                            if (match) {
                                token = this.test_match(match, rules[index]);
                                if (token !== false) {
                                    return token;
                                }
                                // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                                return false;
                            }
                            if (this._input === "") {
                                return this.EOF;
                            } else {
                                return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                                    text: "",
                                    token: null,
                                    line: this.yylineno
                                });
                            }
                        },

                        // return next match that has a token
                        lex: function lex() {
                            var r = this.next();
                            if (r) {
                                return r;
                            } else {
                                return this.lex();
                            }
                        },

                        // activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
                        begin: function begin(condition) {
                            this.conditionStack.push(condition);
                        },

                        // pop the previously active lexer condition state off the condition stack
                        popState: function popState() {
                            var n = this.conditionStack.length - 1;
                            if (n > 0) {
                                return this.conditionStack.pop();
                            } else {
                                return this.conditionStack[0];
                            }
                        },

                        // produce the lexer rule set which is active for the currently active lexer condition state
                        _currentRules: function _currentRules() {
                            if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
                                return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
                            } else {
                                return this.conditions["INITIAL"].rules;
                            }
                        },

                        // return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
                        topState: function topState(n) {
                            n = this.conditionStack.length - 1 - Math.abs(n || 0);
                            if (n >= 0) {
                                return this.conditionStack[n];
                            } else {
                                return "INITIAL";
                            }
                        },

                        // alias for begin(condition)
                        pushState: function pushState(condition) {
                            this.begin(condition);
                        },

                        // return the number of states currently on the stack
                        stateStackSize: function stateStackSize() {
                            return this.conditionStack.length;
                        },
                        options: {},
                        performAction: function anonymous(yy, yy_, $avoiding_name_collisions, YY_START) {
                            var YYSTATE = YY_START;
                            switch ($avoiding_name_collisions) {
                                case 0:
                                    return "(";
                                    break;
                                case 1:
                                    return ")";
                                    break;
                                case 2:
                                    return "SPLAT";
                                    break;
                                case 3:
                                    return "PARAM";
                                    break;
                                case 4:
                                    return "LITERAL";
                                    break;
                                case 5:
                                    return "LITERAL";
                                    break;
                                case 6:
                                    return "EOF";
                                    break;
                            }
                        },
                        rules: [/^(?:\()/, /^(?:\))/, /^(?:\*+\w+)/, /^(?::+\w+)/, /^(?:[\w%\-~\n]+)/, /^(?:.)/, /^(?:$)/],
                        conditions: { "INITIAL": { "rules": [0, 1, 2, 3, 4, 5, 6], "inclusive": true } }
                    };
                    return lexer;
                }();
                parser.lexer = lexer;
                function Parser() {
                    this.yy = {};
                }
                Parser.prototype = parser;parser.Parser = Parser;
                return new Parser();
            }();

            if (true) {
                exports.parser = parser;
                exports.Parser = parser.Parser;
                exports.parse = function () {
                    return parser.parse.apply(parser, arguments);
                };
            }

            /***/
        },
        /* 6 */
        /***/function (module, exports, __webpack_require__) {

            "use strict";
            /**
             * @module route/parser
             */

            /** Wrap the compiled parser with the context to create node objects */

            var parser = __webpack_require__(5).parser;
            parser.yy = __webpack_require__(0);
            module.exports = parser;

            /***/
        },
        /* 7 */
        /***/function (module, exports, __webpack_require__) {

            "use strict";

            var createVisitor = __webpack_require__(1),
                escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;

            /**
             * @class
             * @private
             */
            function Matcher(options) {
                this.captures = options.captures;
                this.re = options.re;
            }

            /**
             * Try matching a path against the generated regular expression
             * @param  {String} path The path to try to match
             * @return {Object|false}      matched parameters or false
             */
            Matcher.prototype.match = function (path) {
                var match = this.re.exec(path),
                    matchParams = {};

                if (!match) {
                    return;
                }

                this.captures.forEach(function (capture, i) {
                    if (typeof match[i + 1] === 'undefined') {
                        matchParams[capture] = undefined;
                    } else {
                        matchParams[capture] = decodeURIComponent(match[i + 1]);
                    }
                });

                return matchParams;
            };

            /**
             * Visitor for the AST to create a regular expression matcher
             * @class RegexpVisitor
             * @borrows Visitor-visit
             */
            var RegexpVisitor = createVisitor({
                'Concat': function Concat(node) {
                    return node.children.reduce(function (memo, child) {
                        var childResult = this.visit(child);
                        return {
                            re: memo.re + childResult.re,
                            captures: memo.captures.concat(childResult.captures)
                        };
                    }.bind(this), { re: '', captures: [] });
                },
                'Literal': function Literal(node) {
                    return {
                        re: node.props.value.replace(escapeRegExp, '\\$&'),
                        captures: []
                    };
                },

                'Splat': function Splat(node) {
                    return {
                        re: '([^?]*?)',
                        captures: [node.props.name]
                    };
                },

                'Param': function Param(node) {
                    return {
                        re: '([^\\/\\?]+)',
                        captures: [node.props.name]
                    };
                },

                'Optional': function Optional(node) {
                    var child = this.visit(node.children[0]);
                    return {
                        re: '(?:' + child.re + ')?',
                        captures: child.captures
                    };
                },

                'Root': function Root(node) {
                    var childResult = this.visit(node.children[0]);
                    return new Matcher({
                        re: new RegExp('^' + childResult.re + '(?=\\?|$)'),
                        captures: childResult.captures
                    });
                }
            });

            module.exports = RegexpVisitor;

            /***/
        },
        /* 8 */
        /***/function (module, exports, __webpack_require__) {

            "use strict";

            var createVisitor = __webpack_require__(1);

            /**
             * Visitor for the AST to construct a path with filled in parameters
             * @class ReverseVisitor
             * @borrows Visitor-visit
             */
            var ReverseVisitor = createVisitor({
                'Concat': function Concat(node, context) {
                    var childResults = node.children.map(function (child) {
                        return this.visit(child, context);
                    }.bind(this));

                    if (childResults.some(function (c) {
                        return c === false;
                    })) {
                        return false;
                    } else {
                        return childResults.join('');
                    }
                },

                'Literal': function Literal(node) {
                    return decodeURI(node.props.value);
                },

                'Splat': function Splat(node, context) {
                    if (context[node.props.name]) {
                        return context[node.props.name];
                    } else {
                        return false;
                    }
                },

                'Param': function Param(node, context) {
                    if (context[node.props.name]) {
                        return context[node.props.name];
                    } else {
                        return false;
                    }
                },

                'Optional': function Optional(node, context) {
                    var childResult = this.visit(node.children[0], context);
                    if (childResult) {
                        return childResult;
                    } else {
                        return '';
                    }
                },

                'Root': function Root(node, context) {
                    context = context || {};
                    var childResult = this.visit(node.children[0], context);
                    if (!childResult) {
                        return false;
                    }
                    return encodeURI(childResult);
                }
            });

            module.exports = ReverseVisitor;

            /***/
        },
        /* 9 */
        /***/function (module, __webpack_exports__, __webpack_require__) {

            "use strict";

            Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
            /* harmony import */var __WEBPACK_IMPORTED_MODULE_0_route_parser__ = __webpack_require__(3);
            /* harmony import */var __WEBPACK_IMPORTED_MODULE_0_route_parser___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_route_parser__);
            /* harmony export (immutable) */__webpack_exports__["on"] = on;
            /* harmony export (immutable) */__webpack_exports__["cacheAll"] = cacheAll;
            /* harmony export (immutable) */__webpack_exports__["put"] = put;
            /* harmony export (immutable) */__webpack_exports__["matchCache"] = matchCache;
            /* harmony export (immutable) */__webpack_exports__["matchCaches"] = matchCaches;
            /* harmony export (immutable) */__webpack_exports__["networkFirst"] = networkFirst;
            /* harmony export (immutable) */__webpack_exports__["cacheFirst"] = cacheFirst;
            /* harmony export (immutable) */__webpack_exports__["ensureCached"] = ensureCached;
            /* harmony export (immutable) */__webpack_exports__["createRouter"] = createRouter;
            var _createClass = function () {
                function defineProperties(target, props) {
                    for (var i = 0; i < props.length; i++) {
                        var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
                    }
                }return function (Constructor, protoProps, staticProps) {
                    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
                };
            }();

            function _classCallCheck(instance, Constructor) {
                if (!(instance instanceof Constructor)) {
                    throw new TypeError("Cannot call a class as a function");
                }
            }

            function on(eventName, handler, options) {
                return addEventListener(eventName, handler, options);
            }

            function cacheAll(cacheName, urls) {
                return caches.open(cacheName).then(function (cache) {
                    return cache.addAll(urls);
                });
            }

            function put(cacheName, req, res) {
                return caches.open(cacheName).then(function (cache) {
                    return cache.put(req, res);
                });
            }

            function matchCache(cacheName, req) {
                return caches.open(cacheName).then(function (cache) {
                    return cache.match(req);
                });
            }

            function matchCaches(cacheNames, request) {
                var tryMatch = function tryMatch(index) {
                    return matchCache(cacheNames[index], request).then(function (res) {
                        if (res) return res;
                        if (index + 1 >= cacheNames.length) return Promise.resolve(null);
                        return tryMatch(index + 1);
                    });
                };

                return tryMatch(0);
            }

            function networkFirst(cacheName) {
                return function (request, params) {
                    return fetchAndStore(request, cacheName).catch(function () {
                        return matchCache(cacheName, request);
                    });
                };
            }

            function cacheFirst(cacheName) {
                return function (request, params) {
                    return matchCache(cacheName, request).then(function (res) {
                        if (res) {
                            fetchAndStore(request, cacheName);
                            return res;
                        } else {
                            return fetchAndStore(request, cacheName);
                        }
                    });
                };
            }

            function ensureCached(cacheName) {
                return function (request, params) {
                    return matchCache(cacheName, request).then(function (res) {
                        if (res) {
                            return res;
                        } else {
                            return fetchAndStore(request, cacheName);
                        }
                    });
                };
            }

            function fetchAndStore(request, cacheName) {
                request = new Request(request.url, {
                    method: request.method,
                    headers: request.headers,
                    mode: 'same-origin'
                });

                return fetch(request, {
                    headers: {
                        'Cache-Control': 'no-cache'
                    }
                }).then(function (res) {
                    return put(cacheName, request, res.clone()).then(function () {
                        return res;
                    });
                });
            }

            function getHeaders(headers) {
                var r = '';
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = headers.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var entry = _step.value;

                        r += entry.toString() + '\n';
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }

                return r;
            }

            var Router = function () {
                function Router() {
                    _classCallCheck(this, Router);

                    this.routes = [];

                    this.dispatch = this.dispatch.bind(this);
                }

                _createClass(Router, [{
                    key: 'get',
                    value: function get(path, handler) {
                        var route = new __WEBPACK_IMPORTED_MODULE_0_route_parser___default.a(path);
                        this.routes.push({ route: route, handler: handler });
                    }
                }, {
                    key: 'dispatch',
                    value: function dispatch(e) {
                        var request = e.request;

                        var url = new URL(request.url);

                        if (url.origin === location.origin) {
                            for (var i = 0; i < this.routes.length; i++) {
                                var _routes$i = this.routes[i],
                                    route = _routes$i.route,
                                    handler = _routes$i.handler;

                                var params = route.match(url.pathname);
                                if (!params) continue;

                                var res = handler(request, params);
                                if (res instanceof Response) {
                                    e.respondWith(Promise.resolve(res));
                                    return;
                                } else if (res instanceof Promise) {
                                    e.respondWith(res);
                                    return;
                                } else {
                                    console.error('Error handling ' + request.url);
                                    throw new Error('Invalid handler response. Must be instance of Response or Promise.');
                                }
                            }
                        }
                    }
                }]);

                return Router;
            }();

            function createRouter() {
                return new Router();
            }

            /***/
        }])
    );
});
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)(module)))

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*!
 * range-parser
 * Copyright(c) 2012-2014 TJ Holowaychuk
 * MIT Licensed
 */



/**
 * Module exports.
 * @public
 */

module.exports = rangeParser;

/**
 * Parse "Range" header `str` relative to the given file `size`.
 *
 * @param {Number} size
 * @param {String} str
 * @return {Array}
 * @public
 */

function rangeParser(size, str) {
  var valid = true;
  var i = str.indexOf('=');

  if (-1 == i) return -2;

  var arr = str.slice(i + 1).split(',').map(function(range){
    var range = range.split('-')
      , start = parseInt(range[0], 10)
      , end = parseInt(range[1], 10);

    // -nnn
    if (isNaN(start)) {
      start = size - end;
      end = size - 1;
    // nnn-
    } else if (isNaN(end)) {
      end = size - 1;
    }

    // limit last-byte-pos to current length
    if (end > size - 1) end = size - 1;

    // invalid
    if (isNaN(start)
      || isNaN(end)
      || start > end
      || start < 0) valid = false;

    return {
      start: start,
      end: end
    };
  });

  arr.type = str.slice(0, i);

  return valid ? arr : -1;
}


/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = function(module) {
	if(!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if(!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_swkit__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_swkit___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_swkit__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__file_cache__ = __webpack_require__(0);



var router = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_swkit__["createRouter"])();

var precacheCacheFirst = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_swkit__["cacheFirst"])('precache_rainapp');

var precachePaths = ['/', '/credits.html', '/js/main.js', '/css/base.css', '/css/checkbox.css', '/css/play-pause.css', '/css/sound.css', '/images/rain_bg.jpg', '/css/comfortaa.woff2'];

precachePaths.forEach(function (path) {
  router.get(path, precacheCacheFirst);
});

var staticCache = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_swkit__["ensureCached"])('precache_rainapp');

var staticPaths = ['/icons/weather/campfire.svg', '/icons/weather/crickets.svg', '/icons/weather/drizzle.svg', '/icons/weather/rain.svg', '/icons/weather/wind.svg', '/icons/weather/lightning.svg', '/audio/samples/campfire.ogg', '/audio/samples/crickets.ogg', '/audio/samples/drizzle.ogg', '/audio/samples/rain.ogg', '/audio/samples/wind.ogg', '/audio/samples/lightning.ogg'];

staticPaths.forEach(function (path) {
  router.get(path, staticCache);
});

var lazyStaticFiles = ['/audio/full/campfire.ogg', '/audio/full/crickets.ogg', '/audio/full/drizzle.ogg', '/audio/full/rain.ogg', '/audio/full/wind.ogg', '/audio/full/lightning.ogg'];

lazyStaticFiles.forEach(function (path) {
  router.get(path, __WEBPACK_IMPORTED_MODULE_1__file_cache__["a" /* handleAndCacheFile */]);
});

__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_swkit__["on"])('fetch', router.dispatch);

__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_swkit__["on"])('install', function (e) {
  e.waitUntil(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_swkit__["cacheAll"])('precache_rainapp', precachePaths).then(skipWaiting()));
});

__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_swkit__["on"])('activate', function (e) {
  e.waitUntil(clients.claim());
});

/***/ })
/******/ ]);