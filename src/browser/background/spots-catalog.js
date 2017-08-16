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
  const _onOpenCatalogDefinition = function(data) {
    try {

      const query = {
        active: true,
        currentWindow: true
      };

      // get the Open API URL
      const url = `pages/openapis.html?catalogUrl=${data.url}`;

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
   * has detected an APIS.json catalog.
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  const _onCatalogApisJsonDetected = function(data) {
    try {

      const icon = (typeof data.image !== 'undefined' ? data.image : 'assets/images/logos/logo-64.png');

      let term = 'describes';

      if (data.type === 'link') {
        term = 'links to';
      }

      // show a notification to the user
      chrome.notifications.create({
        type: 'basic',
        iconUrl: icon,
        title: 'The API spots',
        message: `This page ${term} an APIs.json catalog titled '${data.name}'.`,
        contextMessage: 'Click to explore'
      }, (notificationId) => {

        // add it to the notifications map
        notifications.addToMap(notificationId, {
          channel: 'openapis',
          topic: 'catalog.definition.open',
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
    topic: 'catalog.definition.open',
    callback: _onOpenCatalogDefinition
  });

  postal.subscribe({
    channel: 'content',
    topic: 'catalog.apisjons.detected',
    callback: _onCatalogApisJsonDetected
  });


}());
