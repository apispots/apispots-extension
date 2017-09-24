/**
 * OpenAPI catalog service.
 *
 * @author Chris Spiliotopoulos
 */
import _ from 'lodash';
import axios from 'axios';
import ApiCatalog from 'apispots-lib-stories/lib/openapi/api-catalog';
import ApiCatalogEntry from 'apispots-lib-stories/lib/openapi/api-catalog-entry';

import BrowserStorage from '../common/browser-storage';

export default (function() {

  const PROVIDERS = [
    'apis.guru',
    'apistack'
  ];

  /**
   * Loads an Open API catalog
   * from different 3rd party
   * providers.
   * @param  {[type]} url  [description]
   * @param  {[type]} spec [description]
   * @return {[type]}      [description]
   */
  const _loadByProviderId = function(catalogId) {
    return new Promise((resolve, reject) => {

      try {

        if (PROVIDERS.indexOf(catalogId.toLowerCase()) === -1) {
          throw new Error('Unsupported catalog provider');
        }

        let promise;

        if (catalogId.toLowerCase() === 'apis.guru') {
          promise = _loadApisGuruCatalog();
        } if (catalogId.toLowerCase() === 'apistack') {
          promise = _loadApiStackCatalog();
        }

        promise
          .then((catalog) => {
            resolve(catalog);
          })
          .catch(reject);

      } catch (e) {
        reject(e);
      }
    });


  };

  /**
   * Loads the Apis Guru catalog.
   * @return {[type]} [description]
   */
  const _loadApisGuruCatalog = function() {
    return new Promise((resolve, reject) => {

      const url = 'https://api.apis.guru/v2/list.json';

      // fetch the catalog using their API
      axios.get(url)
        .then((response) => {

          // get the data
          const data = response.data;

          // transform to a collection
          const apis = _.map(data, (o, key) => {

            try {

              const api = new ApiCatalogEntry();
              api.id = key;

              // get the preferred version instance
              const version = o.preferred;
              const entry = o.versions[version];

              api.version = entry.info.version;
              api.created = entry.added;
              api.modified = entry.updated;
              api.spec = entry.swaggerYamlUrl;
              api.name = entry.info.title;
              api.description = entry.info.description;
              api.categories = entry.info['x-apisguru-categories'];
              api.provider = entry.info['x-providerName'];

              if (!_.isEmpty(entry.info['x-logo'])) {
                api.image = entry.info['x-logo'].url;
              }

              // return the API
              return api;

            } catch (e) {
              console.error(e);
            }

            return null;
          });

          // create a new catalog instance
          const catalog = new ApiCatalog();
          catalog.id = 'apis.guru';
          catalog.name = 'APIs Guru';
          catalog.description = 'The APIs Guru catalog';
          catalog.image = 'https://apis.guru/assets/images/logo.svg';
          catalog.url = 'https://api.apis.guru/v2/list.json';
          catalog.apis = apis;

          resolve(catalog);
        })
        .catch(reject);
    });
  };


  /**
   * Loads the Api Stack catalog.
   * @return {[type]} [description]
   */
  const _loadApiStackCatalog = function() {
    return new Promise((resolve, reject) => {

      const url = 'http://theapistack.com/apis.json';

      // fetch the catalog using their API
      axios.get(url)
        .then((response) => {

          // get the data
          const data = response.data;

          // create a new catalog instance
          const catalog = new ApiCatalog();
          catalog.id = 'apistack';
          catalog.name = 'The API Stack';
          catalog.description = data.description;
          catalog.image = data.image;
          catalog.url = data.url;
          catalog.created = data.created;
          catalog.modified = data.modified;
          catalog.tags = data.tags;
          catalog.apis = [];
          catalog.include = data.include;
          catalog.maintainers = data.maintainers;

          resolve(catalog);
        })
        .catch(reject);
    });
  };


  /**
   * Loads a catalog collection
   * from the given URL.
   * @param  {[type]} url [description]
   * @return {[type]}     [description]
   */
  const _loadByUrl = function(url) {
    return new Promise((resolve, reject) => {

      // fetch the catalog collection
      axios.get(url)
        .then((response) => {

          let data = response.data;

          // if array, get first element
          if (_.isArray(data)) {
            data = data[0];
          }

          // create a new catalog instance
          const catalog = new ApiCatalog();

          catalog.name = data.name;
          catalog.description = data.description;
          catalog.image = data.image;
          catalog.url = data.url;
          catalog.created = data.created;
          catalog.modified = data.modified;
          catalog.tags = data.tags;
          catalog.maintainers = data.maintainers;

          catalog['x-common'] = data['x-common'];

          _.each(catalog['x-common'], (p) => {

            // if property holds a value
            // that is a partial URL,
            // build the full version of it
            const url = p.url;
            const baseUrl = _.trimEnd(_.replace(catalog.url, 'apis.json', ''), '/');

            if ((!_.startsWith(url, 'http://'))
              && (!_.startsWith('https://'))) {
              p.url = `${baseUrl}${url}`;
            }
          });

          // transform to a collection
          const apis = _.map(data.apis, (o) => {

            try {

              const api = new ApiCatalogEntry();
              api.name = o.name;
              api.description = o.description;
              api.image = o.image;
              api.humanURL = o.humanURL;
              api.baseURL = o.baseURL;
              api.tags = o.tags;
              api.properties = o.properties;

              _.each(api.properties, (p) => {

                // if property holds a value
                // that is a partial URL,
                // build the full version of it
                const url = p.url;

                if ((!_.startsWith(url, 'http://'))
                  && (!_.startsWith('https://'))) {
                  p.url = `${api.baseURL}${url}`;
                }

                // try to detect the Open API spec URL
                // by matching potential keywords
                const type = _.toLower(p.type);

                if (_.includes(type, 'openapi') ||
                    _.includes(type, 'swagger')) {
                  api.spec = p.url;
                }
              });

              // return the API
              return api;

            } catch (e) {
              console.error(e);
            }

            return null;
          });

          catalog.apis = apis;
          catalog.include = data.include;

          resolve(catalog);
        })
        .catch(reject);
    });
  };


  /**
   * Returns a list of bookmarked API spots.
   * @return {[type]} [description]
   */
  const _getBookmarkedSpots = function() {
    return new Promise((resolve) => {

      // get the collection of
      // bookmarked Open APIs
      // from local storage
      const key = 'openapis|bookmarks';

      BrowserStorage.local.get(key, (items) => {

        // return the bookmarks
        const bookmarks = items[key];

        const out = _.chain(bookmarks)
          .orderBy(['title'])
          .value();

        resolve(out);
      });

    });
  };


  /**
   * Adds a spot bookmark
   * @param {[type]} specUrl [description]
   * @param {[type]} title   [description]
   */
  const _addBookmark = (specUrl, title) => new Promise((resolve, reject) => {

    try {
      if (_.isEmpty(specUrl)) {
        throw new Error('Undefined spec URL');
      }

      if (_.isEmpty(title)) {
        title = specUrl;
      }

      // get the collection of
      // bookmarked Open APIs
      // from local storage
      const key = 'openapis|bookmarks';

      BrowserStorage.local.get(key, (items) => {

        let bookmarks = items[key];
        let bm;

        // look for the item first
        bm = _.find(bookmarks, {specUrl});

        if (_.isEmpty(bm)) {

          // add bookmark to the collection
          if (_.isEmpty(bookmarks)) {
            bookmarks = [];
          }

          bm = {
            specUrl,
            title
          };

          bookmarks.push(bm);

          // update the entry in local storage
          items = {};
          items[key] = bookmarks;

          BrowserStorage.local.set(items, () => {
            resolve();
          });
        } else {
          // do nothing
          resolve();
        }

      });
    } catch (e) {
      reject(e);
    }
  });

  /**
   * Checks if a spot is bookmarked
   * @param  {[type]}  specUrl [description]
   * @return {Boolean}         [description]
   */
  const _isBookmarked = (specUrl) => new Promise(((resolve) => {

    const key = 'openapis|bookmarks';

    BrowserStorage.local.get(key, (items) => {

      const bookmarks = items[key];

      // look for the item first
      const bm = _.find(bookmarks, {specUrl});

      resolve(!_.isEmpty(bm));
    });

  }));


  /**
   * Removes a spot bookmark
   * @param {[type]} specUrl [description]
   * @param {[type]} title   [description]
   */
  const _removeBookmark = (specUrl) => new Promise((resolve) => {

    // get the collection of
    // bookmarked Open APIs
    // from local storage
    const key = 'openapis|bookmarks';

    BrowserStorage.local.get(key, (items) => {

      const bookmarks = items[key];

      // look for the item first
      const bm = _.find(bookmarks, {specUrl});

      if (!_.isEmpty(bm)) {

        // remove bookmark from the collection
        _.remove(bookmarks, (o) => o.specUrl === specUrl);

        // update the entry in local storage
        items = {};
        items[key] = bookmarks;

        BrowserStorage.local.set(items, () => {
          resolve();
        });
      } else {
        // do nothing
        resolve();
      }

    });

  });

  return {

    /*
     * Public
     */
    loadByProviderId: _loadByProviderId,
    loadByUrl: _loadByUrl,
    getBookmarkedSpots: _getBookmarkedSpots,
    addBookmark: _addBookmark,
    isBookmarked: _isBookmarked,
    removeBookmark: _removeBookmark

  };

}());
