---
layout: page
title: Features
excerpt: "swagger.ed features"
search_omit: true
---

<figure class="half">
	{% for post in site.categories.articles %} 
	  <a href="{{ site.url }}{{ post.url }}"><img src="{{ post.image.feature}}" alt="image"></a>
	  <li><article><a href="{{ site.url }}{{ post.url }}">{{ post.title }} <span class="entry-date"><time datetime="{{ post.date | date_to_xmlschema }}">{{ post.image.feature | date: "%B %d, %Y" }}</time></span>{% if post.excerpt %} <span class="excerpt">{{ post.excerpt }}</span>{% endif %}</a></article></li>
	{% endfor %}
	
	<a href="http://placehold.it/1200x600.jpg"><img src="http://placehold.it/600x300.jpg" alt="image"></a>
	<img src="http://placehold.it/600x300.jpg" alt="image">
	<img src="http://placehold.it/600x300.jpg" alt="image">
	<figcaption>Two images.</figcaption>
</figure>


