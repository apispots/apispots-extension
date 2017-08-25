/**
 * Story maker module.
 * @return {[type]} [description]
 */
import _ from 'lodash';
import postal from 'postal';

import DataStory from '../../lib/stories/data-story';

import tplModal from '../../../extension/templates/modules/stories/story-maker.hbs';
import tplStepOutline from '../../../extension/templates/modules/stories/step-outline.hbs';
import tplStepInput from '../../../extension/templates/modules/stories/step-input.hbs';

export default (function() {

  /*
   * Private
   */
  const steps = {
    outline: tplStepOutline,
    input: tplStepInput
  };

  // the API definition instance
  let _api = null;

  // the data story instance
  let _story = new DataStory();

  // the modal instance
  let $modal;

  // the current step Id
  let _stepId;

  /**
   * Called when a story needs to be
   * created.  Displays a modal.
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  const _onCreateStory = function(data) {

    // remember the API definition
    _api = data.api;

    const model = {};

    const html = tplModal(model);
    $modal = $(html);

    // save button
    $('#btn-save', $modal).on('click', _onSaveStory);

    $modal.modal({
      duration: 100,
      onVisible: () => {
        // select the first step
        _onStepSelected('outline');

        $modal.modal('refresh');
      },
      onHidden: () => {
        // clear local data
        _resetData();
      }
    }).modal('show');

    $('.modal .steps .step').on('click', (e) => {
      // get the selected form Id
      const formId = $(e.currentTarget).attr('data-form');
      _onStepSelected(formId);
    });

  };

  /**
   * User clicked on a step.
   * @param  {[type]} e [description]
   * @return {[type]}   [description]
   */
  const _onStepSelected = function(stepId) {

    if (_stepId === stepId) {
      return;
    }

    try {

      // validate the existing form
      if (_stepId) {
        _validateStep(_stepId);
      }

      // remember the current step Id
      _stepId = stepId;

      const $step = $(`.modal .step[data-form="${stepId}"]`);

      $('.modal .steps .step').removeClass('active');
      $step.addClass('active');

      // get the selected form template
      const tpl = steps[stepId];

      // create the model
      const model = {
        title: _api.title,
        operations: _api.operationsBySummary
      };

      // render the form template
      const $cnt = $('.modal #step-contents');
      const html = tpl(model);
      $cnt.html(html);

      // bind the listeners
      _bindFormListeners();

      // bind validators
      _bindFormValidators();

      // populate the step with data
      _populateStepWithData(stepId);

    } catch (e) {
      // silent
    }
  };

  /**
   * Binds all form listeners.
   * @param  {[type]} $cnt [description]
   * @return {[type]}      [description]
   */
  const _bindFormListeners = function() {

    // outline form
    $('[name="title"]', 'form[data-form="outline"]')
      .on('change', (e) => {
        // set the title
        _story.definition.title = $.trim($(e.currentTarget).val());
      });

    $('[name="description"]', 'form[data-form="outline"]')
      .on('change', (e) => {
        // set the description
        _story.definition.description = $.trim($(e.currentTarget).val());
      });

    $('[name="operation"]', 'form[data-form="outline"]')
      .dropdown({
        onChange: (value) => {
          // get the selected operation
          const operationId = value;

          // add one part only
          const part = {};
          if (_story.parts.length === 0) {
            _story.parts.push(part);
          }

          _story.parts[0].operationId = operationId;
        }
      });
  };

  /**
   * Binds the form validators
   * @return {[type]} [description]
   */
  const _bindFormValidators = function() {

    // outline form
    $('.modal form[data-form="outline"]')
      .form({
        inline: true,
        on: 'blur',
        fields: {
          title: {
            identifier: 'title',
            rules: [{
              type: 'empty',
              prompt: 'Please enter a story title'
            }]
          },
          description: {
            identifier: 'description',
            rules: [{
              type: 'empty',
              prompt: 'Please write a short description'
            }]
          },
          operation: {
            identifier: 'operation',
            rules: [{
              type: 'empty',
              prompt: 'Please select a base operation'
            }]
          }
        }
      });
  };


  /**
   * Gathers the data entered in
   * all steps.
   * @return {[type]} [description]
   */
  const _validateStep = function(stepId) {

    // step: outline
    if (stepId === 'outline') {

      const $form = $(`form[data-form="${stepId}"]`);
      $form.form('validate form');
      const res = $form.form('is valid');

      $modal.modal('refresh');

      if ((!res) ||
        ((typeof res !== 'boolean') && (!res[res.length-1]))) {
        throw new Error('Invalid step input');
      }
    }


  };


  /**
   * Populates the given step form
   * with already stored data.
   * @param  {[type]} stepId [description]
   * @return {[type]}        [description]
   */
  const _populateStepWithData = function(stepId) {

    if (stepId === 'outline') {
      // title
      $('[name="title"]', 'form[data-form="outline"]').val(_story.definition.title);

      // description
      $('[name="description"]', 'form[data-form="outline"]').val(_story.definition.description);

      // operation
      console.log(_story.parts[0].operationId);
      if (typeof _story.parts[0] !== 'undefined') {
        $('[name="operation"]', 'form[data-form="outline"]').dropdown('set selected', _story.parts[0].operationId);
      }
    }


  };


  /**
   * Saves the story definition.
   * @return {[type]} [description]
   */
  const _onSaveStory = function() {

    console.log('save story', _story.toYAML());
  };


  /**
   * Resets local data.
   * @return {[type]} [description]
   */
  const _resetData = function() {
    _stepId = null;
    _story = new DataStory();
  };


  // event bindings
  postal.subscribe({
    channel: 'stories',
    topic: 'createStory',
    callback: _onCreateStory
  });


  return {

    /*
     * Public
     */


  };

}());
