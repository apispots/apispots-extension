var globals = {

	tabs : {
		selected : null
	},

	// the loaded Swagger API definition
	api : null,

	// the page URL
	url : null
};


/**
 * Called when a different tab has been selected
 */
chrome.tabs.onSelectionChanged.addListener(function(tabId, info) {

	// remember the selected tab
	globals.tabs.selected = tabId;

});

/**
 * Called when a valid Swagger definition has been detected.
 * 
 * @param api
 *            The parsed API definition
 */
function onSwaggerDefinition(api) {

	try {

		// store the API definition
		globals.api = api;

	} catch (e) {
		console.error(e);
	}
}

/**
 * Called when the user clicks on the page action
 */
chrome.pageAction.onClicked.addListener(function(tab) {

	// create a new window that will load the visualizer
	chrome.windows.create({url: chrome.extension.getURL("graph.html"), type: "popup"}, function() {
	
		// send a message to the new window with the API definition
		var msg = { name: 'onVisualizeApi', api: globals.api };
		chrome.runtime.sendMessage( undefined, msg, undefined );
		
	});
});

/**
 * Bind global event listener
 */
chrome.runtime.onMessage.addListener(function(msg, sender, cb) {

	// call the callback
	switch (msg.name) {
	case 'onSwaggerDefinition':
		
		onSwaggerDefinition(msg.api);

		// enable the page action
		chrome.pageAction.show(sender.tab.id);

		break;
		
	case 'onVisualizeApi':	

		
		break;
		
	default:

		// reset vars
		globals.api = null;

		// disable the page action
		chrome.pageAction.hide(sender.tab.id);

		break;
	}

});
