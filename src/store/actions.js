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

export function toggleSoundUsingFull(soundId) {
	return {
		type: 'TOGGLE_SOUND_USING_FULL',
		payload: soundId
	}
}

export function setState(state) {
	return {
		type: 'SET_STATE',
		payload: state
	};
}
