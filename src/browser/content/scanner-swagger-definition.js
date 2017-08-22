/**
 * Swagger content detector.
 *
 * @author Chris Spiliotopoulos
 */

import jsyaml from 'js-yaml';

export default (function() {

  // only allow the following
  // content types:
  const VALID_MIME_TYPES = [
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

        // is this a valid YAML or JSON document?
        content = jsyaml.load(content);

        // check for the 'swaggerVersion' attribute
        if ((typeof content.swaggerVersion === 'undefined') &&
          (typeof content.swagger === 'undefined')) {
          throw new Error('Not a Swagger document');
        }

        // get the title
        const title = (typeof content.info.title !== 'undefined' ? content.info.title : null);

        const message = {
          channel: 'content',
          topic: 'openapi.detected',
          data: {
            url,
            title
          }
        };

        // return the message
        resolve(message);

      } catch (e) {
        reject(e);
      }
    });
  };


  return {

    /*
     * Public
     */
    scan: _scan

  };

}());
