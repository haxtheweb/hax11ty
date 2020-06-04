---
layout: base.liquid
---

<haxtheme-banner size="large" image="{% getGlobal 'siteLogo' %}" title="{% getGlobal 'siteName' %}" details="{% getGlobal 'siteDescription' %}"></haxtheme-banner>

<main>
{%- for post in collections.post -%}
  <haxtheme-item title="{{post.data.title}}" url="{{post.url}}" date="{{post.date}}"></haxtheme-item>
{%- endfor -%}
</main>