/**
 * Grabs the page content, detect if it contains a Swagger API definition and
 * tries to parse it.
 */
var parseSwaggerDefinition = function(url) {
	
	// default message - invalid content
	var msg = {
		name : 'onInvalidContent'
	};
	
	try {
		
		/*
		 * try to parse the Swagger definition
		 */
		swagger.ed.SwaggerParser.parse(url, function(err, api) {
			
			if (err)
				return chrome.runtime.sendMessage(undefined, msg, undefined);
			
			msg = {
				name : 'onSwaggerDefinition',
				api : api
			};
		
			chrome.runtime.sendMessage(undefined, msg, undefined);
			
		});
		
	} catch (e) {
		
		chrome.runtime.sendMessage(undefined, msg, undefined);
	}
	
	return null;
}

/**
 * Checks whether the page contains Swagger content.
 * 
 * @param content
 *          The page content
 */
function checkIfSwaggerContent(content) {
	
	try {
		
		/*
		 * Is this a valid YAML or JSON document?
		 */
		var json = jsyaml.load(content);
		
		/*
		 * Does it have a 'swagger' or 'swaggerVersion' attribute
		 */

		// check for the 'swaggerVersion' attribute
		if ((typeof json.swaggerVersion == 'undefined')
				&& (typeof json.swagger == 'undefined'))
			throw "Not a Swagger document";
		
		// return the Swagger document
		return json;
		
	} catch (e) {
		
	}
	
	return null;
}

/**
 * Checks whether the page contains APIs catalog content.
 * 
 * @param content
 *          The page content
 */
function checkIfApisCatalogContent(content) {
	
	try {
		
		/*
		 * Is this a valid YAML or JSON document?
		 */
		var json = jsyaml.load(content);
		
		/*
		 * Does it have a 'swagger' or 'swaggerVersion' attribute
		 */

		// check for the 'swaggerVersion' attribute
		if ((typeof json.SpecificationVersion == 'undefined')
				&& (typeof json.apis == 'undefined'))
			throw "Not an APIs catalog  document";
		
		// return the catalog document
		return json;
		
	} catch (e) {
		
	}
	
	return null;
}


/**
 * Scans the page and tries to detect if it contains a compatible content type.
 */
function detectContentType() {
	
	try {
		
		// get the document body
		var body = document.body;
		
		// get the outer text of the page body
		var content = body.textContent;
		
		/*
		 * First check for Swagger content
		 */
		var data = checkIfSwaggerContent(content);
		
		/*
		 * If the page contains a Swagger API document, try to parse it
		 */
		if (data)
			return parseSwaggerDefinition(document.URL);
		
		/*
		 * Next check for APIs.json content
		 */
		data = checkIfApisCatalogContent(content);
		
		if (data) {
			
			var msg = {
				name : 'onApiCatalogDefinition',
				catalog : data
			};
			
			/*
			 * broadcast the message
			 */
			chrome.runtime.sendMessage(undefined, msg, undefined);
		}
		
	} catch (e) {
		console.error(e);
	}
	
}

// The background page is asking us to find an address on the page.
if (window == top) {
	
	/*
	 * detect the content type of the page
	 */
	detectContentType();
	
}
