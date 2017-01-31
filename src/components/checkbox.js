import {h} from 'preact';


export default ({id, label, onToggle, checked}) => {
	if(!id) {
		id = Math.random().toString(16).substr(2);
	}

	return <div>
		<div class="checkbox">
			<input type="checkbox" id={id} onChange={e => onToggle(e.target.checked)} checked={checked} />
			<label for={id} />
		</div>
		<label class="checkbox__label" for={id}>{label}</label>
	</div>
};
