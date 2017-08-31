/**
 * OpenAPI explorer.
 * @return {[type]} [description]
 */
import * as _ from 'lodash';
import postal from 'postal';
import asyncWaterfall from 'async/waterfall';
import swal from 'sweetalert2';

import StoryManager from '../../lib/stories/story-manager';
import BrowserStorage from '../../lib/common/browser-storage';
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
import tplStories from '../../../extension/templates/modules/openapis/explorer/stories.hbs';

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

        // set the bookmarked status
        _checkIfBookmarked();

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
    $('.menu .item[data-section]').on('click', (e) => {
      // get the selected section and render it
      const section = $(e.currentTarget).attr('data-section');
      _renderSection(section);
    });
    $('.menu .item[data-action="bookmark api"]').on('click', _bookmarkApi);
  };

  /**
   * Renders a section.
   * @return {[type]} [description]
   */
  const _renderSection = function(section) {

    if (section === 'general') {
      _renderGeneral();
    } else if (section === 'definitions') {
      _renderDefinitions();
    } else if (section === 'security') {
      _renderSecurity();
    } else if (section === 'operations') {
      _renderOperations();
    } else if (section === 'stories') {
      _renderStories();
    }

    // change the hashbang
    window.location.hash = `#${section}`;

    // scroll to top
    window.scrollTo(0, 0);

    // mark the menu item as active
    $('.menu .item[data-section]').removeClass('active');
    $(`.menu .item[data-section="${section}"]`).addClass('active');

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
        definitions: []
      };

      const definitions = _
        .chain(_.cloneDeep(spec.definitions))
        .map((o, key) => {
          o.name = key;
          return o;
        })
        .sortBy('name')
        .value();

      data.definitions = definitions;

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

    if (_.isEmpty(definition.properties)) {
      delete definition.properties;
    } else {
      _.each(definition.properties, (o) => {

        // check if the prop is a ref
        if (typeof o.$$ref !== 'undefined') {
          // enrich the model with the reference Id
          const id = o.$$ref.replace('#/definitions/', '');
          o.type = id;
        }

        // process array of definitions
        if (o.type === 'array') {
          if ((!_.isEmpty(o.items)) &&
               (!_.isEmpty(o.items.$$ref))) {
            const id = o.items.$$ref.replace('#/definitions/', '');
            o.items.type = id;
          }
        }

        console.log(o);
      });
    }

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
      $('.modal .button[data-action="create story"]').on('click', (e) => {

        // get the target operation Id
        const operationId = $(e.currentTarget).attr('data-operation');

        // render the data stories section
        _renderSection('stories');

        postal.publish({
          channel: 'stories',
          topic: 'create story',
          data: {
            api: _api,
            operationId
          }
        });

      });


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


  /**
   * Renders the data stories section.
   * @return {[type]} [description]
   */
  const _renderStories = function() {
    try {

      const model = {};

      asyncWaterfall([

        (cb) => {

          // get all stories associated with this spec
          StoryManager.getStoriesBySpec(_api.specUrl)
            .then((stories) => {
              // add them to the model
              model.stories = stories;
              cb();
            })
            .catch();
        },

        (cb) => {
          const html = tplStories(model);
          $('#content').html(html);

          cb();
        }

      ], (e) => {

        if (e) {
          console.error(e);
        }

        $('.cards .image').dimmer({
          on: 'hover'
        });

        // bind listeners
        $('.ui.dropdown').dropdown();

        // create a new story
        $('.item[data-id="new-story"], .button[data-action="create story"]').on('click', () => {

          postal.publish({
            channel: 'stories',
            topic: 'create story',
            data: {
              api: _api
            }
          });
        });

        // play a story
        $('.ui.cards.stories .story button[data-action="play story"]').on('click', (e) => {

          const $el = $(e.currentTarget);
          const storyId = $el.attr('data-id');

          postal.publish({
            channel: 'stories',
            topic: 'play story',
            data: {
              api: _api,
              storyId
            }
          });
        });

        // edit a story
        $('.ui.cards.stories .story button[data-action="edit story"]').on('click', (e) => {

          const $el = $(e.currentTarget);
          const storyId = $el.attr('data-id');

          postal.publish({
            channel: 'stories',
            topic: 'edit story',
            data: {
              api: _api,
              storyId
            }
          });
        });

        // delete a story
        $('.ui.cards.stories .story button[data-action="delete story"]').on('click', (e) => {

          const $el = $(e.currentTarget);
          const storyId = $el.attr('data-id');

          swal({
            title: 'Are you sure?',
            text: 'Do you really want to delete the selected data story?',
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
          }).then(() => {

            // delete the story from local storage
            StoryManager.delete(_api.specUrl, storyId)
              .then(() => {
                // reload
                _renderStories();
              });
          })
            .catch(() => {
              // silent
            });
        });

      });

    } catch (e) {
      console.error(`Failed to render Data stories section - ${e}`);
    }
  };

  /**
   * Bookmarks the current API spot.
   * @return {[type]} [description]
   */
  const _bookmarkApi = function(e) {

    try {

      // get the API details
      const specUrl = _api.specUrl;
      const title = _api.title;

      // check current state
      const $el = $(e.currentTarget);

      // get the collection of
      // bookmarked Open APIs
      // from local storage
      const key = 'openapis|bookmarks';
      let bookmarked = false;

      BrowserStorage.local.get(key, (items) => {

        let bookmarks = items[key];
        let bm;

        // look for the item first
        bm = _.find(bookmarks, {specUrl});

        // if already bookmarked, remove
        // it from the collection
        if (!_.isEmpty(bm)) {

          // remove bookmark from the collection
          _.remove(bookmarks, (o) => o.specUrl === specUrl);

        } else {

          // add bookmark to the collection
          if (_.isEmpty(bookmarks)) {
            bookmarks = [];
          }

          bm = {
            specUrl,
            title
          };

          bookmarks.push(bm);
          bookmarked = true;
        }

        // update the entry in local storage
        items = {};
        items[key] = bookmarks;

        BrowserStorage.local.set(items, () => {

          if (bookmarked) {
            $el.attr('data-bookmarked', '');
            $el.find('i.bookmark.icon').addClass('pink');

            // show an alert
            swal({
              title: 'Open API spot bookmarked!',
              text: 'You have created a bookmark for this API spot. Now you can easily access it from the main Open APIs page.',
              type: 'success',
              timer: 10000
            });

          } else {
            $el.attr('data-bookmarked', null);
            $el.find('i.bookmark.icon').removeClass('pink');
          }
        });
      });


    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Cheks whether the API spot
   * is bookmarked and sets the
   * status.
   * @return {[type]} [description]
   */
  const _checkIfBookmarked = function() {

    try {

      // get the API details
      const specUrl = _api.specUrl;

      // get the element
      const $el = $('.ui.menu .item[data-action="bookmark api"]');

      // get the collection of
      // bookmarked Open APIs
      // from local storage
      const key = 'openapis|bookmarks';

      BrowserStorage.local.get(key, (items) => {

        const bookmarks = items[key];

        // look for the item first
        const bm = _.find(bookmarks, {specUrl});

        // if already bookmarked, remove
        // it from the collection
        if (!_.isEmpty(bm)) {
          $el.attr('data-bookmarked', '');
          $el.find('i.bookmark.icon').addClass('pink');
        }
      });

    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Reloads the API stories section.
   * @return {[type]} [description]
   */
  const _onReloadStories = function() {
    _renderStories();
  };


  // event listeners
  postal.subscribe({
    channel: 'openapis',
    topic: 'openapi.path.operations',
    callback: _onOpenApiPathOperations
  });

  // event bindings
  postal.subscribe({
    channel: 'stories',
    topic: 'reload stories',
    callback: _onReloadStories
  });


  return {

    /*
     * Public
     */
    render: _render

  };

}());
