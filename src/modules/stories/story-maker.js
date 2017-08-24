/**
 * Story maker module.
 * @return {[type]} [description]
 */
import _ from 'lodash';
import postal from 'postal';

import tplModal from '../../../extension/templates/modules/stories/story-maker.hbs';
import tplFormOutline from '../../../extension/templates/modules/stories/form-outline.hbs';
import tplFormInput from '../../../extension/templates/modules/stories/form-input.hbs';

export default (function() {

  /*
   * Private
   */
  const forms = {
    outline: tplFormOutline,
    input: tplFormInput
  };

  // the API definition instance
  let _api = null;

  // the story definition
  const _story = {
    parts: []
  };

  // the modal instance
  let $modal;

  // the current form Id
  let _formId;

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
      },
      onHidden: () => {
        // clear local data
        _formId = null;
      }
    }).modal('show');

    $modal.modal('refresh');

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
  const _onStepSelected = function(formId) {

    if (_formId === formId) {
      return;
    }

    try {

      // validate the existing form
      if (_formId) {
        _validateForm(formId);
      }

      const $step = $(`.modal .step[data-form="${formId}"]`);

      $('.modal .steps .step').removeClass('active');
      $step.addClass('active');

      // get the selected form template
      const tpl = forms[formId];

      // create the model
      const model = {
        title: _api.title,
        operations: _api.operationsBySummary
      };

      // render the form template
      const $cnt = $('.modal #selected-form');
      const html = tpl(model);
      $cnt.html(html);

      // bind the listeners
      _bindFormListeners();
      _bindFormValidators();

      // resize the modal
      $modal.modal('refresh');

      // remember the current form Id
      _formId = formId;
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Binds all form listeners.
   * @param  {[type]} $cnt [description]
   * @return {[type]}      [description]
   */
  const _bindFormListeners = function() {

    const $cnt = $('.modal #selected-form');

    // steps
    $('.ui.dropdown', $cnt).dropdown();

    // outline form
    $('[name="title"]', 'form[data-form="outline"]')
      .on('change', (e) => {
        // set the title
        _story.title = $.trim($(e.currentTarget).val());
      });

    $('[name="description"]', 'form[data-form="outline"]')
      .on('change', (e) => {
        // set the description
        _story.description = $.trim($(e.currentTarget).val());
      });

    $('[name="operation"]', 'form[data-form="outline"]')
      .on('change', (e) => {
        // get the selected operation
        const operationId = $(e.currentTarget).val();

        // add one part only
        const part = {};
        if (_story.parts.length === 0) {
          _story.parts.push(part);
        }

        part.operationId = operationId;
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
   * all forms.
   * @return {[type]} [description]
   */
  const _validateForm = function(formId) {

    const valid = $(`form[data-form="${formId}"]`)
      .form('is valid');


  };

  /**
   * Saves the story definition.
   * @return {[type]} [description]
   */
  const _onSaveStory = function() {

    console.log('save story', _story);
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
