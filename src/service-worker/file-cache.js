import parseRange from 'range-parser';


const DEFAULT_CHUNK_SIZE = 128 * 1024;


export function handleAndCacheFile(request) {
  return ensureFileInfoCached(request.url)
    .then(fileInfo => {
      const {url, size, chunks} = fileInfo;

      let rangeHeader = 'bytes=0-';
      let rangeRequest = false;
      if(request.headers.has('range')) {
        rangeHeader = request.headers.get('range');
        rangeRequest = true;
      }

      let start, end;
      try {
        [{start, end}] = parseRange(size, rangeHeader);
      } catch(e) {
        console.error(e);
        return new Response('Invalid range', {status: 416});
      }

      return ensureFileRange(url, start, end)
        .then(bodyStream => new Response(bodyStream, {
          status: rangeRequest ? 206 : 200,
          headers: {
            'Accept-Ranges': 'bytes',
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Content-Length': end - start + 1,
            'Content-Type': 'audio/ogg'
          }
        }));
    });
}

// Returns a Promise of a ReadableStream
function ensureFileRange(url, start, end) {
  return ensureFileInfoCached(url)
    .then(fileInfo => {
      const {size, chunks} = fileInfo;

      const conversionFactor = chunks.length / size;

      const startChunk = Math.floor(start * conversionFactor);
      const endChunk = Math.ceil(end * conversionFactor);

      const chunksToLoad = chunks.slice(startChunk, endChunk + 1);

      const streamNextChunk = controller => {
        if(chunksToLoad.length === 0) {
          controller.close();
          return;
        }

        const chunkInfo = chunksToLoad.shift();

        return ensureChunkCached(url, chunkInfo)
          .then(chunkBuffer => {
            if(chunkInfo.start < start) {
              chunkBuffer = chunkBuffer.slice(start - chunkInfo.start);
            } else if(chunkInfo.end > end) {
              chunkBuffer = chunkBuffer.slice(0, end - chunkInfo.start + 1);
            }

            controller.enqueue(new Uint8Array(chunkBuffer));
          });
      };

      return new ReadableStream({
        start: streamNextChunk,
        pull: streamNextChunk,
        cancel() {}
      });
    });
}


function ensureFileInfoCached(url, chunkSize = DEFAULT_CHUNK_SIZE) {
  const cacheName = '_bs:' + url;

  return existsInCache(cacheName, '/')
    .then(exists => {
      if(!exists) {
        return fetchFileInfo(url, chunkSize)
          .then(fileInfo => storeInCache(cacheName, '/', JSON.stringify(fileInfo))
            .then(() => fileInfo));
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
