
/**
 * Data story model.
 *
 * @author Chris Spiliotopoulos
 */

import jsyaml from 'js-yaml';

export default class DataStory {

  /**
   * Constructor
   * @param  {[type]} [definition=null}={}] [description]
   * @return {[type]}                       [description]
   */
  constructor({definition}={}) {

    // parse any provided definition
    if (typeof definition !== 'undefined') {
      if (typeof definition === 'string') {
        this._definition = jsyaml.safeLoad(definition);
      } else if (typeof definition === 'object') {
        this._definition = definition;
      }
    } else {
      // instantiate with empty object
      this._definition = {
        parts: []
      };
    }
  }

  /**
   * Sets the story Id
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  set id(id) {
    this._definition.id = id;
  }

  /**
   * Returns the story Id
   * @return {[type]} [description]
   */
  get id() {
    return this._definition.id;
  }

  /**
   * Returns the story definition.
   * @return {[type]} [description]
   */
  get definition() {
    return this._definition;
  }

  /**
   * Returns the parts of
   * a story definition.
   * @return {[type]} [description]
   */
  get parts() {
    if (!this._definition) {
      throw new Error('Invalid story definition');
    }

    return this._definition.parts;
  }

  /**
   * Returns the Open API
   * spec URL.
   * @return {[type]} [description]
   */
  get spec() {
    if (!this._definition) {
      throw new Error('Invalid story definition');
    }

    return this._definition.spec;
  }

  /**
   * Sets the API spec URL
   * within the story definition.
   * @param  {[type]} url [description]
   * @return {[type]}     [description]
   */
  set spec(url) {
    if (!this._definition) {
      throw new Error('Invalid story definition');
    }

    this._definition.spec = url;
  }

  /**
   * Dumps the story in YAML format.
   * @return {[type]} [description]
   */
  toYAML() {
    return jsyaml.safeDump(this._definition);
  }

}
