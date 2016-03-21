import {CrossfadeLoopPlayer} from './player';


export default function syncAudio(store) {
	let players = {};

	function update() {
		const {sounds} = store.getState();
		let currentPlayers = {};

		sounds.forEach(({id, playing, volume, usingFull}) => {
			let player = players[id];
			delete players[id];
			if(!player) {
				player = new CrossfadeLoopPlayer();
			}
			currentPlayers[id] = player;

			player.volume = volume;
			player.src = `/audio/${usingFull ? 'full' : 'samples'}/${id}.ogg`;
			if(playing) {
				player.play();
			} else {
				player.pause();
			}
		});

		Object.keys(players).forEach(id => {
			players[id].pause();
		});

		players = currentPlayers;
	}

	store.subscribe(update);
	update();
}
