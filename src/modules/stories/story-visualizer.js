/**
 * Story maker module.
 * @return {[type]} [description]
 */
import _ from 'lodash';
// import postal from 'postal';

import JsonVisualizer from '../../lib/stories/visualizers/json-visualizer';
import TableVisualizer from '../../lib/stories/visualizers/table-visualizer';

import tplPartVisualization from '../../../extension/templates/modules/stories/part-visualization.hbs';

export default (function() {

  /*
   * Private
   */


  /**
    * Visualizes a story.
    * @param  {[type]} story [description]
    * @return {[type]}       [description]
    */
  const _visualize = function(story) {

    if (_.isEmpty(story)) {
      throw new Error('Undefined story');
    }

    console.log('visualizing story', story);

    // get story parts
    const parts = story.parts;

    // iterate though parts
    _.each(parts, (part) => {

      // visualize each part individually
      _visualizeStoryPart(part);
    });
  };


  /**
   * Visualizes a story part.
   * @param  {[type]} part [description]
   * @return {[type]}      [description]
   */
  const _visualizeStoryPart = function(part) {

    // if the visualization section is
    // missing, add the default JSON type
    if (_.isEmpty(part.visualization)) {
      part.visualization = {
        type: 'json'
      };
    }

    // create the template that will
    // act as the container for the
    // visualization
    const model = {
      output: part.output,
      type: part.visualization.type
    };
    console.log(part.output);
    const html = tplPartVisualization(model);
    const $html = $(html);

    // append the template to the main container
    const $cnt = $('.story-output .segments');
    $cnt.append($html);

    // get the visualization container
    const $vis = $('.visualization', $cnt);

    // if the dataset is empty, exit now
    if (_.isEmpty(part.output.data)) {
      return;
    }

    let clazz;

    // visualize based on the selected type
    const type = part.visualization.type;

    if (type === 'json') {
      clazz = new JsonVisualizer();
    } else if (type === 'table') {
      clazz = new TableVisualizer();
    }

    clazz.visualize(part, $vis);

    // get notified when visualization
    // has been rendered
    clazz.on('rendered', () => {
      // refresh the modal
      $('.modal').modal('refresh');
    });

    clazz.on('contentChanged', () => {
      // refresh the modal
      $('.modal').modal('refresh');
    });

  };


  return {

    /*
     * Public
     */
    visualize: _visualize

  };

}());
