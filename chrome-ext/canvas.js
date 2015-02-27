var _globals = {};

_globals.canvas = {
	
	parentCatalog : null

};

/**
 * Bind a global event listener
 */
chrome.runtime.onMessage.addListener(function(msg, sender, cb) {
	
	switch (msg.name) {
	
	case 'onVisualizeApi':

		// visualize the API
		swagger.ed.Graph.draw(msg.api);
		
		// draw the backlink
		drawBacklink();
		
		break;
	
	case 'onVisualizeCatalog':
	case 'onCatalogFetched':

		// visualize the catalog
		visualizeApiCatalog(msg.catalog);
		break;
	
	default:

	}
	
});

/**
 * Visualizes an API catalog
 * @param catalog The catalog definition
 */
function visualizeApiCatalog(catalog) {
	
	try {
		
		// visualize the API catalog
		var opts = {
			resPath : 'libs/swagger.ed/api-catalog/'
		};
		swagger.ed.Catalog.draw(catalog, opts);
		
		// draw the backlink
		drawBacklink();
		
		/*
		 * event handlers
		 */
		swagger.ed.Catalog.on('onCatalogLinkDetails', function(e, data) {
			
			// set this as parent
			_globals.canvas.parentCatalog = catalog.url;
			
			/*
			 * load the linked API catalog
			 */
			var msg = {
				name : 'onLoadLinkedCatalog',
				url : data.url
			};
			chrome.runtime.sendMessage(undefined, msg, undefined);
		});
		
		swagger.ed.Catalog.on('onSwaggerLinkDetails', function(e, data) {
			
			// set this as parent
			_globals.canvas.parentCatalog = catalog.url;
			
			/*
			 * load the Swagger API definition
			 */
			var msg = {
				name : 'onLoadSwaggerDefinition',
				url : data.url
			};
			chrome.runtime.sendMessage(undefined, msg, undefined);
		});
		
	} catch (e) {
		console.error(e);
	}
	
}

/**
 * 
 */
function drawBacklink() {
	
	$('#top-link-block').remove();
	
	if (_globals.canvas.parentCatalog) {
		var html = "<span id='top-link-block' style='cursor: pointer;'><a><i class='glyphicon glyphicon-chevron-left'></i> Back</a></span>";
		$('#section-info').append(html);
		
		// on backlink click, load the parent catalog
		$('#top-link-block').click(function(e) {
			e.preventDefault();
			
			/*
			 * load the linked API catalog
			 */
			var msg = {
				name : 'onLoadLinkedCatalog',
				url : _globals.canvas.parentCatalog
			};
			chrome.runtime.sendMessage(undefined, msg, undefined);
			
			_globals.canvas.parentCatalog = null;
		});
	}
	
}
