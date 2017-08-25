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
        _onStepSelected('input');

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

      // validate the previous step
      if (_stepId) {
        _validateStep(_stepId);
      }

      // change step
      _stepId = stepId;

      const $step = $(`.modal .step[data-form="${stepId}"]`);

      $('.modal .steps .step').removeClass('active');
      $step.addClass('active');

      // manage the step
      if (_stepId === 'outline') {
        _onOutlineStep();
      } else if (_stepId === 'input') {
        _onInputStep();
      }


    } catch (e) {
      // silent
    }
  };


  /**
   * Gathers the data entered in
   * all steps.
   * @return {[type]} [description]
   */
  const _validateStep = function(stepId) {

    // step: outline
    if (_stepId === 'outline') {

      const $form = $(`form[data-form="${stepId}"]`);
      $form.form('validate form');
      const res = $form.form('is valid');

      $modal.modal('refresh');

      if ((!res) ||
        ((typeof res !== 'boolean') && (!res[res.length - 1]))) {
        throw new Error('Invalid step input');
      }
    }


  };


  /**
   * Manage the outline step
   * @return {[type]} [description]
   */
  const _onOutlineStep = function() {

    // create the model
    const model = {
      title: _api.title,
      operations: _api.operationsBySummary
    };

    // render the form template
    const $cnt = $('.modal #step-contents');
    const html = tplStepOutline(model);
    $cnt.html(html);

    /*
     * populate with existing data
     */

    // title
    $('[name="title"]', 'form[data-form="outline"]').val(_story.definition.title);

    // description
    $('[name="description"]', 'form[data-form="outline"]').val(_story.definition.description);

    // operation
    if (typeof _story.parts[0] !== 'undefined') {
      $('[name="operation"]', 'form[data-form="outline"]').dropdown('set selected', _story.parts[0].operationId);
    }

    // form validators
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


    // form listeners
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
   * Manage the input step
   * @return {[type]} [description]
   */
  const _onInputStep = function() {

    // get the selected operation
    const opId = 'findPetsByStatus'; // _story.parts[0].operationId;

    // get the operation definition
    const operation = _.cloneDeep(_api.getOperation(opId));

    _.each(operation.parameters, (o) => {
      // check if the param has a schema
      if (typeof o.schema !== 'undefined') {
        // enrich the model with the object type
        const type = o.schema.$$ref.replace('#/definitions/', '');
        o.type = type;
      }

      // decide on the field type
      if (o.type === 'array') {

        // this should be a dropdown
        o.fieldType = 'select';
        o.fieldValues = o.items.enum;
        o.defaultValue = o.items.default;

        if (o.collectionFormat === 'multi') {
          o.selectMultiple = true;
        }
      } else if (o.type === 'boolean') {
        o.fieldType = 'select';
        o.fieldValues = ['true', 'false'];
      } else if (o.type === 'file') {

        console.log('File is not supported yet');
      } else {

        // otherwise use an input
        o.fieldType = 'input';
      }

    });

    // create the model
    const model = {
      title: _api.title,
      parameters: operation.parameters
    };

    console.log(operation.parameters);

    // render the form template
    const $cnt = $('.modal #step-contents');
    const html = tplStepInput(model);
    $cnt.html(html);

    // initialize dropdowns
    $('.ui.dropdown', $cnt).dropdown();

    // bind the dataset validators
    _bindDatasetValidators(operation.parameters);
  };


  /**
   * Binds form validators for
   * the input dataset.
   * @param  {[type]} parameters [description]
   * @return {[type]}            [description]
   */
  const _bindDatasetValidators = function(parameters) {

    const opts = {
      inline: true,
      on: 'blur',
      fields: {}
    };

    // iterate through all params
    _.each(parameters, (o) => {

      // locate the field on the form
      const name = o.name;

      // get the field instance
      const $field = $(`.modal .parameter[name="${name}"]`);

      // add an entry to the map
      const entry = {
        identifier: name,
        rules: []
      };
      opts.fields[name] = entry;

      // add the rules
      console.log(o);

      // required
      if (o.required) {
        entry.rules.push({
          type: 'empty',
          prompt: 'This field is required'
        });
      }

      switch (o.format) {
        case 'integer':
          entry.rules.push({
            type: 'integer',
            prompt: 'Value should be an integer'
          });
          break;
        case 'float':
        case 'double':
          entry.rules.push({
            type: 'decimal',
            prompt: 'Value should be a decimal'
          });
          break;
        default:
          break;
      }

      // min length
      if (typeof o.minLength !== 'undefined') {
        entry.rules.push({
          type: `minLength[${o.minLength}]`,
          prompt: `Value length should be >= ${o.minLength} characters`
        });
      }

      // max length
      if (typeof o.maxLength !== 'undefined') {
        entry.rules.push({
          type: `maxLength[${o.maxLength}]`,
          prompt: `Value length should be <= ${o.maxLength} characters`
        });
      }

      // pattern
      if (typeof o.pattern !== 'undefined') {
        entry.rules.push({
          type: 'regExp',
          value: o.pattern,
          prompt: `Value should conform to pattern ${o.pattern}`
        });
      }

    });

    console.log($('.modal .form'));

    // bind the validators
    $('.modal .form').form(opts);

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
