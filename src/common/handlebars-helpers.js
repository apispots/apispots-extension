/**
 * Handlebars helpers.
 * @return {[type]} [description]
 */
import shodown from 'showdown';
import * as Handlebars from 'handlebars/runtime';
import _ from 'lodash';
import { decode } from 'html-entities';


const converter = new shodown.Converter();

export default (function () {

  // register the Markdown helper
  Handlebars.registerHelper('markdown', function (options) {

    const text = options.fn(this);
    const html = converter.makeHtml(decode(text));
    return html;

  });

  // equals helper
  Handlebars.registerHelper('eq', function (a, b, options) {

    if (_.isEqual(a, b)) {
      return options.fn(this);
    }
    return null;
  });

  /**
   * Verbs
   * @type {String}
   */
  Handlebars.registerHelper('verb', (verb) => {

    const colors = {
      get: 'blue',
      put: 'yellow',
      post: 'orange',
      patch: 'teal',
      delete: 'red',
      options: 'grey',
      head: 'brown'
    };

    const html = `<span class="verb ui ${colors[verb]} circular label mini empty" title='${verb.toUpperCase()}'></span>`;
    return html;
  });
  
  Handlebars.registerHelper('verb_label', (verb) => {

    const colors = {
      get: 'blue',
      put: 'yellow',
      post: 'orange',
      patch: 'teal',
      delete: 'red',
      options: 'grey',
      head: 'brown'
    };

    const html = `<span class="verb ui ${colors[verb]} label" title='${verb.toUpperCase()}'>${verb.toUpperCase()}</span>`;
    return html;
  });

}());
