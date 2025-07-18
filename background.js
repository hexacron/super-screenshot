try {
    importScripts('db.js');
} catch (e) {
    console.error(e);
}

let captures = [];
let stabilityCounter = 0;
let lastScrollHeight = 0;
let lastScrollY = -1;
let captureInProgress = false;

function initiateCapture(tab) {
    if (captureInProgress) return;
    captureInProgress = true;

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
    }).then(() => {
        chrome.tabs.sendMessage(tab.id, { message: 'get_metadata' }, (metadata) => {
            if (chrome.runtime.lastError) {
                captureInProgress = false;
                return;
            }
            metadata.captureDate = new Date().toUTCString();
            startCapture(tab, metadata);
        });
    }).catch(() => captureInProgress = false);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.message) {
        case 'capture_full':
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) initiateCapture(tabs[0]);
            });
            break;
        case 'user_stopped_capture':
            if (captureInProgress) {
                captureInProgress = false;
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                   if(tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { message: 'hide_stop_button' }, () => chrome.runtime.lastError && 0);
                });
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, { message: 'get_metadata' }, (metadata) => {
                             if(metadata) metadata.captureDate = new Date().toUTCString();
                             setupOffscreenCanvas(metadata);
                        });
                    } else {
                        setupOffscreenCanvas(null);
                    }
                });
            }
            break;
        case 'stitching_complete':
            const newCapture = {
                metadata: request.metadata,
                imageDataUrl: request.imageDataUrl // Storing the data URL string
            };
            addCapture(newCapture).then(newId => {
                chrome.tabs.create({ url: `results.html?id=${newId}` });
                if (chrome.offscreen.hasDocument) {
                    chrome.offscreen.closeDocument();
                }
            });
            break;
    }
    return true;
});

function startCapture(tab, metadata) {
    captures = [];
    stabilityCounter = 0;
    lastScrollHeight = 0;
    lastScrollY = -1;
    chrome.tabs.sendMessage(tab.id, { message: 'show_stop_button' }, () => {
        if (chrome.runtime.lastError) {
            captureInProgress = false;
            return;
        }
        captureLoop(tab, metadata);
    });
}

function captureLoop(tab, metadata) {
    if (!captureInProgress) {
        chrome.tabs.sendMessage(tab.id, { message: 'hide_stop_button' }, () => chrome.runtime.lastError && 0);
        return;
    }

    chrome.tabs.sendMessage(tab.id, { message: 'hide_elements' }, () => {
        if (chrome.runtime.lastError) { captureInProgress = false; return; }
        setTimeout(() => {
            chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' }, (dataUrl) => {
                if (chrome.runtime.lastError) {
                    captureInProgress = false;
                    chrome.tabs.sendMessage(tab.id, { message: 'hide_stop_button' }, () => chrome.runtime.lastError && 0);
                    return;
                }
                captures.push({ url: dataUrl });
                chrome.tabs.sendMessage(tab.id, { message: 'show_elements' }, () => {
                    if (chrome.runtime.lastError) { captureInProgress = false; return; }
                    chrome.tabs.sendMessage(tab.id, { message: 'get_scroll_data' }, (response) => {
                        if (chrome.runtime.lastError || !response) {
                            captureInProgress = false;
                            chrome.tabs.sendMessage(tab.id, { message: 'hide_stop_button' }, () => chrome.runtime.lastError && 0);
                            setupOffscreenCanvas(metadata);
                            return;
                        }
                        if (response.scrollHeight === lastScrollHeight && response.currentScrollY === lastScrollY) {
                            stabilityCounter++;
                        } else {
                            stabilityCounter = 0;
                        }
                        lastScrollHeight = response.scrollHeight;
                        lastScrollY = response.currentScrollY;
                        if (response.isAtBottom || stabilityCounter >= 4) {
                            captureInProgress = false;
                            chrome.tabs.sendMessage(tab.id, { message: 'hide_stop_button' }, () => chrome.runtime.lastError && 0);
                            setupOffscreenCanvas(metadata);
                        } else {
                            setTimeout(() => captureLoop(tab, metadata), 750);
                        }
                    });
                });
            });
        }, 100);
    });
}

async function setupOffscreenCanvas(metadata) {
    if (captures.length === 0) {
        captureInProgress = false;
        return;
    }
    if (!(await chrome.offscreen.hasDocument())) {
        await chrome.offscreen.createDocument({
            url: 'offscreen.html',
            reasons: ['DOM_PARSER'],
            justification: 'To stitch screenshots.'
        });
    }
    chrome.runtime.sendMessage({
        message: 'stitch_captures',
        captures: captures,
        metadata: metadata
    });
}