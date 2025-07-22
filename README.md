# Super Screenshot: OSINT & Full-Page Capture Tool

## Overview

Super Screenshot is a powerful Chrome extension designed for capturing complete, scrolling webpages and extracting valuable metadata, with a special focus on OSINT (Open-Source Intelligence) investigations.

This tool was built to overcome the limitations of standard screenshot utilities, which often fail on modern, dynamically-loading websites like Facebook, Twitter/X, and TikTok. It reliably captures the entirety of a page's content, including "infinite scroll" feeds, and pairs the visual evidence with a rich set of machine-readable metadata. All captures are saved to a local dashboard for easy management and review.

## Key Features

Full-Page Screen Capture: Captures even the longest scrolling pages by intelligently scrolling, capturing, and stitching images together.

Infinite Scroll Support: Reliably captures dynamic feeds on social media sites that load content as you scroll.

Manual Stop Button: For truly infinite feeds (like a Facebook timeline), a "Stop Capture" button gives the user full control over the capture length.

OSINT Metadata Extraction: Automatically scrapes valuable, platform-specific identifiers from supported social media sites.

Generic Metadata Scraping: For any website, it extracts standard metadata, including title, description, keywords, and social media preview (Open Graph) tags.

Capture Dashboard: All captures are automatically saved to a local dashboard where they can be viewed, managed, and deleted.

Permanent Storage: Uses the browser's IndexedDB to reliably store large screenshot images and their associated data.

## How to Use

Initiate a Capture: Click the extension icon in your Chrome toolbar and press the "Capture Full Page" button.

Let it Scroll: The page will begin scrolling automatically. A red "Stop Capture" button will appear in the top-right corner.

### Stop the Capture:

For pages with a defined end (like an article), the capture will stop automatically.

For infinite feeds (like a Twitter timeline), click the "Stop Capture" button when you have captured the desired area.

### View Results: A new tab will open showing the final screenshot and all the extracted metadata. This capture is now saved to your dashboard.

### Access the Dashboard: Click the extension icon and then the "View Saved Captures" link to open the dashboard and see all your previous captures.

## Metadata Extraction Details

The extension automatically detects the website and runs the appropriate scraper.

All Websites (Generic)
title: The page title.

description: The page's meta description.

keywords: The page's meta keywords.

ogTitle, ogDescription, ogImage: Open Graph data for social media previews.

url: The full URL of the captured page.

captureDate: The UTC date and time of the capture.

Facebook (facebook.com)
facebook_post_id: The unique ID of a post or video on the page.

facebook_user_id: The unique numeric ID of the user profile being viewed.

Twitter / X (twitter.com, x.com)
twitter_user_id: The @username of the profile being viewed.

twitter_tweet_id: The unique ID of the primary tweet on the page.

TikTok (tiktok.com)
tiktok_video_id: The unique ID of the video.

tiktok_author_id: The unique username of the video's creator.

tiktok_video_description: The video's full caption.

tiktok_video_download_url: A direct link to the video file, often without a watermark.

## Installation

This extension is not on the Chrome Web Store and must be loaded as an unpacked extension.

Download and unzip the project files to a permanent folder on your computer.

Open Google Chrome and navigate to chrome://extensions.

Enable "Developer mode" using the toggle in the top-right corner.

Click the "Load unpacked" button.

Select the folder where you unzipped the project files.

The "Super Screenshot" extension will now appear in your extensions list and can be pinned to your toolbar.

## Project Structure

manifest.json: Defines the extension's permissions, properties, and file structure.

background.js: The service worker; acts as the main controller for the entire capture process.

content.js: Injected into the webpage to handle scrolling, UI elements (stop button), and metadata scraping.

offscreen.js: A background script that runs in a hidden document to perform the heavy-lifting of stitching images together.

db.js: A helper library for all IndexedDB database operations (saving, retrieving, deleting captures).

popup.html / popup.js: The small window that appears when you click the extension icon.

dashboard.html / dashboard.js: The page that displays the gallery of saved captures.

results.html / results.js: The page that displays the final screenshot and metadata for a single capture.

