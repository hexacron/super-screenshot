document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const captureId = parseInt(urlParams.get('id'));

  if (!captureId && captureId !== 0) {
      document.body.innerHTML = '<h1>Error: No capture ID provided.</h1>';
      return;
  }

  try {
    const result = await getCapture(captureId);
    
    if (!result) {
        document.body.innerHTML = `<h1>Error: Capture with ID ${captureId} not found.</h1>`;
        return;
    }
    
    if (result.metadata) {
        const container = document.getElementById('metadata-display');
        for (const [key, value] of Object.entries(result.metadata)) {
            const keyElement = document.createElement('strong');
            keyElement.textContent = `${key}:`;
            
            const valueElement = document.createElement('pre');
            valueElement.textContent = value || 'Not found';

            container.appendChild(keyElement);
            container.appendChild(valueElement);
        }
    }
    
    // Use the imageDataUrl directly as the src. No createObjectURL needed.
    if (result.imageDataUrl) {
      document.getElementById('screenshot-image').src = result.imageDataUrl;
    } else {
      const container = document.getElementById('screenshot-container');
      container.innerHTML = '<p class="error">The screenshot could not be created.</p>';
    }
  } catch (error) {
    console.error("Failed to load capture:", error);
    document.body.innerHTML = `<h1>Error: Could not load capture from the database.</h1>`;
  }
});