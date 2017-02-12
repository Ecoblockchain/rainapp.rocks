import createStore from './store';
import {h, render} from 'preact';
import {Provider} from 'preact-redux';
import syncLocalStorage from './plugins/ls';
import syncAudio from './plugins/audio';
import Sounds from './components/sounds';


if(navigator.serviceWorker) {
  navigator.serviceWorker.register('/sw.js');
}

/*
function setupCast() {
  cast.framework.CastContext.getInstance().setOptions({
    receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID
  });
}
*/

const store = createStore();

syncAudio(store);
syncLocalStorage(store);

render(
  <Provider store={store}>
    <Sounds/>
  </Provider>,
  document.getElementById('rainroot')
);
