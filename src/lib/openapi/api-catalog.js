
/**
 * OpenAPI catalog.
 *
 * @author Chris Spiliotopoulos
 */

import _ from 'lodash';

export default class ApiCatalog {

  /**
   * Sets the internall collection
   * of APIs.
   * @param  {[type]}  apis [description]
   * @return {Boolean}      [description]
   */
  set apis(apis) {
    this._apis = apis;
    this._apis = _.sortBy(apis, 'title');
  }

  /**
   * Returns the list of APIs
   * @return {Boolean} [description]
   */
  get apis() {
    return this._apis;
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

  get tags() {
    return this._tags;
  }

  set tags(value) {
    this._tags = value;
  }

  get include() {
    return this._include;
  }

  set include(value) {
    this._include = value;
  }

  get maintainers() {
    return this._maintainers;
  }

  set maintainers(value) {
    this._maintainers = value;
  }

  get url() {
    return this._url;
  }

  set url(value) {
    this._url = value;
  }

  /**
   * Returns the length of the catalog.
   * @return {[type]} [description]
   */
  get length() {
    if (_.isEmpty(this._apis)) {
      return 0;
    }

    return this._apis.length;
  }

  /**
   * Returns a collection
   * of API categories.
   * @return {[type]} [description]
   */
  get categories() {
    if (_.isEmpty(this._apis)) {
      return [];
    }

    // get an array of categories
    let categories = _.map(this._apis, (o) => o.categories);
    categories = _.flattenDeep(categories);
    categories = _.compact(categories);
    categories = _.uniq(categories);
    categories = _.sortBy(categories);

    return categories;

  }


}
