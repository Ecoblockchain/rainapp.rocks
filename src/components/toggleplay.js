import {element} from 'deku';


export default {
	render({props: {onToggle, playing}}) {
		return <div class={`play-pause ${playing ? 'active' : ''}`} onClick={onToggle}>
			<div class="play"></div>
			<div class="pause"></div>
		</div>
	}
}
