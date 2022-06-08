import _ from 'lodash';
import postal from 'postal';
import Swal from 'sweetalert2';
import asyncWaterfall from 'async/waterfall';
import ApiDefinitionLoader from '../../lib/openapi/api-definition-loader';

import '../../common/base';
import Storage from '../../lib/common/browser-storage';
import Explorer from './explorer';

import tplBody from '../../../extension/templates/modules/home/index.hbs';

{

  /**
   * Initializes the view.
   * @return {[type]} [description]
   */
  const onReady = function () {

    try {
      // check if any query params have
      // been provided for loading specific
      // content
      const command = _checkForDeepLinks();

      if (!command) {
        throw new Error('Did not find any action to execute...');
      }

      // if a command has been returned
      // switch view to loading state

      const html = tplBody({ loading: true });
      $('body').html(html);

      // and publish the action
      postal.publish(command);

      if (window.history && window.history.pushState) {

        // on back browser button, force reload the page
        $(window).on('popstate', function () {

          // window.location.reload();
          // check if any query params have
          // been provided for loading specific
          // content
          const command = _checkForDeepLinks();
          // and publish the action
          // postal.publish(command);
          console.log(window.history)
        });


      }
    }
    catch (e) {
      // show an error alert
      Swal.fire({
        title: 'Open API explorer',
        text: e.message,
        icon: 'error',
        timer: 10000
      });
    }
  };



  /**
   * Checks for content deep links.
   * @return {[type]} [description]
   */
  const _checkForDeepLinks = function () {

    let command = null;

    try {

      command = {
        channel: 'openapis', topic: 'openapi.load',
        data: {
          spec: _getUrlParam('url'),
          section: _getUrlParam('section'),
          definition: _getUrlParam('definition'),
          operation: _getUrlParam('operation')
        }
      };

    } catch (e) {
      console.error(e);
    }

    return command;
  };


  /**
   * Parses the query string and
   * returns a map of URL params
   * @return {[type]} [description]
   */
  const _getUrlParam = function (name) {

    const params = new URLSearchParams(window.location.search);

    return params.get(name);

  };


  /**
   * Called when a user clicks on the
   *
   * @return {[type]} [description]
   */
  const _onLoadApiDefinition = function (data) {

    // load the definition from the given URL
    const url = data.spec;
    const {
      section,
      definition
    } = data;

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

      // load the API definition
      ApiDefinitionLoader.load({ url, spec })
        .then((api) => {

          const opts = {
            section,
            definition
          };

          // load the Open API into the explorer
          Explorer.render(api, opts)
            .catch((e) => {
              // show an error alert
              Swal.fire({
                title: 'Open API explorer',
                text: e.message,
                icon: 'error',
                timer: 3000
              });
            });
        })
        .catch((err) => {

          // show an error alert
          // and reload the default view
          Swal.fire({
            title: 'Something went wrong...',
            text: `${err.message} [${url}]`,
            icon: 'error',
            timer: 10000
          });
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

    Swal.fire({
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
  postal.subscribe({ channel: 'openapis', topic: 'openapi.load', callback: _onLoadApiDefinition });

}
