[![Stories in Ready](https://badge.waffle.io/nhoizey/esviji.png?label=ready)](https://waffle.io/nhoizey/esviji)
#esviji

<img src="https://raw2.github.com/nhoizey/esviji/master/src/favicons/favicon-160x160.png" alt="esviji" width="160" height="160" style="float: right" />

A variation around the famous [Puzzle Bobble](http://en.wikipedia.org/wiki/Puzzle_Bobble) game (a.k.a. Bust-a-Move), in which you have to destroy balls and gain points as long as you can!

To know how to play, please run the tutorial available in the setting panel of the game.

<img src="https://raw2.github.com/nhoizey/esviji.com/master/img/screenshots/05-crazy-blocks.png" alt="Crazy blocks" width="150" style="float: right;" />

## Features

- Vectorial interface, scalled to fit any viewport size without any visual loss, optimized for portrait orientation
- Multiple interaction options: keyboard, mouse & touch
- Current game persistence: close your browser and resume your game when you return
- Full off-line support

This game came out of my mind 20 years ago thanks to the great platform that were [HP 48 calculators](http://en.wikipedia.org/wiki/HP-48_series) (I've had 3 of them). I loved playing Puzzle Bobble, Tetris and other casual game on my HP, but was also eager to develop my own game (a sily habit I have to develop games to discover new platforms/languages), and came with this idea of a kind of mashup of Puzzle Bobble and other games.

I never found a satisfying name for this game, so I now took "esviji", a word game on "SVG".

esviji is open source, under MIT licence, feel free to <a href="https://github.com/nhoizey/esviji">fork it on Github</a>, make pull requests and open issues for bugs and improvement ideas.

You can "love" [the palette of balls colors on COLOURlovers](http://www.colourlovers.com/palette/2807157/esviji).

## Supported platforms

### Known to work on

- Most recent desktop browsers: Firefox, Chrome, Safari, Maxthon (this one's for Matthias)
- Some mobile browsers: iOS Safari, Firefox Mobile
- [Tell us!](http://twitter.com/esviji)

### Known to NOT work on

- Some desktop browsers: Opera
- Some mobile browsers: Chrome Android
- [Open issues](https://github.com/nhoizey/esviji/issues?labels=Broken+browser+support&page=1&state=open)
- [Open a new issue!](https://github.com/nhoizey/esviji/issues/new)

## Privacy policy

Aggregated analytics data is collected through Google Analytics and is only used to improve the game and develop new features.

## Building blocks

- JavaScript, with a little bit of jQuery
- [Matthias](http://twitter.com/madsgraphics)'s awesome [SVGEventListener polyfil](https://github.com/madsgraphics/SVGEventListener) for SVG animate events in webkit
- [Craig Campbell](http://craig.is/)'s [mousetrap](http://craig.is/killing/mice) for keyboard controls
- [Marcus Westin](http://twitter.com/marcuswestin)'s [store.js](https://github.com/marcuswestin/store.js) for localStorage wrapper
- [GoldFire Studios](https://twitter.com/GoldFireStudios)'s [Howler.js](https://github.com/goldfire/howler.js) for sounds playing
- [Cédric Pons Polo](https://twitter.com/cedricponspolo)'s awesome sound design. Check his other creations on [Panel Sonore](http://www.panel-sonore.com/)

## Thanks a lot to…

- [Jérémie](http://twitter.com/JeremiePat) for [inspiration about SVG](http://jeremie.patonnier.net/tag/SVG)'s [power](http://jeremie.patonnier.net/experiences/parisweb2011/animation.svg) and assistance finding great docs in [Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/SVG)
- [Karl](http://twitter.com/karlpro) for his kind assistance on Opera issues (some were real bugs, some were my own mistakes)
- [Anthony](http://twitter.com/rik24d) for his kind assistance on Firefox issues (again, some were real bugs, some where MDN errors, some were my own mistakes)
- [Matthias](http://twitter.com/madsgraphics) for his SVG animate events polyfil
- [Vincent](http://twitter.com/htmlzg) for the logo following [Firefox OS app icon design principles](http://www.mozilla.org/en-US/styleguide/products/firefoxos/icons/)

## To do

Look at [the roadmap](https://github.com/nhoizey/esviji/issues/milestones?direction=asc&page=1&sort=completeness).

## Contributing

Feel free to fork, fix and [submit a pull requests](https://github.com/nhoizey/esviji/issues). Alternatively, [open issues](https://github.com/nhoizey/esviji/issues/new) for bugs and feature requests.

[@necolas](https://github.com/necolas) wrote down [some good guidelines for contributing](https://github.com/necolas/issue-guidelines). Please keep these in mind when contributing to this project.

Please use the ```.editorconfig``` file in order to set the right usage of tabs/spaces aso. in your editor. Visit [editorconfig.org](http://editorconfig.org/) for more information.

## License

esviji is released under the MIT License.

Copyright (c) 1992-2013 Nicolas Hoizey <nicolas@hoizey.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

