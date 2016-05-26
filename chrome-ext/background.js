var globals = {

    tabs: {
        selected: null
    },

    // the loaded Swagger API definition
    api: null,

    // the loaded API catalog definition
    catalog: null,

    type: null,

    // the page URL
    url: null
};


/**
 * Called when a different tab has been selected
 */
chrome.tabs.onSelectionChanged.addListener(function(tabId, info) {

    // remember the selected tab
    globals.tabs.selected = tabId;

});


/**
 * Called when the user clicks on the page action
 */
chrome.pageAction.onClicked.addListener(function(tab) {

    // create a new window that will load the visualizer
    chrome.windows.create({
        url: chrome.extension.getURL("canvas.html"),
        type: "popup"
    }, function() {

        // send a message to the new window with the API definition
        var msg = null;

        if (globals.type === 'api')
            msg = {
                name: 'onVisualizeApi',
                api: globals.api
            };
        else if (globals.type === 'catalog')
            msg = {
                name: 'onVisualizeCatalog',
                catalog: globals.catalog
            };

        setTimeout(function(){
            chrome.runtime.sendMessage(undefined, msg, undefined);

            console.log('Dispatched message to popup')
        }, 500);



    });
});


/**
 * Loads a linked API catalog
 * from the given resource URL.
 */
function loadLinkedApiCatalog(url, cb) {

    try {

        // GET the resource
        $.ajax({
            url: url,
            success: function(content, status) {

                // return the content fetched
                cb(null, content);
            },
            error: function(jqXHR, err) {
                console.error(jqXHR.statusText);
                cb("Resource at [" + url + "] could not be fetched.");
            }
        });

    } catch (e) {
        console.error(e);
    }

}

/**
 * Loads a linked API catalog
 * from the given resource URL.
 */
function onLinkedCatalogFetched(err, catalog) {

    try {

        var msg = {
            name: 'onCatalogFetched',
            catalog: catalog
        };
        chrome.runtime.sendMessage(undefined, msg, undefined);

    } catch (e) {
        console.error(e);
    }

}

/**
 * Loads a linked API catalog
 * from the given resource URL.
 */
function loadSwaggerDefinition(url, cb) {

    try {

        // GET the resource
        $.ajax({
            url: url,
            success: function(content, status) {

                // return the content fetched
                cb(null, content);
            },
            error: function(jqXHR, err) {
                console.error(jqXHR.statusText);
                cb("Resource at [" + url + "] could not be fetched.");
            }
        });

    } catch (e) {
        console.error(e);
    }

}

/**
 * Loads a linked API catalog
 * from the given resource URL.
 */
function onSwaggerDefinitionFetched(err, api) {

    try {

        /*
         *
         */
        var msg = {
            name: 'onVisualizeApi',
            api: api
        };
        chrome.runtime.sendMessage(undefined, msg, undefined);

    } catch (e) {
        console.error(e);
    }

}



/**
 * Bind global event listener
 */
chrome.runtime.onMessage.addListener(function(msg, sender, cb) {

    // call the callback
    switch (msg.name) {
        case 'onSwaggerDefinition':

            // store the API definition
            globals.type = 'api';
            globals.api = msg.api;

            // enable the page action
            chrome.pageAction.setIcon({
                path: 'res/swagger-32.png',
                tabId: sender.tab.id
            });
            chrome.pageAction.show(sender.tab.id);
            break;

        case 'onApiCatalogDefinition':

            // store the API catalog definition
            globals.type = 'catalog';
            globals.catalog = msg.catalog;

            // enable the page action
            chrome.pageAction.setIcon({
                path: 'res/catalog-32.png',
                tabId: sender.tab.id
            });
            chrome.pageAction.show(sender.tab.id);
            break;

        case 'onLoadLinkedCatalog':

            // load the linked API catalog
            loadLinkedApiCatalog(msg.url, onLinkedCatalogFetched);
            break;

        case 'onLoadSwaggerDefinition':

            // load the linked API catalog
            loadSwaggerDefinition(msg.url, onSwaggerDefinitionFetched);
            break;

    }

});
