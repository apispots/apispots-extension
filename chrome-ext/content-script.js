/**
 * Grabs the page content, detect 
 * if it contains a Swagger API definition
 * and tries to parse it.
 */
var parseSwaggerDefinition = function() {

	// default message - invalid content
	var msg = {
		name : 'onInvalidContent'
	};

	try {

		// get the document body
		var body = document.body;
		
		// get the outer text of the page body
		var content = body.outerText;
		
		/*
		 * check if this a Swagger document
		 */
		var json = checkIfSwaggerContent( content );
		
		if (! json )
			return;
		
		/*
		 * choose which parser to use
		 * depending on the version
		 */
		if ( typeof json.swagger != 'undefined' )
		{
			/*
			 * try to parse the document using the 
			 * Swagger 2.0 parser
			 */
	
			var opts = {
				validateSchema : false
			};
	
			swagger.parser.parse(document.URL, opts, function(err, api) {
	
				if (err) 
				{
					// dispatch an invalid content event
					chrome.runtime.sendMessage(undefined, msg, undefined);
					return;
				}	
					
				msg = {
					name : 'onSwaggerDefinition',
					api : api
				};

				/*
				 * broadcast the message
				 */
				chrome.runtime.sendMessage(undefined, msg, undefined);
				
			});
		}
		else
		{
			/*
			 * try to convert the old 
			 * Swagger doc into the new format
			 */
			convertToNewSwaggerFormat( document.URL, json, function(err, data) {

				if (err) {
					chrome.runtime.sendMessage(undefined, msg, undefined);
					return;
				}
				
				msg = {
					name : 'onSwaggerDefinition',
					api : data
				};

				/*
				 * broadcast the message
				 */
				chrome.runtime.sendMessage(undefined, msg, undefined);
			});
			
		}	
			
	} catch (e) {

		chrome.runtime.sendMessage(undefined, msg, undefined);
	}

	return null;
}

/**
 * Checks whether the page contains
 * Swagger content.
 * @param content The page content
 */
function checkIfSwaggerContent( content ){
	
	try {
		
		/*
		 * Is this a valid YAML or JSON document?
		 */
		var json = jsyaml.load( content );
		
		/*
		 * Does it have a 'swagger' or 'swaggerVersion' 
		 * attribute
		 */
		
		// check for the 'swaggerVersion' attribute
		if ( (typeof json.swaggerVersion == 'undefined') && 
			 (typeof json.swagger == 'undefined') )	
			throw "Not a Swagger document";
		
		// return the Swagger document
		return json;
		
	} catch (e) {
		
	}
	
	return null;
}


/**
 * Try to convert the spec to the latest 
 * version using the Swagger converter.
 * @param url The base resource URL
 * @param cb
 */
function convertToNewSwaggerFormat(url, json, cb) {

try {
		
		var paths = [];
				
		for (var idx in json.apis)
		{
			var path = url + json.apis[idx].path;
			paths.push( path );
		}
		
		var subresources = [];
		
		var api = {
			resourceListing : json,
			apiDeclarations : subresources
		};

		/*
		 * fetch the sub-resources
		 * in parallel
		 */
		async.map( paths, function(path, cb){
			
			// fetch the URL contents
			getResourceAtUrl(path, function(err, response){
				if (err)
					cb(err);
				else
					cb(null, response);
			});
			
		}.bind(), function(err, results){
			
			if (err)
				return cb(err);
			
			/*
			 * loop through the result set
			 */
			for (var idx in results)
			{
				// parse the JSON contents
				var res = results[idx];
				subresources.push( res );
			}
			
			// convert the API
			var converted = SwaggerConverter.convert( api.resourceListing, api.apiDeclarations );
			
			// return the API
			cb(null, converted);
		});
		
	
		
	} catch (e) {
		console.error(e);
	}

}

/**
 * Sends an HTTP GET request to 
 * fetch the resource at the 
 * specified URL.
 */
function getResourceAtUrl(url, cb){
	
	// GET the resource
	$.ajax({
		url : url,
		success : function(content, status) {
			
			// return the content fetched
			cb(null, content);
		},
		error : function(jqXHR, err) {
			cb("Resource at [" + url + "] could not be fetched.");
		}
	});
}


//The background page is asking us to find an address on the page.
if (window == top) {

	/*
	 * If the page contains a Swagger
	 * API document, try to parse it
	 */
	parseSwaggerDefinition();
}
