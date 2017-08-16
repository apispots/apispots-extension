import postal from 'postal';

/**
 * Notifications handler.
 *
 * @author Chris Spiliotopoulos
 */
export default (function() {

  // notifications map instance
  const _map = new Map();


  /**
   * Adds a notification Id and
   * related data to the map.
   * @param  {[type]} id   [description]
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  const _addToMap = function(id, data) {
    // add the entry in the map
    _map.set(id, data);
  };

  /**
   * Removes an entry from the map.
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  const _removeFromMap = function(id) {
    _map.delete(id);
  };


  /**
   * Listen for notification clicks
   * @type {[type]}
   */
  chrome.notifications.onClicked.addListener((notificationId) => {

    // get the entry from the map
    if (_map.has(notificationId)) {

      // get its data
      const data = _map.get(notificationId);

      // broadcast
      postal.publish({
        channel: data.channel,
        topic: data.topic,
        data: data.data
      });

      // clear the notification
      chrome.notifications.clear(notificationId, (id) => {
        // remove it from the map
        _removeFromMap(id);
      });
    }
  });

  /**
   * Listen for notifications closures.
   * @type {[type]}
   */
  chrome.notifications.onClosed.addListener((notificationId) => {
    // remove it from the map
    _removeFromMap(notificationId);
  });


  return {

    /*
     * Public API
     */
    addToMap: _addToMap,
    removeFromMap: _removeFromMap


  };

}());
