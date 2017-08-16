/**
 * Content script main.
 * @type {[type]}
 */

import ScannerOpenApi from './scanner-openapi';
import ScannerCatalogApisJson from './scanner-catalog-apisjson';

// list of supported content scanners
const SCANNERS = [
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

      const message = resolved[0].message;

      // publish the action message to the runtime
      chrome.runtime.sendMessage(undefined, message, undefined);
    }
  })
  .catch((err) => {
    console.error(err);
  });
