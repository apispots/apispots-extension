import jsyaml from 'js-yaml';


/**
 * Scanner that detects Swagger
 * API definitions.
 *
 * @author Chris Spiliotopoulos
 */

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

const VALID_FILE_NAMES = [
  '.json',
  '.yaml'
];

export default class SwaggerScanner {


  /**
   * Scans the document.
   *
   * @param  {[type]}  document [description]
   * @return {Promise}          [description]
   */
  async scan(document) {

    // get the document's content type
    const {contentType} = document;

    // get the outer text of the page body
    let content = document.body.textContent;
    const url = document.URL;

    // check if the resource name matches
    // any of the valid file names
    const res = VALID_FILE_NAMES.map((filename) => {
      if (url.toLowerCase().endsWith(filename)) {
        return true;
      }

      return false;
    });

    if (res.indexOf(true) === -1) {
      throw new Error('Not a valid Swagger resource');
    }

    if (VALID_MIME_TYPES.indexOf(contentType) === -1) {
      throw new Error('Invalid content type');
    }

    // is this a valid YAML or JSON document?
    content = jsyaml.load(content);

    // check for the 'swaggerVersion' attribute
    if ((typeof content.swaggerVersion === 'undefined')
      && (typeof content.swagger === 'undefined')) {
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

    return message;


  }


}
