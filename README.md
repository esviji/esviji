# esviji

## [Nicolas Hoizey](http://gasteroprod.com/)'s silly pet project attempting to develop a cross device/browser game with SVG

This game came out of my mind 20 years ago thanks to the great platform that were [HP 48 calculators](http://en.wikipedia.org/wiki/HP-48_series) (I've had 3 of them). I loved playing Tetris on my HP, but was also eager to develop my own game (a sily habit I have to develop games to discover new platforms/languages), and came with this idea of a kind of mashup of Tetris and Bubble Bobble.

I never found a satisfying name for this game, so I now took "esviji", a word game on "SVG".

## Features

- Vectorial interface, scalled to fit any viewport size without any visual loss
- Multiple interaction options: keyboard, mouse &amp; touch
- Offline support

## Supported platforms

### Known to work on

- Most recent desktop browsers: Firefox, Chrome, Safari, Maxthon (this one's for Matthias)
- Some mobile browsers: iOS Safari, Android stock browser
- [Tell us!](http://twitter.com/esviji)

### Known to NOT work on

- Some desktop browsers: Opera (a bug on score handling)
- Some mobile browsers: Chrome Android
- [Open issues!](https://github.com/nhoizey/esviji/issues?labels=Broken+browser+support&page=1&state=open)

## To do

Look at [the roadmap](https://github.com/nhoizey/esviji/issues/milestones?direction=asc&page=1&sort=due_date).

## Building blocks

- SVG obviously, but with a <del>little</del> huge help from [SVG Web](http://code.google.com/p/svgweb/) on webkit browsers
- JavaScript, with a little bit of jQuery
- [Matthias](http://twitter.com/madsgraphics)'s awesome [SVGEventListener polyfil](https://github.com/madsgraphics/SVGEventListener) for SVG animate events in webkit (once again)
- [Craig Campbell](http://craig.is/)'s [mousetrap](http://craig.is/killing/mice) for keyboard controls
- [mohayonao](http://twitter.com/mohayonao)'s [Timbre.js](https://github.com/mohayonao/timbre) for sounds

## Thanks a lot to…

- [Jérémie](http://twitter.com/JeremiePat) for [inspiration about SVG](http://jeremie.patonnier.net/tag/SVG)'s [power](http://jeremie.patonnier.net/experiences/parisweb2011/animation.svg) and assistance finding great docs in [Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/SVG)
- [Karl](http://twitter.com/karlpro) for his kind assistance on Opera issues (some were real bugs, some were my own mistakes)
- [Anthony](http://twitter.com/rik24d) for his kind assistance on Firefox issues (again, some were real bugs, some where MDN errors, some were my own mistakes)
- [Matthias](http://twitter.com/madsgraphics) for his SVG animate events polyfil


## License

<a rel="license" href="http://creativecommons.org/licenses/by-sa/3.0/"><img alt="Creative Commons License" style="border-width:0" src="http://i.creativecommons.org/l/by-sa/3.0/88x31.png" /></a><br /><span xmlns:dct="http://purl.org/dc/terms/" href="http://purl.org/dc/dcmitype/InteractiveResource" property="dct:title" rel="dct:type">esviji</span> by <a xmlns:cc="http://creativecommons.org/ns#" href="http://esviji.com/" property="cc:attributionName" rel="cc:attributionURL">Nicolas Hoizey</a> is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-sa/3.0/">Creative Commons Attribution-ShareAlike 3.0 Unported License</a>.
