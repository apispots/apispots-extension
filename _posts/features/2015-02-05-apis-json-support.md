---
layout: feature
title: Support for APIs.json catalogs
excerpt: "Navigate API catalogs defined with the APIs.json format."
categories: features
tags: [API,catalog,APIs.json]
image:
  thumb: features/catalog.png
comments: true
share: false
---

# API discovery through the APIs.json format

The [**APIs.json**](http://apisjson.org/ "APIs.json format") format is a collaborative effort from first-movers in the API space to standardize indexing and discovery of APIs.  Below is the manifest taken directly from the web site.

> APIs are becoming a crucial part of the Web. Unfortunately however, it remains very difficult to determine the location of these APIs on servers around the Web. The objective of APIs.json is to help fix this problem by making it easy for people to signpost where the APIs on a given domain are and provide information on how they work. The format is simple and extensible and can be put into any web root domain for discovery.

## An APIs catalog example

Here you can see a sample **APIs.json** definition that describes a catalog of 1st level APIs provided by the [**API Evangelist**](http://apievangelist.com/ "The API Evangelist") and act as entry points to the rest of the APIs in his ecosystem.  On top there is a brief description of the organization / provider followed by the list of 
entry-point APIs.  Each API declaration contains:

* A general description section
* A list of related tags
* A dynamic list of key/value properties
* A list of contacts 
* A list of **included** API definition links
* A list of active maintainers with contact info

<script src="https://gist.github.com/kinlane/10094618.js"></script>

The **APIs.json** definition file can be considered as the equivalent of a **robots.txt** file used by search engines, but this time for API discovery.  There
is a sample search engine show casing the concept over at [**apis.io**](http://apis.io/ "APIs search engine").   

## Discovering and navigating API topologies 

The people driving **swagger.ed** had envisioned for quite a while the time where API discovery would be something as easy as searching on the browser, breaking the barriers of vendor specific lock-ins.  The API Economy train on-boards every day API providers that want to gain visibility within the space and add value to other products & services.

By embracing an open standard such as the **APIs.json** definition format - which was originally created to meet the above requirements - API providers can now expose their 'goods' taking advantage of existing web features & facilities.  Moreover, API consumers are now enabled to easily discover and understand exposed APIs through new age tools and services.          

**swagger.ed** could simply not miss out on this tremendous potential.  In their nature, API catalogs are something that is meant to be navigated and explored.  Similar to APIs, API ecosystems are living organisms that are constantly evolving and enriched over time.  The **swagger.ed** team considers API cataloging as the most fundamental piece in the API visualization puzzle and therefore enabled seamless support for the specification. 

## Same approach, different perspective

The **swagger.ed** add-on is able to detect a valid **APIs.json** definition at a given URL and displays a corresponding 'page action' icon next within the address bar.

[![APIs.json page action]({{ site.url }}/images/features/apis-json-in-browser.png)](https://kin-lane.github.io/master/apis.json)

Clicking on the page action will open a new popup window that displays a graph visualization of the APIs catalog.

![APIs.json page action]({{ site.url }}/images/features/apis-catalog.png)

You can navigate the graph using the mouse and by **double-clicking** on a resource will either display a modal containing info on that resource, or navigate to a linked catalog.

![APIs.json page action]({{ site.url }}/images/features/apis-catalog-linked.png)

If there is a valid Swagger v1.2 or v2.0 API definition anywhere within the catalog, the graph will display an API resource and by double-clicking on it you get to see [the full API graph]({{ site.url }}/features/navigate-api-resources "Navigate the API graph").


