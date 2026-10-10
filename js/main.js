import { initScene } from './scene.js';
import { onDialPhone, bindModals } from './game.js';
import { bindTools } from './tools.js';
import { monitorIdle } from './monitor.js';

const canvas = document.getElementById('c');
initScene(canvas, onDialPhone);
bindTools();
bindModals();
monitorIdle();

try {
  if (localStorage.getItem('zoinbase_v2')) {
    const b = document.getElementById('btn-resume');
    if (b) b.classList.remove('hidden');
  }
} catch(e) {}
