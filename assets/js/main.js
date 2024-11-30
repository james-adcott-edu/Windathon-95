import DesktopEnvironment from './modules/DesktopEnvironment.js';
import { environment } from './Config.js';

if (environment === 'development') {
    document.title = 'Win95 Development Environment';
    document.body.classList.add('development');
}

let de = new DesktopEnvironment();
window.desktopEnvironment = de;

/*
  Do not commit changes below this, we'll have this for testing only to start apps
  we're currently working on etc. 
*/



