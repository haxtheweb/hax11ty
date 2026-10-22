*   Power of [11ty](https://www.11ty.dev/) for publishing static / high SEO
*   Easier than 11ty, 0 config solution for publishing
*   Power of HAXcms for rocket fast PWA in a forever format
*   Extendable via web components
*   [HAX](https://haxtheweb.org) as web editor to skip markdown
*   Easy github pages based publishing workflow
*   All files requiring change are in `src/` directory
*   Output can plug into [HAXcms-php](https://github.com/haxtheweb/haxcms-nodejs), [HAXcms-nodejs](https://github.com/haxtheweb/haxcms-nodejs) and [HAXiam](https://github.com/haxtheweb/haxiam) solutions

### Performance

High lighthouse scores are achieved with certain constraints that will keep it from hitting max possible scores:

*   We keep things unbundled to allow for maximal reuse. This has an initial performance hit in the name of page to page speed.
*   We do this so that if you put, for example, meme-maker into a page of content, hax11ty will generate the preload statements for that element from the CDN. This is done on a page by page level.
*   That's it. All other mettrics we can hit the same scores as any other app!