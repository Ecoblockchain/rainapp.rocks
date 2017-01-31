import {element} from 'deku';
import Sound from './sound';


export default {
	render({context}) {
		return <div>
			{context.sounds.map(sound => <Sound key={'sound_' + sound.id} {...sound} />)}
		</div>
	}
}
