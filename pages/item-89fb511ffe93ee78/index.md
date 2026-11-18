Quick Installation Script
-------------------------

<code-sample copy-clipboard-button=""><template>
    curl -fsSL https://raw.githubusercontent.com/haxtheweb/hax11ty/master/hax11tyme.sh -o hax11tyme.sh &amp;&amp; sh hax11tyme.sh
  </template></code-sample>

Manual Installation
-------------------

<code-sample copy-clipboard-button=""><template>
  git clone https://github.com/haxtheweb/hax11ty.git
  cd hax11ty
  npm install
  npm start
</template></code-sample>

This is the fastest way to get up and running. If you instead want to build new sites with this and push them back up to gh-pages rapidly, start by [using this repo as a template](https://github.com/haxtheweb/hax11ty/generate). This will copy the github actions workflows as well so all you need to do is change our repo in the git clone above to yours in order to start on what will easily become a live website!