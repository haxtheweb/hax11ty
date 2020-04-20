---
title: HAXcms Eleventy Blog
layout: base.liquid
---

<h1>{{title}}</h1>

<ul>
{%- for post in collections.post -%}
  <li>
    <a href="{{post.url}}">{{ post.data.title }}</a>
  </li>
{%- endfor -%}
</ul>