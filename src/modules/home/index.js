import _ from 'lodash';
import postal from 'postal';
import swal from 'sweetalert2';
import asyncWaterfall from 'async/waterfall';
import stories from 'apispots-lib-stories';

import '../../common/base';
import Storage from '../../lib/common/browser-storage';
import CatalogService from '../../lib/openapi/catalog-service';
import Catalog from './catalogs';

import tplBody from '../../../extension/templates/modules/home/index.hbs';

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

    $('#icon-load-definition').on('click', () => {
      // load the API definition from
      // the entered URL
      const url = $.trim($('#input-url-definition').val());
      window.location.href = `/pages/api.html?url=${url}`;
    });

    // $('#icon-open-catalog').on('click', () => {
    //   // open the catalog definition
    //   const url = $.trim($('#input-url-catalog').val());
    //   $('#input-url-catalog').parent().addClass('loading disabled');
    //   postal.publish({channel: 'openapis', topic: 'catalog.load', data: {url, newTab: true }});
    //   return false;
    // });

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


  // attach ready event
  $(document)
    .ready(onReady);

  
}
