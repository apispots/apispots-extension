/**
 * Swagger definition parser.
 * 
 * @author Chris Spiliotopoulos
 */

String.prototype.startsWith = function(prefix) {
	return this.indexOf(prefix) === 0;
}

String.prototype.endsWith = function(suffix) {
	return this.match(suffix + "$") == suffix;
};

/*
 * global namespace
 */
var swagger = swagger || {};
swagger.ed = swagger.ed || {};

/**
 * APIs Catalog
 */
swagger.ed.SwaggerParser = (function() {
	
	"use strict";
	
	/*
	 * PRIVATE METHODS
	 */
	var _private = {
		
		/**
		 * Tries to parse a Swagger definition
		 */
		'parse' : function(url, cb) {
			
			/*
			 * get the definition resource
			 */
			_private.getResourceAtUrl(url, function(err, content) {
				
				var opts = {
					validateSchema : false,
					resolve$Refs : false
				};
				
				/*
				 * try to parse the document using the Swagger 2.0 parser
				 */
				swagger.parser.parse(url, opts, function(err, api) {
					
					if (!err)
						return cb(null, api);
					
					/*
					 * try to convert the old Swagger doc into the new format
					 */
					_private.convertToNewSwaggerFormat(url, content, function(err, api) {
						
						if (err)
							return cb(err);
						else
							return cb(null, api);
					});
					
				});
				
			});
		},
		
		/**
		 * Tries to convert the spec to the latest version using the Swagger
		 * converter.
		 */
		'convertToNewSwaggerFormat' : function(url, json, cb) {
			
			try {
				
				var paths = [];
				
				for ( var idx in json.apis) {
					var path = url + json.apis[idx].path;
					paths.push(path);
				}
				
				var subresources = [];
				
				var api = {
					resourceListing : json,
					apiDeclarations : subresources
				};
				
				/*
				 * fetch the sub-resources in parallel
				 */
				async.map(paths, function(path, cb) {
					
					// fetch the URL contents
					_private.getResourceAtUrl(path, function(err, response) {
						if (err)
							cb(err);
						else
							cb(null, response);
					});
					
				}.bind(), function(err, results) {
					
					if (err)
						return cb(err);
					
					/*
					 * loop through the result set
					 */
					for ( var idx in results) {
						
						// parse the JSON contents
						var res = results[idx];
						subresources.push(res);
					}
					
					// convert the API
					var converted = SwaggerConverter.convert(api.resourceListing,
							api.apiDeclarations);
					
					// return the API
					cb(null, converted);
				});
				
			} catch (e) {
				console.error(e);
			}
			
		},
		
		/**
		 * Sends an HTTP GET request to fetch the resource at the specified URL.
		 */
		'getResourceAtUrl' : function(url, cb) {
			
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
	
	};
	
	/*
	 * PUBLIC METHODS
	 */

	return {
		
		parse : _private.parse
	
	}

})();
