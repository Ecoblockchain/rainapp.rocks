import debounce from 'just-debounce';
import {setState} from '../store/actions';


export default function syncLocalStorage(store, key = 'rain_app') {
	const save = () => {
		localStorage.setItem(key, JSON.stringify(store.getState()));
	}

	const load = debounce(() => {
		let state;
		try {
			state = JSON.parse(localStorage.getItem(key));
		} catch(e) {
			console.log('error loading localStorage data from ' + key);
			console.error(e);
			console.log(localStorage.getItem(key));
		}

		if(state) {
			store.dispatch(setState(state));
		}
	}, 500);

	let lastState;
	store.subscribe(() => {
		const state = store.getState();
		if(state !== lastState) {
			lastState = state;
			save();
		}
	});

	load();
}
