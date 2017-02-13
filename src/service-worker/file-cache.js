import parseRange from 'range-parser';


const DEFAULT_CHUNK_SIZE = 128 * 1024;


export function handleAndCacheFile(request) {
  return ensureFileInfoCached(request.url, DEFAULT_CHUNK_SIZE)
    .then(fileInfo => {
      const {url, size, chunks} = fileInfo;

      const [{start, end}] = parseRange(size, request.headers.range || 'bytes=0-');

      const conversionFactor = chunks.length / size;

      const startChunk = Math.floor(start * conversionFactor);
      const endChunk = Math.ceil(end * conversionFactor);

      const chunksToLoad = chunks.slice(startChunk, endChunk + 1);

      const chunkLoaders = chunksToLoad.map(chunkInfo => () => ensureChunkCached(url, chunkInfo));

      let bufferOffset = 0;
      const buffer = new Uint8Array(end - start + 1);

      console.log('buffer size', buffer.length);

      return series(chunkLoaders, (chunk, i) => {
        const chunkInfo = chunksToLoad[i];

        if(chunkInfo.start < start) {
          chunk = chunk.slice(start - chunkInfo.start);
        } else if(chunkInfo.end > end) {
          chunk = chunk.slice(0, end - chunkInfo.start + 1);
        }

        buffer.set(chunk, bufferOffset);
        bufferOffset += chunk.byteLength;
      })
        .then(() => new Response(buffer.buffer, {
          headers: {
            'Accept-Ranges': 'bytes',
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Content-Length': buffer.buffer.byteLength
          }
        }));
    });
}


function ensureFileInfoCached(url, chunkSize) {
  const cacheName = '_bs:' + url;

  return existsInCache(cacheName, '/')
    .then(exists => {
      if(!exists) {
        return fetchFileInfo(url, chunkSize)
          .then(fileInfo => storeInCache(cacheName, '/', JSON.stringify(fileInfo)));
      } else {
        return fetchFromCache(cacheName, '/', 'json');
      }
    });
}

function ensureChunkCached(url, chunkInfo) {
  const cacheName = '_bs:' + url;
  const cachePath = '/' + chunkInfo.index;

  return existsInCache(cacheName, cachePath)
    .then(exists => {
      if(!exists) {
        return fetchChunk(url, chunkInfo)
          .then(chunkData => storeInCache(cacheName, cachePath, chunkData));
      } else {
        return fetchFromCache(cacheName, cachePath);
      }
    });
}


function existsInCache(cacheName, cachePath) {
  return caches.open(cacheName)
    .then(cache => cache.match(cachePath))
    .then(res => !!res);
}

function fetchFromCache(cacheName, cachePath, type = 'arrayBuffer') {
  return caches.open(cacheName)
    .then(cache => cache.match(cachePath))
    .then(res => res[type]());
}

function storeInCache(cacheName, cachePath, data) {
  return caches.open(cacheName)
    .then(cache => cache.put(cachePath, new Response(data)))
    .then(() => data);
}


function fetchChunk(url, chunkInfo) {
  return fetch(url, {
    headers: {
      Range: `bytes=${chunkInfo.start}-${chunkInfo.end}`
    }
  })
    .then(res => res.arrayBuffer());
}

function fetchFileInfo(url, chunkSize) {
  return fetch(url, {
    method: 'HEAD',
    headers: {
      Range: 'bytes=0-0'
    }
  })
    .then(res => {
      const size = parseInt(res.headers.get('content-range').match(/\d+$/)[0]);

      return {
        url,
        size,
        chunks: getChunkInfos(size, chunkSize)
      };
    });
}

function getChunkInfos(size, chunkSize) {
  const chunkCount = Math.ceil(size / chunkSize);

  const r = [];

  for(let i = 0; i < chunkCount; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize - 1, size - 1);

    r.push({index: i, start, end});
  }

  return r;
}


function series(actions, onEach) {
  return new Promise((resolve, reject) => {
    let i = 0;

    next();

    function next() {
      if(actions.length === 0) {
        return resolve();
      }

      const action = actions.shift();
      action().then(r => {
        if(onEach) {
          onEach(r, i++);
        }
        next();
      });
    }
  });
}
