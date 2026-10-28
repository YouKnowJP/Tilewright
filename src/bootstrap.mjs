const loading = document.querySelector('#loading-note');
const startup = document.querySelector('#startup-status');
document.querySelector('#startup-retry').onclick = () => location.reload();
const slowLoad=setTimeout(()=>{
  startup.querySelector('strong').textContent='The trail is taking longer to light.';
  startup.querySelector('p').textContent='The game is still loading. You can wait or try again. Your saved worlds and progress stay in this browser.';
  document.querySelector('#startup-retry').hidden=false;
},15000);
try {
  await import('./app.mjs');
  loading.hidden = true;
  startup.hidden = true;
} catch (error) {
  startup.querySelector('strong').textContent = 'The game could not load.';
  startup.querySelector('p').textContent = 'Check your internet connection, then try again. Your saved worlds and progress stay in this browser.';
  document.querySelector('#startup-retry').hidden = false;
  document.querySelector('#status').textContent = 'Game startup failed. Please try again.';
  console.error('Tilewright startup failed:', error);
} finally { clearTimeout(slowLoad); }
