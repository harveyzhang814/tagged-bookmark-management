# CrossTag Bookmarks Privacy Policy

Last Updated: November 25, 2025

Thank you for using the "CrossTag Bookmarks" Chrome extension. We take your privacy seriously and are committed to handling data in a transparent and minimal manner. This policy explains what information the extension collects, how it is used, and how you can control your data.

## Collection and Use

The extension only processes the following information locally or through Chrome's sync service:

- **Bookmark and Tag Data**: When you create, edit, or delete bookmarks or tags, we save the relevant records to `chrome.storage.sync` to enable synchronization across devices logged into the same account.
- **Interface Preferences**: Theme mode, recently visited tabs, and other preference settings are also stored in `chrome.storage.sync`.
- **Chrome Bookmark Import**: When you actively perform the "Import Chrome Bookmarks" action, the extension calls `chrome.bookmarks.getTree` to read the browser's built-in bookmark tree, solely for generating new extension bookmarks locally. This process does not upload or transmit data to any server.
- **Website Thumbnails**: To display favicons, the extension makes requests to Google's `https://www.google.com/s2/favicons` service, including the domain name of the bookmarked website. This call is only used to retrieve icons and does not include other user data.

Beyond the above scenarios, the extension does not collect, track, or share any personally identifiable information.

## Data Storage

- The extension does not operate its own servers.
- All data is stored locally in your browser or in Google-maintained `chrome.storage.sync`, protected by your Google account's sync and encryption mechanisms.
- You can delete bookmarks or tags at any time in the extension's options page, or remove the extension entirely through Chrome's extension management page to completely clear all data.

## Permission Explanations

- `storage`: Saves bookmarks and tags in `chrome.storage.sync`.
- `tabs`: Creates new tabs when opening the options page or site links from the popup.
- `bookmarks`: Reads the browser's native bookmark tree when you manually trigger an import.
- `contextMenus`: Provides a "Add to CrossTag Bookmarks" shortcut in the right-click menu.

The extension follows the principle of least privilege and does not access webpage content or collect browsing history.

## Policy Updates

If we make significant changes to our data practices, we will update this document and mark the effective date. Continued use of the extension indicates your acceptance of the latest policy.

## Contact

If you have any questions or suggestions, please submit an issue in the GitHub repository.
