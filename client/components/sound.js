import {element} from 'deku';
import {
	setSoundVolume,
	toggleSoundPlaying,
	setSoundUsingFull
} from '../store/actions';
import Checkbox from './checkbox';
import PlayPause from './toggleplay';


export default {
	render({
		props: {
			id,
			title,
			fullSizeMB,
			volume,
			playing,
			usingFull
		},
		dispatch
	}) {
		return <div class="sound">
			<div class="sound__firstrow">
				<img class="sound__icon" src={`/icons/weather/${id}.svg`} alt={title} title={title} />
				<PlayPause playing={playing} onToggle={togglePlay(id, dispatch)} />
				<Checkbox id={'__' + id} label={`Full Audio (${fullSizeMB}MB)`} onToggle={setSoundFull(id, dispatch)} checked={usingFull} />
			</div>
			<input class="sound__volume" onInput={setVolume(id, dispatch)} type="range" min="0" max="1" step="0.01" value={volume} />
		</div>
	}
}


function setVolume(id, dispatch) {
	return e => {
		dispatch(setSoundVolume(id, parseFloat(e.target.value)));
	}
}

function togglePlay(id, dispatch) {
	return () => dispatch(toggleSoundPlaying(id));
}

function setSoundFull(id, dispatch) {
	return checked => {
		dispatch(setSoundUsingFull(id, checked));
	}
}
