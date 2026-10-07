import { initScene } from './scene.js';
import { onDialPhone, startGame, bindModals } from './game.js';
import { bindTools } from './tools.js';

const canvas = document.getElementById('c');
initScene(canvas, onDialPhone);
bindTools();
bindModals();
