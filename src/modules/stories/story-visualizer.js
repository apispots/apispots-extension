/**
 * Story maker module.
 * @return {[type]} [description]
 */
import _ from 'lodash';
import swal from 'sweetalert2';
import FileSaver from 'file-saver';
import moment from 'moment';

import TextVisualizer from '../../lib/stories/visualizers/text-visualizer';
import JsonVisualizer from '../../lib/stories/visualizers/json-visualizer';
import TableVisualizer from '../../lib/stories/visualizers/table-visualizer';
import CsvVisualizer from '../../lib/stories/visualizers/csv-visualizer';
import XmlVisualizer from '../../lib/stories/visualizers/xml-visualizer';

import tplStoryPlayer from '../../../extension/templates/modules/stories/story-visualizer.hbs';
import tplPartVisualization from '../../../extension/templates/modules/stories/part-visualization.hbs';

export default (function() {

  /*
   * Private
   */

  let _story = null;

  // the modal instance
  let $modal;

  /**
   * Visualizes a story.
   * @param  {[type]} story [description]
   * @return {[type]}       [description]
   */
  const _visualize = function(story) {

    if (_.isEmpty(story)) {
      throw new Error('Undefined story');
    }

    _story = story;

    // display the modal
    const model = {
      title: story.definition.title
    };

    const html = tplStoryPlayer(model);
    $modal = $(html);

    $modal.modal({
      closable: false,
      duration: 100,
      onVisible: () => {

        $modal.modal('refresh');
      },
      onHidden: () => {
        // reset
        _reset();
      }
    }).modal('show');

    // get story parts
    const {parts} = story;

    // iterate though parts
    _.each(parts, (part, idx) => {

      // visualize each part individually
      _visualizeStoryPart(part, idx);
    });


  };


  /**
   * Resets local data.
   * @return {[type]} [description]
   */
  const _reset = function() {

    _story = null;

    // destroy the modal instance
    $modal.remove();
    $modal = null;
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

    // add the part duration
    const duration = moment.duration(part.output.duration).asSeconds().toFixed(2);
    model.duration = duration;

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
    $('.modal .export.output [data-action="save raw data"]').on('click', _onSaveRawData);

    // get the visualization container
    const $vis = $('.visualization', $cnt);
    $vis.attr('id', `vis-${idx}`);

    if ($vis.length > 0) {

      // if the dataset is empty, exit now
      if (typeof part.output.data === 'undefined') {
        return;
      }

      let clazz;

      // visualize based on the selected type
      const {visualization} = part;
      const {type} = visualization;

      if (part.output.ok) {
        if (type === 'text') {
          clazz = new TextVisualizer();
        } else if (type === 'json') {
          clazz = new JsonVisualizer();
        } else if (type === 'table') {
          clazz = new TableVisualizer();
        } else if (type === 'csv') {
          clazz = new CsvVisualizer();
        } else if (type === 'xml') {
          clazz = new XmlVisualizer();
        }
      } else {
        clazz = new TextVisualizer();
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
          .transition('fade');
      });

    // refresh the modal
    $('.modal').modal('refresh');
  };

  /**
   * Saves the output as raw data.
   * @param  {[type]} e [description]
   * @return {[type]}   [description]
   */
  const _onSaveRawData = (e) => {

    const $el = $(e.currentTarget);
    const idx = $el.parents('.story.part').attr('data-partidx');

    const output = _story.outputs[idx];

    swal({
      title: 'Enter a filename',
      input: 'text',
      showCancelButton: true,
      confirmButtonText: 'Save',
      allowOutsideClick: false
    }).then((filename) => {

      const blob = new Blob([output.text], {
        type: output.headers['content-type']
      });

      FileSaver.saveAs(blob, filename);
    })
      .catch(() => {
        // silent
      });
  };


  return {

    /*
     * Public
     */
    visualize: _visualize

  };

}());
