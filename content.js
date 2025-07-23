// This check makes the script safe to inject multiple times
if (typeof hiddenElements === 'undefined') {
  var hiddenElements = [];
  var scrollTarget = window;
  var scrollElement = document.documentElement;
  var activeModal = null;
}

// This function is now more careful when a modal is active.
function hideFixedElements() {
  hiddenElements = [];
  const elements = document.querySelectorAll('*');
  elements.forEach(el => {
    // If we are in a modal, do not hide the modal itself or its children.
    if (activeModal && activeModal.contains(el)) {
        return;
    }
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

// This function has been completely re-engineered with a new "interactive" strategy.
async function determineScrollContext() {
    // Reset to defaults for a new capture session
    activeModal = null;
    scrollElement = document.scrollingElement || document.documentElement;
    scrollTarget = window;

    const bodyStyle = window.getComputedStyle(document.body);
    const isBodyLocked = bodyStyle.overflow === 'hidden' || bodyStyle.overflowY === 'hidden';

    if (!isBodyLocked) {
        return; // Not in a modal context, we're done.
    }

    const modal = Array.from(document.querySelectorAll('div[role="dialog"]')).find(el => el.offsetParent !== null);
    if (!modal) {
        return; // No visible modal found
    }

    // --- NEW "POKE AND OBSERVE" STRATEGY ---
    // Previous methods failed because they guessed based on static properties (size, scrollHeight).
    // This new approach is interactive: we simulate a user action (scrolling) and observe
    // which element actually moves. This is fundamentally more reliable.

    const candidates = Array.from(modal.querySelectorAll('*'));
    candidates.unshift(modal);

    // Store initial scroll positions of all elements in the modal
    const initialScrollTops = new Map(candidates.map(el => [el, el.scrollTop]));

    // "Poke" the modal by dispatching a wheel event to simulate a user scrolling
    modal.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 100 }));

    // Wait a moment for the browser to process the event and render the scroll
    await new Promise(resolve => setTimeout(resolve, 50));

    let foundScroller = null;
    // Check which element's scroll position has changed
    for (const el of candidates) {
        if (el.scrollTop !== initialScrollTops.get(el)) {
            foundScroller = el;
            break; // Found the one that scrolled
        }
    }

    if (foundScroller) {
        // We found the element that scrolled! Scroll it back to its original position.
        // The 'reset_scroll' command will handle the final reset to the very top.
        foundScroller.scrollTop = initialScrollTops.get(foundScroller);

        activeModal = modal;
        scrollElement = foundScroller;
        scrollTarget = foundScroller;
    } else {
        // FALLBACK: If nothing scrolled, it's likely a non-scrolling modal.
        // Use the "most content" heuristic as a safe bet for getting dimensions right.
        const fallbackScroller = candidates
            .filter(el => (window.getComputedStyle(el).overflowY === 'auto' || window.getComputedStyle(el).overflowY === 'scroll') && el.clientHeight > 0)
            .reduce((best, current) => (!best || current.scrollHeight > best.scrollHeight) ? current : best, null);

        if (fallbackScroller) {
            activeModal = modal;
            scrollElement = fallbackScroller;
            scrollTarget = fallbackScroller;
        }
    }
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

// --- METADATA EXTRACTION LOGIC (with improved error handling) ---

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

function extractFacebookData() {
  let data = extractGenericMetadata();
  try {
    const permalink = document.querySelector("a[href*='/posts/'], a[href*='/videos/'], a[href*='?story_fbid=']");
    if (permalink) {
      const url = new URL(permalink.href);
      const pathParts = url.pathname.split('/');
      data.facebook_post_id = pathParts.find(part => /^\d{15,}/.test(part)) || 'Not found';
    }
    const bodyHtml = document.body.innerHTML;
    const userIdMatch = bodyHtml.match(/"userID":"(\d+)"/);
    data.facebook_user_id = (userIdMatch && userIdMatch[1]) ? userIdMatch[1] : 'Not found';
  } catch (e) { /* ignore */ }
  return data;
}

function extractTwitterData() {
  let data = extractGenericMetadata();
  const pathParts = window.location.pathname.split('/').filter(p => p);
  try {
    const nextDataScript = document.getElementById('__NEXT_DATA__');
    if (!nextDataScript) {
        if (pathParts.length >= 3 && pathParts[1] === 'status') {
            data.twitter_screen_name = pathParts[0];
            data.twitter_tweet_id = pathParts[2];
        } else if (pathParts.length >= 1) {
            data.twitter_screen_name = pathParts[0];
        }
        return data;
    }
    const jsonData = JSON.parse(nextDataScript.textContent);
    const isTweetPage = pathParts.length >= 3 && pathParts[1] === 'status';
    if (isTweetPage) {
        data.twitter_tweet_id = pathParts[2];
        const screenNameFromUrl = pathParts[0];
        data.twitter_screen_name = screenNameFromUrl;
        const users = jsonData?.props?.pageProps?.initialState?.entities?.users?.entities;
        if (users) {
            const authorObject = Object.values(users).find(user => user.screen_name.toLowerCase() === screenNameFromUrl.toLowerCase());
            if (authorObject) data.twitter_user_id = authorObject.id_str;
        }
    } else {
        const userData = jsonData?.props?.pageProps?.userData?.user_results?.result;
        if (userData) {
            data.twitter_screen_name = userData.legacy?.screen_name;
            data.twitter_user_id = userData.rest_id;
        }
    }
  } catch (e) { /* ignore */ }
  return data;
}

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

function extractInstagramData() {
  let data = extractGenericMetadata();
  try {
    const scriptTag = document.querySelector('script[type="application/ld+json"]');
    if (scriptTag) {
      const jsonData = JSON.parse(scriptTag.textContent);
      data.instagram_post_id = jsonData.identifier;
      data.instagram_author = jsonData.author.name;
      data.instagram_caption = jsonData.caption;
    } else {
        const match = window.location.pathname.match(/\/p\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) data.instagram_post_id = match[1];
    }
  } catch (e) { /* ignore */ }
  return data;
}

function extractRedditData() {
  let data = extractGenericMetadata();
  try {
    const postElement = document.querySelector('shreddit-post');
    if (postElement) {
        data.reddit_author = postElement.getAttribute('author') || 'Not found';
        data.reddit_subreddit = postElement.getAttribute('subreddit-name') || 'Not found';
        data.reddit_post_id = postElement.getAttribute('id') || 'Not found';
    } else {
        const match = window.location.pathname.match(/\/r\/(\w+)\/comments\/(\w+)/);
        if (match) {
            data.reddit_subreddit = match[1];
            data.reddit_post_id = match[2];
        }
    }
  } catch (e) { /* ignore */ }
  return data;
}

function extractLinkedInData() {
  let data = extractGenericMetadata();
  try {
    const urlMatch = window.location.pathname.match(/urn:li:(activity|share|ugcPost):(\d+)/);
    if (urlMatch && urlMatch[2]) {
      data.linkedin_post_urn = urlMatch[0];
      data.linkedin_post_id = urlMatch[2];
    }
    const authorElement = document.querySelector(".feed-shared-actor__name span[aria-hidden='true']");
    if (authorElement) data.linkedin_author_name = authorElement.textContent.trim();
  } catch (e) { /* ignore */ }
  return data;
}

function extractVkontakteData() {
  let data = extractGenericMetadata();
  try {
    const urlMatch = window.location.search.match(/w=wall(-?\d+_\d+)/) || window.location.pathname.match(/wall(-?\d+_\d+)/);
    if (urlMatch && urlMatch[1]) {
      data.vk_post_id = urlMatch[1];
      const postElement = document.querySelector(`#post${data.vk_post_id}`);
      if (postElement) {
          const authorElement = postElement.querySelector('.post_author .author');
          if (authorElement) data.vk_author_name = authorElement.textContent.trim();
      }
    }
  } catch (e) { /* ignore */ }
  return data;
}

function getMetadata() {
  const hostname = window.location.hostname;
  if (hostname.includes('facebook.com')) return extractFacebookData();
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) return extractTwitterData();
  if (hostname.includes('tiktok.com')) return extractTikTokData();
  if (hostname.includes('instagram.com')) return extractInstagramData();
  if (hostname.includes('reddit.com')) return extractRedditData();
  if (hostname.includes('linkedin.com')) return extractLinkedInData();
  if (hostname.includes('vk.com')) return extractVkontakteData();
  return extractGenericMetadata();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.message) {
        case 'get_scroll_data':
            const pageHeight = scrollElement.scrollHeight;
            const currentScrollY = scrollElement.scrollTop;
            const viewportHeight = scrollElement.clientHeight;
            // Use a more "forceful" and consistent scroll method.
            // The scrollTo() method with 'instant' behavior can be more reliable on
            // complex sites that might interfere with direct scrollTop manipulation.
            scrollTarget.scrollTo({ top: currentScrollY + viewportHeight, behavior: 'instant' });
            sendResponse({
              scrollHeight: pageHeight,
              currentScrollY: currentScrollY,
              viewportHeight: viewportHeight,
              // Add a small buffer to account for fractional pixels
              isAtBottom: (currentScrollY + viewportHeight + 2) >= pageHeight
            });
            break;
        case 'get_metadata':
            sendResponse(getMetadata());
            break;
        case 'hide_elements': hideFixedElements(); sendResponse({}); break;
        case 'show_elements': showFixedElements(); sendResponse({}); break;
        case 'show_stop_button':
            // This is now async because determineScrollContext is interactive.
            determineScrollContext().then(() => {
                showStopButton();
                sendResponse({});
            });
            return true; // IMPORTANT: Indicates an async response.
            break;
        case 'reset_scroll':
            // Use the forceful method for resetting as well.
            scrollTarget.scrollTo({ top: 0, behavior: 'instant' });
            sendResponse({});
            break;
        case 'hide_stop_button': hideStopButton(); sendResponse({}); break;
    }
    return true;
});