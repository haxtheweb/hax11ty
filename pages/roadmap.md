<p>The goal of HAX11ty is to combine the best of HAX / HAXcms with the best of 11ty. To that end we seek to produce the following workflow (things done first, followed by things needed):</p>
<h3>Working / exists currently</h3>
<ul>
    <li>11ty static site publishing workflow</li>
    <li>Abstract content files / settings / structure of 11ty away as much as possible so user deals only with content files</li>
    <li>CI / workflow / gh-actions routine automatically setup</li>
    <li>Interface with the HAXcms data structure / automatically generate site.json files</li>
</ul>
<h3>Things needed</h3>
<ul>
    <li>Turn 11ty abstraction (which mirrors HAXcms data structure) into a stand alone npm package / tooling</li>
    <li>Get the NodeJS based version of HAXcms wired up to hax11ty to allow for full HAXcms editing tools / endpoints</li>
    <li>Allow inclusion of custom assets (which then includes custom theme development) just like HAXcms sites allow</li>
    <li>Docker / containerized workflows</li>
</ul>
