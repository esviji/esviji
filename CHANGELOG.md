# esviji changelog

## v1.10.x

### 2013-07-04 v1.10.4

- [NEW] Use @codepo8's https://github.com/codepo8/mozVibrate-polyfill to simulate vibrations on devices that don't have a vibrator

### 2013-06-24 v1.10.3

- [FIXED] New (fav)icons matching redesign, thanks to @htmlzg

### 2013-06-22 v1.10.2

- [FIXED] typo in code was breaking everything

### 2013-06-18 v1.10.1

- [FIXED] Destroy animation was broken on latest column

### 2013-06-14 v1.10.0

- [FIXED] endEvent callback was called several times instead of one single on webkit with SVGEventListener polyfil

## v1.9.x

### 2013-05-30 v1.9.3

- [ENHANCEMENT] Howler.js upgraded to v1.1.7

### 2013-05-26 v1.9.2

- [ENHANCEMENT] Show an animation when chosing the position of the ball before launching it

### 2013-05-14 v1.9.1

- [FIXED] No error when using private browsing, which disables localStorage

### 2013-05-02 v1.9.0

- [ENHANCEMENT] Now uses [howler.js](https://github.com/goldfire/howler.js) for sounds
- [NEW] Great sounds created specificaly for esviji by [@cedricponspolo](https://twitter.com/cedricponspolo) of [Panel Sonore](http://www.panel-sonore.com/)

## v1.8.x

### 2013-04-30 v1.8.9

- [FIXED] Prevent default event behavior when chosing the difficulty level

### 2013-04-30 v1.8.8

- [ENHANCEMENT] Add grunt rev to the packaging process for a cleaner cache update

### 2013-04-17 v1.8.7

- [ENHANCEMENT] Store Google Analytics data in localStorage when offline

### 2013-04-16 v1.8.6

- [ENHANCEMENT] Adjusting rules for "Crazy" difficulty level

### 2013-04-16 v1.8.5

- [FIXED] Cursor was still active (and ball could be launched) when pause and game over panel were displayed

### 2013-04-15 v1.8.4

- [ENHANCEMENT] Change sound preference in the pause panel, without leaving/losing your current game
- [ENHANCEMENT] Chose the difficulty when starting a new game, easier than in the settings panel

### 2013-04-12 v1.8.3

- [FIXED] Invalid reuse of pre 1.8.1 high scores

### 2013-04-12 v1.8.2

- [ENHANCEMENT] Select the difficulty level in the highscores panel to see accurate scores

### 2013-04-11 v1.8.1

- [ENHANCEMENT] Don't mix high scores from different difficulty levels

### 2013-04-11 v1.8.0

- [NEW] Several difficulty levels now available — beginner, easy, hard and crazy — with different settings
