/**
 * Story maker module.
 * @return {[type]} [description]
 */
import _ from 'lodash';
import postal from 'postal';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import asyncWaterfall from 'async/waterfall';
import swal from 'sweetalert2';
import DataStory from 'apispots-lib-stories/lib/stories/data-story';
import ace from 'brace';
import 'brace/theme/chrome';
import 'brace/mode/json';
import 'brace/mode/xml';
import 'brace/mode/text';

import StoryManager from '../../lib/stories/story-manager';

import tplModal from '../../../extension/templates/modules/stories/story-maker.hbs';
import tplStepOutline from '../../../extension/templates/modules/stories/step-outline.hbs';
import tplStepInput from '../../../extension/templates/modules/stories/step-input.hbs';
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

  // the selected operation
  let _operationId;

  /**
   * Called when a story needs to be
   * created.  Displays a modal.
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  const _onCreateStory = function(data) {

    // remember the API definition
    _api = data.api;
    _operationId = data.operationId;

    // create a new data story
    _story = new DataStory();

    const model = {};

    const html = tplModal(model);
    $modal = $(html);

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
      },
      onApprove: () => {
        try {
          // save the story
          _onSaveStory();
          return true;
        } catch (e) {
          // something failed
          return false;
        }
      }
    }).modal('show');

    $('.modal .steps .step').on('click', (e) => {
      // get the selected form Id
      const formId = $(e.currentTarget).attr('data-step');
      _onStepSelected(formId);
    });

    // TODO: REMOVE THIS
    _story.parts.push({});
  };

  /**
   * Called when a story needs to be
   * edited.
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  const _onEditStory = function(data) {

    // remember the API definition
    _api = data.api;

    // get the story Id
    const id = data.storyId;

    asyncWaterfall([

      (cb) => {

        // get the story instance
        StoryManager.getStory(_api.specUrl, id)
          .then(story => {
            // set the story instance
            _story = story;

            cb();
          })
          .catch(e => {
            console.error(e);
            cb();
          });
      }

    ], () => {

      const model = {};

      const html = tplModal(model);
      $modal = $(html);

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
        },
        onApprove: () => {
          try {
            // save the story
            _onSaveStory();
            return true;
          } catch (e) {
            // something failed
            return false;
          }
        }
      }).modal('show');

      // bind listeners
      $('.modal .steps .step').on('click', (e) => {
        // get the selected form Id
        const formId = $(e.currentTarget).attr('data-step');
        _onStepSelected(formId);
      });

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

    // get the payload type
    const payloadType = $('.payload.tabs .item.active').attr('data-tab');

    // check the selected payload type
    if (payloadType === 'payload-model') {

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

    }

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
    const $select = $('[name="operation"]', 'form[data-step="outline"]');

    if (!_.isEmpty(_story.parts[0])) {
      $select.dropdown('set selected', _story.parts[0].operationId);
    } else if (!_.isEmpty(_operationId)) {
      $select.dropdown('set selected', _operationId);
    }

    // dropdown
    $('.modal .dropdown').dropdown();

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

    // for now remove all 'header' params
    _.remove(operation.parameters, (o) => o.in === 'header');

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
      parameters: operation.parameters,
      hasParameters: (!_.isEmpty(operation.parameters)),
      consumes: operation.consumes
    };

    // check if the operation has a payload param (in body)
    const matches = _.find(operation.parameters, { in: 'body'
    });
    model.hasPayload = (!_.isEmpty(matches));

    // render the form template
    const $cnt = $('.modal #step-contents');
    const html = tplStepInput(model);
    $cnt.html(html);

    // initialize the tabs
    $('.payload.tabs .item').tab({
      onVisible: (tabPath) => {

        // when the ray payload tab is clicked
        if (tabPath === 'payload-raw') {

          // load the ACE editor
          const editor = ace.edit($('.tab .editor').get(0));
          editor.setTheme('ace/theme/chrome');
          editor.session.setMode('ace/mode/json');
          editor.$blockScrolling = Infinity;
        }

        $modal.modal('refresh');
      }
    });

    // initialize calendars
    flatpickr('.ui.input[data-format="date"]', {});
    flatpickr('.ui.input[data-format="dateTime"],.ui.input[data-format="date-time"]', {
      enableTime: true
    });

    // manage schema definitions
    _bindSchemaManager();

    // initialize dropdowns
    _.each($('.form .ui.dropdown', $cnt), (el) => {

      const $el = $(el);
      const opts = {};

      if ($el.attr('data-allowAdditions')) {
        opts.allowAdditions = true;
      }

      // create the dropdown
      $el.dropdown(opts);
    });

    // content type drop down
    $('[name="payload-content-type"]').dropdown({
      onChange: (value) => {

        // change the session mode of the editor
        const editor = ace.edit($('.tab .editor').get(0));

        let mode = 'ace/mode/json';

        if (value === 'application/xml') {
          mode = 'ace/mode/xml';
        } else if (value === 'text/plain') {
          mode = 'ace/mode/text';
        }

        editor.session.setMode(mode);
      }
    });

    // populate with existing data
    _populateInputDataset();

    // bind the dataset validators
    _bindDatasetValidators();

    // refresh the modal
    $modal.modal('refresh');
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

    // check the supported response types
    if (_.includes(operation.produces, 'application/json')) {
      model.jsonSupported = true;
    }

    if (_.includes(operation.produces, 'application/xml')) {
      model.xmlSupported = true;
    }

    if (_.includes(operation.produces, 'application/csv') ||
      _.includes(operation.produces, 'text/csv')) {
      model.csvSupported = true;
    }

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

        // check if model property is required
        if (!_.isEmpty(prop.parent)) {
          if (_.includes(prop.parent.required, prop.name)) {
            prop.required = true;
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
      const dataset = {};

      // get the payload type
      let payloadType = $('.payload.tabs .item.active').attr('data-tab');

      if (_.isEmpty(payloadType)) {
        payloadType = 'payload-model';
      }

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
          const isRootForm = (typeof $form.attr('data-root') !== 'undefined');

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
              const isRootField = (typeof $field.attr('data-root') !== 'undefined');

              if (isRootForm && (!isRootField)) {
                return;
              }

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

      // set the story input
      const input = {
        payloadType,
        parameters: dataset
      };

      if (payloadType === 'payload-raw') {
        // get the raw payload from the editor
        const editor = ace.edit($('.tab .editor').get(0));
        const payload = editor.session.getValue();

        const opId = _story.parts[0].operationId;
        const operation = _api.getOperation(opId);

        // find the 'in body' param of the operation
        const match = _.find(operation.parameters, { in: 'body' });

        // replace the correct parameter
        // name with the payload
        if (!_.isEmpty(match)) {
          input.parameters[match.name] = payload;
        }
      }

      // get the selected content type
      const $dd = $('[name="payload-content-type"]');

      if ($dd.length === 1) {
        input.contentType = $dd.dropdown('get value');
      }

      // get the part
      const part = _story.parts[0];

      // set the input
      part.input = input;

    } catch (e) {
      console.error('Failed to gather input dataset', e);
    }
  };

  /**
   * Populates the input dataset
   * form with the saved part's data.
   * @return {[type]} [description]
   */
  const _populateInputDataset = function() {

    try {

      const part = _story.parts[0];

      if (_.isEmpty(part.input)) {
        return;
      }

      // the default payload type
      let payloadType = 'payload-model';

      // if there is a set payload type
      // on the input section, use this
      if (!_.isEmpty(part.input.payloadType)) {
        payloadType = part.input.payloadType;
      }

      // get the story input (if exists)
      const dataset = part.input.parameters;

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

      // switch to the selected payload type
      $('.payload.tabs .item').tab('change tab', payloadType);

      // if the saved payload type is 'raw'
      if (payloadType === 'payload-raw') {

        // set the selected content type
        if (!_.isEmpty(part.input.contentType)) {
          const $dd = $('[name="payload-content-type"]');

          if ($dd.length === 1) {
            $dd.dropdown('set selected', part.input.contentType);
          }
        }

        // find the name of the 'in body' parameter
        const opId = part.operationId;
        const operation = _api.getOperation(opId);
        const match = _.find(operation.parameters, { in: 'body' });
        const name = match.name;

        const payload = dataset[name];

        // raw payload has been used, so
        // populate the editor
        const editor = ace.edit($('.tab .editor').get(0));
        editor.setTheme('ace/theme/chrome');

        let mode = 'ace/mode/json';

        if (part.input.contentType === 'application/xml') {
          mode = 'ace/mode/xml';
        } else if (part.input.contentType === 'text/plain') {
          mode = 'ace/mode/text';
        }

        editor.session.setMode(mode);
        editor.setValue(payload);
        editor.clearSelection();
        editor.gotoLine(0, 0);
        editor.resize();
      }

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

    // save the story definition
    StoryManager.save(_story)
      .then(() => {
        // reload the stories
        postal.publish({
          channel: 'stories',
          topic: 'reload stories'
        });
      })
      .catch(e => {
        // show an alert
        swal({
          title: 'Ooops...',
          text: `Something went wrong and the story could not be saved [${e.message}]`,
          type: 'error',
          timer: 10000
        });
      });

  };


  // event bindings
  postal.subscribe({
    channel: 'stories',
    topic: 'create story',
    callback: _onCreateStory
  });

  postal.subscribe({
    channel: 'stories',
    topic: 'edit story',
    callback: _onEditStory
  });


  return {

    /*
     * Public
     */


  };

}());
