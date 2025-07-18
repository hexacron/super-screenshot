// This check makes the script safe to inject multiple times
if (typeof hiddenElements === 'undefined') {
  var hiddenElements = [];
}

// All of these helper functions are correct and do not need changes.
function hideFixedElements() {
  hiddenElements = [];
  const elements = document.querySelectorAll('*');
  elements.forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed' || style.position === 'sticky') {
      el.style.setProperty('display', 'none', 'important');
      hiddenElements.push(el);
    }
  });
}

function showFixedElements() {
  hiddenElements.forEach(el => {
    el.style.display = '';
  });
}

function showStopButton() {
    const stopButton = document.createElement('button');
    stopButton.id = 'super-screenshot-stop-button';
    stopButton.textContent = 'Stop Capture';
    Object.assign(stopButton.style, {
        position: 'fixed', top: '20px', right: '20px', zIndex: '2147483647',
        padding: '10px 20px', background: '#dc3545', color: 'white',
        border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px'
    });
    document.body.appendChild(stopButton);
    stopButton.onclick = () => {
        chrome.runtime.sendMessage({ message: 'user_stopped_capture' });
    };
}

function hideStopButton() {
    const stopButton = document.getElementById('super-screenshot-stop-button');
    if (stopButton) {
        document.body.removeChild(stopButton);
    }
}

// --- METADATA EXTRACTION LOGIC ---

// This is the GENERIC function that runs on any standard webpage.
function extractGenericMetadata() {
  const getMeta = (selector) => document.querySelector(selector)?.content || 'Not found';
  return {
    title: document.title,
    description: getMeta("meta[name='description']"),
    keywords: getMeta("meta[name='keywords']"),
    ogTitle: getMeta("meta[property='og:title']"),
    ogDescription: getMeta("meta[property='og:description']"),
    ogImage: document.querySelector("meta[property='og:image']")?.content || 'Not found',
    url: window.location.href
  };
}

// Scraper for FACEBOOK (Now with User ID extraction)
function extractFacebookData() {
  let data = extractGenericMetadata();
  try {
    // Attempt to find Post ID
    const permalink = document.querySelector("a[href*='/posts/'], a[href*='/videos/'], a[href*='?story_fbid=']");
    if (permalink) {
      const url = new URL(permalink.href);
      const pathParts = url.pathname.split('/');
      data.facebook_post_id = pathParts.find(part => /^\d{15,}/.test(part)) || 'Not found';
    }

    // --- NEW: Attempt to find User ID ---
    // User IDs are often found in the HTML body as "userID":"<some_long_number>"
    const bodyHtml = document.body.innerHTML;
    const userIdMatch = bodyHtml.match(/"userID":"(\d+)"/);
    if (userIdMatch && userIdMatch[1]) {
        data.facebook_user_id = userIdMatch[1];
    } else {
        data.facebook_user_id = 'Not found';
    }
    
  } catch (e) { /* ignore errors */ }
  return data;
}

// Scraper for TWITTER / X
function extractTwitterData() {
  let data = extractGenericMetadata();
  try {
    const profileLink = document.querySelector("a[data-testid='AppTabBar_Profile_Link']");
    if (profileLink) {
      data.twitter_user_id = profileLink.href.split('/').pop();
    }
    const tweet = document.querySelector("article[data-testid='tweet'] a[href*='/status/']");
    if (tweet) {
        const urlParts = tweet.href.split('/');
        if (urlParts[urlParts.length - 2] === 'status') {
            data.twitter_tweet_id = urlParts.pop();
        }
    }
  } catch (e) { /* ignore */ }
  return data;
}

// Scraper for TIKTOK
function extractTikTokData() {
  let data = extractGenericMetadata();
  try {
    const scriptTag = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
    if (scriptTag) {
      const jsonData = JSON.parse(scriptTag.textContent);
      const itemData = jsonData['__DEFAULT_SCOPE__']['webapp.video-detail']['itemInfo']['itemStruct'];
      data.tiktok_video_id = itemData.id;
      data.tiktok_author_id = itemData.author.uniqueId;
      data.tiktok_video_description = itemData.desc;
      data.tiktok_video_download_url = itemData.video.downloadAddr;
    }
  } catch (e) { /* ignore */ }
  return data;
}

// This is the main ROUTER function that decides which scraper to use.
function getMetadata() {
  const hostname = window.location.hostname;
  if (hostname.includes('facebook.com')) {
    return extractFacebookData();
  } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    return extractTwitterData();
  } else if (hostname.includes('tiktok.com')) {
    return extractTikTokData();
  } else {
    return extractGenericMetadata();
  }
}

// The main message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.message) {
        case 'get_scroll_data':
            const pageHeight = document.body.scrollHeight;
            const currentScrollY = window.scrollY;
            const viewportHeight = window.innerHeight;
            window.scrollBy(0, viewportHeight);
            sendResponse({
              scrollHeight: pageHeight,
              currentScrollY: currentScrollY,
              viewportHeight: viewportHeight,
              isAtBottom: (currentScrollY + viewportHeight) >= pageHeight
            });
            break;
        case 'get_metadata':
            sendResponse(getMetadata());
            break;
        case 'hide_elements': hideFixedElements(); sendResponse({}); break;
        case 'show_elements': showFixedElements(); sendResponse({}); break;
        case 'show_stop_button': showStopButton(); sendResponse({}); break;
        case 'hide_stop_button': hideStopButton(); sendResponse({}); break;
    }
    return true;
});