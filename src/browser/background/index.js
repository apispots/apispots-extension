import postal from 'postal';

import './browser-actions';
import './spots-openapi';
import './spots-catalog';

/**
 * [channel description]
 * @type {[type]}
 */
chrome.browserAction.onClicked.addListener(() => {
  try {
    postal.publish({
      channel: 'browser',
      topic: 'browserAction.clicked'
    });
  } catch (e) {
    console.error(e);
  }
});

/**
 * Listens to all Chrome
 * runtime messages.
 * @type {[type]}
 */
chrome.runtime.onMessage.addListener((message) => {

  // broadcast the event
  postal.publish(message);
});
