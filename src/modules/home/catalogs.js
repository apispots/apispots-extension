/**
 * OpenAPI catalog.
 * @return {[type]} [description]
 */
import * as _ from 'lodash';
import postal from 'postal';

import tplBody from '../../../extension/templates/modules/catalogs/index.hbs';

export default (function() {

  /*
   * Private
   */


  /**
   * Renders the provided Open API
   * definition.
   * @param  {[type]} openapi [description]
   * @return {[type]}         [description]
   */
  const _render = function(catalog) {
    return new Promise((resolve, reject) => {
      try {

        if (_.isEmpty(catalog)) {
          throw new Error('Invalid Open API catalog');
        }

        // render the body
        const html = tplBody({
          catalog
        });

        // render the body
        $('body').html(html);

        // scroll to top
        window.scrollTo(0, 0);

        // attach event listeners
        _attachListeners();

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

    $('.api.definition .button').on('click', _openApiDefinition);

    $('.item[data-section=\'filters\']').on('click', () => {
      $('.ui.top.sidebar').sidebar('toggle');
    });

    // categories filter dropdown
    $('.ui.dropdown').dropdown({
      onChange(value) {
        // filter the catalog by selected category
        postal.publish({
          channel: 'openapis',
          topic: 'catalog.filterByCategory',
          data: {
            category: value
          }
        });
      }
    });

    // catalog link
    $('.catalogs.collections .collection a').on('click', function() {
      // open the selected catalog collection
      const url = $(this).attr('data-url');

      postal.publish({
        channel: 'openapis',
        topic: 'catalogs.collection.open',
        data: {
          url
        }
      });
    });

  };

  /**
   * Opens the selected API definition.
   * @return {[type]} [description]
   */
  const _openApiDefinition = function(e) {

    e.preventDefault();

    const $api = $(this).parents('.api');
    const spec = $api.attr('data-spec');

    // loading state
    $api.addClass('disabled');
    $('.dimmer', $api).addClass('visible');

    // load the api definition
    postal.publish({
      channel: 'openapis',
      topic: 'openapi.load',
      data: {
        spec
      }
    });
  };

  /**
   * Filters catalog by API category
   * @return {[type]} [description]
   */
  const _onFilterByCategory = function(data) {

    // get the selected category
    const category = data.category;

    $('.card.api.definition').show();
    $('.card.api.definition').filter((idx, o) => {
      const categories = $(o).attr('data-categories');

      if (category === 'unknown') {
        if (categories !== '') {
          return true;
        }
      } else if (categories.indexOf(category) === -1) {
        return true;
      }

      return false;
    }).hide();
  };


  // event bindings
  postal.subscribe({
    channel: 'openapis',
    topic: 'catalog.filterByCategory',
    callback: _onFilterByCategory
  });


  return {

    /*
     * Public
     */
    render: _render

  };

}());
