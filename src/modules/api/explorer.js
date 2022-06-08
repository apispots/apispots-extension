/**
 * OpenAPI explorer.
 * @return {[type]} [description]
 */
import * as _ from 'lodash';
import postal from 'postal';
import asyncMap from 'async/map';
import asyncWaterfall from 'async/waterfall';
import swal from 'sweetalert2';

import graph from '../api/graph';
import '../stories/story-viewer';
import '../stories/story-player';
import '../api/authentication';
import CatalogService from '../../lib/openapi/catalog-service';
import CredentialsManager from '../../lib/openapi/browser-credentials-manager';

import tplBody from '../../../extension/templates/modules/api/explorer/index.hbs';
import tplGeneral from '../../../extension/templates/modules/api/explorer/general.hbs';
import tplDefinition from '../../../extension/templates/modules/api/explorer/definition.hbs';
import tplSecurityDefinitions from '../../../extension/templates/modules/api/explorer/security.hbs';
import tplOperations from '../../../extension/templates/modules/api/explorer/operations.hbs';
import tplOperation from '../../../extension/templates/modules/api/explorer/operation.hbs';
import tplPaths from '../../../extension/templates/modules/api/explorer/paths.hbs';
import tplGraph from '../../../extension/templates/modules/api/explorer/graph.hbs';
import tplDefinitions from '../../../extension/templates/modules/api/explorer/definitions.hbs';


