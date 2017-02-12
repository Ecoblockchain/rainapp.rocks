import {createStore} from 'redux';


export default () => createStore(reducer);

const initialSounds = [
	{
		id: 'rain',
		title: 'Rain Under Tree',
		fullSizeMB: '5',
		usingFull: false,
		volume: 1,
		playing: false
	},
	{
		id: 'drizzle',
		title: 'Gentle Rain',
		fullSizeMB: '5',
		usingFull: false,
		volume: 1,
		playing: false
	},
	{
		id: 'lightning',
		title: 'Severe Thunderstorm',
		fullSizeMB: '10',
		usingFull: false,
		volume: 1,
		playing: false
	},
	{
		id: 'wind',
		title: 'Roaring Gale',
		fullSizeMB: '5',
		usingFull: false,
		volume: 1,
		playing: false
	},
	{
		id: 'campfire',
		title: 'Campfire',
		fullSizeMB: '2',
		usingFull: false,
		volume: 1,
		playing: false
	},
	{
		id: 'crickets',
		title: 'Crickets',
		fullSizeMB: '5',
		usingFull: false,
		volume: 1,
		playing: false
	}
];

const reducer = (state = {}, action) => {
	if(action.type === 'SET_STATE') {
		return action.payload;
	}

	return {
		sounds: soundsReducer(state.sounds, action)
	}
}

const soundsReducer = (state = initialSounds, {type, payload}) => {
	switch(type) {
		case 'SET_SOUND_VOLUME':
			return replaceSound(state, payload.id, sound => {
				return {...sound, volume: payload.volume}
			});
		case 'TOGGLE_SOUND_PLAYING':
			return replaceSound(state, payload, sound => {
				return {...sound, playing: !sound.playing}
			});
		case 'SET_SOUND_USING_FULL':
			return replaceSound(state, payload.id, sound => {
				return {...sound, usingFull: payload.usingFull}
			});
		default:
			return state;
	}
}


function findMatchesId(sounds, id) {
	for(let i = 0; i < sounds.length; i++) {
		if(sounds[i].id === id) return i;
	}
	return -1;
}

function replaceElement(arr, i, el) {
	return arr.slice(0, i).concat(el, arr.slice(i + 1));
}

function replaceSound(sounds, id, fn) {
	const pos = findMatchesId(sounds, id);
	if(pos === -1) {
		return sounds;
	}
	const newSound = fn(sounds[pos]);
	return replaceElement(sounds, pos, newSound);
}
