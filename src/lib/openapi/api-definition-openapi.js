/**
 * Legacy Swagger 2 API definition.
 *
 * @author Chris Spiliotopoulos
 */
import _ from 'lodash';

import ApiDefinition from './api-definition';
import GraphUtils from '../utils/utils-graph';

export default class OpenApiDefinition extends ApiDefinition {

  /**
   * Returns the API title.
   * @return {[type]} [description]
   */
  get title() {
    return this.spec.info.title;
  }

  /**
   * Returns the list of
   * defined schema definitions.
   * @return {[type]} [description]
   */
  get schemas() {

    if (_.isEmpty(this.spec.components) &&
      _.isEmpty(this.spec.components.schemas)) {
      return null;
    }

    const schemas = _
      .chain(_.cloneDeep(this.spec.components.schemas))
      .map((o, key) => {
        o.name = key;
        return o;
      })
      .sortBy('name')
      .value();

    return schemas;
  }


  /**
   * Returns a definition by Id.
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  getDefinition(id) {

    if (_.isEmpty(this.spec.components) ||
      _.isEmpty(this.spec.components.schemas) ||
      _.isEmpty(this.spec.components.schemas[id])) {
      return null;
    }


    // get the original spec definition
    const definition = _.cloneDeep(this.spec.components.schemas[id]);

    // enrich it
    if (_.isEmpty(definition.properties)) {
      delete definition.properties;
    } else {
      _.each(definition.properties, (o, key) => {

        o.name = key;

        // check if the prop is a ref
        if (typeof o.$$ref !== 'undefined') {
          // enrich the model with the reference Id
          const id = o.$$ref.split('#/components/schemas/')[1];
          o.type = id;
        }

        // process array of definitions
        if (o.type === 'array') {
          if ((!_.isEmpty(o.items)) &&
            (!_.isEmpty(o.items.$$ref))) {
            const id = o.items.$$ref.split('#/components/schemas/')[1];
            o.items.type = id;
          }
        }

        // check for required properties
        if (_.includes(definition.required, o.name)) {
          o.required = true;
        }

      });
    }

    // return the definition
    return definition;
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

    const definition = _.cloneDeep(match);

    // process operations
    _.each(definition, (o) => {

      // process request body payload
      if (_.has(o, 'requestBody')) {

        // get the request body definition
        // const requestBody = o.requestBody;

        // if ((typeof p.schema !== 'undefined') &&
        //   (typeof p.schema.$$ref !== 'undefined')) {
        //   const schema = p.schema.$$ref.replace('#/components/schemas/', '');
        //   p.schema = schema;
        //   p.hasSchema = true;
        //
        // } else if ((typeof p.schema !== 'undefined') &&
        //   (typeof p.schema.items !== 'undefined') &&
        //   (typeof p.schema.items.$$ref !== 'undefined')) {
        //   const schema = p.schema.items.$$ref.replace('#/components/schemas/', '');
        //   p.type = p.schema.type;
        //   p.schema = schema;
        //   p.hasSchema = true;
        // }
      }

      // process responses
      o.responses = _.map(o.responses, (o, key) => {
        const obj = {
          code: key,
          description: o.description
        };

        if (typeof o.schema !== 'undefined') {
          obj.type = o.schema.type;

          // is this a collection of objects?
          if ((typeof o.schema.items !== 'undefined') &&
            (typeof o.schema.items.$$ref !== 'undefined')) {
            obj.schema = o.schema.items.$$ref.replace('#/definitions/', '');
          } else {
            obj.schema = o.schema.$$ref.replace('#/definitions/', '');
          }
        }

        return obj;
      });
    });

    return definition;
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


  /**
   * Returns the list of security
   * definitions.
   * @return {[type]} [description]
   */
  get securities() {

    const definitions = _.cloneDeep(this.spec.components.securitySchemes);

    // supported types so far
    const supported = ['basic', 'apiKey'];

    // check if type is supported
    _.each(definitions, (o, key) => {

      // the security definition name
      o.name = key;
      o.type = o.type;

      // TODO: To be removed in the future
      // in the case of HTTP type with BASIC scheme,
      // set the type as 'basic' for compatibility
      if (o.type === 'http') {
        o.type = 'basic';
      }

      if (_.includes(supported, o.type)) {
        o.supported = true;
      }

      // if type is 'basic' there are
      // no properties
      if (o.type !== 'basic') {
        o.hasProperties = true;
      }
    });

    return definitions;

  }


}
