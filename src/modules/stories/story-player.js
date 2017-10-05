/**
 * Story maker module.
 * @return {[type]} [description]
 */
import postal from 'postal';
import asyncWaterfall from 'async/waterfall';
import FileSaver from 'file-saver';
import jsonexport from 'jsonexport';
import StoryPlayer from 'apispots-lib-stories/lib/stories/story-player';

import StoryVisualizer from './story-visualizer';
import StoryManager from '../../lib/stories/story-manager';
import CredentialsManager from '../../lib/openapi/browser-credentials-manager';

import tplStoryPlayer from '../../../extension/templates/modules/stories/story-player.hbs';

export default (function() {

  /*
   * Private
   */


  // the API definition instance
  let _api = null;

  // the data story instance
  let _story;

  // the modal instance
  let $modal;

  /**
   * Called when a story needs to be
   * played.  Displays a modal.
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  const _onPlayStory = function(data) {

    // remember the API definition
    _api = data.api;

    asyncWaterfall([

      (cb) => {
        // get the story instance
        StoryManager.getStory(_api.specUrl, data.storyId)
          .then(story => {
            // set the story instance
            // _story = story;
            cb(null, story);
          })
          .catch(e => {
            cb(e);
          });
      },

      (story, cb) => {
        // set the credentials manager instance
        StoryPlayer.setCredentialsManager(CredentialsManager);

        // play the story and return a promise
        StoryPlayer.play(story)
          .then(() => {
            cb(null, story);
          })
          .catch(cb);
      }

      // (cb) => {
      //
      //   // display the modal
      //   const model = {
      //     title: _story.definition.title
      //   };
      //
      //   const html = tplStoryPlayer(model);
      //   $modal = $(html);
      //
      //   $modal.modal({
      //     closable: false,
      //     duration: 100,
      //     onVisible: () => {
      //
      //       $modal.modal('refresh');
      //       cb();
      //     },
      //     onHidden: () => {
      //       // clear local data
      //       _resetData();
      //     }
      //   }).modal('show');
      //
      // }

    ], (e, story) => {
      if (e) {
        console.error(e);
      }

      postal.publish({
        channel: 'stories',
        topic: 'story completed',
        data: {
          story
        }
      });

    });


  };


  /**
   * Resets local data.
   * @return {[type]} [description]
   */
  const _resetData = function() {
    _story = null;

    // destroy the modal instance
    $modal.remove();
    $modal = null;
  };


  /**
   * Called when the user has
   * selected to export the story
   * output.
   * @return {[type]} [description]
   */
  const _onExportOutput = (data) => {

    const idx = data.partIndex;
    const output = _story.parts[idx].output;

    // export the data as a flat CSV
    jsonexport(output.data, (err, csv) => {
      if (err) {
        console.error(err);
      } else {
        const blob = new Blob([csv], {type: 'text/csv'});
        FileSaver.saveAs(blob, 'data.csv');
      }
    });

  };


  // event bindings
  postal.subscribe({
    channel: 'stories',
    topic: 'play story',
    callback: _onPlayStory
  });

  postal.subscribe({
    channel: 'stories',
    topic: 'export output',
    callback: _onExportOutput
  });


  return {

    /*
     * Public
     */


  };

}());
