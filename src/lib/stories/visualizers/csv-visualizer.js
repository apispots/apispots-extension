

import FileSaver from 'file-saver';
import jsonexport from 'jsonexport';

import Visualizer from './visualizer';

/**
 * JSON raw data visualizer.
 *
 * @type {Object}
 */
export default class CsvVisualizer extends Visualizer {


  /**
   * Visualizes the given
   * story part as JSON.
   * @return {[type]} [description]
   */
  visualize(part) {

    // get the part's output section
    const output = part.output;

    // export the data as a flat CSV
    jsonexport(output.data, (err, csv) => {
      if (err) {
        console.error(err);
      } else {
        const blob = new Blob([csv], {type: 'text/csv'});
        FileSaver.saveAs(blob, 'data.csv');
      }
    });

    // emit an event
    this.emit('rendered');
  }


}
