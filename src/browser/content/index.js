/**
 * Content script main.
 * @type {[type]}
 */

import ScannerSwagger from './scanners/swagger';
import ScannerOpenApi from './scanners/openapi';
import ScanneApisJsonCatalog from './scanners/apisjson-catalog';
import Storage from '../../lib/common/browser-storage';

// list of supported content scanners
const SCANNERS = [
  new ScannerSwagger(),
  new ScannerOpenApi(),
  new ScanneApisJsonCatalog()
];


(async () => {

  let match = false;
  let message = null;

  // check doc with all registered scanners
  for (const scanner of SCANNERS) {

    try {

      // scan the document
      message = await scanner.scan(document);

      // document is matched
      match = true;
      break;

    } catch (e) {
      // fail silently
    }

  }

  if (match) {
    // if the URL is for a local file,
    // store its contents in local storage
    const url = document.URL;
    const content = document.body.textContent;
    const items = {};
    items[url] = content;

    if (url.startsWith('file://')) {
      Storage.local.set(items);
    }

    // publish the action message to the runtime
    chrome.runtime.sendMessage(undefined, message, undefined);
    console.log(chrome);
    chrome.tabs.executeScript({
      code: 'document.body.style.backgroundColor="orange"'
    });


    // $('body').children().remove();

  }


})();
