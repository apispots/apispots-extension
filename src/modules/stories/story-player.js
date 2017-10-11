/**
 * Story maker module.
 * @return {[type]} [description]
 */
import postal from 'postal';
import asyncWaterfall from 'async/waterfall';
import FileSaver from 'file-saver';
import _ from 'lodash';
import swal from 'sweetalert2';
import StoryPlayer from 'apispots-lib-stories/lib/stories/story-player';

import StoryVisualizer from './story-visualizer';
import StoryManager from '../../lib/stories/story-manager';
import CredentialsManager from '../../lib/openapi/browser-credentials-manager';


export default (function() {

  /*
   * Private
   */


  /**
   * Called when a story needs to be
   * played.  Displays a modal.
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  const _onPlayStory = function(data) {

    asyncWaterfall([

      (cb) => {

        // get the story instance
        StoryManager.getStory(data.api.specUrl, data.storyId)
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

    ], (e, story) => {
      if (e) {
        console.error(e);
      }

      // publish the event
      postal.publish({
        channel: 'stories',
        topic: 'story completed',
        data: {
          story
        }
      });

      // process the story output
      _processStoryOutput(story);

    });

  };


  /**
   * Processes the story ouput.
   * @param  {[type]} story [description]
   * @return {[type]}       [description]
   */
  const _processStoryOutput = (story) => {
    try {

      const {output} = story;

      if ((output.data instanceof Blob) &&
           (output.data.size > 0)) {

        // output type is Blob,
        // so download now
        const blob = output.data;

        swal({
          title: 'Enter a filename',
          input: 'text',
          showCancelButton: true,
          confirmButtonText: 'Save',
          allowOutsideClick: false
        }).then((filename) => {

          FileSaver.saveAs(blob, filename);
        })
          .catch(() => {
            // silent
            FileSaver.saveAs(blob);
          });
      } else if ((typeof output.data !== 'undefined')
                || (!_.isEmpty(output.text))) {

        // visualize the output data
        StoryVisualizer.visualize(story);
      } else {
        // do nothing

      }

    } catch (e) {
      // silent
    }
  };


  // event bindings
  postal.subscribe({
    channel: 'stories',
    topic: 'play story',
    callback: _onPlayStory
  });


  return {

    /*
     * Public
     */


  };

}());
