const loading = document.querySelector('#loading-note');
try {
  await import('./app.mjs');
  loading.hidden = true;
} catch (error) {
  loading.querySelector('strong').textContent = 'The editor could not load.';
  loading.querySelector('p').textContent = 'Start the local server with npm --prefix Tilewright start, open http://127.0.0.1:4174, and refresh. Check your connection if you are using a hosted copy.';
  document.querySelector('#status').textContent = 'Editor startup failed. See the message in the map area.';
  console.error('Tilewright startup failed:', error);
}
