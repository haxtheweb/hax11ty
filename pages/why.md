<p><ul>
    <li>Power of <a href="https://www.11ty.dev/">11ty</a> for publishing static / high SEO</li>
    <li>Easier than 11ty, 0 config solution for publishing</li>
    <li>Power of HAXcms for rocket fast PWA in a forever format</li>
    <li>Extendable via web components</li>
    <li><a href="https://haxtheweb.org">HAX</a> as web editor to skip markdown</li>
    <li>Easy github pages based publishing workflow</li>
    <li>All files requiring change are in <code>src/</code> directory</li>
    <li>Output can plug into <a href="https://github.com/elmsln/haxcms">HAXcms SaaS</a> and <a href="https://github.com/elmsln/haxiam">HAXcms PaaS</a> solutions</li>
</ul></p>
<h3>Performance</h3>
<p>High lighthouse scores are achieved with certain constraints that will keep it from hitting max possible scores:
<ul>
    <li>We keep things unbundled to allow for maximal reuse. This has an initial performance hit in the name of page to page speed.</li>
    <li>We do this so that if you put, for example, meme-maker into a page of content, hax11ty will generate the preload statements for that element from the CDN. This is done on a page by page level.</li>
    <li>That's it. All other mettrics we can hit the same scores as any other app!</li>
</ul>
</p>
