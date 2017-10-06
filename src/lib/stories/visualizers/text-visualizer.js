import ace from 'brace';
import 'brace/theme/chrome';
import 'brace/mode/text';

import Visualizer from './visualizer';

/**
 * Simple text response visualizer.
 *
 * @type {Object}
 */
export default class TextVisualizer extends Visualizer {


  /**
   * Visualizes the given
   * story part as JSON.
   * @return {[type]} [description]
   */
  visualize(part, container) {

    // get the part's output section
    const output = part.output;

    const editor = ace.edit($(container).get(0));
    editor.setTheme('ace/theme/chrome');
    editor.session.setMode('ace/mode/text');
    editor.setValue(output.text);
    editor.clearSelection();
    editor.setReadOnly(true);
    editor.resize();

    // emit an event
    this.emit('rendered');
  }


}
