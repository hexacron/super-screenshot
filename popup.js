document.getElementById('capture-full').addEventListener('click', () => {
  chrome.runtime.sendMessage({ message: 'capture_full' });
  window.close();
});