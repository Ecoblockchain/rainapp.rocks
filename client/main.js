import createStore from './store';
import {createApp, element} from 'deku';
import syncLocalStorage from './plugins/ls';
import syncAudio from './plugins/audio';
import Sounds from './components/sounds';


// Setup service worker
if(navigator.serviceWorker) {
	navigator.serviceWorker.register('/sw.js').then(
		worker => {
			console.log('service worker is registered');
		},
		err => console.log('service worker registration error', err)
	);
} else {
	console.log('service worker not supported');
}

// Delete indexedDB from previous version
if(window.indexedDB) {
	const rainsounds = indexedDB.deleteDatabase('rainsounds');
	rainsounds.onerror = err => console.log('Error deleting indexedDB from previous version:', err);
	rainsounds.onsuccess = e => console.log('Deleted indexedDB from previous version');
}


function main() {
	const store = createStore();
	window.store = store;
	syncAudio(store);
	syncLocalStorage(store);
	const render = createApp(document.getElementById('rainroot'), store.dispatch);

	function reRender() {
		render(<Sounds />, store.getState());
	}

	store.subscribe(reRender);
	reRender();
}

main();
