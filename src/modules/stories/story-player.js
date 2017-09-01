/**
 * Story maker module.
 * @return {[type]} [description]
 */
import _ from 'lodash';
import postal from 'postal';
import asyncWaterfall from 'async/waterfall';

import DataStory from '../../lib/stories/data-story';
import StoryPlayer from '../../lib/stories/story-player';
import StoryVisualizer from './story-visualizer';
import StoryManager from '../../lib/stories/story-manager';

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
            _story = story;
            cb();
          })
          .catch(e => {
            cb(e);
          });
      },

      (cb) => {

        // display the modal
        const model = {
          title: _story.definition.title
        };

        const html = tplStoryPlayer(model);
        $modal = $(html);

        $modal.modal({
          closable: false,
          duration: 100,
          onVisible: () => {

            $modal.modal('refresh');
            cb();
          },
          onHidden: () => {
            // clear local data
            _resetData();
          }
        }).modal('show');

      }

    ], (e) => {
      if (e) {
        console.error(e);
      }

      // play the story
      _playStory();

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
   * Plays the current data story.
   * @return {[type]} [description]
   */
  const _playStory = function() {

    // play the story
    StoryPlayer.play(_story)
      .then(() => {

        // hide the loader
        const $loader = $('.modal .story.output .load');
        $loader.fadeOut(() => {
          $loader.remove();

          // visualize the story
          StoryVisualizer.visualize(_story);
        });
      })
      .catch(e => {
        console.error('story failed to execute', e);
      })
      .finally(() => {
        // $btn.removeClass('disabled loading');
      });
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
