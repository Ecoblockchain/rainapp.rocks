import {h} from 'preact';
import {bindActionCreators} from 'redux';
import {connect} from 'preact-redux';
import Sound from './sound';
import * as actions from '../store/actions';


const Sounds = ({
  sounds,
  setSoundVolume,
  toggleSoundPlaying,
  setSoundUsingFull
}) => {
  return <div>
    {sounds.map(sound => <Sound
      key={'sound_' + sound.id}
      onVolumeChange={setSoundVolume.bind(null, sound.id)}
      onTogglePlaying={toggleSoundPlaying.bind(null, sound.id)}
      onUsingFull={setSoundUsingFull.bind(null, sound.id)}
      {...sound}
    />)}
  </div>
};

export default connect(
  state => state,
  dispatch => bindActionCreators(actions, dispatch)
)(Sounds);
