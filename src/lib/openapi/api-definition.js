/**
 * OpenAPI definition
 *
 * @author Chris Spiliotopoulos
 */
import Swagger from 'swagger-client';
import _ from 'lodash';
import async from 'async';
import jsyaml from 'js-yaml';

import Storage from '../common/browser-storage';
import GraphUtils from '../utils/utils-graph';

export default class ApiDefinition {

  /**
   * Creates a new ApiDefinition instance
   * using the OpenAPI definition.
   * @param  {[type]} openapi [description]
   * @return {[type]}         [description]
   */
  constructor(openapi) {

    if (_.isEmpty(openapi)) {
      throw new Error('A valid OpenAPI instance is required');
    }

    this.openapi = openapi;
  }


  /**
   * Loads a valid OpenAPI definition
   * from the provided URI and returns
   * the Swagger API instance.
   * @param  {[type]} url  [description]
   * @param  {[type]} spec [description]
   * @return {[type]}      [description]
   */
  static load({
    url,
    spec
  } = {}) {
    return new Promise((resolve, reject) => {

      try {

        // URI cannot be empty
        if (_.isEmpty(url) && _.isEmpty(spec)) {
          throw new Error('Either a URI or a valid Swagger spec should be provided');
        }

        // clone the original spec URL
        const originalUrl = _.clone(url);

        async.waterfall([

          (cb) => {
            // if the URL is for local file
            // check if the content is available
            // in local storage
            if ((typeof url !== 'undefined') &&
                (url.startsWith('file://'))) {
              spec = Storage.local.get([url], (data) => {
                if (!_.isEmpty(data)) {
                  spec = data[url];
                  url = undefined;
                  cb();
                }
              });
            } else {
              cb();
            }
          }

        ], (e) => {

          if (e) {
            reject(e);
          } else {

            // if spec is provided as a string,
            // convert it to an object
            if (typeof spec === 'string') {
              spec = jsyaml.load(spec);
            }

            // try to resolve the API definition
            // using either a URI or a spec
            new Swagger({
              url,
              spec
            })
              .then((openapi) => {
                const api = new ApiDefinition(openapi);

                // set the original Url of the definition
                api.specUrl = originalUrl;

                if (_.isEmpty(api.spec)) {
                  reject(new Error('Invalid Open API specification'));
                } else {
                  // return the API instance
                  resolve(api);
                }
              }, (err) => {
                reject(new Error(err.message));
              });
          }
        });

      } catch (e) {
        reject(e);
      }
    });

  }

  /**
   * Sets the spec URL.
   * @param  {[type]} url [description]
   * @return {[type]}     [description]
   */
  set specUrl(url) {
    this._specUrl = url;
  }

  /**
   * Returns the spec URL.
   * @return {[type]} [description]
   */
  get specUrl() {
    return this._specUrl;
  }

  /**
   * Returns the Open API client instance.
   * @return {[type]} [description]
   */
  get client() {
    return this.openapi;
  }

  /**
   * Returns the API spec
   * @return {[type]} [description]
   */
  get spec() {
    return this.openapi.spec;
  }

  /**
   * Returns the API title.
   * @return {[type]} [description]
   */
  get title() {
    try {
      const spec = this.openapi.spec;
      return spec.info.title;
    } catch (e) {
      // silent
    }
    return null;
  }

  /**
   * Returns a definition by Id.
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  getDefinition(id) {

    if (_.isEmpty(this.spec.definitions) ||
      (typeof this.spec.definitions[id] === 'undefined')) {
      return null;
    }

    // return the definition
    return this.spec.definitions[id];
  }

  /**
   * Returns an API operation
   * by Id.
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  getOperation(id) {
    if (_.isEmpty(id)) {
      return null;
    }

    let operation = null;

    _.each(this.spec.paths, (entry, path) => {
      _.each(entry, (op, verb) => {
        if (op.operationId === id) {
          operation = op;
          operation.path = path;
          operation.verb = verb;
        }
      });
    });

    return operation;
  }

  /**
   * Returns a sorted list of
   * API paths.
   * @return {[type]} [description]
   */
  get paths() {
    const paths = _.chain(this.spec.paths)
      .map((o, path) => {
        const obj = {
          path,
          verbs: _.keys(o).sort()
        };


        return obj;
      })
      .sortBy()
      .value();

    return paths;
  }

  /**
   * Returns the graph of paths
   * grouped at resource level.
   * @return {[type]} [description]
   */
  get pathsGraph() {

    const tree = {
      name: '',
      path: '/',
      children: []
    };

    // iterate all paths
    _.each(this.spec.paths, (o, path) => {

      // trim last '/' if there
      path = _.trimEnd(path, '/');

      // get the path definition
      const def = this.path(path);

      // get the operations
      const verbs = _.keys(def);

      // split the path into parts
      const parts = _.split(path, '/');

      // get the 1st level resource group
      const group = parts[1];

      // iterate through all parts and ensure
      // that nodes exist on the tree
      let pathPointer;
      _.each(parts, (o, idx) => {
        pathPointer = _.slice(parts, 0, idx + 1).join('/');

        if (pathPointer === '') {
          pathPointer = '/';
        }

        // check if the node already exists
        const node = GraphUtils.findNode(tree, pathPointer);

        if (!node) {

          // get the parent path
          let parentPath = '';

          if (pathPointer !== '/') {
            parentPath = _.slice(parts, 0, idx).join('/');
            parentPath = (parentPath === '' ? '/' : parentPath);
          }

          const parent = GraphUtils.findNode(tree, parentPath);

          if (parent) {
            // add it as a child node
            const node = {
              name: parts[idx],
              path: pathPointer,
              operations: verbs,
              part: parts[idx],
              parent: parent.path,
              group
            };

            if (_.isEmpty(parent.children)) {
              parent.children = [];
            }
            parent.children.push(node);
          }
        }
      });
    });

    return tree;
  }

  /**
   * Returns the definition of
   * the path item with the provided
   * Id.
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  path(id) {
    if (_.isEmpty(this.spec.paths)) {
      throw new Error('No paths have been defined in spec');
    }

    const paths = this.spec.paths;
    const match = _.find(paths, (o, key) => (_.trimEnd(key, '/') === _.trimEnd(id, '/')));

    if (_.isEmpty(match)) {
      throw new Error('Undefined path');
    }

    return match;
  }


  /**
   * Returns a list of all API
   * operations.
   * @return {[type]} [description]
   */
  get operations() {
    if (_.isEmpty(this.spec.paths)) {
      throw new Error('No paths have been defined in spec');
    }

    const paths = this.spec.paths;
    const operations = [];

    _.each(paths, (entry, path) => {
      _.each(entry, (op, verb) => {
        op.path = path;
        op.verb = verb;
        operations.push(op);
      });
    });

    return operations;
  }

  /**
   * Returns a compact list
   * of operations by summary and
   * Id.
   * @return {[type]} [description]
   */
  get operationsBySummary() {

    const ops = this.operations;

    const res = _.chain(ops)
      .map((o) => {

        // return a compact version of the operation
        const obj = {
          id: o.operationId,
          path: o.path,
          verb: o.verb,
          summary: o.summary,
          description: (_.isEmpty(o.description) ? o.summary : o.description)
        };
        return obj;
      })
      // sort by summary text
      .sortBy(['summary'])
      .value();

    return res;
  }

  /**
   * Returns a compact list
   * of operations grouped by path.
   * @return {[type]} [description]
   */
  get operationsByPath() {

    const ops = this.operationsBySummary;

    const res = _.chain(ops)
      // group by path
      .sortBy(['path'])
      .groupBy('path')
      .value();

    return res;
  }
}
