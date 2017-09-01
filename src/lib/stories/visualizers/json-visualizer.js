
import _ from 'lodash';
import renderjson from 'renderjson';

import Visualizer from './visualizer';

/**
 * JSON raw data visualizer.
 *
 * @type {Object}
 */
export default class JsonVisualizer extends Visualizer {


  /**
   * Visualizes the given
   * story part as JSON.
   * @return {[type]} [description]
   */
  visualize(part, container) {

    // get the part's output section
    const output = part.output;

    // convert the JSON into HTML
    renderjson.set_icons('+', '-');

    // decide on the default
    // expansion level
    if (_.isArray(output.data)) {
      if (output.data.length < 100) {
        renderjson.set_show_to_level(2);
      }
    } else {
      renderjson.set_show_to_level(1);
    }

    const html = renderjson(output.data);

    // append it to the container
    const $cnt = $(container);
    $cnt.html(html);

    $('a.disclosure:eq(0)').on('click', () => {
      // content has changed
      this.emit('contentChanged');
    });

    // emit an event
    this.emit('rendered');
  }


}
