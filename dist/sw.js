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
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	var _rangeParser = __webpack_require__(1);

	var _rangeParser2 = _interopRequireDefault(_rangeParser);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	// Preloaded files that are only gotten from the cache when offline
	var freshFiles = ['/', '/credits.html', '/js/main.js', '/css/base.css', '/css/checkbox.css', '/css/play-pause.css', '/css/sound.css'];
	var freshFileLookup = lookupFromArray(freshFiles);

	// Preloaded files that are gotten from the cache
	var staticFiles = ['/images/rain_bg.jpg', '/css/comfortaa.woff2', '/icons/weather/campfire.svg', '/icons/weather/crickets.svg', '/icons/weather/drizzle.svg', '/icons/weather/rain.svg', '/icons/weather/wind.svg', '/icons/weather/lightning.svg', '/audio/samples/campfire.ogg', '/audio/samples/crickets.ogg', '/audio/samples/drizzle.ogg', '/audio/samples/rain.ogg', '/audio/samples/wind.ogg', '/audio/samples/lightning.ogg'];

	// File that are gotten from the cache after being requested at least once
	var lazyStaticFiles = ['/audio/full/campfire.ogg', '/audio/full/crickets.ogg', '/audio/full/drizzle.ogg', '/audio/full/rain.ogg', '/audio/full/wind.ogg', '/audio/full/lightning.ogg'];
	var lazyStaticFileLookup = lookupFromArray(lazyStaticFiles);

	self.addEventListener('install', function (e) {
		e.waitUntil(Promise.all([caches.open('fresh_files').then(function (cache) {
			return cache.addAll(freshFiles);
		}), caches.open('static_files').then(function (cache) {
			return cache.addAll(staticFiles);
		})]).then(function () {
			return self.skipWaiting();
		}));
	});

	self.addEventListener('activate', function (e) {
		e.waitUntil(self.clients.claim());
	});

	self.addEventListener('fetch', function (e) {
		// if in the static file cache, return
		var request = e.request;

		var _ref = new URL(request.url);

		var pathname = _ref.pathname;
		var host = _ref.host;

		// Request to another origin

		if (location.host !== host) {
			return e.respondWith(fetch(request));
		}

		// Try to request fresh files every time
		// Fallback to cache
		if (freshFileLookup[pathname]) {
			return e.respondWith(caches.open('fresh_files').then(function (freshCache) {
				return fetch(request.clone()).then(function (response) {
					freshCache.put(request, response.clone());
					return response;
				}, function (fetchErr) {
					return freshCache.match(request);
				});
			}));
		}

		e.respondWith(caches.open('static_files').then(function (staticCache) {
			return staticCache.match(pathname).then(function (response) {
				if (response) {
					var _ret = function () {
						var responseLength = parseInt(response.headers.get('content-length'));
						var range = (0, _rangeParser2.default)(responseLength, request.headers.get('range') || '');
						if (range !== -1 && range !== -2) {
							var _ret2 = function () {
								var firstRange = range[0];
								//console.log('range request?', responseLength, response.headers.get('content-length'), firstRange)
								return {
									v: {
										v: response.blob().then(function (blob) {
											return new Response(blob.slice(firstRange.start, firstRange.end), {
												headers: {
													'Content-Range': 'bytes ' + firstRange.start + '-' + firstRange.end + '/' + responseLength
												}
											});
										})
									}
								};
							}();

							if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
						} else {
							return {
								v: response
							};
						}
						return {
							v: void 0
						};
					}();

					if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
				}

				if (lazyStaticFileLookup[pathname]) {
					//console.log('lazy static file', pathname)
					fetch(pathname).then(function (response) {
						return response.blob();
					}).then(function (blob) {
						//console.log('added to cache as blob', blob.size)
						staticCache.put(pathname, new Response(blob));
					});
				}

				return fetch(request).catch(function (e) {
					console.log('fetch err', e);
				});
			});
		}));
	});

	function lookupFromArray(arr) {
		var r = {};

		for (var i = 0; i < arr.length; i++) {
			var key = arr[i];
			r[key] = true;
		}

		return r;
	}

/***/ },
/* 1 */
/***/ function(module, exports) {

	/*!
	 * range-parser
	 * Copyright(c) 2012-2014 TJ Holowaychuk
	 * MIT Licensed
	 */

	'use strict';

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


/***/ }
/******/ ]);