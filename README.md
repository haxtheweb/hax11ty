# HAXcms + 11ty

This wrapper on 11ty provides conventions to simplify how you build and deploy HAXcms in a static form.

## Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/elmsln/hax11ty/master/hax11tyme.sh -o hax11tyme.sh && sh hax11tyme.sh
```

## Starting the repo usage

- Clone the repo / use it as a template
- `yarn install`
- `yarn start` to work locally and view changes

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

### Publishing to github

- `yarn run build` will build it into the `dist` directory
- Or, if you use github actions, you should be able to just change files

### Taking into HAXiam or HAXcms local versions

`yarn run local-build` will build it into the `dist` directory, tweaking paths to be more compatible with HAXcms local and shared hosting solutions

## 11ty expert

You can find all 11ty configuration and settings inside the `app/` folder. Only modify these things if you have experience with 11ty as you'll be forking from the suported build workflows.
