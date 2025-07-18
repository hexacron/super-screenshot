chrome.runtime.onMessage.addListener((request) => {
  if (request.message === 'stitch_captures') {
    stitchCaptures(request.captures, request.metadata);
  }
});

function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

async function stitchCaptures(captures, metadata) {
  try {
    const images = await Promise.all(captures.map(c => createImageBitmapFromUrl(c.url)));
    const finalWidth = images[0].width;
    const finalHeight = images.reduce((acc, img) => acc + img.height, 0);
    const canvas = new OffscreenCanvas(finalWidth, finalHeight);
    const ctx = canvas.getContext('2d');
    
    let y = 0;
    images.forEach(img => {
      ctx.drawImage(img, 0, y);
      y += img.height;
    });

    const blob = await canvas.convertToBlob();
    // Convert the blob to a permanent data URL string
    const dataUrl = await blobToDataURL(blob);
    
    chrome.runtime.sendMessage({ 
        message: 'stitching_complete', 
        imageDataUrl: dataUrl, // Send the data URL string
        metadata: metadata 
    });

  } catch (error) {
    console.error("Error during stitching:", error);
  }
}

async function createImageBitmapFromUrl(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return createImageBitmap(blob);
}