export default (function () {

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
  const _render = function (openapi, opts = {}) {

    return new Promise((resolve, reject) => {
      try {

        if (_.isEmpty(openapi)) {
          throw new Error('Invalid Open API specification');
        }

        // set the Open API instance
        _api = openapi;

        const model = {
          spec: openapi.spec,
          classes: _.chain(_api.schemas).sortBy('name').flatMap((o) => o.name).value(),
          operations: _.chain(_api.operations).sortBy('operationId').value()
        };

        // render the body
        const html = tplBody(model);

        // render the body
        $('body').html(html);

        // scroll to top
        window.scrollTo(0, 0);

        // attach event listeners
        _attachListeners();

        // render the general section
        const section = opts.section || 'general';
        _renderSection(section);

        // check if URL points to specific definition
        if (opts.definition) {
          _onDefinitionSelected(opts.definition);
        }

      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Attaches all event listeners
   * @return {[type]} [description]
   */
  const _attachListeners = function () {

    // menu sections
    $('.menu .item[data-section]').on('click', (e) => {
      // get the selected section and render it
      const section = $(e.currentTarget).attr('data-section');
      _renderSection(section);
    });

    // listeners
    $('.menu .item[data-item=\"definition\"]').on('click', (e) => {
      const id = $(e.currentTarget).attr('data-id');
      _onDefinitionSelected(id);
    });
    $('.menu .item[data-item=\"operation\"]').on('click', (e) => {
      const id = $(e.currentTarget).attr('data-id');
      _onOperationSelected(id);
    });


    $('.menu .item[data-action="bookmark api"]').on('click', _bookmarkApi);

    $('.ui.dropdown').dropdown();

    /**
     * initialize search box
     */

     var categoryContent = [
      { category: 'South America', title: 'Brazil' },
      { category: 'South America', title: 'Peru' },
      { category: 'North America', title: 'Canada' },
      { category: 'Asia', title: 'South Korea' },
      { category: 'Asia', title: 'Japan' },
      { category: 'Asia', title: 'China' },
      { category: 'Europe', title: 'Denmark' },
      { category: 'Europe', title: 'England' },
      { category: 'Europe', title: 'France' },
      { category: 'Europe', title: 'Germany' },
      { category: 'Africa', title: 'Ethiopia' },
      { category: 'Africa', title: 'Nigeria' },
      { category: 'Africa', title: 'Zimbabwe' },
    ];

    $('#searchbox')
      .search({
        type: 'category',
        minCharacters: 3,
        onSearchQuery: (query) => {
          console.log(query);
        }
      });

      
  };

  /**
   * Renders a section.
   * @return {[type]} [description]
   */
  const _renderSection = function (section) {

    if (section === 'general') {
      _renderGeneral();
    } else if (section === 'security') {
      _renderSecurity();
    } else if (section === 'graph') {
      _renderOperationsGraph();
    } else if (section === 'definitions') {
      _renderDefinitions();
    } else if (section === 'operations') {
      _renderOperations();
    }

    // update the URL without reloading
    if (history.pushState) {

      let newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;

      const query = new URLSearchParams();
      query.append("url", _api.openapi.specUrl);
      query.append("section", section);
      newurl = `${newurl}?${query.toString()}`;

      window.history.pushState({ path: newurl }, '', newurl);
    }

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
  const _renderGeneral = function () {
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
   * Renders the security definitions section
   * @return {[type]} [description]
   */
  const _renderSecurity = function () {
    try {

      const data = {
        definitions: _api.securities
      };

      asyncWaterfall([

        (cb) => {

          // get activated securities
          asyncMap(data.definitions, (o, done) => {

            // get the security name
            const name = o.name;

            // get any saved credentials for this definition
            CredentialsManager.getCredentials(_api.specUrl, name)
              .then(credentials => {

                // if credentials are found, mark
                // security definition as activated
                o.activated = (!_.isEmpty(credentials));

                done();
              });
          }, (e) => {
            if (e) {
              console.error(e);
            }

            cb();
          });

        }

      ], (e) => {

        if (e) {
          console.error(e);
        }

        const html = tplSecurityDefinitions(data);
        $('#content').html(html);

        // bind listeners
        $('.button[data-action="activate authentication"]').on('click', (e) => {

          const type = $(e.currentTarget).attr('data-type');
          const name = $(e.currentTarget).attr('data-name');

          postal.publish({
            channel: 'openapis',
            topic: 'activate authentication',
            data: {
              api: _api,
              type,
              name
            }
          });
        });

        $('.button[data-action="deactivate authentication"]').on('click', (e) => {

          const type = $(e.currentTarget).attr('data-type');
          const name = $(e.currentTarget).attr('data-name');

          postal.publish({
            channel: 'openapis',
            topic: 'deactivate authentication',
            data: {
              api: _api,
              type,
              name
            }
          });
        });

      });

    } catch (e) {
      console.error(`Failed to render Security section - ${e}`);
    }
  };

  /**
   * Renders the definitions section
   * @return {[type]} [description]
   */
  const _renderDefinitions = function () {
    try {

      const data = {
        definitions: []
      };

      const definitions = _api.schemas;
      data.definitions = definitions;

      const html = tplDefinitions(data);
      $('#content').html(html);

      // listeners
      $('.card.definition .button').on('click', (e) => {
        const id = $(e.currentTarget).attr('data-id');
        _onDefinitionSelected(id);
      });

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
  const _renderDefinition = function () {
    const id = $(this).attr('data-id');

    // get the definition instance
    const definition = _api.getDefinition(id);

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
   * Displays the selected definition
   * details.
   * @param  {[type]} e [description]
   * @return {[type]}   [description]
   */
  const _onDefinitionSelected = function (id) {

    // get the definition instance
    const definition = _api.getDefinition(id);

    if (!definition) {
      console.error(`Definition [${id}] not found`);
      return;
    }

    const data = {
      id,
      definition
    };

    const html = tplDefinition(data);

    $(html)
      .modal({
        duration: 100,

        onVisible: function () {

          // update the URL without reloading
          if (history.pushState) {
            let newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;

            // get the URL query params
            const query = new URLSearchParams(window.location.search);
            query.delete("definition");
            query.append("definition", id);
            newurl = `${newurl}?${query.toString()}`;

            window.history.pushState({ path: newurl }, '', newurl);
          }

          window.scrollTo(0, 0);
        },

        onHide: function () {

          // // update the URL without reloading
          // if (history.pushState) {
          //   let newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
          //   const query = new URLSearchParams(window.location.search);
          //   query.delete("definition");
          //   newurl = `${newurl}?${query.toString()}`;
          //   window.history.pushState({ path: newurl }, '', newurl);
          // }

        }
      })
      .modal('show');

    // listeners
    $('.view.definition').on('click', (e) => {
      const id = $(e.currentTarget).attr('data-id');
      _onDefinitionSelected(id);
    });

    // scroll to top
    window.scrollTo(0, 0);
  };

  /**
   * Displays the selected operation
   * details.
   * @param  {[type]} e [description]
   * @return {[type]}   [description]
   */
  const _onOperationSelected = function (id) {

    // get the path Id and dispatch the event
    const path = $(this).attr('data-id');
    const verb = $(this).attr('data-verb');

    postal.publish({
      channel: 'openapis',
      topic: 'openapi.path.operations',
      data: {
        path,
        verb
      }
    });

    // scroll to top
    window.scrollTo(0, 0);
  };


  /**
   * Renders the operations section
   * @return {[type]} [description]
   */
  const _renderOperations = function () {
    try {

      const data = {};

      const html = tplOperations(data);
      $('#content').html(html);

      // default view
      _renderOperationPaths();


    } catch (e) {
      console.error(`Failed to render Operations view - ${e}`);
    }
  };





  /**
   * Renders the API paths section
   * @return {[type]} [description]
   */
  const _renderOperationPaths = function () {
    try {

      const operations = _.chain(_api.operations).orderBy(['path', 'verb']).value()

      const data = {
        paths: _api.operationsByPath,
        operations
      };

      const html = tplPaths(data);
      $('#section-contents').html(html);

      // path link clicked
      $('a[data-type="path"]').on('click', function () {

        // get the path Id and dispatch the event
        const path = $(this).attr('data-id');
        const verb = $(this).attr('data-verb');

        postal.publish({
          channel: 'openapis',
          topic: 'openapi.path.operations',
          data: {
            path,
            verb
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
  const _renderOperationsGraph = function () {
    try {

      const data = {};

      const html = tplGraph(data);
      $('#content').html(html);

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
  const _renderOperationsModal = function (path, verb) {
    try {
      // get the definition instance
      const definition = _.cloneDeep(_api.path(path));

      const data = {
        path,
        definition
      };

      asyncWaterfall([


        (cb) => {

          // go through all operations
          _.each(definition, (o) => {

            // process security
            _.each(o.security, (s) => {

              // enrich security elements
              o.security = _.map(s, (o, key) => ({
                definition: key,
                scopes: o
              }));
            });
          });

          cb();
        }

      ], () => {

        const html = tplOperation(data);

        const $html = $(html);

        const $modal = $html.modal({
          duration: 100
        });

        $modal.modal('show');

        const $tab = $('.menu .item', $html);
        $tab.tab();

        $('.modal .menu .item').on('click', function () {
          const verb = $(this).attr('data-tab');
          $('.modal .tab').removeClass('active');
          $tab.tab('change tab', verb);
          $modal.modal('refresh');
        });

        $modal.modal('refresh');

        // if a verb is given, select the
        // corresponding tab
        if (!_.isUndefined(verb)) {
          $tab.tab('change tab', verb);
        }

        // listeners
        $('.modal .view.definition').on('click', (e) => {
          const id = $(e.currentTarget).attr('data-id');
          _onDefinitionSelected(id);
        });

        // scroll to top
        window.scrollTo(0, 0);
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
  const _onOpenApiPathOperations = function (data) {

    // render the operations modal
    _renderOperationsModal(data.path, data.verb);
  };


  /**
   * Bookmarks the current API spot.
   * @return {[type]} [description]
   */
  const _bookmarkApi = function (e) {

    try {

      // get the API details
      const specUrl = _api.specUrl;
      const title = _api.title;

      // check current state
      const $el = $(e.currentTarget);

      CatalogService.isBookmarked(specUrl)
        .then(bookmarked => {

          if (!bookmarked) {

            // add a bookmark
            CatalogService.addBookmark(specUrl, title)
              .then(() => {
                $el.attr('data-bookmarked', '');
                $el.find('i.bookmark.icon').addClass('pink');

                // show an alert
                swal({
                  title: 'Open API spot bookmarked!',
                  text: 'You have created a bookmark for this API spot. Now you can easily access it from the main Open APIs page.',
                  type: 'success',
                  timer: 10000
                });
              })
              .catch(e => {
                // show an error alert
                swal({
                  title: 'Something went wrong...',
                  text: e.message,
                  type: 'error',
                  timer: 3000
                });
              });
          } else {

            // remove the bookmark
            CatalogService.removeBookmark(specUrl)
              .then(() => {
                $el.attr('data-bookmarked', null);
                $el.find('i.bookmark.icon').removeClass('pink');
              });
          }
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
  const _checkIfBookmarked = function () {

    try {

      // get the API details
      const specUrl = _api.specUrl;

      // get the element
      const $el = $('.ui.menu .item[data-action="bookmark api"]');

      CatalogService.isBookmarked(specUrl)
        .then(bookmarked => {
          if (bookmarked) {
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
  const _onReloadStories = function () {
    _renderStories();
  };


  /**
   * Triggers an event for
   * rendering the available stories.
   * @return {[type]} [description]
   */
  const _renderStories = function () {

    postal.publish({
      channel: 'stories',
      topic: 'load',
      data: {
        api: _api
      }
    });

  };

  // event listeners
  postal.subscribe({
    channel: 'openapis',
    topic: 'openapi.path.operations',
    callback: _onOpenApiPathOperations
  });

  postal.subscribe({
    channel: 'stories',
    topic: 'reload stories',
    callback: _onReloadStories
  });

  postal.subscribe({
    channel: 'openapis',
    topic: 'reload security',
    callback: _renderSecurity
  });

  return {

    /*
     * Public
     */
    render: _render

  };

}());