# Super Screenshot: OSINT & Full-Page Capture Tool

## Overview

Super Screenshot is a powerful Chrome extension designed for capturing complete, scrolling webpages and extracting valuable metadata, with a special focus on OSINT (Open-Source Intelligence) investigations.

This tool was built to overcome the limitations of standard screenshot utilities, which often fail on modern, dynamically-loading websites like Facebook, Twitter/X, and TikTok. It reliably captures the entirety of a page's content, including "infinite scroll" feeds, and pairs the visual evidence with a rich set of machine-readable metadata. All captures are saved to a local dashboard for easy management and review.

## Key Features

Full-Page Screen Capture: Captures even the longest scrolling pages by intelligently scrolling, capturing, and stitching images together.

Infinite Scroll Support: Reliably captures dynamic feeds on social media sites that load content as you scroll.

Manual Stop Button: For truly infinite feeds (like a Facebook timeline), a "Stop Capture" button gives the user full control over the capture length.

OSINT Metadata Extraction: Automatically scrapes valuable, platform-specific identifiers from supported social media sites.

Generic Metadata Scraping: For any website, it extracts standard metadata, including title, description, keywords, and social media preview (Open Graph) tags.

Capture Dashboard: All captures are automatically saved to a local dashboard where they can be viewed, managed, and deleted.

Permanent Storage: Uses the browser's IndexedDB to reliably store large screenshot images and their associated data.

## How to Use

Initiate a Capture: Click the extension icon in your Chrome toolbar and press the "Capture Full Page" button.

Let it Scroll: The page will begin scrolling automatically. A red "Stop Capture" button will appear in the top-right corner.

### Stop the Capture:

For pages with a defined end (like an article), the capture will stop automatically.

For infinite feeds (like a Twitter timeline), click the "Stop Capture" button when you have captured the desired area.

### View Results: A new tab will open showing the final screenshot and all the extracted metadata. This capture is now saved to your dashboard.

### Access the Dashboard: Click the extension icon and then the "View Saved Captures" link to open the dashboard and see all your previous captures.

## Metadata Extraction Details

The extension automatically detects the website and runs the appropriate scraper.

All Websites (Generic)
title: The page title.

description: The page's meta description.

keywords: The page's meta keywords.

ogTitle, ogDescription, ogImage: Open Graph data for social media previews.

url: The full URL of the captured page.

captureDate: The UTC date and time of the capture.

Facebook (facebook.com)
facebook_post_id: The unique ID of a post or video on the page.

facebook_user_id: The unique numeric ID of the user profile being viewed.

Twitter / X (twitter.com, x.com)
twitter_user_id: The @username of the profile being viewed.

twitter_tweet_id: The unique ID of the primary tweet on the page.

TikTok (tiktok.com)
tiktok_video_id: The unique ID of the video.

tiktok_author_id: The unique username of the video's creator.

tiktok_video_description: The video's full caption.

tiktok_video_download_url: A direct link to the video file, often without a watermark.

## Installation

This extension is not on the Chrome Web Store and must be loaded as an unpacked extension.

Download and unzip the project files to a permanent folder on your computer.

Open Google Chrome and navigate to chrome://extensions.

Enable "Developer mode" using the toggle in the top-right corner.

Click the "Load unpacked" button.

Select the folder where you unzipped the project files.

The "Super Screenshot" extension will now appear in your extensions list and can be pinned to your toolbar.

## Project Structure

manifest.json: Defines the extension's permissions, properties, and file structure.

background.js: The service worker; acts as the main controller for the entire capture process.

content.js: Injected into the webpage to handle scrolling, UI elements (stop button), and metadata scraping.

offscreen.js: A background script that runs in a hidden document to perform the heavy-lifting of stitching images together.

db.js: A helper library for all IndexedDB database operations (saving, retrieving, deleting captures).

popup.html / popup.js: The small window that appears when you click the extension icon.

dashboard.html / dashboard.js: The page that displays the gallery of saved captures.

results.html / results.js: The page that displays the final screenshot and metadata for a single capture.