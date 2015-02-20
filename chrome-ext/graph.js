

/**
 * Bind a global event listener
 */
chrome.runtime.onMessage.addListener(function(msg, sender, cb) {
	
	if (msg.name !== 'onVisualizeApi')
		return;
	
	swagger.ed.Graph.draw( msg.api );
	
});
