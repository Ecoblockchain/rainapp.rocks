// Partly interface-compatible with HTMLMediaElement
// Plays sounds in a loop using a sine curved volume fade to
// hide the change between tracks
const FADE_TIME_SECONDS = 10;
const STATE_ONE_PLAYING = 0;
const STATE_TWO_PLAYING = 1;


// TODO: Change to use web audio api
export class CrossfadeLoopPlayer {
	constructor() {
		this._player1 = new Audio();
		this._player2 = new Audio();

		this._p1volmod = 1;
		this._p2volmod = 1;

		this.paused = true;
		this.state = STATE_ONE_PLAYING;

		this._fadeManager = this._fadeManager.bind(this);
	}

	get src() {
		return this._src;
	}
	set src(v) {
		if(v !== this._src) {
			this.pause();
			this._src = v;
			this._player1.src = v;
			this._player2.src = v;
		}
	}

	get volume() {
		return this._volume;
	}
	set volume(v) {
		if(v !== this._volume) {
			this._volume = v;
			this._flushVolume();
		}
	}

	get loop() {
		return this._player1.loop;
	}
	set loop(v) {
		this._player1.loop = v;
		this._player2.loop = v;
	}

	play() {
		if(!this.paused) return;
		this.paused = false;

		this._faderInterval = setInterval(this._fadeManager, 200);

		switch(this.state) {
		case STATE_TWO_PLAYING:
			if(this._player2.src) {
				playWhenReady(this._player2);
			}

		case STATE_ONE_PLAYING:
			if(this._player1.src) {
				playWhenReady(this._player1);
			}
			break;
		}
	}

	pause() {
		if(this.paused) return;
		this.paused = true;

		clearTimeout(this._faderInterval);

		this._player1.pause();
		this._player2.pause();
	}

	_fadeManager() {
		if(this.paused) return;

		const {_player1, _player2} = this;
		const secondsUntilEnd = _player1.duration - _player1.currentTime;

		if(secondsUntilEnd < FADE_TIME_SECONDS) { // Nearing the end
			const fadeProgress =
				(FADE_TIME_SECONDS - secondsUntilEnd) /
				FADE_TIME_SECONDS * // Normalize from fade time
				(Math.PI / 2); // Scale to half of PI

			// Get a sine curved y value in the range 0-1
			this._p1volmod = Math.cos(fadeProgress);
			this._p2volmod = Math.sin(fadeProgress);

			this._flushVolume();

			if(this.state === STATE_ONE_PLAYING) {
				_player2.play();
				this.state = STATE_TWO_PLAYING;
			}
		}

		if(_player1.paused) { // Player one has ended
			this._player1 = _player2;
			this._player2 = _player1;
			this.state = STATE_ONE_PLAYING;
		}
	}

	_flushVolume() {
		const v = this._volume;
		this._player1.volume = this._p1volmod * v;
		this._player2.volume = this._p2volmod * v;
	}
}


function playWhenReady(audio) {
	if(audio.readyState === audio.HAVE_ENOUGH_DATA) {
		audio.play();
	} else {
		audio.addEventListener('canplaythrough', () => audio.play(), {once: true});
	}
}
