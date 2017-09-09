/**
 * Authentication management service.
 *
 * @author Chris Spiliotopoulos
 */
import _ from 'lodash';

import BrowserStorage from '../common/browser-storage';

export default (function() {

  /*
   * Private
   */

  /**
    * Saves a set of authentication
    * credentials.
    * @param  {[type]} specUrl     [description]
    * @param  {[type]} name        [description]
    * @param  {[type]} credentials [description]
    * @return {[type]}             [description]
    */
  const _saveCredentials = function(specUrl, name, credentials) {

    return new Promise((resolve) => {

      // put in local storage
      const key = `openapis|credentials|${specUrl}`;

      // get the entry from local storage
      BrowserStorage.local.get(key, (items) => {

        const entries = items[key] || {};

        // set the credentials
        // as a named entry
        entries[name] = credentials;

        // update the entry in the store
        items = {};
        items[key] = entries;

        BrowserStorage.local.set(items, () => {
          resolve();
        });
      });
    });
  };

  /**
   * Returns a stored set of credentials.
   * @param  {[type]} specUrl [description]
   * @param  {[type]} name    [description]
   * @return {[type]}         [description]
   */
  const _getCredentials = function(specUrl, name) {

    return new Promise((resolve) => {

      const key = `openapis|credentials|${specUrl}`;

      // get the entry from local storage
      BrowserStorage.local.get(key, (items) => {

        const entries = items[key] || {};
        const credentials = entries[name];

        resolve(credentials);
      });
    });
  };

  /**
   * Deletes the specific set of credentials.
   * @param  {[type]} specUrl [description]
   * @param  {[type]} name    [description]
   * @return {[type]}         [description]
   */
  const _deleteCredentials = function(specUrl, name) {

    return new Promise((resolve) => {

      const key = `openapis|credentials|${specUrl}`;

      // remove the entry from local storage
      BrowserStorage.local.get(key, (items) => {

        const entries = items[key] || {};
        delete entries[name];

        // update the entry in the store
        items = {};
        items[key] = entries;

        if (_.isEmpty(entries)) {
          // if list is empty, remove it completely
          BrowserStorage.local.remove(key, () => {
            resolve();
          });
        } else {
          // update the list
          BrowserStorage.local.set(items, () => {
            resolve();
          });
        }
      });
    });
  };

  return {

    /*
     * Public
     */
    saveCredentials: _saveCredentials,
    getCredentials: _getCredentials,
    deleteCredentials: _deleteCredentials

  };

}());
