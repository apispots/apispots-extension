import _ from 'lodash';
import postal from 'postal';
import swal from 'sweetalert2';
import asyncWaterfall from 'async/waterfall';
import stories from 'apispots-lib-stories';

import '../../common/base';
import Storage from '../../lib/common/browser-storage';
import CatalogService from '../../lib/openapi/catalog-service';
import Explorer from './explorer';
import Catalog from './catalog';
import '../stories/story-maker';

import tplBody from '../../../extension/templates/modules/openapis/index.hbs';

{

  /**
   * Initializes the view.
   * @return {[type]} [description]
   */
  const onReady = function() {

    // check if any query params have
    // been provided for loading specific
    // content
    const command = _checkForDeepLinks();

    if (command) {
      // if a command has been returned
      // switch view to loading state

      const html = tplBody({loading: true});
      $('body').html(html);

      // and publish the action
      postal.publish(command);
    } else {

      // load the default view
      _loadDefaultView();
    }

  };

  /**
   * Loads the default view.
   * @return {[type]} [description]
   */
  const _loadDefaultView = () => {

    const model = {};

    asyncWaterfall([
      (cb) => {

        // load any bookmaked spots
        CatalogService.getBookmarkedSpots()
          .then((bookmarks) => {
            // add them to the model
            model.bookmarks = bookmarks;
            cb();
          })
          .catch(cb);
      }

    ], (e) => {

      if (e) {
        console.error(e);
      }

      // render the default view
      const html = tplBody(model);
      $('body').html(html);

      // fix menu when passed
      $('.masthead')
        .visibility({
          once: false,
          onBottomPassed() {
            $('.fixed.menu').transition('fade in');
          },
          onBottomPassedReverse() {
            $('.fixed.menu').transition('fade out');
          }
        });

      // bind all event listeners
      _bindListeners();
      _bindValidators();

    });

  };


  /**
   * Checks for content deep links.
   * @return {[type]} [description]
   */
  const _checkForDeepLinks = function() {

    try {

      let command = null;

      // check if a specific URL is provided
      // as a query param
      if (!_.isEmpty(_getUrlParam('spec'))) {
        const spec = _getUrlParam('spec');
        command = {channel: 'openapis', topic: 'openapi.load', data: {spec }};
      } else if (!_.isEmpty(_getUrlParam('providerId'))) {
        const providerId = _getUrlParam('providerId');
        command = {channel: 'openapis', topic: 'catalog.load', data: {providerId }};
      } else if (!_.isEmpty(_getUrlParam('catalogUrl'))) {
        const url = _getUrlParam('catalogUrl');
        command = {channel: 'openapis', topic: 'catalog.load', data: {url }};
      }

      return command;

    } catch (e) {
      console.error(e);
    }

    return null;
  };


  /**
   * Parses the query string and
   * returns a map of URL params
   * @return {[type]} [description]
   */
  const _getUrlParam = function(name) {

    const url = window.location.href;

    name = name.replace(/[[]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  };

  /**
   * Binds all event listeners
   * @return {[type]} [description]
   */
  const _bindListeners = function() {

    // API URL input
    $('#form-openapi').on('submit', (e) => {
      e.preventDefault();
      return true;
    });

    $('#icon-load-definition').on('click', () => {
      // load the API definition from
      // the entered URL
      const url = $.trim($('#input-url-definition').val());
      $('#input-url-definition').parent().addClass('loading disabled');
      postal.publish({channel: 'openapis', topic: 'openapi.load', data: {spec: url }});
      return false;
    });

    $('#icon-open-catalog').on('click', () => {
      // open the catalog definition
      const url = $.trim($('#input-url-catalog').val());
      $('#input-url-catalog').parent().addClass('loading disabled');
      postal.publish({channel: 'openapis', topic: 'catalog.load', data: {url, newTab: true }});
      return false;
    });

    $('[data-action="remove bookmark"]').on('click', _onDeleteBookmark);

  };

  /**
   * Attaches validators
   * @return {[type]} [description]
   */
  const _bindValidators = function() {
    $('#form-openapi')
      .form({
        on: 'blur',
        fields: {
          openapi: {
            identifier: 'openapi',
            rules: [
              {
                type: 'url',
                prompt: 'Please enter a valid URL'
              }
            ]
          }
        }
      });
  };


  /**
   * Called when a user clicks on the
   *
   * @return {[type]} [description]
   */
  const _onLoadApiDefinition = function(data) {

    // load the definition from the given URL
    const url = data.spec;
    let spec = null;

    asyncWaterfall([

      (cb) => {
        // if the URL is for local file
        // check if the content is available
        // in local storage
        if ((typeof url !== 'undefined') &&
          (url.startsWith('file://'))) {
          spec = Storage.local.get([url], (data) => {
            if (!_.isEmpty(data)) {
              spec = data[url];
              cb();
            }
          });
        } else {
          cb();
        }
      }

    ], () => {

      // load the story definition
      stories.ApiDefinitionLoader.load({url, spec})
        .then((api) => {

          // load the Open API into the explorer
          Explorer.render(api)
            .catch((e) => {
              // show an error alert
              swal({
                title: 'Open API explorer',
                text: e.message,
                type: 'error',
                timer: 3000
              });
            });
        })
        .catch((err) => {

          // show an error alert
          // and reload the default view
          swal({
            title: 'Something went wrong...',
            text: `${err.message} [${url}]`,
            type: 'error',
            timer: 10000
          })
            .then(() => {
              setTimeout(_loadDefaultView, 300);
            })
            .catch(() => {
              setTimeout(_loadDefaultView, 300);
            });
        });

    });

  };


  /**
   * Called when a user clicks on
   * a catalog button.
   * @return {[type]} [description]
   */
  const _onLoadApiCatalog = function(data) {

    // get the catalog either
    // by provider Id or URL
    const providerId = data.providerId;
    const url = data.url;

    let promise;

    if (!_.isEmpty(providerId)) {
      promise = CatalogService.loadByProviderId(providerId);
    } else if (!_.isEmpty(url)) {
      promise = CatalogService.loadByUrl(url);
    }
    // load the selected Open API catalog
    promise
      .then((catalog) => {

        $(this).removeClass('loading disabled');

        // render the catalog view
        Catalog.render(catalog);
      })
      .catch((err) => {

        // switch to normal state
        $('.loading').removeClass('loading disabled');

        // show an error alert
        swal({
          title: 'Something went wrong...',
          text: err.message,
          type: 'error',
          timer: 3000
        });
      });
  };

  /**
   * User selected to delete a spot
   * bookmark.
   * @param  {[type]} specUrl [description]
   * @return {[type]}         [description]
   */
  const _onDeleteBookmark = (e) => {

    const specUrl = $(e.currentTarget).attr('data-spec');

    swal({
      title: 'Are you sure?',
      text: 'Do you really want to delete the selected bookmark?',
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(() => {

      // remove bookmark
      CatalogService.removeBookmark(specUrl)
        .then(() => {

          // remove the segment
          const $cnt = $(e.currentTarget).closest('.segment');
          $cnt.fadeOut(() => {
            $cnt.remove();
          });

        });
    })
      .catch(() => {
        // silent
      });

  };


  // attach ready event
  $(document)
    .ready(onReady);

  // listen for events
  postal.subscribe({channel: 'openapis', topic: 'openapi.load', callback: _onLoadApiDefinition});
  postal.subscribe({channel: 'openapis', topic: 'catalog.load', callback: _onLoadApiCatalog});

}
