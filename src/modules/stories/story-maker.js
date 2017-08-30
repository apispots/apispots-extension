/**
 * Story maker module.
 * @return {[type]} [description]
 */
import _ from 'lodash';
import postal from 'postal';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import shortid from 'shortid';

import DataStory from '../../lib/stories/data-story';
import StoryPlayer from '../../lib/stories/story-player';
import StoryVisualizer from './story-visualizer';
import BrowserStorage from '../../lib/common/browser-storage';

import tplModal from '../../../extension/templates/modules/stories/story-maker.hbs';
import tplStepOutline from '../../../extension/templates/modules/stories/step-outline.hbs';
import tplStepInput from '../../../extension/templates/modules/stories/step-input.hbs';
import tplStepPlay from '../../../extension/templates/modules/stories/step-play.hbs';
import tplStepVisualize from '../../../extension/templates/modules/stories/step-visualize.hbs';
import tplSchemaEditor from '../../../extension/templates/modules/stories/schema-editor.hbs';

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

    // create a new data story
    _story = new DataStory();

    const model = {};

    const html = tplModal(model);
    $modal = $(html);

    // save button
    $('#btn-save', $modal).on('click', _onSaveStory);

    $modal.modal({
      closable: false,
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
      const formId = $(e.currentTarget).attr('data-step');
      _onStepSelected(formId);
    });

    // TODO: REMOVE THIS
    _story.parts.push({});
    // _story.parts[0].operationId = 'addPet';


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

        // except from the move 'Input' back to 'Outline',
        // in any other case validate the step
        if ((_stepId === 'input') && (stepId === 'outline')) {
          // do nothing
        } else {
          _validateStep(_stepId);
        }
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
      } else if (_stepId === 'visualize') {
        _onVisualizeStep();
      } else if (_stepId === 'play') {
        _onPlayStep();
      }

    } catch (e) {
      // silent
      console.error(e);
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

    // gather step data
    if (_stepId === 'outline') {
      // step: outline
      _gatherOutlineData();
    } else if (_stepId === 'input') {
      // step: data input
      _gatherInputDataset();
    } else if (_stepId === 'visualize') {
      // step: visualize
      _gatherVisualizationData();
    }

  };

  /**
   * Gathers the outline step data.
   * @return {[type]} [description]
   */
  const _gatherOutlineData = function() {
    try {

      // gather data
      _story.definition.spec = _api.specUrl;
      _story.definition.title = $.trim($('.form .field [name="title"]').val());
      _story.definition.description = $.trim($('.form .field [name="description"]').val());

      if (_story.parts.length === 0) {
        _story.parts.push({});
      }

      _story.parts[0].operationId = $('.form .field [name="operation"]').val();

    } catch (e) {
      console.error(e);
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
    const opId = _story.parts[0].operationId;

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

    // populate with existing data
    _populateInputDataset();

    // bind the dataset validators
    _bindDatasetValidators();
  };

  /**
   * Manages the visualization step
   * @return {[type]} [description]
   */
  const _onVisualizeStep = function() {

    // get the selected operation
    const opId = _story.parts[0].operationId;

    // get the operation definition
    const operation = _.cloneDeep(_api.getOperation(opId));

    // create the model
    const model = {
      story: _story,
      operation
    };

    // render the template
    const $cnt = $('.modal #step-contents');
    const html = tplStepVisualize(model);
    $cnt.html(html);

    // bind listeners
    $('.card .button', $cnt).on('click', (e) => {

      // mark the selected visualization card
      const $cards = $('.card', $cnt);
      $cards.removeClass('raised');
      const $buttons = $('.button', $cards);
      $buttons.removeClass('green active');

      const $btn = $(e.currentTarget);
      $btn.addClass('green active');
      $btn.closest('.card').addClass('raised');

    });

    // set any previously selected type
    if (!_.isEmpty(_story.parts[0].visualization)) {
      const type = _story.parts[0].visualization.type;
      $(`.card .button[data-type="${type}"]`, $cnt).trigger('click');
    }

  };

  /**
   * Manage the outline step
   * @return {[type]} [description]
   */
  const _onPlayStep = function() {

    try {

      // get the selected operation
      const opId = _story.parts[0].operationId;

      // get the operation definition
      const operation = _.cloneDeep(_api.getOperation(opId));

      const safeVerbs = ['get', 'head', 'options'];

      // create the model
      const model = {
        story: _story,
        part: _story.parts[0],
        operation
      };

      if (!_.isEmpty(operation)) {
        model.isSafe = _.includes(safeVerbs, operation.verb);
      }

      // render the form template
      const $cnt = $('.modal #step-contents');
      const html = tplStepPlay(model);
      $cnt.html(html);

      // bind listeners
      $('.modal button[data-action="play-story"]').on('click', _onPlayStory);

    } catch (e) {
      console.error(e);
    }

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
        property.fieldType = 'file';

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

      // traverse the definition to
      // enrich the properties
      traverse(definition, (prop) => {

        // check if object
        if ((prop.type === 'object') || (typeof prop.$$ref !== 'undefined')) {
          // enrich the model with the object type
          const type = prop.$$ref.replace('#/definitions/', '');
          prop.schema = type;
          prop.property = prop.name;
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

            // find the first form and its 'data-property'
            $('.form', $input).attr('data-property', $input.attr('data-property'));
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

      // switch on / off the toggle
      $form.parent().find('.checkbox.toggle').eq(0).checkbox(included ? 'check' : 'uncheck');
    });

    // re-bind all validators
    _bindDatasetValidators();

  };


  /**
   * Resets local data.
   * @return {[type]} [description]
   */
  const _resetData = function() {
    _stepId = null;
    _story = null;

    // destroy the modal instance
    $modal.remove();
    $modal = null;
  };


  /**
   * Gathers the input data set.
   * @return {[type]} [description]
   */
  const _gatherInputDataset = function() {

    try {

      // the dataset object
      let dataset = {};

      // get all forms in the view
      const $form = $('.modal .form').eq(0);

      /**
       * Form traversal function.
       * @param  {[type]} definition [description]
       * @return {[type]}            [description]
       */
      const traverseForm = function($form, parentNode) {

        let node;

        try {

          // is included?
          const included = $form.attr('data-include');

          // process only forms mark
          // as included
          if (included !== 'false') {

            // get the mapped property name
            const propname = $form.attr('data-property');

            if (typeof propname !== 'undefined') {
              // set the property on the parent node
              parentNode[propname] = {};
              node = parentNode[propname];
            } else {
              node = parentNode;
            }

            // gather all field data
            const $fields = $('.field', $form);

            // loop through the fields
            _.each($fields, (field) => {

              // get the field instance
              const $field = $(field);

              // get the corresponding property name
              const propname = $field.attr('data-property');

              // get the parameter control
              const $ctl = $('.parameter', $field);

              // check the control type and
              // get the field value
              let value;

              if ($ctl.is('input')) {
                // input box
                value = _.trim($ctl.val());

              } else if ($ctl.hasClass('dropdown')) {
                // select box

                // get the array of values from
                // the dropdown
                value = $ctl.dropdown('get value');
              }

              // if one way or another
              // value is empty, mark it
              // as undefined so that it
              // will not get included in
              // the data model
              if (_.isEmpty(value)) {
                value = undefined;
              }

              // add the property and value
              // to the model
              if (typeof value !== 'undefined') {
                node[propname] = value;
              }
            });
          }

        } catch (e) {
          console.error(e);
        }

        // get all 1st level child forms
        const $children = $form.parent().find('.form').eq(1);

        // traverse child forms
        _.each($children, (o) => {
          traverseForm($(o), node);
        });

      };

      // traverse the top-level form
      traverseForm($form, dataset);

      // TODO: This should be changed
      // temp fix for form traversal mixup
      // in case of 'body' payload
      if (typeof dataset.body !== 'undefined') {
        dataset = {
          body: dataset.body
        };
      }

      /*
       * set the story input
       */
      _story.parts[0].input = {
        parameters: dataset
      };

    } catch (e) {
      console.error('Failed to gather input dataset', e);
    }
  };


  /**
   * Populates the input dataset
   * section with in-memory
   * data.
   * @return {[type]} [description]
   */
  const _populateInputDataset = function() {

    try {

      if (_.isEmpty(_story.parts[0].input) ||
        _.isEmpty(_story.parts[0].input.parameters)) {
        return;
      }

      // get the story input (if exists)
      const dataset = _story.parts[0].input.parameters;

      // get all forms in the view
      const $form = $('.modal .form').eq(0);

      /**
       * Form traversal function.
       * @param  {[type]} definition [description]
       * @return {[type]}            [description]
       */
      const traverseForm = function($form, parentNode) {

        let node;

        try {

          // get the data-property of this form
          const propertyname = $form.attr('data-property');

          if (typeof propertyname !== 'undefined') {

            // get the corresponding node
            // from the dataset
            node = parentNode[propertyname];

            if (_.isEmpty(node)) {
              return;
            }

          } else {
            node = parentNode;
          }

          // get all parameter fields
          const $fields = $('.field', $form);

          // flag indicating whether at
          // least one field in the form
          // has been used
          let atLeastOneUsed = false;

          // loop through the fields
          _.each($fields, (field) => {

            // get the field instance
            const $field = $(field);

            // get the corresponding property name
            const propname = $field.attr('data-property');

            // get the property value
            // from the data node
            const value = node[propname];

            // process fields with values only
            if (typeof value !== 'undefined') {

              // a field is used
              atLeastOneUsed = true;

              // get the parameter control
              const $ctl = $('.parameter', $field);

              if ($ctl.is('input')) {
                // input box
                $ctl.val(value);

              } else if ($ctl.hasClass('dropdown')) {
                // select box

                let values;
                const allowAdditions = (typeof $ctl.attr('data-allowAdditions') !== 'undefined');

                if (_.isArray(value)) {
                  // if this is an array of values,
                  // populate the dropdown and
                  // mark all as selected
                  values = _.map(value, (o) => ({
                    name: o,
                    value: o,
                    selected: true
                  }));

                  $ctl.dropdown('change values', values);
                } else if (_.isString(value)) {

                  $ctl.dropdown('set selected', value);
                }


              }
            }
          });

          // if the form is optional and
          // at least one field has been
          // used, mark it as included
          if (atLeastOneUsed) {
            _switchStateOfOptionalModels(true, $form);
          }


        } catch (e) {
          console.error(e);
        }

        // get all 1st level child forms
        const $children = $form.parent().find('.form').eq(1);

        // traverse child forms
        _.each($children, (o) => {
          traverseForm($(o), node);
        });

      };

      // traverse the top-level form
      traverseForm($form, dataset);


    } catch (e) {
      // silent
      console.warn(e);
    }

  };

  /**
   * Gathers the selected visualization
   * step data.
   * @return {[type]} [description]
   */
  const _gatherVisualizationData = function() {

    // get the selected visualization type
    const type = $('#section-visualizations .card .button.active').attr('data-type');

    // save the visualization type
    // on the part
    _story.parts[0].visualization = {
      type
    };

  };


  /**
   * Saves the story definition.
   * @return {[type]} [description]
   */
  const _onSaveStory = function() {

    // validate the current step
    _validateStep();

    // generate a unique Id for this story
    const storyId = shortid.generate();
    _story.id = storyId;

    // remove all sections
    // that should not be serialized
    _.each(_story.parts, (part) => {
      delete part.output;
      delete part.valid;
    });

    // dump into YAML format
    // const dump = _story.toYAML();

    // put in local storage
    const key = `openapis|stories|${_api.specUrl}`;

    // get the entry from local storage
    BrowserStorage.local.get(key, (items) => {

      let stories = items[key];

      // if no stories have already been stored,
      // create a new collection
      if (_.isEmpty(stories)) {
        stories = [];
      }

      // push the story into the collection
      stories.push(_story.definition);

      // replace the entry in the store
      items = {};
      items[key] = stories;

      BrowserStorage.local.set(items, () => {
        // collection updated
      });
    });

  };


  /**
   * Plays the current data story.
   * @return {[type]} [description]
   */
  const _onPlayStory = function() {

    // switch button to loading state
    const $btn = $('.modal button[data-action="play-story"]');
    $btn.addClass('disabled loading');

    // play the story
    StoryPlayer.play(_story)
      .then(() => {

        // visualize the story
        StoryVisualizer.visualize(_story);

      })
      .catch(e => {
        console.log('story failed to execute', e);
      })
      .finally(() => {
        $btn.removeClass('disabled loading');
      });
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
