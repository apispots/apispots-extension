/**
 * Legacy Swagger 2 API definition.
 *
 * @author Chris Spiliotopoulos
 */
import _ from 'lodash';

import ApiDefinition from './api-definition';
import GraphUtils from '../utils/utils-graph';

export default class SwaggerApiDefinition extends ApiDefinition {

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

    const schemas = _
      .chain(_.cloneDeep(this.spec.definitions))
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

    if (_.isEmpty(this.spec.definitions) ||
      (typeof this.spec.definitions[id] === 'undefined')) {
      return null;
    }

    // get the original spec definition
    const definition = _.cloneDeep(this.spec.definitions[id]);

    // enrich it
    if (_.isEmpty(definition.properties)) {
      delete definition.properties;
    } else {
      _.each(definition.properties, (o, key) => {

        o.name = key;

        // check if the prop is a ref
        if (typeof o.$$ref !== 'undefined') {

          // enrich the model with the reference Id
          const id = o.$$ref.split('#/definitions/')[1];
          o.type = id;
        }

        // process array of definitions
        if (o.type === 'array') {
          if ((!_.isEmpty(o.items)) &&
            (!_.isEmpty(o.items.$$ref))) {
            const id = o.items.$$ref.split('#/definitions/')[1];
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

      // process parameter references
      _.each(o.parameters, (p) => {
        if (p.in === 'body') {

          if ((typeof p.schema !== 'undefined') &&
            (typeof p.schema.$$ref !== 'undefined')) {
            const parts = p.schema.$$ref.split('/');
            const schema = parts[parts.length - 1];
            p.schema = schema;
            p.hasSchema = true;

          } else if ((typeof p.schema !== 'undefined') &&
            (typeof p.schema.items !== 'undefined') &&
            (typeof p.schema.items.$$ref !== 'undefined')) {
            const parts = p.schema.items.$$ref.split('/');
            const schema = parts[parts.length - 1];
            p.type = p.schema.type;
            p.schema = schema;
            p.hasSchema = true;
          }
        }
      });

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
            const parts = o.schema.items.$$ref.split('/');
            const schema = parts[parts.length - 1];
            obj.schema = schema;
          } else if (_.has(o.schema, '$$ref')) {
            const parts = o.schema.$$ref.split('/');
            const schema = parts[parts.length - 1];
            obj.schema = schema;
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
          description: (_.isEmpty(o.description) ? o.summary : o.description),
          deprecated: o.deprecated
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

    const definitions = _.cloneDeep(this.spec.securityDefinitions);

    // supported types so far
    const supported = ['basic', 'apiKey'];

    // check if type is supported
    _.each(definitions, (o, key) => {

      // the security definition name
      o.name = key;

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

  /**
   * Returns the mapped response
   * status description for the
   * given operation and status.
   * @param  {[type]} opId   [description]
   * @param  {[type]} status [description]
   * @return {[type]}        [description]
   */
  getOperationResponseDescription(opId, status) {

    let description = '';

    try {

      const operation = this.getOperation(opId);

      // check if the responses section
      // has such a status entry
      if (_.has(operation.responses, status)) {
        description = operation.responses[status].description;
      }

    } catch (e) {
      console.error(e);
    }

    return description;
  }

  /**
   * Returns the schema of a
   * specific response code.
   * @param  {[type]} opId   [description]
   * @param  {[type]} status [description]
   * @return {[type]}        [description]
   */
  getResponseSchemaDefinition(opId, status) {

    const obj = {};

    try {

      const operation = this.getOperation(opId);

      const response = operation.responses[status];

      if (_.isEmpty(response)) {
        throw new Error(`Respose definition not found for status ${status}`);
      }

      if (!_.isEmpty(response.schema)) {
        obj.type = response.schema.type;

        // is this a collection of objects?
        if ((typeof response.schema.items !== 'undefined') &&
          (typeof response.schema.items.$$ref !== 'undefined')) {
          obj.schema = response.schema.items.$$ref.replace('#/definitions/', '');
        } else if (_.has(response.schema, '$$ref')) {
          obj.schema = response.schema.$$ref.replace('#/definitions/', '');
        }
      }

    } catch (e) {
      // silent
    }

    return obj;
  }

  /**
   * Returns a list of all
   * tags found within the
   * definition.
   * @return {[type]} [description]
   */
  get tags() {

    let tags = [];

    // get the top level tags first
    // that are shared among operations
    if (_.has(this.spec, 'tags')) {
      _.each(this.spec.tags, (o) => {
        tags.push({
          name: o.name,
          description: o.description
        });
      });
    }

    // now get all tags from
    // operations
    const ops = this.operations;

    _.each(ops, (o) => {

      _.each(o.tags, (tag) => {

        // check if the tag is
        // already included in the list
        const matches = _.find(tags, { name: tag });

        // console.log(matches);
        // add the tag only if it
        // doesn't exist
        if (_.isEmpty(matches)) {

          tags.push({
            name: tag
          });
        }
      });
    });

    tags = _.sortBy(tags, 'name');

    return tags;
  }

  /**
   * Returns a filtered list of
   * operations by a list
   * of verbs.
   * @param  {[type]} tag [description]
   * @return {[type]}     [description]
   */
  filterOperations({ verbs, tag, keywords, allowedOnly = false, sortBy } = {}) {

    let ops = this.operations;

    // allowed verbs only?
    if (allowedOnly) {
      if (!_.isEmpty(this._allowedVerbs)) {
        if (_.isEmpty(verbs)) {
          verbs = [];
        }

        // add the allowed only verbs as filter
        verbs = verbs.concat(this._allowedVerbs);
        verbs = _.uniq(verbs);
      }
    }

    // filter by verbs
    if (typeof verbs !== 'undefined') {

      if (typeof verbs === 'string') {
        verbs = [verbs];
      }

      ops = _.filter(ops, (o) => {

        const matches = _.find(verbs, (v) => {
          if (v.toLowerCase() === o.verb.toLowerCase()) {
            return true;
          }
          return false;
        });

        if (matches) {
          return true;
        }
        return false;
      });
    }

    // filter by tag
    if (typeof tag !== 'undefined') {
      ops = _.filter(ops, (o) => {

        const matches = _.find(o.tags, (t) => {
          if (t.toLowerCase() === tag.toLowerCase()) {
            return true;
          }
          return false;
        });

        if (matches) {
          return true;
        }
        return false;
      });
    }

    // filter by keywords
    if (typeof keywords !== 'undefined') {

      // if string convert to array
      if (typeof keywords === 'string') {
        keywords = [keywords];
      }

      ops = _.filter(ops, (o) => {

        // get the summary in lower case
        const summary = o.summary.toLowerCase();

        let matches = 0;

        // go through the keywords
        _.each(keywords, (word) => {

          word = word.toLowerCase().trim();

          // check if the word is included in the summary
          if (_.includes(summary, word.toLowerCase())) {
            matches += 1;
          }
        });

        return matches === keywords.length;
      });
    }

    // map the result set
    ops = _.map(ops, (o) => ({
      id: o.operationId,
      summary: o.summary,
      description: o.description
    }));

    // sort by given attribute
    if (typeof sortBy !== 'undefined') {
      ops = _.sortBy(ops, sortBy);
    }

    return ops;
  }

}
