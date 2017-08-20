import _ from 'lodash';
import postal from 'postal';
import swal from 'sweetalert2';

import '../../common/base';
import ApiDefinition from '../../lib/openapi/api-definition';
import ApiCatalogService from '../../lib/openapi/catalog-service';
import Explorer from './explorer';
import Catalog from './catalog';

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

      // render the default view
      const html = tplBody();
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
    }

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

    ApiDefinition.load({url})
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

        // switch to normal state
        $('#input-url-definition').parent().removeClass('loading disabled');
        $('.dimmer').removeClass('visible');

        // show an error alert
        swal({
          title: 'Something went wrong...',
          text: `${err.message} [${url}]`,
          type: 'error',
          timer: 10000
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
      promise = ApiCatalogService.loadByProviderId(providerId);
    } else if (!_.isEmpty(url)) {
      promise = ApiCatalogService.loadByUrl(url);
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


  // attach ready event
  $(document)
    .ready(onReady);

  // listen for events
  postal.subscribe({channel: 'openapis', topic: 'openapi.load', callback: _onLoadApiDefinition});
  postal.subscribe({channel: 'openapis', topic: 'catalog.load', callback: _onLoadApiCatalog});

}
