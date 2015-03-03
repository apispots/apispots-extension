---
layout: page
title: Swagger APIs at a glance
excerpt: "Change the way you look at APIs"
image:
  feature: common/swagger-graph.png
---

<h1 class="text-center">Features</h1>

{% for post in site.categories.features reversed %}
<div class="media">
      <div class="media-body">
        <a href="{{ site.url }}{{ post.url }}">
          <h4 class="media-heading">{{ post.title }}</h4>
        </a>
        {{ post.excerpt }}
      </div>
      <div class="media-right">
        <a href="{{ site.url }}{{ post.url }}">
          <img class="media-object" src="{{ site.url }}/images/{{ post.image.thumb}}" style="width: 64px; height: 64px;">
        </a>
      </div>
    </div>
{% endfor %}

<div markdown="0" class="text-center" style='margin-top: 40px;'><a href="https://github.com/chefArchitect/swagger.ed/releases/download/{{ site.artifact.version }}/swagger.ed.crx" class="btn" style='font-size: 28px; background-color: #f1c40f;'>Download the Chrome extension</a></div>