---
title: HAXcms Eleventy Blog
layout: base.liquid
---

<h1>{{title}}</h1>

{%- for post in collections.post -%}
  <haxtheme-item title="{{post.data.title}}" url="{{post.url}}"></haxtheme-item>
{%- endfor -%}