/**
 * Story management service.
 *
 * @author Chris Spiliotopoulos
 */
import _ from 'lodash';
import shortid from 'shortid';
import moment from 'moment';
import DataStory from 'apispots-lib-stories/lib/stories/data-story';

import BrowserStorage from '../common/browser-storage';

export default (function() {

  /**
   * Saves a story instance in the
   * local storage.
   * @param  {[type]} story [description]
   * @return {[type]}       [description]
   */
  const _save = function(story) {
    return new Promise((resolve, reject) => {

      try {

        if (_.isEmpty(story.id)) {
          // if this is a new story,
          // generate a unique Id
          const storyId = shortid.generate();
          story.id = storyId;

          // add the creation timestamp
          story.definition.createdAt = moment.utc().toISOString();
        }

        // add the update timestamp
        story.definition.updatedAt = moment.utc().toISOString();

        // remove all sections
        // that should not be serialized
        _.each(story.parts, (part) => {
          delete part.output;
          delete part.valid;
        });

        // remove all empty story parts
        _.remove(story.parts, (o) => _.isEmpty(o));

        // put in local storage
        const key = `openapis|stories|${story.spec}`;

        // get the entry from local storage
        BrowserStorage.local.get(key, (items) => {

          let stories = items[key];

          // if no stories have already been stored,
          // create a new collection
          if (_.isEmpty(stories)) {
            stories = [];
          }

          // check if the story exists in the collection
          const match = _.find(stories, {
            id: story.id
          });

          if (!_.isEmpty(match)) {
            // if the story already exists,
            // remove it from the collection first
            _.remove(stories, {
              id: story.id
            });
          }

          // add the new story to the collection
          stories.push(story.definition);

          // update the entry in the store
          items = {};
          items[key] = stories;

          BrowserStorage.local.set(items, () => {
            // return the Id of the story
            resolve(story.id);
          });
        });
      } catch (e) {
        reject(e);
      }

    });
  };

  /**
   * Fetches all stories associated with
   * the provided API spot url.
   * @param  {[type]} specUrl [description]
   * @return {[type]}         [description]
   */
  const _getStoriesBySpec = function(specUrl) {
    return new Promise((resolve, reject) => {

      try {

        // get the list of stories
        // created for this API spec
        const key = `openapis|stories|${specUrl}`;

        // get the entry from local storage
        BrowserStorage.local.get(key, (items) => {
          // return the stories collection
          const stories = items[key];

          const out = _.chain(stories)
            .each((o) => {

              // create a humanized version
              // of the update duration
              if (!_.isEmpty(o.updatedAt)) {
                const duration = moment.duration(moment.utc().diff(moment(o.updatedAt)));
                o.tsHuman = duration.humanize();
              }
            })
            .orderBy(['updatedAt'], ['desc'])
            .value();

          resolve(out);
        });

      } catch (e) {
        reject(e);
      }

    });

  };

  /**
   * Returns a story instance
   * by spec URL and Id.
   * @return {[type]} [description]
   */
  const _getStory = function(specUrl, id) {
    return new Promise((resolve, reject) => {

      try {

        // get the list of stories
        // created for this API spec
        _getStoriesBySpec(specUrl)
          .then(stories => {

            // find our story
            const definition = _.find(stories, {
              id
            });

            if (_.isEmpty(definition)) {
              reject(new Error('Story does not exist'));
            } else {

              // create the story instance
              // using this definition
              const story = new DataStory({
                definition
              });

              // return the story instance
              resolve(story);
            }
          });

      } catch (e) {
        reject(e);
      }

    });
  };


  /**
   * Deletes a story by Id.
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  const _delete = function(specUrl, id) {
    return new Promise((resolve) => {

      // get the stories for this API
      _getStoriesBySpec(specUrl)
        .then(stories => {

          if (!_.isEmpty(stories)) {

            // remove the story from the
            // collection by Id
            _.remove(stories, {
              id
            });

            // update in local storage
            const key = `openapis|stories|${specUrl}`;
            const items = {};
            items[key] = stories;

            BrowserStorage.local.set(items, () => {
              resolve();
            });
          } else {
            resolve();
          }
        })
        .catch(() => {
          // silent
          resolve();
        });

    });
  };

  /**
   * Searches all available data stories
   * matching any input query params.
   * @param  {[type]} query [description]
   * @return {[type]}       [description]
   */
  const _search = (query) => new Promise((resolve) => {

    const {specUrl, phrase} = query;

    // get all stories for this spec URL
    _getStoriesBySpec(specUrl)
      .then(stories => {

        const matches = _.chain(stories)
          .filter(o => {

            const matchpoints = [];

            // check if phrase is contained within title
            if (_.includes(o.title.toLowerCase(), phrase.toLowerCase())) {
              matchpoints.push('title');
            }

            // check if phrase is contained within description
            if (!_.isEmpty(o.description)) {
              if (_.includes(o.description.toLowerCase(), phrase.toLowerCase())) {
                matchpoints.push('description');
              }
            }

            if (_.isEmpty(matchpoints)) {
              return false;
            }

            // set the matchpoints and
            // include this story
            o.matchpoints = matchpoints;
            return true;
          })
          .value();

        resolve(matches);
      });
  });

  /**
   * Duplicates a story instance.
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  const _duplicate = function(specUrl, id, title) {
    return new Promise((resolve, reject) => {

      // get the story instance
      _getStory(specUrl, id)
        .then(story => {

          const obj = _.cloneDeep(story);
          delete obj.definition.id;
          obj.definition.title = title;

          // save the story
          _save(obj)
            .then(resolve)
            .catch(reject);
        })
        .catch(reject);
    });
  };


  return {

    /*
     * Public
     */
    getStoriesBySpec: _getStoriesBySpec,
    getStory: _getStory,
    save: _save,
    delete: _delete,
    search: _search,
    duplicate: _duplicate

  };

}());
