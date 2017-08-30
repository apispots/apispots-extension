
import tableify from './tableify';
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
    const output = part.output;

    const html = tableify(output.data);

    // append it to the container
    const $cnt = $(container);
    $cnt.html(html);

    $('table', $cnt).addClass('ui celled collapsing compact table');

    // emit an event
    this.emit('rendered');
  }


}
