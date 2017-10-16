
import ace from 'brace';
import 'brace/theme/chrome';
import 'brace/mode/xml';
import beautify from 'vkbeautify';


import Visualizer from './visualizer';

/**
 * JSON raw data visualizer.
 *
 * @type {Object}
 */
export default class XmlVisualizer extends Visualizer {


  /**
   * Visualizes the given
   * story part as JSON.
   * @return {[type]} [description]
   */
  visualize(part, container) {

    // get the part's output section
    const {output} = part;
    const xml = beautify.xml(output.data);

    const editor = ace.edit($(container).get(0));
    editor.setTheme('ace/theme/chrome');
    editor.session.setMode('ace/mode/xml');
    editor.$blockScrolling = Infinity;

    try {
      editor.setValue(xml);
    } catch (e) {

    }

    editor.clearSelection();
    editor.setReadOnly(true);
    editor.resize();


    // emit an event
    this.emit('rendered');
  }


}
