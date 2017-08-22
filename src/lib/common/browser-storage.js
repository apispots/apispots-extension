/**
 * Browser storage Api.
 *
 * @author Chris Spiliotopoulos
 */

import PouchDB from 'pouchdb-browser';

export default (function() {

  let _db;

  /**
   *
   * @param  {[type]}   keys [description]
   * @param  {Function} cb   [description]
   * @return {[type]}        [description]
   */
  const _getLocal = function(keys, cb) {
    chrome.storage.local.get(keys, cb);
  };

  /**
   *
   * @param {[type]}   items [description]
   * @param {Function} cb    [description]
   */
  const _setLocal = function(items, cb) {
    chrome.storage.local.set(items, cb);
  };

  /**
   * [_removeLocal description]
   * @param  {[type]}   keys [description]
   * @param  {Function} cb   [description]
   * @return {[type]}        [description]
   */
  const _removeLocal = function(keys, cb) {
    chrome.storage.local.remove(keys, cb);
  };


  /**
   * Sets up the in-browser PouchDB store.
   */
  const _setup = function() {
    try {

      // create a new database instance
      _db = new PouchDB('apispots');
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Fetches a document from the
   * store.
   * @param  {[type]}   key [description]
   * @param  {Function} cb  [description]
   * @return {[type]}       [description]
   */
  const _get = function(key, cb) {

    // setup the database
    if (!_db) {
      _setup();
    }

    _db.get(key).then((doc) => {
      delete doc._id;
      delete doc._rev;

      cb(null, doc);

    }).catch((err) => {
      cb(err);
    });
  };

  /**
   * Creates / updates a document in the store.
   */
  const _put = function(key, data, cb) {

    // setup the database
    if (!_db) {
      _setup();
    }

    try {
      /*
       * fetch the document (if exists) and
       * update it
       */
      _db.get(key).then((doc) => {

        // merge the data
        for (const attr in data) {
          doc[attr] = data[attr];
        }

        // update the document
        return _db.put(data, key, doc._rev);

      }).then(() => {
        // all good
        cb();
      }).catch((err) => {

        if (err.status !== 404) {
          return cb(err);
        }

        if (!data) {
          return cb('No data to be stored');
        }

        /*
         * document doesn't exist, so set it's ID (key)
         */
        data._id = key;

        // and create it
        _db.put(data).then(() => {
          cb();
        }).catch((err) => {
          cb(err);
        });
      });

    } catch (e) {
      cb(e);
    }
  };

  /**
   * Removes a document from the
   * store by key.
   */
  const _remove = function(key, cb) {

    // setup the database
    if (!_db) {
      _setup();
    }

    // remove the document with this key
    _db.get(key).then((doc) => _db.remove(doc)).then((result) => {
      // handle result
      if (cb) {
        cb(null, result);
      }

    }).catch((err) => {
      if (cb) {
        cb(err);
      }
    });

  };

  return {

    /*
     * Public API
     */
    setup: _setup,
    get: _get,
    put: _put,
    remove: _remove,
    local: {
      set: _setLocal,
      get: _getLocal,
      remove: _removeLocal
    }


  };

}());
