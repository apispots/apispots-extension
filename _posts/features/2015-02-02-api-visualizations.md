---
layout: feature
title: Swaggered powered API Visualizations
excerpt: "View visual representation of APIs with a click"
categories: features
tags: [api,graph]
image:
  thumb: features/api-visualization.png
comments: true
share: false
---

# From Swagger definitions to visual API graphs

> A picture is worth a thousand words.

Swagger.ed was created under the prism of the well known quote in order to bridge the gap 
between a machine-readable API definition and human perception.  Being able to understand
what an API is all about **at a glance** is the bet we want to win.       


## One specification - a thousand possibilities

The guys at [**Reverb**](http://reverb.com/ "Reverb") took the first step forward and created a specification that broke barriers and set 
new ground rules. [**Swagger**](http://swagger.io/ "Swagger") is here to stay and a enormous community is evolving around it.   

Various tools and services are constantly being developed that enable developers, designers, architects, researchers, analysts, etc 
to simplify painful tasks and open up new horizons.  **Swagger.ed** is a tool that aims to help all personas connected through an API
to explore it under a different perspective.

## From machine readable to human readable formats

The bare bones of the Swagger specification is a machine readable API definition document which can be generated either automatically or manually
using a broad range of tools and frameworks in JSON or YAML formats.

<figure class="half">
	<img src="{{ site.url }}/images/features/swagger-json.png" alt="image">
	<img src="{{ site.url }}/images/features/swagger-yaml.png" alt="image">
	<figcaption>Swagger definitions in JSON and YAML formats</figcaption>
</figure>

Both formats have become the de-facto when it comes to machine parsing, but are really hard to understand and navigate when humans 
are involved.

## Visualizations to the rescue

Humans tend to understand and interpret drawings faster and easier than documents.  Visual signs have been used as a communication medium
since the dawn of humanity and is something usually preferred when we want someone to get the idea of something without much explanation
up-front. 

**Swagger.ed** tries to solve this communication problem by using easy-to-understand visualizations that are easy to interpret by
both technical and non people.

The following image shows a visualization of the [infamous **Petstore API**](http://petstore.swagger.io/v2/swagger.json "Petstore API - Swagger definition") 
as generated directly from its live Swagger spec.

<figure>
	<img src="{{ site.url }}/images/features/swagger-petstore.png" alt="image">
	<figcaption>The Petstore API visualized as a directed API graph</figcaption>
</figure>

This is exactly the same definition document that drives the [Swagger UI application](http://petstore.swagger.io/ "Swagger Explorer").

<div markdown="0"  class="text-center"><a href="{{ site.url }}/features/navigate-api-resources/" class="btn">Wow, is this graph interactive?</a></div>



