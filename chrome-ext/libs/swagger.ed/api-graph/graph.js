/**
 * 
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
 * Swagger graph
 */
swagger.ed.Graph = (function() {
	
	"use strict";
	
	/*
	 * global object
	 */
	var _globals = {
		
		nodes : [],
		edges : [],
		network : null,
		
		api : null
	};
	
	/*
	 * PRIVATE METHODS
	 */
	var _private = {
		
		/**
		 * Draws the API graph
		 */
		'draw' : function draw(api, opts) {
			
			opts = opts || {};
			
			_globals.resPath = (typeof opts.resPath != 'undefined' ? opts.resPath
					: './')

			_private.destroy();
			
			// store globally
			_globals.api = api;
			
			/*
			 * parse the Swagger endpoints and create nodes
			 */

			// create the root node
			var root = {
				id : 'root',
				label : api.info.title,
				type : 'root',
				image : _globals.resPath + 'res/api.png',
				shape : 'image',
				color : {
					background : '#27ae60',
				},
				fontSize : '20',
				fontColor : '#34495e'
			
			};
			
			_globals.nodes.push(root);
			
			/*
			 * process resource paths
			 */
			_private.processPaths();
			
			/*
			 * process model definitions
			 */
			_private.processModelDefinitions();
			
			/*
			 * process security definitions
			 */
			_private.processSecurityDefinitions();
			
			try {
				
				// append the alert section
				var html = "<div id='section-info'></div>";
				$('body').append(html);
				
				// create the graph container
				html = "<div id='container-graph' class='swagger-graph'></div>";
				$('body').append(html);
				
				var height = $(window).height();
				$('#container-graph').height(height);
				
				var data = {
					nodes : _globals.nodes,
					edges : _globals.edges
				};
				
				if (typeof opts == 'undefined') {
					opts = {
						height : height
					};
				}
				
				/*
				 * set the container dimensions
				 */
				$('#container-graph').height(opts.height);
				
				var options = {
					width : '100%',
					height : '100%',
					stabilize : true,
					smoothCurves : {
						dynamic : false
					},
					nodes : {
						shape : 'box',
						fontFace : 'Arial',
						fontColor : 'white',
						mass : 4
					},
					edges : {
						color : '#bdc3c7'
					},
					dragNodes : true,
					hover : true,
					dragNetwork : true,
					hierarchicalLayout : false
				};
				
				// create the network graph
				_globals.network = new vis.Network($('#container-graph')[0], data,
						options);
				
				// add event listeners
				_globals.network.on('doubleClick', function(properties) {
					
					// handle the event
					_private.onNodeDoubleClicked(properties.nodes, properties.edges);
				});
				
				// create the modal template
				_private.createModal();
				
				// show the info bar
				var title = (typeof _globals.api.info.title != 'undefined' ? _globals.api.info.title
						: '');
				_private.showInfo('info', 'API', title);
				
			} catch (e) {
				console.error(e);
			}
			
		},
		
		/**
		 * Processes the API paths
		 */
		'processPaths' : function() {
			
			try {
				
				// create the root node
				var node = {
					id : '#resources',
					label : 'Resources',
					shape : 'box',
					color : {
						background : '#e67e22',
					}
				};
				
				_globals.nodes.push(node);
				
				var edge = {
					from : 'root',
					to : '#resources'
				};
				_globals.edges.push(edge);
				
				/*
				 * go through the API resource paths
				 */
				var idx = 0;
				for ( var path in _globals.api.paths) {
					idx++;
					
					// process the resource path
					_private.processResourcePath(path);
					
				}
				
			} catch (e) {
				console.error(e);
			}
			
		},
		
		/**
		 * Processes a single resource path.
		 */
		'processResourcePath' : function(path) {
			
			try {
				
				if (path.endsWith('/'))
					path = path.slice(0, -1);
				
				if (path.startsWith('/'))
					path = path.slice(1);
				
				// split the path into sub-resource parts
				var parts = path.split('/');
				
				// ditch the 1st part if empty
				if (parts[0] === '')
					delete parts[0];
				
				// get the API path object
				var obj = _globals.api.paths[path];
				
				/*
				 * loop through the parts
				 */
				var level = 0;
				var parent = '#resources';
				
				for ( var idx in parts) {
					level++;
					
					var part = parts[idx];
					
					if (part == '')
						continue;
					
					/*
					 * create the node and edge
					 */

					// locate the part within the path
					var loc = path.indexOf(part);
					var key = path.substring(0, loc) + part;
					
					var id = 'path:' + key;
					
					// add the node to the graph
					if (!_private.getNode(id)) {
						
						// create the node
						var node = {
							id : id,
							key : key,
							label : part,
							parent : parent,
							type : 'resource'
						};
						
						var edge = null;
						
						// get the resource object (if exists)
						var res = _globals.api.paths[id];
						
						// else connect it with the
						// parent node
						edge = {
							from : parent,
							to : id
						};
						edge.style = 'arrow';
						
						// styling
						if (typeof res != 'undefined')
							node.color = {
								background : '#3498db'
							};
						else
							node.color = {
								background : '#7f8c8d'
							};
						
						// is this a sub-resource Id?
						if (part.startsWith('{') && part.endsWith('}')) {
							node.color = {
								background : '#9b59b6'
							};
						}
						
						// add the node
						_globals.nodes.push(node);
						
						// add the edge
						if (edge)
							_globals.edges.push(edge);
					}
					
					// set it as parent for the next sub-resource
					parent = id;
				}
				
			} catch (e) {
				console.error(e);
			}
			
		},
		
		/**
		 * Processes model definitions.
		 */
		'processModelDefinitions' : function() {
			
			try {
				
				if ((typeof _globals.api.definitions == 'undefined')
						|| (Object.keys(_globals.api.definitions).length == 0))
					return;
				
				// create the root node
				var node = {
					id : '#models',
					label : 'Models',
					shape : 'box',
					color : {
						background : '#e67e22',
					}
				};
				
				_globals.nodes.push(node);
				
				var edge = {
					from : 'root',
					to : '#models'
				};
				_globals.edges.push(edge);
				
				/*
				 * go through the API model definitions
				 */
				var idx = 0;
				for ( var key in _globals.api.definitions) {
					
					// get the model object
					var model = _globals.api.definitions[key];
					
					var id = 'model:' + key;
					
					// create the node and edge
					var node = {
						id : id,
						key : key,
						label : key,
						color : {
							background : '#9b59b6'
						},
						type : 'model'
					};
					
					var edge = {
						from : '#models',
						to : id
					};
					
					_globals.nodes.push(node);
					_globals.edges.push(edge);
				}
			} catch (e) {
				console.error(e);
			}
			
		},
		
		/**
		 * Processes security definitions.
		 */
		'processSecurityDefinitions' : function() {
			
			try {
				
				if ((typeof _globals.api.securityDefinitions == 'undefined')
						|| (Object.keys(_globals.api.securityDefinitions).length == 0))
					return;
				
				// create the root node
				var node = {
					id : '#security',
					label : 'Security',
					shape : 'box',
					color : {
						background : '#e67e22',
					}
				};
				
				_globals.nodes.push(node);
				
				var edge = {
					from : 'root',
					to : '#security'
				};
				_globals.edges.push(edge);
				
				/*
				 * go through the API security definitions
				 */
				var idx = 0;
				for ( var key in _globals.api.securityDefinitions) {
					
					// get the security object
					var security = _globals.api.securityDefinitions[key];
					
					var id = 'security:' + key;
					
					// create the node and edge
					var node = {
						id : id,
						key : key,
						label : key,
						color : {
							background : '#e74c3c'
						},
						type : 'security'
					};
					var edge = {
						from : '#security',
						to : id
					};
					
					_globals.nodes.push(node);
					_globals.edges.push(edge);
				}
				
			} catch (e) {
				console.error(e);
			}
			
		},
		
		/**
		 * Scans the graph and tries to detect a node with the given Id and parent.
		 */
		'getNode' : function(id, parent) {
			
			try {
				for ( var idx in _globals.nodes) {
					var node = _globals.nodes[idx];
					
					if (node.id === id) {
						if (typeof parent != 'undefined') {
							
							if (node.parent != parent)
								continue;
						}
						
						return node;
					}
				}
			} catch (e) {
				console.error(e);
			}
			return null;
		},
		
		/**
		 * Called when a graph node is double clicked.
		 */
		'onNodeDoubleClicked' : function(nodes, edges) {
			
			try {
				
				// get the selected node
				var nodeId = nodes[0];
				
				if (typeof nodeId == 'undefined')
					return;
				
				/*
				 * clear old dialog data
				 */
				$('#template-modal .modal-title').text('');
				$('#template-modal .modal-body').children().remove();
				
				// find the node instance
				var node = _private.getNode(nodeId);
				
				/*
				 * create the modal dialog
				 */
				var details = {};
				
				if (node.type == 'root')
					details = _private.onApiDetails(node);
				else if (node.type == 'resource')
					details = _private.onResourceDetails(node);
				else if (node.type == 'model')
					details = _private.onModelDetails(node);
				else if (node.type == 'security')
					details = _private.onSecurityDetails(node);
				else
					return;
				
				if (!details)
					return;
				
				$('#template-modal .modal-title').text(details.title);
				$('#template-modal .modal-body').append(details.html);
				
				// initialize code highlighting
				$('pre code').each(function(i, block) {
					hljs.highlightBlock(block);
				});
				
				// show the modal
				$('#template-modal').modal('show');
			} catch (e) {
				console.log(e);
			}
		},
		
		/**
		 * Returns modal content for the root API node.
		 */
		'onApiDetails' : function(node) {
			
			var details = {};
			
			try {
				
				// get the corresponding API resource model definition
				var api = _globals.api;
				
				var html = "";
				
				// get the info section
				var info = api.info;
				
				/*
				 * URL
				 */
				html += "<div class='api-url'>";
				html += "<h4>URL <small>The base URL of the API and supported protocols</small></h4>";
				html += "<blockquote>["
						+ (typeof api.schemes != 'undefined' ? api.schemes.join('|')
								: 'http') + "]://" + api.host + api.basePath + " </blockquote>";
				html += "</div>";
				
				/*
				 * info
				 */
				if (typeof info != 'undefined') {
					/*
					 * General info
					 */
					details.title = api.info.title;
					
					html += "<div class='api-info'>";
					
					// description
					if (typeof info.description != 'undefined') {
						html += "<h4>Description <small>A few words on this API</small></h4>";
						html += "<p>" + info.description + "</p>";
					}
					
					// version
					if (typeof info.version != 'undefined')
						html += "<blockquote>Version <span class='label label-info'>"
								+ info.version + "</span></blockquote>";
					
					html += "<hr/>";
					html += "</div>";
					
					/*
					 * Contact
					 */
					if (typeof info.contact != 'undefined') {
						html += "<h4>Contact <small>Get in touch with the providers</small></h4>";
						html += "<dl class='dl-horizontal'><dt>Name</dt><dd>"
								+ info.contact.name + "</dd></dl>";
					}
					
					/*
					 * License
					 */
					if (typeof info.license != 'undefined') {
						html += "<h4>License <small>Legal and usage details</small></h4>";
						html += "<dl class='dl-horizontal'><dt>Name</dt><dd>"
								+ info.license.name + "</dd></dl>";
						html += "<dl class='dl-horizontal'><dt>URL</dt><dd><a href='"
								+ info.license.url + "' target='_blank'>" + info.license.url
								+ "</a></dd></dl>";
					}
					
					if (typeof info.termsOfService != 'undefined')
						html += "<dl class='dl-horizontal'><dt>Terms of service</dt><dd><a href='"
								+ info.termsOfService
								+ "' target='_blank'>"
								+ info.termsOfService + "</a></dd></dl>";
				}
				
				details.html = html;
				
			} catch (e) {
				console.error(e);
			}
			
			return details;
			
		},
		
		/**
		 * Returns modal content for a resource node.
		 */
		'onResourceDetails' : function(node) {
			
			var details = {};
			
			try {
				
				// get the corresponding API resource path
				var path = null;
				
				for (key in _globals.api.paths) {
					var keyclone = key;
					
					if (key.endsWith('/'))
						keyclone = keyclone.slice(0, -1);
					
					if (key.startsWith('/'))
						keyclone = keyclone.slice(1);
					
					if (keyclone === node.key) {
						path = _globals.api.paths[key];
						break;
					}
				}
				
				if ((typeof path == 'undefined') || (!path))
					return null;
				
				// set the title
				details.title = "Path: " + node.key;
				
				/*
				 * render the supported operations
				 */
				var html = "<h3>Operations <small>Supported operations - click to view details</small></h3>";
				
				html += "<div role='tab-panel'>"
				html += "<ul class='nav nav-pills'>";
				
				var count = 0;
				for ( var key in path) {
					count++;
					var method = path[key];
					html += "<li role='presentation' class='operation  "
							+ (count == 1 ? 'active ' : '') + key + "' ><a href='#" + key
							+ "' aria-controls='" + key + "' role='pill' data-toggle='pill'>"
							+ key.toUpperCase() + "</a></li>"
				}
				
				html += "</ul>";
				
				/*
				 * create the tab content
				 */
				html += " <div class='tab-content'>";
				
				count = 0;
				for ( var key in path) {
					var method = path[key];
					
					count++;
					
					// open the tab panel for the method
					html += " <div role='tabpanel' class='tab-pane "
							+ (count == 1 ? 'active' : '') + "' id='" + key + "'>";
					
					html += "<h4>"
							+ (typeof method.summary != 'undefined' ? method.summary
									: 'Description') + "</h4> <p>" + method.description + "</p>";
					
					/*
					 * Tags
					 */
					if (typeof method.tags != 'undefined') {
						html += "<div class='section-tags'>";
						
						for ( var idx in method.tags) {
							// get the next param
							var tag = method.tags[idx];
							html += "<span class='label label-default'>" + tag + "</span>";
						}
						
						html += " </div>";
					}
					
					html += "<hr/>";
					
					/*
					 * Security
					 */
					if (typeof method.security != 'undefined') {
						html += "<div class='section-security'>";
						html += "<h4>Security <small>List of applied security schemes</small></h4>";
						html += "<table class='table table-condensed'>";
						html += "<thead><tr><th>Scheme</th><th>Permissions</th></tr></thead><tbody>";
						
						for ( var idx in method.security) {
							// get the policy
							var policy = method.security[idx];
							
							/*
							 * loop though the schemes
							 */
							for ( var scheme in policy) {
								var perms = policy[scheme];
								
								html += "<tr>";
								html += "<td><strong>" + scheme + "</strong></td>";
								
								// write the perms as labels
								html += "<td>";
								for ( var i in perms) {
									html += "<span class='label label-primary'>" + perms[i]
											+ "</span>";
								}
								html += "</td>";
								
								html += "</tr>";
							}
						}
						
						html += "</tbody></table>";
						html += " </div>";
					}
					
					/*
					 * Parameters
					 */
					if (typeof method.parameters != 'undefined') {
						html += "<div class='section-parameters'>";
						html += "<h4>Parameters <small>List of parameters supported by the operation</small></h4>";
						html += "<table class='table table-condensed'>";
						html += "<thead><tr><th>Name</th><th>In</th><th>Type</th><th>Format</th><th>Description</th><th>Required</th></tr></thead><tbody>";
						
						for ( var idx in method.parameters) {
							// get the next param
							var param = method.parameters[idx];
							
							// if required, highlight the row
							html += "<tr class='" + (param.required ? 'info' : '') + "'>";
							
							// name
							html += "<td>" + param.name + "</td>";
							
							// in
							html += "<td>"
									+ (typeof param['in'] != 'undefined' ? param['in'] : '')
									+ "</td>";
							
							// type
							html += "<td>"
									+ (typeof param.type != 'undefined' ? param.type : '')
									+ "</td>";
							
							// format
							var format = (typeof param.format != 'undefined' ? param.format
									: '');
							
							// does it have a schema?
							var hasSchema = false;
							
							if (typeof param.schema != 'undefined')
								hasSchema = true;
							
							if (hasSchema) {
								html += "<td class='schema'>";
								html += "<button class='btn btn-info btn-xs' type='button' data-toggle='collapse' data-target='#schema' aria-expanded='false' aria-controls='collapseExample'>Show Schema</button>";
								html += "<div id='schema' class='collapse'><pre><code class='json'>"
										+ JSON.stringify(param.schema, undefined, 2)
										+ "</code></pre></div>";
								html += "</td>";
							} else
								html += "<td class='primitive'>" + format + "</td>";
							
							// description
							html += "<td>"
									+ (typeof param.description != 'undefined' ? param.description
											: '') + "</td>";
							
							// required?
							html += "<td><span class='glyphicon "
									+ (param.required ? "glyphicon-ok" : "glyphicon-remove")
									+ " aria-hidden='true'></span></td>";
							
							html += "</tr>";
							
						}
						
						html += "</tbody></table>";
						html += "</div>";
						
					}
					
					/*
					 * Consumes
					 */
					if (typeof method.consumes != 'undefined') {
						html += "<div class='section-produces'>";
						html += "<h4>Consumes <small>List of MIME types consumed by the operation</small></h4>";
						
						for ( var idx in method.consumes) {
							// get the next param
							var mime = method.produces[idx];
							html += "<span class='label label-info'>" + mime + "</span>";
						}
						
						html += " </div>";
					}
					
					/*
					 * Produces
					 */
					if (typeof method.produces != 'undefined') {
						html += "<div class='section-produces'>";
						html += "<h4>Produces <small>List of MIME types produced by the operation</small></h4>";
						
						for ( var idx in method.produces) {
							// get the next param
							var mime = method.produces[idx];
							html += "<span class='label label-primary'>" + mime + "</span>";
						}
						
						html += " </div>";
					}
					
					/*
					 * Responses
					 */
					if (typeof method.responses != 'undefined') {
						html += "<div class='section-responses'>";
						html += "<h4>Responses <small>List of responses returned by the operation</small></h4>";
						html += "<table class='table table-condensed'>";
						html += "<thead><tr><th>Code</th><th>Description</th></tr></thead><tbody>";
						
						for ( var code in method.responses) {
							// get the next param
							var response = method.responses[code];
							
							var num = parseInt(code);
							var status = 'success';
							
							if ((num >= 300) && (num < 400))
								status = 'info';
							else if ((num >= 400) && (num < 500))
								status = 'warning';
							else if (num >= 500)
								status = 'danger';
							
							// if required, highlight the row
							html += "<tr class='" + status + "'>";
							
							// code
							html += "<td><strong>" + code + "</strong></td>";
							
							// description
							html += "<td>" + response.description + "</td>";
							
							html += "</tr>";
						}
						
						html += "</tbody></table>";
						html += " </div>";
					}
					
					// close the tab panel for method
					html += "</div>";
					
				}
				
				// close tab-content
				html += "</div>";
				
				// close tabs
				html += "</div>";
				
				details.html = html;
				
			} catch (e) {
				console.error(e);
			}
			
			return details;
		},
		
		/**
		 * Returns modal content for a model node.
		 */
		'onModelDetails' : function(node) {
			
			var details = {};
			
			try {
				
				// get the corresponding API resource model definition
				var model = _globals.api.definitions[node.key];
				
				details.title = "Model: " + node.key;
				
				/*
				 * required properties
				 */
				var html = "";
				
				if (typeof model.required != 'undefined') {
					html += "<div class='model-required'>";
					html += "<h4>Required <small>List of attritubes that are required by operations</small></h4>";
					
					for ( var idx in model.required) {
						// get the property name
						var property = model.required[idx];
						
						html += "<span class='label label-warning'>" + property + "</span>";
					}
					
					html += "<hr/>";
					html += "</div>";
					
					delete model.required;
				}
				
				/*
				 * render the schema
				 */

				html += "<div class='model-schema'>";
				
				// pretify the JSON schema
				var json = JSON.stringify(model, undefined, 4);
				
				html += "<pre><code class='json'>" + json + "</code></pre>";
				html += "</div>";
				
				details.html = html;
				
			} catch (e) {
				console.error(e);
			}
			
			return details;
		},
		
		/**
		 * Creates modal content for a security node.
		 */
		'onSecurityDetails' : function(node) {
			var details = {};
			
			try {
				
				// get the corresponding API resource model definition
				var policy = _globals.api.securityDefinitions[node.key];
				
				details.title = "Security policy: " + node.key;
				
				/*
				 * render the policies
				 */
				var html = "";
				
				// type
				html += "<blockquote>Type: <span class='label label-warning'>"
						+ policy.type + "</span></blockquote>";
				
				if (policy.type === 'apiKey') {
					html += "<dl class='dl-horizontal'><dt>Name:</dt><dd>" + policy.name
							+ "</dd></dl>";
					html += "<dl class='dl-horizontal'><dt>In:</dt><dd>" + policy['in']
							+ "</dd></dl>";
				} else if (policy.type === 'oauth2') {
					html += "<dl class='dl-horizontal'><dt>Flow:</dt><dd>" + policy.flow
							+ "</dd></dl>";
					html += "<dl class='dl-horizontal'><dt>Authorization URL:</dt><dd><a href='"
							+ policy.authorizationUrl
							+ "' target='_blank'>"
							+ policy.authorizationUrl + "</a></dd></dl>";
					
					if (typeof policy.scopes != 'undefined') {
						html += "<dl class='dl-horizontal'><dt>Scopes:</dt><dd>";
						
						html += "<table class='table table-condensed'>";
						html += "<thead><tr><th>Scope</th><th>Description</th></tr></thead><tbody>";
						
						for ( var scope in policy.scopes) {
							html += "<tr><td><span class='label label-info'>" + scope
									+ "</span></td><td>" + policy.scopes[scope] + "</td></tr>";
						}
						
						html += "</table>";
						html += "</dd></dl>";
					}
				}
				
				details.html = html;
				
			} catch (e) {
				console.error(e);
			}
			
			return details;
		},
		
		/**
		 * Destroys the graph instance.
		 */
		'destroy' : function() {
			
			if (_globals.network !== null) {
				_globals.network.destroy();
				_globals.network = null;
			}
			
			_globals.api = null;
			_globals.nodes = [];
			_globals.edges = [];
			
		},
		
		/**
		 * Creates the modal template
		 */
		'createModal' : function() {
			
			try {
				
				// ensure singleton
				if ($('.modal').length > 0)
					return;
				
				var html = "<div class='modal' id='template-modal' tabindex='-1' role='dialog' aria-hidden='true'>"
						+ "<div class='modal-dialog'><div class='modal-content'><div class='modal-header'><button type='button' class='close' data-dismiss='modal' aria-label='Close'>"
						+ "<span aria-hidden='true'>&times;</span></button><h4 class='modal-title'></h4></div><div class='modal-body'></div><div class='modal-footer'>"
						+ "<button type='button' class='btn btn-default' data-dismiss='modal'>Close</button></div></div></div></div>";
				
				$('body').append(html);
				
			} catch (e) {
				console.error(e);
			}
		},
		
		/**
		 * Resizes the graph
		 */
		'resize' : function() {
			try {
				
				if (!_globals.network)
					return;
				
				// get the current window height
				var height = $(document).height();
				
				var $cnt = $('#container-graph');
				$cnt.css({
					'height' : height + 'px'
				});
				
				// redraw the graph
				_globals.network.redraw();
				
			} catch (e) {
				console.error(e);
			}
			
		},
		
		/**
		 * Displays info on the top alert section.
		 */
		'showInfo' : function(type, title, msg) {
			try {
				
				$('#section-info').children().remove();
				var html = "<div class='alert alert-" + type
						+ " text-center' role='alert'>";
				html += "<h3>" + title + " <small>" + msg + "</small></h3>";
				html += "</div>";
				
				$('#section-info').append(html);
				
			} catch (e) {
				console.error(e);
			}
		}
	
	};
	
	/*
	 * PUBLIC METHODS
	 */

	return {
		
		/**
		 * Draws the swagger graph
		 * 
		 * @param api
		 *          The Swagger v2 parsed API object
		 * @param opts
		 *          The
		 * @returns
		 */
		draw : _private.draw,
		
		/**
		 * Resizes the graph
		 */
		resize : _private.resize
	
	}

})();

/*
 * catch window resizes
 */
$(window).resize(swagger.ed.Graph.resize);
