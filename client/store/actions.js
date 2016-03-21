export function addSound({id, title, fullSizeMB, usingFull, volume}) {
	let playing = false;
	const player = new CrossfadeLoopPlayer();

	function setVolume() {
		volume = v;
		// TODO: Save to ls
	}

	function togglePlaying() {
		playing = !playing;
		if(playing) {
			player.play();
		} else {
			player.pause();
		}
	}

	return {
		getState() {
			return {
				title,
				iconUrl: ICON_URL,
				audioUrl: usingFull ? FULL_URL : SAMPLE_URL,
				playing,
				fullSizeMB,
				volume,
				setVolume,
				togglePlaying
			}
		}
	}

	return {type: 'ADD_SOUND', payload: sound}
}

export function setSoundVolume(soundId, volume) {
	return {
		type: 'SET_SOUND_VOLUME',
		payload: {
			id: soundId,
			volume
		}
	}
}

export function toggleSoundPlaying(soundId) {
	return {
		type: 'TOGGLE_SOUND_PLAYING',
		payload: soundId
	}
}

export function setSoundUsingFull(soundId, usingFull) {
	return {
		type: 'SET_SOUND_USING_FULL',
		payload: {
			id: soundId,
			usingFull
		}
	}
}

export function setState(state) {
	return {
		type: 'SET_STATE',
		payload: state
	}
}
