/**
 * APIs Catalog viewer
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
swagger.ed.Catalog = (function() {
	
	"use strict";
	
	
	
	/*
	 * global object
	 */
	var _globals = {
		
		nodes : [],
		edges : [],
		network : null,
		catalog : null
		
	};

	/*
	 * PRIVATE METHODS
	 */
	var _private = {
		
		/**
		 * Draws the APIs catalog graph
		 */
		'draw' : function draw(catalog, opts) {
			
			opts = opts || {};
			
			_globals.resPath = ( typeof opts.resPath != 'undefined' ? opts.resPath : './' )
			
			_private.destroy();
			
			// store globally
			_globals.catalog = catalog;
			
			// create the root node
			var root = {
				id : 'root',
				label : catalog.name,
				type : 'catalog',
				image : _globals.resPath + 'res/catalog.png',
				shape : 'image',
				color : {
					background : '#27ae60',
				},
				fontSize : '20'
			};
			
			_globals.nodes.push(root);
			
			/*
			 * process APIs collection
			 */
			_private.processApis();
			
			/*
			 * process inclusions
			 */
			_private.processInclusions();
			
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
						fontColor : 'black',
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
				
				// show the info bar
				_private.showInfo('info', 'API Catalog', _globals.catalog.name);
				
				// create the modal template
				_private.createModal();
				
			} catch (e) {
				console.error(e);
			}
			
		},
		
		/**
		 * Processes the APIs collection
		 */
		'processApis' : function() {
			
			try {
				
				if ( ( typeof _globals.catalog.apis == 'undefined' ) || (_globals.catalog.apis.length == 0) )
					return;
				
				// create the root node
				var node = {
					id : '#apis',
					label : 'APIs',
					shape : 'box',
					color : {
						background : '#e67e22',
					},
					fontColor : 'white'
				};
				
				_globals.nodes.push(node);
				
				var edge = {
					from : 'root',
					to : '#apis'
				};
				_globals.edges.push(edge);
				
				/*
				 * go through the API collection
				 */
				for ( var idx in _globals.catalog.apis) {
					
					// process the API entry
					var api = _globals.catalog.apis[idx];
					_private.processApi(api);
					
				}
				
			} catch (e) {
				console.error(e);
			}
			
		},
		
		/**
		 * Processes a single API resource.
		 */
		'processApi' : function(api) {
			
			try {
				
				var parent = '#apis';
				
				var id = api.name;
				
				// create the node
				var node = {
					id : id,
					key : api.name,
					label : api.name,
					parent : parent,
					type : 'api',
					shape : 'image',
					image : _globals.resPath + 'res/api.png'
				};
				
				var edge = {
					from : parent,
					to : id
				};
				
				// add the node and edge
				_globals.nodes.push(node);
				_globals.edges.push(edge);
				
				/*
				 * does it have a Swagger definition?
				 */
				if (typeof api.properties == 'undefined')
					return;
				
				var swaggerUrl = null;
				for (var idx in api.properties)
				{
					var prop = api.properties[idx];
					
					if (prop.type.toUpperCase() === 'swagger'.toUpperCase())
					{
						swaggerUrl = prop.url;
						break;
					}
				}
				
				if (!swaggerUrl)
					return;
				
				// create the Swagger definition node
				var key = swaggerUrl;
				
				var node = {
					id : key,
					key : key,
					title : 'Swagger definition',
					label: 'Swagger',
					parent : id,
					type : 'swagger',
					shape : 'image',
					image : _globals.resPath + 'res/swagger.png'
				};
				
				var edge = {
					from : id,
					to : key,
					style: 'dash-line'
				};
				
				// add the node and edge
				_globals.nodes.push(node);
				_globals.edges.push(edge);
				
			} catch (e) {
				console.error(e);
			}
			
		},
		
		/**
		 * Processes inclusions.
		 */
		'processInclusions' : function() {
			
			try {
				
				// create the root node
				var node = {
					id : '#links',
					label : 'Includes',
					shape : 'box',
					color : {
						background : '#2ecc71'
					},
					fontColor : 'white'
				};
				
				_globals.nodes.push(node);
				
				var edge = {
					from : 'root',
					to : '#links'
				};
				_globals.edges.push(edge);
				
				/*
				 * go through the catalog inclusions
				 */
				var idx = 0;
				for ( var idx in _globals.catalog.include) {
					
					var inclusion = _globals.catalog.include[idx];
					
					var id = inclusion.url;
					
					var parent = '#links';
					
					// create the node
					var node = {
						id : id,
						key : id,
						label : inclusion.name,
						parent : parent,
						type : 'link',
						shape : 'image',
						image : _globals.resPath + 'res/link.png'
					};
					
					var edge = {
						from : parent,
						to : id
					};
					
					// add the node and edge
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
				
				if (node.type == 'catalog')
					details = _private.onCatalogDetails(node);
				else if (node.type == 'api')
					details = _private.onApiDetails(node);
				else if (node.type == 'link')
					return _private.onLink(node);
				else if (node.type == 'swagger')
					return _private.onSwagger(node);
				else
					return;
				
				if (!details)
					return;
				
				$('#template-modal .modal-title').text(details.title);
				$('#template-modal .modal-body').append(details.html);
				
				// show the modal
				$('#template-modal').modal('show');
				
			} catch (e) {
				console.log(e);
			}
		},
		
		/**
		 * Returns modal content for the root catalog node.
		 */
		'onCatalogDetails' : function(node) {
			
			var details = {};
			
			try {
				
				// get the corresponding API resource model definition
				var catalog = _globals.catalog;
				
				var html = "";
				
				/*
				 * General info
				 */
				details.title = 'Catalog: ' + catalog.name;
				
				html += "<div class='row'>";
				
				// image
				html += "<div class='col-md-6'><img class='img-responsive' src='"
						+ catalog.image + "'></div>";
				
				html += "<div class='col-md-6'>";
				
				// description
				html += "<p>" + catalog.description + "</p>";
				
				html += "</div>";
				html += "</div><hr>";
				
				/*
				 * Details
				 */
				html += "<h4>Details <small>Catalog information</small></h4>";
				
				// spec version
				if (typeof catalog.SpecificationVersion != 'undefined') {
					
					html += "<dl class='dl-horizontal'><dt>Specification Version</dt><dd><span class='label label-info'>"
							+ catalog.SpecificationVersion + "</span></dd></dl>";
				}
				
				// url
				if (typeof catalog.url != 'undefined') {
					
					html += "<dl class='dl-horizontal'><dt>URL</dt><dd><a target='_blank' href='"
							+ catalog.url + "'>" + catalog.url + "</a></dd></dl>";
				}
				
				// created
				if (typeof catalog.created != 'undefined') {
					
					html += "<dl class='dl-horizontal'><dt>Created at</dt><dd>"
							+ catalog.created + "</dd></dl>";
				}
				
				// modified
				if (typeof catalog.modified != 'undefined') {
					
					html += "<dl class='dl-horizontal'><dt>Modified at</dt><dd>"
							+ catalog.modified + "</dd></dl>";
				}
				
				/*
				 * Tags
				 */
				if (typeof catalog.tags != 'undefined') {
					html += "<div class='section-tags'>";
					html += "<h4>Tags</h4>";
					
					for ( var idx in catalog.tags) {
						// get the next param
						var tag = catalog.tags[idx];
						html += "<span class='label label-default'>" + tag + "</span>";
					}
					
					html += " </div>";
				}
				
				details.html = html;
				
			} catch (e) {
				console.error(e);
			}
			
			return details;
			
		},
		
		/**
		 * Returns modal content for an API node.
		 */
		'onApiDetails' : function(node) {
			
			var details = {};
			
			try {
				
				// get the corresponding API resource
				var api = null;
				
				for ( var idx in _globals.catalog.apis) {
					api = _globals.catalog.apis[idx];
					
					if (api.name === node.id)
						break;
				}
				
				if (!api)
					return null;
				
				// set the title
				details.title = "API: " + api.name;
				
				/*
				 * render the supported operations
				 */
				var html = "";
				
				/*
				 * General info
				 */
				html += "<div class='row'>";
				
				// image
				html += "<div class='col-md-6'><img class='img-responsive' src='"
						+ api.image + "'></div>";
				
				html += "<div class='col-md-6'>";
				
				// description
				html += "<p>" + api.description + "</p>";
				
				html += "</div>";
				html += "</div><hr>";
				
				/*
				 * Tags
				 */
				if (typeof api.tags != 'undefined') {
					html += "<div class='section-tags'>";
					
					for ( var idx in api.tags) {
						// get the next tag
						var tag = api.tags[idx];
						html += "<span class='label label-default'>" + tag + "</span>";
					}
					
					html += " </div><hr>";
				}
				
				/*
				 * URLs
				 */
				if ((typeof api.baseURL != 'undefined')
						|| (typeof api.humanURL != 'undefined')) {
					
					html += "<h4>URLs <small>List of API URLs</small></h4>";
					
					// base
					if (typeof api.baseURL != 'undefined') {
						
						html += "<dl class='dl-horizontal'><dt>Base</dt><dd><a target='_blank' href='"
								+ api.baseURL + "'>" + api.baseURL + "</a></dd></dl>";
					}
					
					// human
					if (typeof api.humanURL != 'undefined') {
						
						html += "<dl class='dl-horizontal'><dt>Human</dt><dd><a target='_blank' href='"
								+ api.humanURL + "'>" + api.humanURL + "</a></dd></dl>";
					}
					
				}
				
				/*
				 * Contact
				 */
				if (typeof api.contact != 'undefined') {
					html += "<div><h4>Contact <small>Provider contact details</small></h4>";
					
					var contactNum = api.contact.length;
					var colsize = Math.floor(12 / contactNum);
					
					html += "<div class='row'>";
					
					// loop through the contacts
					for ( var idx in api.contact) {
						
						html += "<div class='col-md-" + colsize + "'>";
						
						var contact = api.contact[idx];
						html += "<div class='media'><div class='media-left'><span class='glyphicon glyphicon-user img-thumbnail' aria-hidden='true' style='font-size: 24px;'></span></div>";
						html += "<div class='media-body'>";
						
						for ( var key in contact) {
							html += "<address><strong>" + key + "</strong><br>"
									+ contact[key] + "</address>";
						}
						
						html += "</div>";
						html += "</div></div>";
					}
					
					html += "</div>";
					
					html += "</div>";
					
				}
				
				/*
				 * Properties
				 */
				if (typeof api.properties != 'undefined') {
					
					html += "<div class='section-properties'>";
					html += "<h4>Properties <small>List of API properties</small></h4>";
					html += "<table class='table table-condensed'>";
					html += "<thead><tr><th>Type</th><th>URL</th></tr></thead><tbody>";
					
					for ( var idx in api.properties) {
						
						// get the property
						var property = api.properties[idx];
						
						/*
						 * loop though the properties
						 */
						html += "<tr>";
						html += "<td><strong>" + property.type + "</strong></td>";
						html += "<td><a target='_blank' href='" + property.url + "'>"
								+ property.url + "</a></td>";
					}
					
					html += "</div>";
				}
				
				details.html = html;
				
			} catch (e) {
				console.error(e);
			}
			
			return details;
		},
		
		/**
		 * Triggers an event.
		 */
		'onLink' : function(node) {
			
			var link = {
				name: node.label,
				url: node.id
			};
			
			$(swagger.ed.Catalog).trigger( 'onCatalogLinkDetails', link );
			
		},
		
		/**
		 * Triggers an event.
		 */
		'onSwagger' : function(node) {
			
			var link = {
				url: node.id
			};
			
			$(swagger.ed.Catalog).trigger( 'onSwaggerLinkDetails', link );
			
		},
		
		/**
		 * Destroys the graph instance.
		 */
		'destroy' : function() {
			
			if (_globals.network !== null) {
				_globals.network.destroy();
				_globals.network = null;
			}
			
			_globals.catalog = null;
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
		 * Displays info on the top 
		 * alert section.
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
		},
		
		/**
		 * Registers an event listener.
		 */
		'on' : function(event, cb) {
			
			$(this).unbind(event).bind(event, cb);
			
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
		resize : _private.resize,
		
		on : _private.on
	
	}

})();

/*
 * catch window resizes
 */
$(window).resize(swagger.ed.Catalog.resize);
