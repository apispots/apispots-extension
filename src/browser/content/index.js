/**
 * Content script main.
 * @type {[type]}
 */
import async from 'async';

import ScannerSwagger from './scanner-swagger-definition';
import ScannerOpenApi from './scanner-openapi-definition';
import ScannerCatalogApisJson from './scanner-catalog-apisjson';
import Storage from '../../lib/common/browser-storage';

// list of supported content scanners
const SCANNERS = [
  ScannerSwagger,
  ScannerOpenApi,
  ScannerCatalogApisJson
];

/*
 * Execute all content scanners
 * in parallel using reflection,
 * so that failed promises won't
 * stop the flow
 */
const promises = SCANNERS.map((o) => {
  const p = o.scan(document);
  return p.then((message) => ({message, status: 'resolved' }),
    (e) => ({e, status: 'rejected' }));
});

Promise.all(promises)
  .then((results) => {

    // after all scanners have
    // completed, check if there
    // is at least one successful result
    const resolved = results.filter((o) => o.status === 'resolved');

    if (resolved.length > 0) {

      // one scanner has detected compatible content

      // get the first resolved message
      const {message} = resolved[0];

      async.waterfall([

        (cb) => {
          // if the URL is for a local file,
          // store its contents in local storage
          const url = document.URL;
          const content = document.body.textContent;
          const items = {};
          items[url] = content;
          if (url.startsWith('file://')) {
            Storage.local.set(items, cb);
          } else {
            cb();
          }
        }

      ], () => {

        // publish the action message to the runtime
        chrome.runtime.sendMessage(undefined, message, undefined);
      });

    }
  })
  .catch((err) => {
    console.error(err);
  });
