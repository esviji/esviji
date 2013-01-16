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

esviji is released under the MIT License.

Copyright (c) 1992 Nicolas Hoizey <nicolas@hoizey.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

