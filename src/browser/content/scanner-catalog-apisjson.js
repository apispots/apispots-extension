/**
 * OpenAPI content detector.
 *
 * @author Chris Spiliotopoulos
 */

import jsyaml from 'js-yaml';


export default (function() {

  // only allow the following
  // content types:
  const VALID_MIME_TYPES = [
    'text/html',
    'text/plain',
    'application/json',
    'text/yaml',
    'application/vnd.github+json',
    'application/vnd.github.v3+json',
    'application/vnd.github.v3.raw+json',
    'application/vnd.github.v3.text+json',
    'application/vnd.github.v3.html+json',
    'application/vnd.github.v3.full+json'
  ];

  const VALID_FILE_NAMES = [
    'api.json',
    'apis.json',
    'apis.yaml',
    'apis.txt'
  ];

  /**
   * Scans for possible OpenAPI spec.
   * @return {[type]} [description]
   */
  const _scan = function(document) {

    // get the document's content type
    const contentType = document.contentType;

    // get the outer text of the page body
    let content = document.body.textContent;
    const url = document.URL;

    return new Promise((resolve, reject) => {


      try {

        if (VALID_MIME_TYPES.indexOf(contentType) === -1) {
          throw new Error('Invalid content type');
        }

        const message = {
          channel: 'content',
          topic: 'catalog.apisjons.detected',
          data: {}
        };


        if (contentType === 'text/html') {

          const data = _scanHtmlFolLinkRelation(document);
          message.data = data;

          // return the message
          resolve(message);
        } else {

          // check if the resource name matches
          // any of the valid file names
          const res = VALID_FILE_NAMES.map((filename) => {
            if (url.toLowerCase().endsWith(filename)) {
              return true;
            }

            return false;
          });

          if (res.indexOf(true) === -1) {
            throw new Error('Not a valid APIS.json resource');
          }

          // is this a valid YAML or JSON document?
          content = jsyaml.load(content);

          // check for the 'swaggerVersion' attribute
          if ((typeof content.specificationVersion === 'undefined') ||
            (typeof content.name == 'undefined') ||
            (typeof content.url == 'undefined')) {
            throw new Error('Not a valid APIS.json resource');
          }

          // set the message data
          message.data = {
            url,
            name: content.name,
            image: content.image
          };

          // return the message
          resolve(message);

        }
      } catch (e) {
        reject(e);
      }
    });
  };


  /**
   * Scans the HTML content for
   * possible link relation that
   * points to an APIs.json catalog.
   * @param  {[type]} content [description]
   * @return {[type]}         [description]
   */
  const _scanHtmlFolLinkRelation = function(document) {

    const match = document.querySelector('link[rel=api]');

    if (!match) {
      throw new Error('no API link found');
    }

    // get the link attributes
    const url = match.getAttribute('href');
    const title = match.getAttribute('title');

    const data = {
      type: 'link',
      url,
      name: title
    };

    return data;
  };


  return {

    /*
     * Public
     */
    scan: _scan

  };

}());
