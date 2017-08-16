
/**
 * OpenAPI catalog entry class.
 *
 * @author Chris Spiliotopoulos
 */
import _ from 'lodash';


export default class ApiCatalogEntry {

  get id() {
    return this._id;
  }

  set id(value) {
    this._id = value;
  }

  get name() {
    return this._name;
  }

  set name(value) {
    this._name = value;
  }

  get description() {
    return this._description;
  }

  set description(value) {
    this._description = value;
  }

  get image() {
    return this._image;
  }

  set image(value) {
    this._image = value;
  }

  get humanURL() {
    return this._humanURL;
  }

  set humanURL(value) {
    this._humanURL = value;
  }

  get baseURL() {
    return this._baseURL;
  }

  set baseURL(value) {
    this._baseURL = value;
  }

  get categories() {
    return this._categories;
  }

  set categories(value) {
    this._categories = value;
  }

  get properties() {
    return this._properties;
  }

  set properties(value) {
    this._properties = value;
  }

  get contacts() {
    return this._contacts;
  }

  set contacts(value) {
    this._contacts = value;
  }

  get version() {
    return this._version;
  }

  set version(value) {
    this._version = value;
  }

  get spec() {

    // first check if the member is
    // explicitly set
    if (!_.isEmpty(this._spec)) {
      return this._spec;
    }

    // if not, check if some specific property is set
    if (!_.isEmpty(this.getProperty('x-openapi-spec'))) {
      return this.getProperty('x-openapi-spec');
    }

    // no spec found
    return null;
  }

  set spec(value) {
    this._spec = value;
  }

  get created() {
    return this._created;
  }

  set created(value) {
    this._created = value;
  }

  get modified() {
    return this._modified;
  }

  set modified(value) {
    this._modified = value;
  }

  get provider() {
    return this._provider;
  }

  set provider(value) {
    this._provider = value;
  }

  /**
   * Searches the properties
   * collection for the given property
   * name and if found, returns its value.
   * @param  {[type]} value [description]
   * @return {[type]}       [description]
   */
  getProperty(value) {
    if (_.isEmpty(this._properties)) {
      return null;
    }

    // try to find the property by name
    const filtered = _.filter(this._properties, (o) => {
      if (o.type.toLowerCase() === value.toLowerCase()) {
        return true;
      }
      return false;
    });

    if (_.isEmpty(filtered) || (filtered.length === 0)) {
      return null;
    }

    // return the first element only
    const prop = filtered[0];

    // return the value
    return prop.url;
  }
}
