
import beautify from 'vkbeautify';
import ace from 'brace';
import 'brace/theme/chrome';
import 'brace/mode/json';

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
    const {output} = part;

    // get the part's output section
    const json = beautify.json(output.data);

    const editor = ace.edit($(container).get(0));
    editor.setTheme('ace/theme/chrome');
    editor.session.setMode('ace/mode/json');
    editor.$blockScrolling = Infinity;
    editor.setValue(json);
    editor.clearSelection();
    editor.setReadOnly(true);
    editor.resize();

    // emit an event
    this.emit('rendered');
  }


}
