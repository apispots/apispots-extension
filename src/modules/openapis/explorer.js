/**
 * OpenAPI explorer.
 * @return {[type]} [description]
 */
import * as _ from 'lodash';
import postal from 'postal';

import graph from './graph';
import '../../../extension/templates/modules/openapis/explorer/module.css';

import tplBody from '../../../extension/templates/modules/openapis/explorer/index.hbs';
import tplGeneral from '../../../extension/templates/modules/openapis/explorer/general.hbs';
import tplDefinitions from '../../../extension/templates/modules/openapis/explorer/definitions.hbs';
import tplDefinition from '../../../extension/templates/modules/openapis/explorer/definition.hbs';
import tplSecurityDefinitions from '../../../extension/templates/modules/openapis/explorer/security.hbs';
import tplOperations from '../../../extension/templates/modules/openapis/explorer/operations.hbs';
import tplOperation from '../../../extension/templates/modules/openapis/explorer/operation.hbs';
import tplPaths from '../../../extension/templates/modules/openapis/explorer/paths.hbs';
import tplGraph from '../../../extension/templates/modules/openapis/explorer/graph.hbs';

export default (function() {

  /*
   * Private
   */
  let _api = null;


  /**
   * Renders the provided Open API
   * definition.
   * @param  {[type]} openapi [description]
   * @return {[type]}         [description]
   */
  const _render = function(openapi) {
    return new Promise((resolve, reject) => {
      try {

        if (_.isEmpty(openapi)) {
          throw new Error('Invalid Open API specification');
        }

        // set the Open API instance
        _api = openapi;

        // render the body
        const html = tplBody(openapi.spec);

        // render the body
        $('body').html(html);

        // scroll to top
        window.scrollTo(0, 0);

        // attach event listeners
        _attachListeners();

        let section = 'general';

        // check if there is a selected
        // section in the hashbang
        if (window.location.hash) {
          const hash = window.location.hash.replace('#', '');

          // check if the section exists
          if ($(`.menu .item[data-section='${hash}']`).length > 0) {
            section = hash;
          }
        }

        // render the selected section
        $(`.menu .item[data-section='${section}']`).trigger('click');

        // done
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Attaches all event listeners
   * @return {[type]} [description]
   */
  const _attachListeners = function() {

    // menu sections
    $('.menu .item[data-section]').on('click', _renderSection);

  };

  /**
   * Renders a section.
   * @return {[type]} [description]
   */
  const _renderSection = function() {
    const section = $(this).attr('data-section');

    if (section === 'general') {
      _renderGeneral();
    } else if (section === 'definitions') {
      _renderDefinitions();
    } else if (section === 'security') {
      _renderSecurity();
    } else if (section === 'operations') {
      _renderOperations();
    }

    // change the hashbang
    window.location.hash = `#${section}`;

    // scroll to top
    window.scrollTo(0, 0);

    // mark the menu item as active
    $('.menu .item[data-section]').removeClass('active');
    $(this).addClass('active');

  };


  /**
   * Renders the general section
   * @return {[type]} [description]
   */
  const _renderGeneral = function() {
    try {

      const spec = _api.spec;

      const data = {
        info: spec.info,
        host: spec.host,
        basePath: spec.basePath,
        tags: spec.tags,
        schemes: spec.schemes,
        externalDocs: spec.externalDocs

      };

      const html = tplGeneral(data);
      $('#content').html(html);


    } catch (e) {
      console.error(`Failed to render General section - ${e}`);
    }
  };

  /**
   * Renders the definitions section
   * @return {[type]} [description]
   */
  const _renderDefinitions = function() {
    try {

      const spec = _api.spec;

      const data = {
        definitions: spec.definitions
      };

      _.each(spec.definitions, (o) => {
        _.each(o.required, (key) => {
          o.properties[key].required = true;
        });
      });

      const html = tplDefinitions(data);
      $('#content').html(html);

      // listeners
      $('.card.definition .button').on('click', _renderDefinition);

    } catch (e) {
      console.error(`Failed to render General section - ${e}`);
    }
  };

  /**
   * Renders the security definitions section
   * @return {[type]} [description]
   */
  const _renderSecurity = function() {
    try {

      const spec = _api.spec;

      const data = {
        definitions: spec.securityDefinitions
      };

      const html = tplSecurityDefinitions(data);
      $('#content').html(html);

    } catch (e) {
      console.error(`Failed to render General section - ${e}`);
    }
  };

  /**
   * Displays the selected definition
   * details.
   * @param  {[type]} e [description]
   * @return {[type]}   [description]
   */
  const _renderDefinition = function() {
    const id = $(this).attr('data-id');

    // get the definition instance
    const definition = _.cloneDeep(_api.getDefinition(id));

    _.each(definition.properties, (o) => {
      // check if the prop is a ref
      if (typeof o.$$ref !== 'undefined') {
        // enrich the model with the reference Id
        const id = o.$$ref.replace('#/definitions/', '');
        o.type = id;
      }
    });

    const data = {
      id,
      definition
    };

    const html = tplDefinition(data);

    $(html)
      .modal({
        duration: 100
      })
      .modal('show');

    // listeners
    $('.view.definition').on('click', _renderDefinition);
  };


  /**
   * Renders the operations section
   * @return {[type]} [description]
   */
  const _renderOperations = function() {
    try {

      const data = {};

      const html = tplOperations(data);
      $('#content').html(html);

      // bind the menu listener
      $('.menu.presentation .item').on('click', function() {
        // render the selected operations view
        const id = $(this).attr('data-id');
        _onRenderOperationsView(id);
      });

      // render the API paths by default
      _onRenderOperationsView('paths');

    } catch (e) {
      console.error(`Failed to render General section - ${e}`);
    }
  };

  /**
   * Renders the selected operations view
   * by Id.
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  const _onRenderOperationsView = function(id = 'paths') {

    if (id === 'paths') {
      // default view
      _renderOperationPaths();
    } else if (id === 'graph') {
      _renderOperationsGraph();
    }

    // switch active item
    $('.menu.presentation .item').removeClass('active');
    $(`.menu.presentation .item[data-id="${id}"]`).addClass('active');
  };


  /**
   * Renders the API paths section
   * @return {[type]} [description]
   */
  const _renderOperationPaths = function() {
    try {

      const data = {
        paths: _api.paths
      };

      const html = tplPaths(data);
      $('#section-contents').html(html);

      // path link clicked
      $('a[data-type="path"]').on('click', function() {

        // get the path Id and dispatch the event
        const path = $(this).attr('data-id');
        postal.publish({
          channel: 'openapis',
          topic: 'openapi.path.operations',
          data: {
            path
          }
        });
      });

    } catch (e) {
      console.error(`Failed to render General section - ${e}`);
    }
  };


  /**
   * Renders the API paths section
   * @return {[type]} [description]
   */
  const _renderOperationsGraph = function() {
    try {

      const data = {};

      const html = tplGraph(data);
      $('#section-contents').html(html);

      // render the graph view
      graph.render('#graph', _api);

    } catch (e) {
      console.error(`Failed to render General section - ${e}`);
    }
  };

  /**
   * Displays a modal with
   * the operations details.
   * @param  {[type]} e [description]
   * @return {[type]}   [description]
   */
  const _renderOperationsModal = function(path) {
    try {
      // get the definition instance
      const definition = _.cloneDeep(_api.path(path));

      const data = {
        path,
        definition
      };

      // process operations
      _.each(definition, (o) => {

        // process parameter references
        _.each(o.parameters, (p) => {
          if (p.in === 'body') {

            if ((typeof p.schema !== 'undefined') &&
              (typeof p.schema.$$ref !== 'undefined')) {
              const schema = p.schema.$$ref.replace('#/definitions/', '');
              p.schema = schema;

            } else if ((typeof p.schema !== 'undefined') &&
              (typeof p.schema.items !== 'undefined') &&
              (typeof p.schema.items.$$ref !== 'undefined')) {
              const schema = p.schema.items.$$ref.replace('#/definitions/', '');
              p.type = p.schema.type;
              p.schema = schema;

            }
          }
        });

        // process security
        _.each(o.security, (s) => {
          o.security = _.map(s, (o, key) => ({
            definition: key,
            scopes: o
          }));
        });

        // process responses
        o.responses = _.map(o.responses, (o, key) => {
          const obj = {
            code: key,
            description: o.description
          };

          if (typeof o.schema !== 'undefined') {
            obj.type = o.schema.type;

            if ((typeof o.schema.items !== 'undefined') &&
              (typeof o.schema.items.$$ref !== 'undefined')) {
              obj.schema = o.schema.items.$$ref.replace('#/definitions/', '');
            }
          }

          return obj;
        });

        console.log(o.responses);

      });

      const html = tplOperation(data);

      const $html = $(html);

      const $modal = $html.modal({
        duration: 100
      });

      $modal.modal('show');

      const $tab = $('.menu .item', $html);
      $tab.tab();

      $('.modal .menu .item').on('click', function() {
        const verb = $(this).attr('data-tab');
        $('.modal .tab').removeClass('active');
        $tab.tab('change tab', verb);
        $modal.modal('refresh');
      });

      $modal.modal('refresh');

      // listeners
      $('.modal .view.definition').on('click', _renderDefinition);
    } catch (e) {
      // silent fail if path is undefined
    }
  };


  /**
   * Called when an API path operation
   * needs to be opened.
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  const _onOpenApiPathOperations = function(data) {

    // render the operations modal
    _renderOperationsModal(data.path);
  };


  // event listeners
  postal.subscribe({
    channel: 'openapis',
    topic: 'openapi.path.operations',
    callback: _onOpenApiPathOperations
  });

  return {

    /*
     * Public
     */
    render: _render

  };

}());
