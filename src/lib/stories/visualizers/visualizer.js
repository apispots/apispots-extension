
import EventEmitter from 'event-emitter-es6';

/**
 * Base visualizer class.
 *
 * @author Chris Spiliotopoulos
 */


export default class Visualizer extends EventEmitter {

  /**
   * Visualizes a story part
   * @return {[type]} [description]
   */
  visualize() {
    throw new Error('Should be implemented by subclass');
  }


}
