/**
 * Cross-browser communicator module.
 *
 * @author Chris Spiliotopoulos
 */

export default (function() {

  /**
   * [event description]
   * @type {Object}
   */
  const _pushEventToApp = function(name, data) {
    try {
      const event = {
        channel: 'background',
        name,
        data
      };

      // push it
      chrome.runtime.sendMessage(undefined, event, undefined);

    } catch (e) {
      console.error(e);
    }
  };

  /**
   * [description]
   * @param  {[type]}   event    [description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  const _handleEvent = function(event, callback) {
    try {
      if (typeof this[event.name] !== 'function') {
        return;
      }

      // call the method applying the arguments
      this[event.name].apply(undefined, [event.data, callback]);

    } catch (e) {
      console.error(e);
    }
  };

  /**
   * [description]
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  const _onOpenInTab = function(data) {
    try {

      console.log('open in tab', data);

      const query = {
        active: true,
        currentWindow: true
      };

      chrome.tabs.query(query, (tabs) => {
        if (tabs.length === 0) {
          return;
        }

        const tab = tabs[0];

        chrome.tabs.create({
          active: true,
          url: 'pages/home.html'
        });

      });

    } catch (e) {
      console.error(e);
    }
  };

  return {

    /*
     * Public
     */
    onOpenInTab: _onOpenInTab,
    handleEvent: _handleEvent,
    pushEventToApp: _pushEventToApp

  };

}());
