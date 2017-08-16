
import '../../common/base';

import tplBody from '../../../extension/templates/modules/home/index.hbs';

{

  /**
   * Initializes the view.
   * @return {[type]} [description]
   */
  const onReady = function() {

    const html = tplBody({loading: true});
    $('body').html(html);

    // fix menu when passed
    $('.masthead')
      .visibility({
        once: false,
        onBottomPassed() {
          $('.fixed.menu').transition('fade in');
        },
        onBottomPassedReverse() {
          $('.fixed.menu').transition('fade out');
        }
      });

  };


  // attach ready event
  $(document)
    .ready(onReady);


}
