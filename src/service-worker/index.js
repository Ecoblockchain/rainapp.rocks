import {
  on,
  cacheAll,
  createRouter,
  cacheFirst
} from 'swkit';
import {handleAndCacheFile} from './file-cache';


const router = createRouter();


const precacheCacheFirst = cacheFirst('precache_rainapp');

const precachePaths = [
  '/',
  '/credits.html',
  '/js/main.js',
  '/css/base.css',
  '/css/checkbox.css',
  '/css/play-pause.css',
  '/css/sound.css',

  '/images/rain_bg.jpg',
  '/css/comfortaa.woff2',

  '/icons/weather/campfire.svg',
  '/icons/weather/crickets.svg',
  '/icons/weather/drizzle.svg',
  '/icons/weather/rain.svg',
  '/icons/weather/wind.svg',
  '/icons/weather/lightning.svg',

  '/audio/samples/campfire.ogg',
  '/audio/samples/crickets.ogg',
  '/audio/samples/drizzle.ogg',
  '/audio/samples/rain.ogg',
  '/audio/samples/wind.ogg',
  '/audio/samples/lightning.ogg'
];

precachePaths.forEach(path => {
  router.get(path, precacheCacheFirst);
});


const lazyStaticFiles = [
  '/audio/full/campfire.ogg',
  '/audio/full/crickets.ogg',
  '/audio/full/drizzle.ogg',
  '/audio/full/rain.ogg',
  '/audio/full/wind.ogg',
  '/audio/full/lightning.ogg'
];

lazyStaticFiles.forEach(path => {
  router.get(path, handleAndCacheFile);
});


on('fetch', router.dispatch);

on('install', e => {
  e.waitUntil(
    cacheAll('precache_rainapp', precachePaths)
      .then(skipWaiting())
  );
});

on('activate', e => {
  e.waitUntil(clients.claim());
});
