/**
 * Story maker module.
 * @return {[type]} [description]
 */
import _ from 'lodash';
import postal from 'postal';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';

import DataStory from '../../lib/stories/data-story';

import tplModal from '../../../extension/templates/modules/stories/story-maker.hbs';
import tplStepOutline from '../../../extension/templates/modules/stories/step-outline.hbs';
import tplStepInput from '../../../extension/templates/modules/stories/step-input.hbs';
import tplSchemaEditor from '../../../extension/templates/modules/stories/schema-editor.hbs';

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
      const formId = $(e.currentTarget).attr('data-step');
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

      const $step = $(`.modal .step[data-step="${stepId}"]`);

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
  const _validateStep = function() {

    // get all forms at this step
    const $forms = $('.modal .form');

    // validate each form in turn
    _.each($forms, (form) => {
      const $form = $(form);

      const included = $form.attr('data-include');

      // validate only included forms
      if (included !== 'false') {

        $form.form('validate form');
        const res = $form.form('is valid');

        $modal.modal('refresh');

        if ((!res) ||
        ((typeof res !== 'boolean') && (!res[res.length - 1]))) {
          throw new Error('Invalid step input');
        }
      }
    });

    // step: outline
    if (_stepId === 'outline') {

      // gather data
      _story.definition.title = $.trim($('.form .field [name="title"]').val());
      _story.definition.description = $.trim($('.form .field [name="description"]').val());
      if (_story.parts.length === 0) {
        _story.parts.push({});
      }
      _story.parts[0].operationId = $('.form .field [name="operation"]').val();
    } else if (_stepId === 'input') {

      // step: data input


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
    $('[name="title"]', 'form[data-step="outline"]').val(_story.definition.title);

    // description
    $('[name="description"]', 'form[data-step="outline"]').val(_story.definition.description);

    // operation
    if (typeof _story.parts[0] !== 'undefined') {
      $('[name="operation"]', 'form[data-step="outline"]').dropdown('set selected', _story.parts[0].operationId);
    }

    // form validators
    $('.modal form[data-step="outline"]')
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
   * Manage the input step
   * @return {[type]} [description]
   */
  const _onInputStep = function() {

    // get the selected operation
    const opId = 'addPet';// _story.parts[0].operationId;

    // get the operation definition
    const operation = _.cloneDeep(_api.getOperation(opId));

    _.each(operation.parameters, (o) => {
      // check if the param has a schema
      if (typeof o.schema !== 'undefined') {
        // enrich the model with the object type
        const type = o.schema.$$ref.replace('#/definitions/', '');
        o.type = type;
      }

      // enrich with field info
      _enrichWithFieldInfo(o);
    });

    // create the model
    const model = {
      title: _api.title,
      parameters: operation.parameters
    };

    // render the form template
    const $cnt = $('.modal #step-contents');
    const html = tplStepInput(model);
    $cnt.html(html);

    // initialize calendars
    flatpickr('.ui.input[data-stepat="date"]', {});
    flatpickr('.ui.input[data-stepat="dateTime"]', {
      enableTime: true
    });

    // manage schema definitions
    _bindSchemaManager();

    // initialize dropdowns
    _.each($('.ui.dropdown', $cnt), (el) => {

      const $el = $(el);
      const opts = {};

      if ($el.attr('data-allowAdditions')) {
        opts.allowAdditions = true;
      }

      // create the dropdown
      $el.dropdown(opts);
    });

    // bind the dataset validators
    _bindDatasetValidators();
  };


  /**
   * Enriches a property model with
   * the appropriate field info.
   * @param  {[type]} property [description]
   * @return {[type]}          [description]
   */
  const _enrichWithFieldInfo = function(property) {

    try {

      // decide on the field type
      if (property.type === 'array') {

        // this should be a dropdown
        property.fieldType = 'select';

        // if an enum is defined, field should
        // be a dropdown
        if (typeof property.items.enum !== 'undefined') {
          property.fieldValues = property.items.enum;
          property.fieldDefaultValue = property.items.default;
        } else {
          // use a tag bar that allows additions
          property.fieldAllowAdditions = true;
          property.selectMultiple = true;
        }

        // is multi selection allowed?
        if (property.collectionFormat === 'multi') {
          property.selectMultiple = true;
        }
      } else if (property.type === 'boolean') {
        // boolean dropdown
        property.fieldType = 'select';
        property.fieldValues = ['true', 'false'];
      } else if (typeof property.enum !== 'undefined') {
        // enums should use a dropdown with predefined values
        property.fieldType = 'select';
        property.fieldValues = property.enum;
        property.fieldDefaultValue = property.default;
      } else if (property.type === 'file') {

        console.log('File is not supported yet');
      } else {

        // otherwise use an input
        property.fieldType = 'input';

        // set the type of input field
        if (property.format === 'password') {
          property.inputType = 'password';
        } else {
          property.inputType = 'text';
        }
      }

      // add validation rules
      _addValidationRules(property);

    } catch (e) {
      console.error('Failed to enrich with field info', e);
    }
  };

  /**
   * Adds validation rules on the
   * property based on definition.
   * @param  {[type]} o [description]
   * @return {[type]}   [description]
   */
  const _addValidationRules = function(o) {

    o.rules = [];

    // required
    if ((o.required) && (!o.allowEmptyValue)) {
      o.rules.push('empty');
    }

    // integer
    if (o.type === 'integer') {
      o.rules.push('integer');
    }

    // double / float
    if ((o.format === 'float') ||
      (o.format === 'double')) {
      o.rules.push('decimal');
    }

    // min length
    if (typeof o.minLength !== 'undefined') {
      o.rules.push(`minLength[${o.minLength}]`);
    }

    // max length
    if (typeof o.maxLength !== 'undefined') {
      o.rules.push(`maxLength[${o.maxLength}]`);
    }

    // pattern
    if (typeof o.pattern !== 'undefined') {
      o.rules.push(`regExp[${o.pattern}]`);
    }

    // stringify and escape rules
    o.rules = _.escape(JSON.stringify(o.rules));
  };

  /**
   * Binds form validators for
   * the input dataset.
   * @param  {[type]} parameters [description]
   * @return {[type]}            [description]
   */
  const _bindDatasetValidators = function() {

    // find all forms
    const $forms = $('.modal .form');

    // process each form
    _.each($forms, (form) => {
      const $form = $(form);

      // find all fields with 'data-rule'
      // attributes in this form
      const $fields = $('[data-rules]', $form);

      const opts = {
        inline: true,
        on: 'blur',
        fields: {}
      };

      // get the 'included' state of the form
      const include = $form.attr('data-include');

      // process only forms
      // included in the payload
      if (include !== 'false') {

        // loop through the fields
        _.each($fields, (field) => {
          const $field = $(field);
          const name = $field.attr('name');

          // get the rules, unescape and parse
          let rules = $field.attr('data-rules');
          rules = JSON.parse(_.unescape(rules));

          opts.fields[name] = {
            identifier: name,
            rules: []
          };

          // if the 'empty' rule is not
          // present, make the validation optional
          if (rules.indexOf('empty') === -1) {
            opts.fields[name].optional = true;
          }

          _.each(rules, (rule) => {
            opts.fields[name].rules.push({
              type: rule
            });
          });
        });
      }

      // bind the validators
      $form.form(opts);
    });

  };


  /**
   * [description]
   * @return {[type]} [description]
   */
  const _bindSchemaManager = function() {

    // find all schema inputs
    const $input = $('.modal div[data-type="definition"]');

    if ($input.length > 0) {

      // get the definition type
      const type = $input.attr('data-schema');

      // get the type definition and clone it
      const definition = _.cloneDeep(_api.getDefinition(type));

      /**
       * Definition properties traversal function.
       * @param  {[type]} definition [description]
       * @return {[type]}            [description]
       */
      const traverse = function(node, func) {

        try {
          // call the func
          if (typeof func === 'function') {
            func(node);
          }
        } catch (e) {
          console.error(e);
        }

        _.each(node.properties, (o, key) => {

          o.name = key;
          o.parent = node;

          traverse(o, func);
        });
      };

      // traverse the definition to enrich
      // the properties
      traverse(definition, (prop) => {

        // check if object
        if ((prop.type === 'object') || (typeof prop.$$ref !== 'undefined')) {
          // enrich the model with the object type
          const type = prop.$$ref.replace('#/definitions/', '');
          prop.schema = type;
        }

        // check if object model is required
        if ((!_.isEmpty(prop.parent)) && (prop.parent.type === 'object')) {
          if ((!_.isEmpty(prop.parent.required)) &&
              (prop.parent.required.indexOf(prop.name) > -1)) {
            prop.optional = false;
            prop.required = true;
          } else {
            prop.optional = true;
          }
        }

        // enrich with field info
        _enrichWithFieldInfo(prop);
      });

      // traverse the definition to
      // build the input template
      traverse(definition, (prop) => {

        if ((prop.type === 'object') || (typeof prop.$$ref !== 'undefined')) {

          const model = {
            type: prop.schema,
            definition: prop
          };

          const html = tplSchemaEditor(model);

          if (typeof prop.parent === 'undefined') {
            // set as root
            $input.html(html);
            $('.accordion', $input).addClass('ui styled');
            $('.accordion', $input).attr('data-type', prop.schema);
          } else {
            // append to the parent model
            const $parent = $(`.accordion[data-type="${prop.parent.schema}"]`, $input);
            $('.content', $parent).append(html);
          }
        }
      });

      // initialize accordions
      $('.ui.accordion').accordion({
        onOpen: () => {
          // refresh the modal
          $modal.modal('refresh');
        },
        onClose: () => {
          // refresh the modal
          $modal.modal('refresh');
        }
      });

      // bind model togglers
      $('.ui.checkbox[data-toggle="include"]')
        .checkbox({
          onChange() {
            const $el = $(this);
            const enabled = $el.parent().checkbox('is checked');
            const $form = $el.closest('.content.model').find('.form');

            // switch the state of the model form
            _switchStateOfOptionalModels(enabled, $form);
          }
        });

      // disable all optional models by default
      _switchStateOfOptionalModels(false);

      // refresh the modal
      $modal.modal('refresh');
    }

  };

  /**
   * Switches the state of all optional
   * models in the iput step.
   * @param  {[type]} enabled [description]
   * @return {[type]}         [description]
   */
  const _switchStateOfOptionalModels = function(included, $ctx) {

    // if a form context is not provided,
    // find all optional forms
    if (typeof $ctx === 'undefined') {
      $ctx = $('.form[data-optional="true"]');
    }

    // go through each optional form
    _.each($ctx, (form) => {
      const $form = $(form);
      const $fields = $('.field', $form);
      _.each($fields, (field) => {
        const $field = $(field);

        if (included) {
          $field.removeClass('disabled');
        } else {
          $field.addClass('disabled');
        }
      });

      // set the attribute flag
      $form.attr('data-include', included);
    });

    // re-bind all validators
    _bindDatasetValidators();

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
