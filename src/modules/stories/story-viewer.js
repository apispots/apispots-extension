/**
 * Story viewer module.
 * @return {[type]} [description]
 */
import postal from 'postal';
import _ from 'lodash';
import moment from 'moment';
import asyncWaterfall from 'async/waterfall';
import StoryManager from '../../lib/stories/story-manager';
import './story-player';

import tplCanvas from '../../../extension/templates/modules/stories/canvas.hbs';
import tplStories from '../../../extension/templates/modules/stories/stories.hbs';


export default (function() {

  /*
   * Private
   */
  let _api = null;

  /**
   * Event received for loading the module.
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  const _onLoad = (data) => {
    _api = data.api;

    const model = {};
    const html = tplCanvas(model);

    $('#content').html(html);

    // bind listeners
    $('input[data-action="search"]').on('keyup', (e) => {
      const key = e.key;

      if (key.toLowerCase() === 'enter') {
        _onSearch();
      }
    });

    $('i[data-action="search"]').on('click', () => {
      _onSearch();
    });

    // load the stories view by default
    _loadStories();
  };

  /**
   * User has triggered a search action.
   * @return {[type]} [description]
   */
  const _onSearch = () => {

    // get the search phrase and context
    const phrase = $.trim($('input[data-action="search"]').val());
    const context = $('.stories.menu .item.active').attr('data-view');

    // do not use phrases < 3 chars
    if ((!_.isEmpty(phrase)) && (phrase.length < 3)) {
      return;
    }

    // trigger a search action event
    // for the selected context
    postal.publish({
      channel: 'stories',
      topic: `search ${context}`,
      data: {
        phrase
      }
    });
  };


  /**
   * Loads the data stories section.
   * @return {[type]} [description]
   */
  const _loadStories = function(stories=null) {
    try {

      const model = {};

      asyncWaterfall([

        (cb) => {

          // if stories are explicitly
          // provided use them
          if (stories) {
            model.stories = stories;
            cb();
          } else {
          // get all stories associated with this spec
            StoryManager.getStoriesBySpec(_api.specUrl)
              .then((stories) => {
              // add them to the model
                model.stories = stories;
                cb();
              })
              .catch(cb);
          }
        },

        (cb) => {
          const html = tplStories(model);
          $('#canvas').html(html);

          cb();
        }

      ], (e) => {

        if (e) {
          console.error(e);
        }

        // bind event listeners
        _bindListeners();

      });

    } catch (e) {
      console.error(`Failed to render Data stories section - ${e}`);
    }
  };

  /**
   * Binds event listeners.
   * @return {[type]} [description]
   */
  const _bindListeners = () => {

    try {

      // bind listeners
      $('.ui.dropdown').dropdown();
      $('.ui.tipped').popup({
        hoverable: true
      });

      // bind the menu listener
      $('.stories.menu .item[data-view]').on('click', function() {

        // render the selected view
        const view = $(this).attr('data-view');
        _renderView(view);
      });

      // create a new story
      $('.item[data-id="new-story"], .button[data-action="create story"]').on('click', () => {

        postal.publish({
          channel: 'stories',
          topic: 'create story',
          data: {
            api: _api
          }
        });
      });

      // play a story
      $('.ui.cards.stories .story [data-action="play story"]').on('click', _onPlayStory);

      // edit a story
      $('.ui.cards.stories .story [data-action="edit story"]').on('click', (e) => {

        const $el = $(e.currentTarget);
        const storyId = $el.attr('data-id');

        postal.publish({
          channel: 'stories',
          topic: 'edit story',
          data: {
            api: _api,
            storyId
          }
        });
      });

      // delete a story
      $('.ui.cards.stories .story [data-action="delete story"]').on('click', (e) => {

        const $el = $(e.currentTarget);
        const storyId = $el.attr('data-id');

        swal({
          title: 'Are you sure?',
          text: 'Do you really want to delete the selected data story?',
          type: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, delete it!'
        }).then(() => {

          // delete the story from local storage
          StoryManager.delete(_api.specUrl, storyId)
            .then(() => {
              // reload
              _loadStories();
            });
        })
          .catch(() => {
            // silent
          });
      });

    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Renders the selected view by Id.
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  const _renderView = function(view = 'stories') {

    if (view === 'stories') {
      // default view
      _loadStories();
    }

    // switch active menu item
    $('.stories.menu .item').removeClass('active');
    $(`.stories.menu .item[data-view="${view}"]`).addClass('active');
  };


  /**
   * Called when a story search
   * has been triggered.
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  const _onSearchStories = (data) => {

    const phrase = data.phrase;

    if (_.isEmpty(phrase)) {
      // if no phrase is passed,
      // load all stories
      _loadStories();
    } else {

      const query = {
        specUrl: _api.specUrl,
        phrase: data.phrase
      };

      // search all stories for matches
      StoryManager.search(query)
        .then(matches => {

          // show the matching stories
          _loadStories(matches);
        })
        .catch();
    }

  };

  /**
   * Initiates a new story play.
   * @param  {[type]} e [description]
   * @return {[type]}   [description]
   */
  const _onPlayStory = (e) => {
    const $el = $(e.currentTarget);
    const storyId = $el.attr('data-id');

    // disable all other stories play buttons
    $('.story.card [data-action="play story"]').attr('disabled', 'disabled');

    // show the loader
    const $card = $el.closest('.story.card');
    $('.dimmer', $card).addClass('active');

    postal.publish({
      channel: 'stories',
      topic: 'play story',
      data: {
        api: _api,
        storyId
      }
    });
  };


  /**
   * Called when a story has
   * completed its execution.
   * @type {[type]}
   */
  const _onStoryCompleted = (data) => {

    const story = data.story;
    const storyId = story.id;

    // hide the loader
    const $card = $(`.story.card[data-id="${storyId}"]`);
    $('.dimmer', $card).removeClass('active');

    // enable all stories play buttons
    $('.story.card [data-action="play story"]').attr('disabled', null);

    try {
      // get the story output
      const output = story.output;

      const color = (output.ok ? 'green' : 'red');
      const text = (output.ok ? 'OK' : 'ERROR');
      const duration = moment.duration(output.duration).asSeconds().toFixed(2);
      $('.result .status.code', $card).removeClass('green red').addClass(color);
      $('.result .status.text', $card).text(text);
      $('.result .duration', $card).text(duration);

      // show the results section
      $('.result', $card).fadeIn();


    } catch (e) {
      console.error(e);
    }

  };

  // event bindings
  postal.subscribe({
    channel: 'stories',
    topic: 'load',
    callback: _onLoad
  });

  postal.subscribe({
    channel: 'stories',
    topic: 'search stories',
    callback: _onSearchStories
  });

  postal.subscribe({
    channel: 'stories',
    topic: 'story completed',
    callback: _onStoryCompleted
  });

  return {

    /*
     * Public
     */


  };

}());
