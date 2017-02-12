import {h} from 'preact';
import Checkbox from './checkbox';
import PlayPause from './toggleplay';


const Sound = ({
  id,
  title,
  fullSizeMB,
  volume,
  playing,
  usingFull,
  onVolumeChange,
  onTogglePlaying,
  onUsingFull
}) => {
  return <div class="sound">
    <div class="sound__firstrow">
      <img class="sound__icon" src={`/icons/weather/${id}.svg`} alt={title} title={title} />
      <PlayPause playing={playing} onToggle={onTogglePlaying} />
      <Checkbox id={'__' + id} label={`Full Audio (${fullSizeMB}MB)`} onToggle={checked => onUsingFull(checked)} checked={usingFull} />
    </div>
    <input class="sound__volume" onInput={e => onVolumeChange(parseFloat(e.target.value))} type="range" min="0" max="1" step="0.01" value={volume} />
  </div>
};

export default Sound;
