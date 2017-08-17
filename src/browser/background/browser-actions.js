import postal from 'postal';


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


  /*
   * Subscribe to events
   */
  postal.subscribe({
    channel: 'browser',
    topic: 'browserAction.clicked',
    callback: _onBrowserActionClicked
  });


}());
