import postal from 'postal';

import notifications from './notifications';


/**
 * Browser actions handler.
 *
 * @author Chris Spiliotopoulos
 */
export default (function() {

  /**
   * Called when user has clicked on
   * the browser action
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  const _onBrowserActionClicked = function() {
    try {

      const query = {
        active: true,
        currentWindow: true
      };

      chrome.tabs.query(query, (tabs) => {
        if (tabs.length === 0) {
          return;
        }

        chrome.tabs.create({
          active: true,
          url: 'pages/openapis.html'
        });
      });

    } catch (e) {
      console.error(e);
    }
  };


  /**
   * When a notification about an
   * available update is received,
   * display a notification to the user.
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  const _onExtensionUpdateAvailable = function(data) {
    try {

      // get the version info
      const version = data.version;

      // split the version semantic parts
      const parts = version.split('.');

      let isMajorOrMinor = true;

      if ((parts.length === 3) &&
          (parts[2] !== '0')) {
        isMajorOrMinor = false;
      }

      // show a notification to the user
      // only this is a major or minor release
      if (isMajorOrMinor) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'assets/images/logos/logo-64.png',
          title: 'API Spots update available!',
          message: `The latest version ${data.version} is available for update and will be automatically installed when Chrome is restarted.`,
          contextMessage: 'Click to find out more'
        }, (notificationId) => {

          // add it to the notifications map
          notifications.addToMap(notificationId, {
            channel: 'extension',
            topic: 'update notification clicked',
            data
          });
        });
      }

    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Called when the user has clicked the
   * extension update notification.
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  const _onUpdateNotificationClicked = function() {
    const query = {
      active: true,
      currentWindow: true
    };

    // open a new tab
    // and redirect to website
    chrome.tabs.query(query, (tabs) => {
      if (tabs.length === 0) {
        return;
      }

      chrome.tabs.create({
        active: true,
        url: 'https://apispots.github.io/releases'
      });
    });
  };


  /*
   * Subscribe to events
   */
  postal.subscribe({
    channel: 'browser',
    topic: 'browserAction.clicked',
    callback: _onBrowserActionClicked
  });

  postal.subscribe({
    channel: 'extension',
    topic: 'update available',
    callback: _onExtensionUpdateAvailable
  });

  postal.subscribe({
    channel: 'extension',
    topic: 'update notification clicked',
    callback: _onUpdateNotificationClicked
  });


}());
