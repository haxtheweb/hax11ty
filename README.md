[![License: Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Lit](https://img.shields.io/badge/-Lit-324fff?style=flat&logo=data:image/svg%2bxml;base64,PHN2ZyBmaWxsPSIjZmZmIiB2aWV3Qm94PSIwIDAgMTYwIDIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtMTYwIDgwdjgwbC00MC00MHptLTQwIDQwdjgwbDQwLTQwem0wLTgwdjgwbC00MC00MHptLTQwIDQwdjgwbDQwLTQwem0tNDAtNDB2ODBsNDAtNDB6bTQwLTQwdjgwbC00MC00MHptLTQwIDEyMHY4MGwtNDAtNDB6bS00MC00MHY4MGw0MC00MHoiLz48L3N2Zz4%3D)](https://lit.dev/)
[![#HAXTheWeb](https://img.shields.io/badge/-HAXTheWeb-999999FF?style=flat&logo=data:image/svg%2bxml;base64,PHN2ZyBpZD0iZmVhMTExZTAtMjEwZC00Y2QwLWJhMWQtZGZmOTQyODc0Njg1IiBkYXRhLW5hbWU9IkxheWVyIDEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDE4NC40IDEzNS45NyI+PGRlZnM+PHN0eWxlPi5lMWJjMjAyNS0xODAwLTRkYzItODc4NS1jNDZlZDEwM2Y0OTJ7ZmlsbDojMjMxZjIwO308L3N0eWxlPjwvZGVmcz48cGF0aCBjbGFzcz0iZTFiYzIwMjUtMTgwMC00ZGMyLTg3ODUtYzQ2ZWQxMDNmNDkyIiBkPSJNNzguMDcsODMuNDVWNTVIODYuMnY4LjEzaDE2LjI2djQuMDdoNC4wN1Y4My40NUg5OC40VjY3LjE5SDg2LjJWODMuNDVaIi8+PHBvbHlnb24gcG9pbnRzPSIxNTMuMTMgNjMuNyAxNTMuMTMgNTEuMzkgMTQwLjU0IDUxLjM5IDE0MC41NCAzOS4wOSAxMjcuOTUgMzkuMDkgMTI3Ljk1IDI2Ljc5IDEwMi43OCAyNi43OSAxMDIuNzggMzkuMDkgMTE1LjM2IDM5LjA5IDExNS4zNiA1MS4zOSAxMjcuOTUgNTEuMzkgMTI3Ljk1IDYzLjcgMTQwLjU0IDYzLjcgMTQwLjU0IDc2IDEyNy4zNiA3NiAxMjcuMzYgODguMyAxMTQuNzggODguMyAxMTQuNzggMTAwLjYxIDEwMi4xOSAxMDAuNjEgMTAyLjE5IDExMi45MSAxMjcuMzYgMTEyLjkxIDEyNy4zNiAxMDAuNjEgMTM5Ljk1IDEwMC42MSAxMzkuOTUgODguMyAxNTIuNTQgODguMyAxNTIuNTQgNzYgMTY1LjcyIDc2IDE2NS43MiA2My43IDE1My4xMyA2My43Ii8+PHBvbHlnb24gcG9pbnRzPSIzMy4xMyA2My43IDMzLjEzIDUxLjM5IDQ1LjcyIDUxLjM5IDQ1LjcyIDM5LjA5IDU4LjMxIDM5LjA5IDU4LjMxIDI2Ljc5IDgzLjQ4IDI2Ljc5IDgzLjQ4IDM5LjA5IDcwLjg5IDM5LjA5IDcwLjg5IDUxLjM5IDU4LjMxIDUxLjM5IDU4LjMxIDYzLjcgNDUuNzIgNjMuNyA0NS43MiA3NiA1OC44OSA3NiA1OC44OSA4OC4zIDcxLjQ4IDg4LjMgNzEuNDggMTAwLjYxIDg0LjA3IDEwMC42MSA4NC4wNyAxMTIuOTEgNTguODkgMTEyLjkxIDU4Ljg5IDEwMC42MSA0Ni4zMSAxMDAuNjEgNDYuMzEgODguMyAzMy43MiA4OC4zIDMzLjcyIDc2IDIwLjU0IDc2IDIwLjU0IDYzLjcgMzMuMTMgNjMuNyIvPjwvc3ZnPg==)](https://haxtheweb.org/)
[![X](https://img.shields.io/twitter/follow/haxtheweb.svg?style=social&label=Follow)](https://twitter.com/intent/follow?screen_name=haxtheweb)

# HAX11ty
The authoring experience of HAX and the ability to make fast, static file backed websites rapidly.
Get all the details you want on [HAXTheWeb.org](https://haxtheweb.org/haxcms-1)!
HAX seeks to be the smallest possible back-end CMS to make HAX work and be able to build websites with it. Leveraging JSON Outline Schema, HAX is able to author multiple pages, which it then writes onto the file system. This way a slim server layer is just for basic authentication, knowing how to save files, and placing them in version control.

# HAXcms + 11ty

This wrapper on 11ty provides conventions to simplify how you build and deploy HAXcms in a static form.

## Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/haxtheweb/hax11ty/master/hax11tyme.sh -o hax11tyme.sh && sh hax11tyme.sh
```

## Starting the repo usage

- Clone the repo / use it as a template
- `npm install`
- `npm start` to work locally and view changes

## gh-pages workflow

There are already github actions setup that will work out of the box after you change these two settings:

- Use this repo as a template to make your own
- Edit `src/settings.js` and ensure the line that has `var gitOrg` is set to your organization (gitRepo as well if you change the repo name)
- Then make sure you enable actions by clicking the Actions tab and telling it to run
  By changing these settings up front all changes to the repo should automatically build out your github pages site!

## Adding content / working locally

All files that you'll want to modify are found in the `src/` directory

- Add pages into the `src/content/` directory, `.md` with greymatter allows you to set title of the page and order
- `src/files/` is where you can place files you manually want to include in your site, referenced within content
- `src/styles.css` has some default settings and styles which you can modify
- `src/settings.js` - modify theme used, additional settings

## Publishing

Publishing with hax11ty is a snap and we have multiple methods of publishing we support. As long as you stick to just modifying the files mentioned

### Publishing to github with assets included

- `npm run build` will build it into the `dist` directory
- Or, if you use github actions, you should be able to just change files

### Publishing to github leveraging CDN network
- `npm run build:cdn` will publish your site as if it is leveraging our CDN network
- This will default to cdn.webcomponents.psu.edu but can be set to point to other sources in `src/settings.js`

### Taking into HAXiam or HAXcms local versions

`npm run local-build` will build it into the `dist` directory, tweaking paths to be more compatible with HAXcms local and shared hosting solutions

## 11ty expert

You can find all 11ty configuration and settings inside the `app/` folder. Only modify these things if you have experience with 11ty as you'll be forking from the suported build workflows.

# Get Help / Issues / Support
- Discord Channel - https://bit.ly/hax-discord
- Unified issue queue - https://github.com/haxtheweb/issues/issues
- Using Merlin directly in any HAX spaces and type "Issue" to jump start a report!

## Watch and Learn more about HAX here:
- Try Hax: https://hax.cloud
- HAXCellence https://haxtheweb.org/what-is-hax
- Youtube channel - https://www.youtube.com/@haxtheweb

# Related links and tech
- [NPM Package list](https://www.npmjs.com/org/haxtheweb)
- [HAXcms (NodeJS)](https://github.com/haxtheweb/haxcms-nodejs)
- [HAXcms (PHP)](https://github.com/haxtheweb/haxcms-php)
- [Storybook docs](https://open-apis.hax.cloud/)
- [HAX [dot] PSU](https://hax.psu.edu)
- [HAX doc site](https://haxtheweb.org/)
- [HAX + 11ty](https://github.com/haxtheweb/hax11ty)


![HAX Traveler: World Changer](https://raw.githubusercontent.com/haxtheweb/art/refs/heads/main/haxtheweb/hax-traveler-world-changer.jpg)

