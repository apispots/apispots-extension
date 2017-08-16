import postal from 'postal';

import notifications from './notifications';

/**
 * Open API spots handler.
 *
 * @author Chris Spiliotopoulos
 */
export default (function() {

  /**
   * Called when an Open API
   * definition is to be opened.
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  const _onOpenApiDefinition = function(data) {
    try {

      const query = {
        active: true,
        currentWindow: true
      };

      // get the Open API URL
      const url = `pages/openapis.html?spec=${data.url}`;

      chrome.tabs.query(query, (tabs) => {
        if (tabs.length === 0) {
          return;
        }

        chrome.tabs.create({
          active: true,
          url
        });
      });

    } catch (e) {
      console.error(e);
    }
  };


  /**
   * Called when the content scanner
   * has detected an Open API spec.
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  const _onOpenApiDetected = function(data) {
    try {

      // show a notification to the user
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/images/logos/logo-64.png',
        title: 'The API Spots',
        message: `This page describes an Open API titled '${data.title}'.`,
        contextMessage: 'Click to explore'
      }, (notificationId) => {

        // add it to the notifications map
        notifications.addToMap(notificationId, {
          channel: 'openapis',
          topic: 'openapi.definition.open',
          data: {
            url: data.url
          }
        });
      });

    } catch (e) {
      console.error(e);
    }
  };

  /*
   * Subscribe to events
   */
  postal.subscribe({
    channel: 'openapis',
    topic: 'openapi.definition.open',
    callback: _onOpenApiDefinition
  });

  postal.subscribe({
    channel: 'content',
    topic: 'openapi.detected',
    callback: _onOpenApiDetected
  });


}());
