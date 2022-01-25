/**
 * Authentication module.
 * @return {[type]} [description]
 */
import _ from 'lodash';
import asyncWaterfall from 'async/waterfall';
import postal from 'postal';
import swal from 'sweetalert2';

import CredentialsManager from '../../lib/openapi/browser-credentials-manager';

import tplModal from '../../../extension/templates/modules/api/authentication/auth-modal.hbs';

export default (function() {

  /*
   * Private
   */

  // the API definition instance
  let _api = null;

  // the authentication type
  let _type = null;

  // the authentication definition name
  let _name = null;

  // the modal instance
  let $modal;

  /**
   * Called when an authentication
   * needs to be activated.
   * Displays a modal.
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  const _onActivateAuthentication = function(data) {

    // remember these
    _api = data.api;
    _type = data.type;
    _name = data.name;

    const model = {
      type: data.type,
      name: data.name
    };

    asyncWaterfall([

      (cb) => {
        // load any stored credentials
        CredentialsManager.getCredentials(_api.specUrl, _name)
          .then(credentials => {

            if (!_.isEmpty(credentials)) {
              model.credentials = credentials;
            }

            cb();
          });
      }

    ], () => {

      const html = tplModal(model);
      $modal = $(html);

      $modal.modal({
        closable: false,
        duration: 100,
        onVisible: () => {

          $modal.modal('refresh');
        },
        onHidden: () => {
          // clear local data
          _resetData();
        },
        onApprove: () => {
          try {
            // save the settings
            _validateForm();

            return true;
          } catch (e) {
            // something failed
            return false;
          }
        }
      }).modal('show');

      // form validators
      $('.modal .form')
        .form({
          inline: true,
          on: 'blur',
          fields: {
            username: 'empty',
            password: 'empty',
            apiKey: 'empty'
          }
        });

      $('.modal .button[data-action="save credentials"]').on('click', _saveCredentials);


    });

  };

  /**
   * Resets local data.
   * @return {[type]} [description]
   */
  const _resetData = function() {

    _api = null;
    _type = null;
    _name = null;

    // destroy the modal instance
    $modal.remove();
    $modal = null;
  };


  /**
   * Validates form data.
   * @return {[type]} [description]
   */
  const _validateForm = function() {

    const $form = $('.modal .form');

    $form.form('validate form');
    const res = $form.form('is valid');

    $modal.modal('refresh');

    if ((!res) ||
      ((typeof res !== 'boolean') && (!res[res.length - 1]))) {
      throw new Error('Invalid form data');
    }

  };

  /**
   * Saves the authentication settings.
   * @return {[type]} [description]
   */
  const _saveCredentials = function() {

    try {
      // validate the form
      _validateForm();

      // store the data
      const credentials = {
        type: _type
      };

      if (_type === 'basic') {

        const username = _.trim($('[name="username"]').val());
        const password = _.trim($('[name="password"]').val());

        credentials.username = username;
        credentials.password = password;

      } else if (_type === 'apiKey') {
        const apiKey = _.trim($('[name="apiKey"]').val());

        credentials.apiKey = apiKey;
      }

      // save the credentials
      const specUrl = _api.specUrl;
      const name = _name;

      // save the set of credentials
      CredentialsManager.saveCredentials(specUrl, name, credentials)
        .then(() => {
          postal.publish({
            channel: 'openapis',
            topic: 'reload security'
          });

          swal(
            'Activated!',
            'Authentication credentials have been saved',
            'success'
          );
        });
    } catch (e) {
    // silent
    }
  };

  /**
   * User selected to deactivate
   * the authentication.
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  const _onDeactivateAuthentication = function(data) {

    // remember these
    _api = data.api;
    _type = data.type;
    _name = data.name;

    swal({
      title: 'Are you sure?',
      text: 'You are about to deactivate the selected authentication',
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, deactivate it!'
    }).then(() => {

      // save the credentials
      const specUrl = _api.specUrl;
      const name = _name;

      // delete the set of credentials
      CredentialsManager.deleteCredentials(specUrl, name)
        .then(() => {

          postal.publish({
            channel: 'openapis',
            topic: 'reload security'
          });

          swal(
            'Deleted!',
            'The authentication has been deactivated',
            'success'
          );

        });
    })
      .catch(() => {
      // silent
      });

  };


  // event bindings
  postal.subscribe({
    channel: 'openapis',
    topic: 'activate authentication',
    callback: _onActivateAuthentication
  });

  postal.subscribe({
    channel: 'openapis',
    topic: 'deactivate authentication',
    callback: _onDeactivateAuthentication
  });

  return {

    /*
     * Public
     */


  };

}());
