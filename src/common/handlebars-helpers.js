/**
 * Handlebars helpers.
 * @return {[type]} [description]
 */
import * as markdown from 'helper-markdown';
import * as Handlebars from 'handlebars/runtime';
import _ from 'lodash';

export default (function() {

  // register the Markdown helper
  Handlebars.registerHelper('markdown', markdown());

  // equals helper
  Handlebars.registerHelper('eq', function(a, b, options) {

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

}());
