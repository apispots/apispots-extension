---
layout: feature
title: Navigate API resources
excerpt: "Navigate the full API graph and see how resources are interconnected."
categories: features
tags: [api,graph]
image:
  thumb: features/api-navigate-resources.png
comments: true
share: false
---

# Navigate the API graph with simple actions

Once **Swagger.ed** has generated the API graph, you can navigate it simply by using the mouse.  

## Zoom the graph in & out 

You can zoom the graph in & out by using the **mouse wheel**.  This will let you focus around specific areas and
also get a birds-eye view of the topology.

## Inspect resource details

**Double-clicking** on a resource will open a modal box with all available details regarding
the selected resource.

### View general information about the API

Double clicking on the central API resource, will display general information about the API under inspection.

<figure>
	<img src="{{ site.url }}/images/features/api-general-info.png" alt="image">
	<figcaption>General API information</figcaption>
</figure>  

### Inspect API resource paths

Double clicking on a **path resource** will display all the available information, including **supported operations** 
(HTTP methods), **request paramaters**, applied **security schemes**, supported **MIME types** and **responses**.

<figure class='half'>
	<img src="{{ site.url }}/images/features/api-path-info-1.png" alt="image">
	<img src="{{ site.url }}/images/features/api-path-info-2.png" alt="image">
	<figcaption>Path resource information</figcaption>
</figure>

### Inspect API model schemas

Double clicking on a **model resource** will display the defined schema for the selected object along with 
any required properties.  The schema is displayed in a code box with highlighting.

<figure>
	<img src="{{ site.url }}/images/features/api-model-info.png" alt="image">
	<figcaption>Model resource information</figcaption>
</figure>

<div markdown="0"  class="text-center"><a href="{{ site.url }}/features/swagger-versions-support/" class="btn">Damn, I have a Swagger v1.2 spec - now what?</a></div>
