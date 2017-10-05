/**
 * Story maker module.
 * @return {[type]} [description]
 */
import _ from 'lodash';
import postal from 'postal';
import FileSaver from 'file-saver';

import JsonVisualizer from '../../lib/stories/visualizers/json-visualizer';
import TableVisualizer from '../../lib/stories/visualizers/table-visualizer';
import CsvVisualizer from '../../lib/stories/visualizers/csv-visualizer';
import XmlVisualizer from '../../lib/stories/visualizers/xml-visualizer';

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

    // get story parts
    const parts = story.parts;

    // iterate though parts
    _.each(parts, (part, idx) => {

      // visualize each part individually
      _visualizeStoryPart(part, idx);
    });
  };


  /**
   * Visualizes a story part.
   * @param  {[type]} part [description]
   * @return {[type]}      [description]
   */
  const _visualizeStoryPart = function(part, idx) {

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
      index: idx,
      output: part.output,
      type: part.visualization.type
    };

    const html = tplPartVisualization(model);
    const $html = $(html);

    // append the template to the main container
    const $cnt = $('.story.output .segments');
    $cnt.append($html);

    // initialize dropdowns
    $('.modal .dropdown').dropdown({
      action: 'combo'
    });

    // export output button
    $('.modal .export.output [data-action="export as flat csv"]').on('click', (e) => {

      const $el = $(e.currentTarget);
      const partIndex = $el.parents('.story.part').attr('data-partidx');
      const type = $el.attr('data-type');

      postal.publish({
        channel: 'stories',
        topic: 'export output',
        data: {
          partIndex,
          type
        }
      });
    });


    // get the visualization container
    const $vis = $('.visualization', $cnt);
    $vis.attr('id', `vis-${idx}`);

    if ($vis.length > 0) {

      // if the dataset is empty, exit now
      if (typeof part.output.data === 'undefined') {
        return;
      }

      // if the output is a Blob,
      // download it
      if (part.output.data instanceof Blob) {
        const blob = part.output.data;

        FileSaver.saveAs(blob, 'data.zip');
        return;
      }


      let clazz;

      // visualize based on the selected type
      const type = part.visualization.type;

      if (type === 'json') {
        clazz = new JsonVisualizer();
      } else if (type === 'table') {
        clazz = new TableVisualizer();
      } else if (type === 'csv') {
        clazz = new CsvVisualizer();
      } else if (type === 'xml') {
        clazz = new XmlVisualizer();
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
    }

    $('.message .close')
      .on('click', function() {
        $(this)
          .closest('.message')
          .transition('fade')
        ;
      });

    // refresh the modal
    $('.modal').modal('refresh');
  };


  return {

    /*
     * Public
     */
    visualize: _visualize

  };

}());
