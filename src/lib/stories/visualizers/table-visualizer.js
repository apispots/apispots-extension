import 'jszip';
import 'datatables.net-se';
import 'datatables.net-se/css/dataTables.semanticui.css';
import 'datatables.net-buttons-se';
import 'datatables.net-buttons/js/buttons.html5';
import 'datatables.net-buttons/js/buttons.print';
import 'datatables.net-responsive-se';
import _ from 'lodash';
import flatten from 'flat';

import Visualizer from './visualizer';

/**
 * Tabular data visualizer.
 *
 * @type {Object}
 */
export default class TableVisualizer extends Visualizer {


  /**
   * Visualizes the given
   * story part as JSON.
   * @return {[type]} [description]
   */
  visualize(part, container) {

    // get the part's output section
    const {
      output
    } = part;

    try {

      let {data} = output;

      try {
        data = JSON.parse(data);
      } catch (e) {
        // silent
      }

      if (_.isEmpty(data)) {
        throw new Error('Empty data set');
      }

      // append it to the container
      const $cnt = $(container);

      $cnt.append('<table class="ui table"></table>');

      $('table', $cnt).addClass('ui padded celled table');

      let columns = [];

      if (_.isArray(data)) {

        // if result is an array,
        // flatten all entries
        _.each(data, (o, idx) => {
          const flat = flatten(o, {delimiter: '_'});
          data[idx] = flat;
        });

        columns = _.map(data[0], (value, key) => ({
          data: key,
          name: key,
          title: key
        }));

      } else {

        // if result is an object,
        // flatten it first
        const flat = flatten(data, {delimiter: '_'});
        data = [flat];

        columns = _.map(flat, (value, key) => ({
          data: key,
          name: key,
          title: key
        }));

      }

      $('.table', $cnt).DataTable({
        paging: false,
        info: false,
        scrollX: true,
        scrollY: 500,
        dom: 'fBrt',
        data,
        columns,
        buttons: [
          {
            className: 'ui basic button',
            extend: 'copy',
            text: 'Copy'
          },
          {
            className: 'ui basic button',
            extend: 'csv',
            text: 'CSV'
          }
        ]
      });

    } catch (e) {
      // silent
    }

    // emit an event
    this.emit('rendered');
  }


}
