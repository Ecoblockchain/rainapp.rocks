// Partly interface-compatible with HTMLMediaElement
// Plays sounds in a loop using a sine curved volume fade to
// hide the change between tracks
const FADE_TIME_SECONDS = 10;
const STATE_ONE_PLAYING = 0;
const STATE_TWO_PLAYING = 1;


// TODO: Change to use web audio api
export class CrossfadeLoopPlayer {
  constructor() {
    this._context = new AudioContext();

    this._context.suspend();

    this._currentGain = this._context.createGain();
    this._nextGain = this._context.createGain();

    this._volume = this._context.createGain();

    this._currentGain.connect(this._volume);
    this._nextGain.connect(this._volume);

    this._volume.connect(this._context.destination);

    this._src = '';

    this._audioManager = this._audioManager.bind(this);
    this._swapSources = this._swapSources.bind(this);
  }

  get src() {
    return this._src;
  }

  set src(v) {
    if(v !== this._src) {
      const wasPlaying = this._context.state === 'running';

      this.pause();

      this._clearAudio();

      this._src = v;

      getPCMData(this._context, this._src)
        .then(pcm => {
          this._pcm = pcm;

          if(wasPlaying) {
            this.play();
          }
        });
    }
  }

  get volume() {
    return this._volume.gain.value;
  }

  set volume(v) {
    if(v !== this._volume) {
      this._volume.gain.value = v;
    }
  }

  play() {
    if(this._managerInterval) return;

    this._managerInterval = setInterval(this._audioManager, 1000);

    this._audioManager();

    this._context.resume();
  }

  pause() {
    clearInterval(this._managerInterval);

    delete this._managerInterval;

    this._context.suspend();
  }

  _clearAudio() {
    if(this._currentSource) {
      this._currentSource.disconnect();
      delete this._currentSource;
    }

    if(this._nextSource) {
      this._nextSource.disconnect();
      delete this._nextSource;
    }

    delete this._pcm;
  }

	_audioManager() {
    const {currentTime} = this._context;

    if(!this._currentSource && this._pcm) {
      this._startCurrentSource();
    }

    if(this._currentSource) {
      const currentSourceEnd = this._currentSourceStart + this._currentSource.buffer.duration;

      const untilCurrentEnds = currentSourceEnd - currentTime;

      if(!this._nextSource && untilCurrentEnds <= FADE_TIME_SECONDS) {
        this._startNextSource();
      }
    }
  }

  _startCurrentSource() {
    const {currentTime} = this._context;

    this._currentSourceStart = currentTime;

    const source = this._context.createBufferSource();
    source.buffer = this._pcm;
    source.connect(this._currentGain);
    source.start();

    this._currentSource = source;
  }

  _startNextSource() {
    const {currentTime} = this._context;

    this._nextSourceStart = currentTime;

    const source = this._context.createBufferSource();
    source.buffer = this._pcm;
    source.connect(this._nextGain);
    source.start();

    this._nextSource = source;

    this._currentGain.gain.value = 1;
    this._nextGain.gain.value = 0;

    for(let time = 0; time < FADE_TIME_SECONDS; time += 0.1) {
      const {current, next} = volumesAtTime(FADE_TIME_SECONDS - time);

      this._currentGain.gain.linearRampToValueAtTime(current, currentTime + time);
      this._nextGain.gain.linearRampToValueAtTime(next, currentTime + time);
    }

    this._currentSource.onended = this._swapSources;
  }

  _swapSources() {
    this._currentSource = this._nextSource;
    this._currentSourceStart = this._nextSourceStart;

    const currentGain = this._nextGain;
    this._nextGain = this._currentGain;
    this._currentGain = currentGain;

    delete this._nextSource;
    delete this._nextSourceStart;
  }
}


function getPCMData(context, url) {
  return fetch(url)
    .then(res => res.arrayBuffer())
    .then(buffer => context.decodeAudioData(buffer));
}

function volumesAtTime(secondsUntilEnd) {
  const fadeProgress =
    (FADE_TIME_SECONDS - secondsUntilEnd) /
    FADE_TIME_SECONDS * // Normalize from fade time
    (Math.PI / 2); // Scale to half of PI

  return {
    current: Math.cos(fadeProgress),
    next: Math.sin(fadeProgress)
  };
}
