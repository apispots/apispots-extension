/**
 * Credentials managemer
 * implementation that uses
 * the local browser storage.
 *
 * @author Chris Spiliotopoulos
 */
import _ from 'lodash';
import CredentialsManager from 'apispots-lib-stories/lib/openapi/credentials-manager';

import BrowserStorage from '../common/browser-storage';

class BrowserCredentialsManager extends CredentialsManager {

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
  saveCredentials(specUrl, name, credentials) {

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
  }

  /**
   * Returns a stored set of credentials.
   * @param  {[type]} specUrl [description]
   * @param  {[type]} name    [description]
   * @return {[type]}         [description]
   */
  getCredentials(specUrl, name) {

    return new Promise((resolve) => {

      const key = `openapis|credentials|${specUrl}`;

      // get the entry from local storage
      BrowserStorage.local.get(key, (items) => {

        const entries = items[key] || {};
        const credentials = entries[name];

        resolve(credentials);
      });
    });
  }

  /**
   * Deletes the specific set of credentials.
   * @param  {[type]} specUrl [description]
   * @param  {[type]} name    [description]
   * @return {[type]}         [description]
   */
  deleteCredentials(specUrl, name) {

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
  }

  /**
   * Returns a list of named security
   * definitions that have been activated
   * for a given spec URL.
   * @param  {[type]} specUrl [description]
   * @return {[type]}         [description]
   */
  getActivatedBySpecUrl(specUrl) {

    return new Promise((resolve) => {

      const key = `openapis|credentials|${specUrl}`;

      // remove the entry from local storage
      BrowserStorage.local.get(key, (items) => {

        const entries = items[key] || {};

        const names = _.keys(entries);
        resolve(names);
      });
    });
  }

}

export default new BrowserCredentialsManager();
