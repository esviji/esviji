// Load dependencies
import $ from 'jquery';
import { Howl, Howler } from 'howler';
import Mousetrap from 'mousetrap';
import store from 'store';
var viewportUnitsBuggyfill = require('viewport-units-buggyfill');

const debug = (message) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('%c' + message, 'colo: blue; font-family: monospace;');
  }
};

const boardToText = function (board, ball = undefined) {
  const rowMax = ESVIJI.settings.board.yMax;
  const columnMax = ESVIJI.settings.board.xMax;
  const items = ['❌', '➖', '🟠', '🟢', '🔵', '🟣', '🟤', '🔴'];
  let textLines = [];
  let textRow;
  for (let row = 1; row <= rowMax; row++) {
    textRow = rowMax - row;
    textLines[textRow] = '';
    for (let column = 1; column <= columnMax; column++) {
      if (board[column] !== undefined && board[column][row] !== undefined) {
        textLines[textRow] += items[board[column][row] + 1];
      } else {
        textLines[textRow] += items[1];
      }
    }
    if (ball !== undefined && row === ESVIJI.settings.turn.posY) {
      textLines[textRow] += items[ball + 1];
    } else {
      textLines[textRow] += items[1];
    }
  }

  return textLines.join('\n');
};

// UA sniff iOS Safari for viewport units issues
// Yes, it's bad to UA sniff…
// Why CriOS? -> http://stackoverflow.com/a/29696509
// Why OPiOS? -> http://stackoverflow.com/questions/3007480/determine-if-user-navigated-from-mobile-safari/29696509#comment55234967_29696509
var iOS = /(iPad|iPhone|iPod)/gi.test(navigator.userAgent);
var iosSafari = iOS && !/(CriOS|OPiOS)/gi.test(navigator.userAgent);
if (iosSafari) {
  // https://github.com/rodneyrehm/viewport-units-buggyfill/issues/35
  viewportUnitsBuggyfill.init({
    force: true,
  });
}

var ESVIJI = {};

if (process.env.NODE_ENV === 'production') {
  ESVIJI.version = $('.version').text();
} else {
  ESVIJI.version = 'development';
}

ESVIJI.settings = {
  // board size and according ball extreme positions
  board: {
    width: 320,
    height: 430,
    xMax: 9,
    yMax: 13,
  },

  // list of available ball 'names'
  balls: ['ball1', 'ball2', 'ball3', 'ball4', 'ball5', 'ball6'],

  // special ids for the game matrix
  emptyId: 0,
  rockId: -1,

  // game info at launch time
  launch: {
    lives: 9,
    score: 0,
    level: 0,
  },

  /**
   * Sets the number of rows for a specific game level
   * @param {integer} level The current level
   */
  levelRows: function levelRows(level) {
    return Math.min(7, 2 + Math.ceil((level + 1) / 2));
  },

  levelColumns: function levelColumns(level) {
    return Math.min(7, 2 + Math.ceil(level / 2));
  },

  levelBalls: function levelBalls(level) {
    return Math.min(6, Math.ceil((level + 1) / 2));
  },

  levelRocks: function levelRocks(level) {
    return Math.max(0, Math.min(15, Math.ceil((level - 10) / 2)));
  },

  points: function points(nbHits, level) {
    return Math.pow(nbHits, 4);
  },

  // One extra life every 100 points
  extraLifePoints: 100,

  // One extra life every time a new level is finished
  extraLifeLevel: 0,

  // Game info at new turn start
  turn: {
    posX: 9,
    dirX: -1,
    posY: 8,
    dirY: 0,
  },

  // animation settings
  durationMove: 0.15,
  durationMorph: 0.5,
};

/**
 * Builds the game engine
 */
ESVIJI.game = (function () {
  // Initial values
  var viewportWidth = 0;
  var viewportHeight = 0;
  var boardWidth;
  var boardHeight;
  var boardOffsetY;
  var drawnCurrentBalls = [];
  var validBalls = [];
  var drawnCurrentBall = null;
  var drawnSpring = null;
  var stackedAnimationToStart = 1;
  var lastStackedAnimation = 0;
  var currentPosX = 0;
  var currentPosY = 0;
  var currentDirX = -1;
  var currentDirY = 0;
  var dragged = false;
  var moveCount = 0;
  var cursorY = 0;
  var cursorMinY = 0;
  var cursorMaxY = 0;
  var maxAvailableBalls = 0;
  var nbBalls = 0;
  var scoreThisTurn = 0;
  var lastHitBall = ESVIJI.settings.rockId;
  var highScores = [];
  var lastGameDate = '';
  var lastGameScore;
  var gameStatus = {};
  var useStored = false;
  var soundEffects;
  var soundAmbiance;

  /**
   * Initializes the game
   */

  function init() {
    window.setTimeout(ESVIJI.game.optimizeViewport, 500);
    optimizeViewport();

    // No vh support test per https://github.com/Modernizr/Modernizr/issues/1805#issuecomment-167754373
    if (
      Modernizr.svg &&
      Modernizr.inlinesvg &&
      Modernizr.smil &&
      Modernizr.cssvwunit &&
      Modernizr.cssvminunit &&
      Modernizr.flexbox
    ) {
      document.querySelector('#description').style.display = 'none';
    } else {
      // Add this message using JS to prevent indexing it in search engines
      var msg =
        '<div class="error"><p><strong>Sorry, your can\'t play…</strong></p>';
      msg += `<p>Your browser doesn't support some Web technologies <strong>esviji</strong> version <em>${ESVIJI.version}</em> requires.</p>`;
      msg += '<p> It lacks support for ';
      var nbMissing = 0;
      var features = {
        svg: {
          feature: 'svg',
          name: 'SVG',
        },
        inlinesvg: {
          feature: 'svg-html5',
          name: 'inline SVG',
        },
        smil: {
          feature: 'svg-smil',
          name: 'SVG SMIL animations',
        },
        cssvwunit: {
          feature: 'viewport-units',
          name: 'vw/vh viewport units',
        },
        cssvminunit: {
          feature: 'viewport-units',
          name: 'vmin viewport unit',
        },
        flexbox: {
          feature: 'flexbox',
          name: 'flexible box layout',
        },
      };

      for (var feature in features) {
        if (!Modernizr[feature]) {
          if (nbMissing > 0) {
            msg += ', ';
          }

          msg +=
            '<a href="http://caniuse.com/#feat=' +
            features[feature].feature +
            '">' +
            features[feature].name +
            '</a>';
          nbMissing++;
        }
      }

      if (nbMissing > 1) {
        msg = msg.replace(/, ([^,]+)$/, ' and $1');
      }

      msg += '.</p>';

      msg +=
        '</div><p>Learn more about this game on <a href="https://esviji.com/">esviji.com</a>.</p>';
      $('#description p.icon').before(msg);
      return;
    }

    if (process.env.NODE_ENV === 'production') {
      // Send version to Google Analytics only in production
      ga('set', 'dimension1', ESVIJI.version);
    }

    if (!store.disabled) {
      highScores = store.get('highScores') || [];
      gameStatus = store.get('gameStatus') || {
        currentBalls: [],
        currentBall: 0,
        level: 0,
        score: 0,
        lives: 0,
        playing: false,
        levelReplay: {
          lostLives: 0,
          level: 0,
          balls: [],
          sequence: [],
        },
        preferences: {
          sound: true,
        },
      };
    }

    cursorMinY = yToSvg(1);
    cursorMaxY = yToSvg(ESVIJI.settings.board.yMax);
    maxAvailableBalls = ESVIJI.settings.balls.length;

    // Deal with localStore content that has been set when there was less data
    if (gameStatus.levelReplay === undefined) {
      // v1.6.7
      gameStatus.levelReplay = {
        lostLives: 0,
        level: 0,
        balls: [],
        sequence: [],
      };
    }

    if (gameStatus.preferences === undefined) {
      // v1.6.8
      gameStatus.preferences = {
        sound: true,
      };
    }

    if (gameStatus.preferences.vibration === undefined) {
      // v1.13.0
      gameStatus.preferences.vibration = true;
    }

    if (
      gameStatus.preferences.difficulty !== undefined &&
      highScores.Crazy !== undefined
    ) {
      // v2.0.0, no more difficulty choice, keep only 'crazy' scores
      gameStatus.preferences.difficulty = undefined;
      highScores = highScores.Crazy;
      storeSet('highScores', highScores);

      // no more vibration
      gameStatus.preferences.vibration = undefined;
    }

    // Available sounds
    soundEffects = new Howl({
      src: ['sounds/effects-sprite.mp3'],
      sprite: {
        soundFall: [0, 204.05895691609976],
        soundHitFloor: [2000, 2000],
        soundHitOtherBallKo: [5000, 468.7528344671206],
        soundHitOtherBallOk: [7000, 500],
        soundHitSameBall: [9000, 1000],
        soundHitWall: [11000, 1835.941043083901],
        soundLevel: [14000, 2947.0068027210878],
        soundLifeDown: [18000, 1000],
        soundLifeUp: [20000, 1000],
        soundThrow: [22000, 797.1201814058943],
      },
      volume: 0.7,
      onload: function () {
        $('body').addClass('soundeffectsloaded');
      },
      onloaderror: function () {
        console.error("Can't load sound effects…");
      },
      onplayerror: function () {
        soundEffects.once('unlock', function () {
          soundEffects.play('soundThrow');
        });
      },
    });

    // soundAmbiance = new Howl({
    //   src: ['sounds/in-game-loop.mp3'],
    //   autoplay: true,
    //   loop: true,
    //   volume: 0.5,
    //   onload: function () {
    //     $('body').addClass('ambiancesoundloaded');
    //   },
    //   onloaderror: function () {
    //     console.error("Can't load ambiance sound…");
    //   },
    // });

    if (gameStatus.preferences.sound) {
      $('#home .sound').addClass('on');
      $('#pause .sound').addClass('on');

      // playSoundEffect('soundThrow');
    }

    initBindings();
    run();
  }

  function storeSet(item, value) {
    if (!store.disabled) {
      store.set(item, value);
    }
  }

  function initBindings() {
    // Home screen buttons
    $('#home .controls .play').bind('click', startPlaying);
    $('#home .controls .scores').bind('click', startScores);
    $('#home .controls .sound').bind('click', toggleSound);
    $('#home .controls .about').bind('click', function (event) {
      event.preventDefault();
      showScreen('about');
    });

    // Play screen buttons
    $('#play .controls .pause').bind('click', function (event) {
      event.preventDefault();
      showScreen('pause');
    });

    // Pause screen buttons
    $('#pause .controls .resume').bind('click', function (event) {
      event.preventDefault();
      showScreen('play');

      // back to the level screen
      ga('set', 'page', '/play/level_' + gameStatus.level);
      ga('send', 'pageview');
    });

    $('#pause .controls .restart').bind('click', function (event) {
      event.preventDefault();
      storeSet('gameStatus', {
        playing: false,
      });

      startPlaying();
    });

    $('#pause .controls .sound').bind('click', toggleSound);
    $('#pause .controls .exit').bind('click', stopPlaying);

    // Game over screen buttons
    $('#gameover .controls .restart').bind('click', function (event) {
      event.preventDefault();
      storeSet('gameStatus', {
        playing: false,
      });
      startPlaying();
    });

    $('#gameover .controls .exit').bind('click', stopPlaying);

    // Scores screen button
    $('#scores .controls .exit').bind('click', function (event) {
      event.preventDefault();
      showScreen('home');
    });

    // About screen buttons
    $('#about .controls .exit').bind('click', function (event) {
      event.preventDefault();
      showScreen('home');
    });
  }

  function toggleSound(event) {
    event.preventDefault();
    if (gameStatus.preferences.sound) {
      gameStatus.preferences.sound = false;
      $('.controls .sound').removeClass('on');
    } else {
      gameStatus.preferences.sound = true;
      $('.controls .sound').addClass('on');
    }

    storeSet('gameStatus', gameStatus);
  }

  function reliableViewportSize() {
    // reliable viewport width: https://gist.github.com/scottjehl/2051999
    var test = document.createElement('div');

    test.style.cssText =
      'position: fixed; top: 0; left: 0; bottom: 0; right: 0;';
    document.documentElement.insertBefore(
      test,
      document.documentElement.firstChild
    );

    var dims = { width: test.offsetWidth, height: test.offsetHeight };

    document.documentElement.removeChild(test);

    return dims;
  }

  function optimizeViewport() {
    var dims = reliableViewportSize();
    var vw = dims.width;
    var vh = dims.height;

    if (viewportWidth != vw || viewportHeight != vh) {
      viewportWidth = vw;
      viewportHeight = vh;
      console.info('Aspect ratio: ' + vw / (vh / 24) + '/24');
    }

    var boardElement = document.getElementById('board');
    var boardStyles = getComputedStyle(boardElement);

    boardWidth = parseInt(boardStyles.width, 10);
    boardHeight = parseInt(boardStyles.height, 10);

    boardOffsetY = viewportHeight - boardHeight;
  }

  function run() {
    if (
      typeof gameStatus.playing === 'undefined' ||
      gameStatus.playing === false
    ) {
      showScreen('home');
    } else {
      useStored = true;
      startPlaying();
    }
  }

  function showScreen(screen) {
    // Remove focus from the button that led to this screen
    $(':focus').trigger('blur');

    if (screen === 'gameover') {
      // Move gameover section to the end, because there's no z-index in SVG, later is above
      $('#gameover').appendTo('body');
    } else {
      if (screen === 'home' && gameStatus.currentScreen === 'gameover') {
        $('#play').attr('aria-hidden', 'true');
      }

      // Hide current screen only if there's one…
      if (gameStatus.currentScreen !== '') {
        $('#' + gameStatus.currentScreen).attr('aria-hidden', 'true');
      }
    }

    gameStatus.currentScreen = screen;

    // Show new screen
    $('#' + screen).attr('aria-hidden', 'false');

    // "Show" current screen in URL
    // history.pushState(null, '/' + screen, (screen === 'home' ? '/' : screen));

    // Google Analytics tracking of activated screen
    // https://developers.google.com/analytics/devguides/collection/analyticsjs/single-page-applications#multiple-hits

    if (screen !== 'play' && screen !== 'gameover') {
      // Only track levels, not generic play screen
      // Don't track Game Over screen from here
      ga('set', 'page', '/' + (screen === 'home' ? '' : screen));
      ga('send', 'pageview');
    }
  }

  function startPlaying(event) {
    if (event !== undefined) {
      event.preventDefault();
    }

    if (!useStored) {
      gameStatus.level = ESVIJI.settings.launch.level;
      gameStatus.score = ESVIJI.settings.launch.score;
      gameStatus.lives = ESVIJI.settings.launch.lives;
      if (drawnCurrentBall !== null) {
        drawnCurrentBall.remove();
      }

      drawnCurrentBall = null;

      // TODO: is this really necessary?
      eraseSpring();
    }

    showScreen('play');
    drawLevel();
    drawScore();
    drawLives();
    nextLevel();
  }

  function stopPlaying(event) {
    if (event !== undefined) {
      event.preventDefault();
    }

    gameStatus.playing = false;
    gameStatus.level = 0;
    gameStatus.score = 0;
    gameStatus.lives = 0;
    eraseBalls();
    if (drawnCurrentBall !== null) {
      drawnCurrentBall.remove();
    }

    eraseSpring();

    storeSet('gameStatus', {
      playing: false,
    });
    run();
  }

  function startScores(event) {
    event.preventDefault();
    showScores();
    showScreen('scores');
  }

  function showScores() {
    var thisone = false;
    $('.highscores li').remove();
    for (let i = 0; i < 10; i++) {
      if (highScores[i] !== undefined && highScores[i].score !== 0) {
        if (lastGameDate === highScores[i].date) {
          thisone = true;
          $('.highscores').append(
            '<li class="thisone">' + highScores[i].score + '</li>'
          );
        } else {
          $('.highscores').append('<li>' + highScores[i].score + '</li>');
        }
      }
    }

    if (!thisone && lastGameDate !== '' && lastGameScore !== undefined) {
      $('.highscores').append('<li>…</li>');
      $('.highscores').append(
        '<li class="tryagain">' + lastGameScore + '</li>'
      );
    }
  }

  function nextLevel() {
    gameStatus.playing = true;
    eraseBalls();
    if (useStored) {
      debug('before reused drawBalls');
      drawBalls();
    } else {
      gameStatus.level++;
      drawLevel();
      $('#play .level').attr('class', 'level changeUp');
      window.setTimeout(function () {
        $('#play .level').attr('class', 'level');
      }, 1000);

      debug('before initBalls');
      initBalls();
      debug('before drawBalls');
      drawBalls();
      debug('before getValidBalls');
      getValidBalls();
      gameStatus.currentBall =
        validBalls[Math.floor(Math.random() * validBalls.length)];
    }

    // TODO: remove 'null' values from gameStatus.currentBalls

    // clone the array (https://twitter.com/naholyr/status/311112698421198848)
    var replayBalls = gameStatus.currentBalls.map(function (a) {
      return a === null ? null : a.slice();
    });

    gameStatus.levelReplay = {
      lostLives: 0,
      level: gameStatus.level,
      balls: replayBalls,
      sequence: [],
    };

    // Track levels with Google Analytics
    ga('set', 'page', '/play/level_' + gameStatus.level);
    ga('send', 'pageview');

    playSoundEffect('soundLevel');

    debug("let's start the new level");
    startNewTurn();
  }

  function startNewTurn() {
    debug('starting a new turn');
    currentPosX = ESVIJI.settings.turn.posX;
    currentDirX = ESVIJI.settings.turn.dirX;
    currentPosY = ESVIJI.settings.turn.posY;
    currentDirY = ESVIJI.settings.turn.dirY;
    scoreThisTurn = 0;
    lastHitBall = ESVIJI.settings.rockId;
    getValidBalls();

    debug({ validBalls });
    debug({ drawnCurrentBalls });

    stackedAnimationToStart = 1;
    lastStackedAnimation = 0;

    if (validBalls.length === 0) {
      // no more valid ball, end of the turn
      // TODO: don't even draw it, maybe
      if (drawnCurrentBall !== null) {
        drawnCurrentBall.remove();
        drawnCurrentBall = null;
      }

      eraseSpring();

      if (ESVIJI.settings.extraLifeLevel > 0) {
        gameStatus.lives += ESVIJI.settings.extraLifeLevel;
        drawLives();
        $('#play .lives').attr('class', 'lives changeUp');
        window.setTimeout(function () {
          $('#play .lives').attr('class', 'lives');
        }, 1000);
      }

      if (gameStatus.levelReplay.lostLives === 0) {
        storeOnFirebase(gameStatus.levelReplay);
      }

      makeEverythingFall();
    } else {
      if (validBalls.indexOf(gameStatus.currentBall) == -1) {
        var notPlayableBall = drawBall(
          xToSvg(ESVIJI.settings.turn.posX),
          yToSvg(ESVIJI.settings.turn.posY),
          ESVIJI.settings.balls[gameStatus.currentBall - 1],
          'notplayable'
        );
        var notPlayableAnimMain = svgAnimate({
          attributeName: 'opacity',
          from: '0',
          to: '1',
          begin: 'indefinite',
          dur: '0.5s',
          repeatCount: '4',
          fill: 'freeze',
          id: 'notPlayableAnim',
        });
        notPlayableAnimMain.addEventListener(
          'beginEvent',
          function () {
            playSoundEffect('error');
          },
          false
        );

        notPlayableAnimMain.addEventListener('endEvent', notPlayableEnd, false);
        notPlayableBall.append(notPlayableAnimMain);

        // TODO: create animation just once?
        $('[data-valid=true]').each(function () {
          var that = $(this);
          var notPlayableAnim = svgAnimate({
            attributeName: 'opacity',
            from: '0',
            to: '1',
            begin: 'notPlayableAnim.begin',
            dur: '0.5s',
            repeatCount: '4',
            fill: 'freeze',
          });
          that.append(notPlayableAnim);
        });

        notPlayableAnimMain.beginElement();
      } else {
        storeSet('gameStatus', gameStatus);
        useStored = false;
        if (gameStatus.playing) {
          // draw ball and spring
          if (drawnCurrentBall !== null && drawnCurrentBall !== undefined) {
            drawnCurrentBall.remove();
          }

          eraseSpring();

          drawnCurrentBall = drawBall(
            xToSvg(currentPosX),
            yToSvg(currentPosY),
            ESVIJI.settings.balls[gameStatus.currentBall - 1],
            'playable'
          );
          drawnCurrentBall.attr({
            class: 'throwable',
          });
          drawnSpring = drawSpring(yToSvg(currentPosY));
          drawnSpring.attr({
            class: 'throwable',
          });

          // bind events
          $('#play .playzone').on('mousedown touchstart', cursorStart);
          $('#play .playzone').on('mousemove touchmove', cursorMove);
          $('#play .playzone').on('mouseup touchend', cursorEnd);
          $('#play .playzone').on('touchcancel', startNewTurn);
          Mousetrap.bind('up', keyUp);
          Mousetrap.bind('down', keyDown);
          Mousetrap.bind(['enter', 'space'], keyEnter);
          Mousetrap.bind('esc', startNewTurn);
          Mousetrap.bind('p', function () {
            showScreen('pause');
          });
        }
      }
    }
  }

  function storeOnFirebase(replay) {
    var incoming = new Firebase(
      'https://fiery-heat-4665.firebaseio.com/incoming'
    );

    incoming.on('child_added', function (snapshot) {
      // console.info('Level stored on Firebase.');
    });

    delete replay.lostLives;
    incoming.push(replay);
  }

  function notPlayableEnd() {
    $('#notplayable').remove();
    $('[data-valid=true] animate').remove();
    removeLife();
    gameStatus.currentBall =
      validBalls[Math.floor(Math.random() * validBalls.length)];
    startNewTurn();
  }

  function keyUp(event) {
    cursorY = Math.min(
      Math.max(yToSvg(currentPosY + 1), cursorMaxY),
      cursorMinY
    );
    currentPosY = svgToY(cursorY);
    drawnCurrentBall.attr({
      y: cursorY,
    });
    drawnSpring.attr({
      y: cursorY,
    });
  }

  function keyDown(event) {
    cursorY = Math.min(
      Math.max(yToSvg(currentPosY - 1), cursorMaxY),
      cursorMinY
    );
    currentPosY = svgToY(cursorY);
    drawnCurrentBall.attr({
      y: cursorY,
    });
    drawnSpring.attr({
      y: cursorY,
    });
  }

  function keyEnter(event) {
    Mousetrap.unbind('up');
    Mousetrap.unbind('down');
    Mousetrap.unbind(['enter', 'space']);
    $('#play .playzone').off('mousedown touchstart');
    $('#play .playzone').off('mousemove touchmove');
    $('#play .playzone').off('mouseup touchend');
    drawnCurrentBall.attr({
      class: '',
    });

    moveCount = 0;
    window.oldPosX = currentPosX;
    window.oldPosY = currentPosY;

    eraseSpring();

    cursorY = yToSvg(currentPosY);
    drawnCurrentBall.attr({
      y: cursorY,
    });
    currentPosY = svgToY(cursorY);

    gameStatus.levelReplay.sequence.push({
      ball: gameStatus.currentBall,
      position: currentPosY,
    });

    playSoundEffect('soundThrow');
    playUserChoice();
  }

  function cursorStart(event) {
    event.preventDefault();
    dragged = true;
    if (event.originalEvent.touches && event.originalEvent.touches.length) {
      event = event.originalEvent.touches[0];
    } else if (
      event.originalEvent.changedTouches &&
      event.originalEvent.changedTouches.length
    ) {
      event = event.originalEvent.changedTouches[0];
    }

    cursorY = Math.min(
      Math.max(pixelsToSvgY(event.pageY) - 16, cursorMaxY),
      cursorMinY
    );
    drawnCurrentBall.attr({
      y: cursorY,
    });
    drawnSpring.attr({
      y: cursorY,
    });
  }

  function cursorMove(event) {
    event.preventDefault();
    if (event.originalEvent.touches && event.originalEvent.touches.length) {
      event = event.originalEvent.touches[0];
    } else if (
      event.originalEvent.changedTouches &&
      event.originalEvent.changedTouches.length
    ) {
      event = event.originalEvent.changedTouches[0];
    }

    // event.pageY seems to be returning weird values when movement starts
    cursorY = Math.min(
      Math.max(pixelsToSvgY(event.pageY) - 16, cursorMaxY),
      cursorMinY
    );
    currentPosY = svgToY(cursorY);
    drawnCurrentBall.attr({
      y: cursorY,
    });
    drawnSpring.attr({
      y: cursorY,
    });
  }

  function cursorEnd(event) {
    event.preventDefault();
    if (dragged) {
      if (event.originalEvent.touches && event.originalEvent.touches.length) {
        event = event.originalEvent.touches[0];
      } else if (
        event.originalEvent.changedTouches &&
        event.originalEvent.changedTouches.length
      ) {
        event = event.originalEvent.changedTouches[0];
      }

      dragged = false;
      Mousetrap.unbind('up');
      Mousetrap.unbind('down');
      Mousetrap.unbind(['enter', 'space']);
      $('#play .playzone').off('mousedown touchstart');
      $('#play .playzone').off('mousemove touchmove');
      $('#play .playzone').off('mouseup touchend');
      cursorY = Math.min(
        Math.max(pixelsToSvgY(event.pageY) - 16, cursorMaxY),
        cursorMinY
      );
      currentPosY = svgToY(cursorY);
      drawnCurrentBall.attr({
        y: yToSvg(currentPosY),
        class: '',
      });

      moveCount = 0;
      window.oldPosX = currentPosX;
      window.oldPosY = currentPosY;

      eraseSpring();

      gameStatus.levelReplay.sequence.push({
        ball: gameStatus.currentBall,
        position: currentPosY,
      });

      playSoundEffect('soundThrow');
      playUserChoice();
    }
  }

  function playUserChoice() {
    moveCount++;
    if (currentPosY == 1 && currentDirY == -1) {
      // Against the floor, no more possible move
      if (window.oldPosY != 1) {
        animStackMove(
          drawnCurrentBall,
          (window.oldPosY - currentPosY) * ESVIJI.settings.durationMove,
          'y',
          yToSvg(window.oldPosY),
          yToSvg(currentPosY)
        );
      }

      $('#anim' + lastStackedAnimation)[0].addEventListener(
        'beginEvent',
        function (event) {
          playSoundEffect('soundHitFloor');
        }
      );

      endOfMove();
    } else {
      if (currentPosX == 1 && currentDirX == -1) {
        // Against the left wall, should now go down
        currentDirX = 0;
        currentDirY = -1;
        animStackMove(
          drawnCurrentBall,
          (window.oldPosX - currentPosX) * ESVIJI.settings.durationMove,
          'x',
          xToSvg(window.oldPosX),
          xToSvg(currentPosX)
        );
        $('#anim' + lastStackedAnimation)[0].addEventListener(
          'endEvent',
          function (event) {
            playSoundEffect('soundHitWall');
          },
          false
        );

        window.oldPosX = currentPosX;
        playUserChoice();
      } else {
        // Neither floor nor wall, so what is it?
        let nextBall =
          gameStatus.currentBalls[currentPosX + currentDirX][
            currentPosY + currentDirY
          ];
        switch (nextBall) {
          case ESVIJI.settings.rockId:
            // A rock...
            if (currentDirX == -1) {
              // ...at our left, should now go down
              currentDirX = 0;
              currentDirY = -1;
              animStackMove(
                drawnCurrentBall,
                (window.oldPosX - currentPosX) * ESVIJI.settings.durationMove,
                'x',
                xToSvg(window.oldPosX),
                xToSvg(currentPosX)
              );
              window.oldPosX = currentPosX;
              $('#anim' + lastStackedAnimation)[0].addEventListener(
                'endEvent',
                function (event) {
                  playSoundEffect('soundHitWall');
                },
                false
              );

              playUserChoice();
            } else {
              // ...under us, no more possible move
              if (window.oldPosY != currentPosY) {
                animStackMove(
                  drawnCurrentBall,
                  (window.oldPosY - currentPosY) * ESVIJI.settings.durationMove,
                  'y',
                  yToSvg(window.oldPosY),
                  yToSvg(currentPosY)
                );
              }

              $('#anim' + lastStackedAnimation)[0].addEventListener(
                'endEvent',
                function (event) {
                  playSoundEffect('soundHitFloor');
                },
                false
              );

              endOfMove();
            }

            break;

          case ESVIJI.settings.emptyId:
            // Nothing can stop us
            currentPosX += currentDirX;
            currentPosY += currentDirY;
            playUserChoice();
            break;

          case gameStatus.currentBall:
            // Same ball, let's destroy it!
            let currentPosXBefore = currentPosX;
            let currentPosYBefore = currentPosY;
            currentPosX += currentDirX;
            currentPosY += currentDirY;
            gameStatus.currentBalls[currentPosX][currentPosY] =
              ESVIJI.settings.emptyId;
            if (currentPosXBefore != window.oldPosX) {
              animStackMove(
                drawnCurrentBall,
                (window.oldPosX - currentPosXBefore) *
                  ESVIJI.settings.durationMove,
                'x',
                xToSvg(window.oldPosX),
                xToSvg(currentPosXBefore)
              );
              window.oldPosX = currentPosXBefore;
            } else if (currentPosYBefore != window.oldPosY) {
              animStackMove(
                drawnCurrentBall,
                (window.oldPosY - currentPosYBefore) *
                  ESVIJI.settings.durationMove,
                'y',
                yToSvg(window.oldPosY),
                yToSvg(currentPosYBefore)
              );
              window.oldPosY = currentPosYBefore;
            }

            animStackDestroy(drawnCurrentBalls[currentPosX][currentPosY]);
            scoreThisTurn++;
            playSoundEffect('soundHitSameBall');
            playUserChoice();
            break;

          default:
            lastHitBall = nextBall;
            if (currentPosX != window.oldPosX) {
              animStackMove(
                drawnCurrentBall,
                (window.oldPosX - currentPosX) * ESVIJI.settings.durationMove,
                'x',
                xToSvg(window.oldPosX),
                xToSvg(currentPosX)
              );
            } else if (currentPosY != window.oldPosY) {
              animStackMove(
                drawnCurrentBall,
                (window.oldPosY - currentPosY) * ESVIJI.settings.durationMove,
                'y',
                yToSvg(window.oldPosY),
                yToSvg(currentPosY)
              );
            }

            if (scoreThisTurn > 0) {
              gameStatus.currentBall = nextBall;
              if (currentPosX != window.oldPosX) {
                animStackMorph(
                  drawnCurrentBall,
                  nextBall,
                  xToSvg(currentPosX),
                  yToSvg(currentPosY),
                  'x',
                  xToSvg(currentPosX),
                  xToSvg(currentPosX + currentDirX)
                );
              } else {
                animStackMorph(
                  drawnCurrentBall,
                  nextBall,
                  xToSvg(currentPosX),
                  yToSvg(currentPosY),
                  'y',
                  yToSvg(currentPosY),
                  yToSvg(currentPosY + currentDirY)
                );
              }
            }

            endOfMove();
        }
      }
    }
  }

  function endOfTurn() {
    if (scoreThisTurn === 0) {
      if (lastHitBall != ESVIJI.settings.rockId) {
        removeLife();
      }
    } else {
      addScore(scoreThisTurn);
    }

    stackedAnimationToStart = lastStackedAnimation + 1;
    startNewTurn();
  }

  function svgAnimate(settings, type) {
    var anim = document.createElementNS(
      'http://www.w3.org/2000/svg',
      type || 'animate'
    );
    anim.setAttributeNS(null, 'attributeType', 'xml');
    for (var key in settings) {
      anim.setAttributeNS(null, key, settings[key]);
    }

    return anim;
  }

  function svgAnimateTransform(settings) {
    return svgAnimate(settings, 'animateTransform');
  }

  function animStackMove(ball, duration, attribute, from, to, begin) {
    if (begin === undefined) {
      if (lastStackedAnimation === stackedAnimationToStart - 1) {
        begin = 'indefinite';
      } else {
        begin = 'anim' + lastStackedAnimation + '.end';
      }
    }

    lastStackedAnimation++;

    let anim = svgAnimate({
      attributeName: attribute,
      from: from,
      to: to,
      begin: begin,
      dur: duration + 's',
      fill: 'freeze',
      id: 'anim' + lastStackedAnimation,
    });
    anim.attribute = attribute;
    anim.attributeTo = to;
    anim.addEventListener(
      'endEvent',
      function (event) {
        // Set new attribute value at the end of the animation
        $(event.currentTarget.parentElement).attr(
          event.currentTarget.attribute,
          event.currentTarget.attributeTo
        );

        // Remove the animation
        $(event.currentTarget).remove();
      },
      false
    );

    ball.append(anim);
  }

  function animStackMorph(ballFrom, ballToId, x, y, attribute, from, to) {
    var ballTo = svgUse('ball' + ballToId, 'morph');
    ballTo.attr({
      x: x,
      y: y,
      opacity: 0,
    });
    $('#board').append(ballTo);

    // opacity from
    let animOpacityFrom = svgAnimate({
      attributeName: 'opacity',
      to: '0',
      begin: 'anim' + lastStackedAnimation + '.end',
      dur: ESVIJI.settings.durationMorph + 's',
      fill: 'freeze',
      id: 'anim' + (lastStackedAnimation + 1),
    });
    ballFrom.append(animOpacityFrom);

    // move
    let animMoveFrom = svgAnimate({
      attributeName: attribute,
      from: from,
      to: to,
      begin: 'anim' + lastStackedAnimation + '.end',
      dur: ESVIJI.settings.durationMorph + 's',
      fill: 'freeze',
      id: 'anim' + (lastStackedAnimation + 2),
    });
    ballFrom.append(animMoveFrom);

    // opacity to
    let animOpacityTo = svgAnimate({
      attributeName: 'opacity',
      to: '1',
      begin: 'anim' + lastStackedAnimation + '.end',
      dur: ESVIJI.settings.durationMorph + 's',
      fill: 'freeze',
      id: 'anim' + (lastStackedAnimation + 3),
    });
    ballTo.append(animOpacityTo);

    // move
    let animMoveTo = svgAnimate({
      attributeName: attribute,
      from: from,
      to: to,
      begin: 'anim' + lastStackedAnimation + '.end',
      dur: ESVIJI.settings.durationMorph + 's',
      fill: 'freeze',
      id: 'anim' + (lastStackedAnimation + 4),
    });
    animMoveTo.addEventListener(
      'beginEvent',
      function (event) {
        playSoundEffect('soundHitOtherBallOk');
      },
      false
    );

    ballTo.append(animMoveTo);

    lastStackedAnimation += 4;
  }

  function animStackDestroy(ball, begin) {
    begin =
      begin ||
      (lastStackedAnimation === 0
        ? 'indefinite'
        : 'anim' + lastStackedAnimation + '.end');

    // rotate
    var centerX = parseInt(ball.attr('x'), 10) + 16;
    var centerY = parseInt(ball.attr('y'), 10) + 16;
    var animRotate = svgAnimateTransform({
      attributeName: 'transform',
      type: 'rotate',
      from: '0 ' + centerX + ' ' + centerY,
      to: '360 ' + centerX + ' ' + centerY,
      begin: begin,
      dur: ESVIJI.settings.durationMove * 2 + 's',
      fill: 'freeze',
      id: 'anim' + (lastStackedAnimation + 1),
    });
    animRotate.addEventListener(
      'beginEvent',
      function (event) {
        playSoundEffect('soundHitSameBall');
      },
      false
    );

    ball.append(animRotate);

    // opacity
    var animOpacity = svgAnimate({
      attributeName: 'opacity',
      to: '0',
      begin: 'anim' + (lastStackedAnimation + 1) + '.begin',
      dur: ESVIJI.settings.durationMove * 2 + 's',
      fill: 'freeze',
      id: 'anim' + (lastStackedAnimation + 2),
    });
    animOpacity.addEventListener(
      'endEvent',
      function (event) {
        // Remove the ball after the animation
        $(event.currentTarget.parentElement).remove();
      },
      false
    );

    ball.append(animOpacity);

    lastStackedAnimation += 2;
  }

  function endOfMove() {
    $('#anim' + lastStackedAnimation)[0].addEventListener('endEvent', function (
      event
    ) {
      drawnCurrentBall.remove();
      $('#morph').remove();
      if (scoreThisTurn === 0) {
        playSoundEffect('soundHitOtherBallKo');
      }
    });

    makeBallsFall();
  }

  function makeBallsFall() {
    let aboveBalls;
    let lastStackedAnimationBeforeFall = lastStackedAnimation;
    for (var x = 1; x <= 7; x++) {
      aboveBalls = 0;
      for (var y = 1; y <= 6; y++) {
        // No need to check if there is a hole in the top line, no ball upper to make fall
        if (gameStatus.currentBalls[x][y] === ESVIJI.settings.emptyId) {
          // There's a hole, let's see if there are balls above
          for (var z = y + 1; z <= 7; z++) {
            switch (gameStatus.currentBalls[x][z]) {
              case ESVIJI.settings.rockId:
                // It's a rock, we can bypass it
                y = z;
                z = 8;
                break;

              case ESVIJI.settings.emptyId:
                // It's empty
                if (z === 7) {
                  // Only empty places, no need to test further this column
                  y = 7;
                }

                break;

              default:
                // Neither rock nor empty, so there's a ball
                aboveBalls++;
                gameStatus.currentBalls[x][y] = gameStatus.currentBalls[x][z];
                drawnCurrentBalls[x][y] = drawnCurrentBalls[x][z];
                for (var a = y + 1; a <= z; a++) {
                  gameStatus.currentBalls[x][a] = ESVIJI.settings.emptyId;
                  drawnCurrentBalls[x][a] = null;
                }

                let dur = ESVIJI.settings.durationMove * (z - y);

                // Follow through and overlapping action:
                // http://uxdesign.smashingmagazine.com/2012/10/30/motion-animation-new-mobile-ux-design-material/
                dur = dur * (1 + aboveBalls / 3);

                // TODO: add an easing to the fall animation
                animStackMove(
                  drawnCurrentBalls[x][y],
                  dur,
                  'y',
                  yToSvg(z),
                  yToSvg(y),
                  'anim' + lastStackedAnimationBeforeFall + '.end'
                );

                // TODO: make the sound later as for piles of falling balls
                $('#anim' + lastStackedAnimation)[0].addEventListener(
                  'beginEvent',
                  function (event) {
                    playSoundEffect('soundFall');
                  }
                );

                // Let's try again to see if there are new balls above that have to fall
                y = 1;
                z = 8;
            }
          }
        }
      }
    }

    if (lastStackedAnimation >= stackedAnimationToStart) {
      $('#anim' + lastStackedAnimation)[0].addEventListener(
        'endEvent',
        function (event) {
          endOfTurn();
        },
        false
      );

      // Launch the animation
      $('#anim' + stackedAnimationToStart)[0].beginElement();
    } else {
      endOfTurn();
    }
  }

  function makeEverythingFall() {
    var ballsUnder;
    let dur;

    stackedAnimationToStart = 1;
    lastStackedAnimation = 0;

    for (let x = 1; x <= 7; x++) {
      ballsUnder = 0;
      for (let y = 1; y <= 7; y++) {
        if (gameStatus.currentBalls[x][y] != ESVIJI.settings.emptyId) {
          dur = ESVIJI.settings.durationMove * (1 + ballsUnder / 3);
          if (lastStackedAnimation === 0) {
            animStackMove(
              drawnCurrentBalls[x][y],
              dur * 7,
              'y',
              yToSvg(y),
              yToSvg(y - 7)
            );
          } else {
            animStackMove(
              drawnCurrentBalls[x][y],
              dur * 7,
              'y',
              yToSvg(y),
              yToSvg(y - 7),
              'anim' + stackedAnimationToStart + '.begin'
            );
          }

          drawnCurrentBalls[x][y] = ESVIJI.settings.emptyId;
          ballsUnder++;
        } else {
          ballsUnder = 0;
        }
      }
    }

    if (lastStackedAnimation >= stackedAnimationToStart) {
      $('#anim' + lastStackedAnimation)[0].addEventListener(
        'endEvent',
        function (event) {
          nextLevel();
        },
        false
      );

      $('#anim' + stackedAnimationToStart)[0].beginElement();
    } else {
      nextLevel();
    }
  }

  function initBalls(thisLevel) {
    thisLevel = thisLevel || gameStatus.level;
    nbBalls = ESVIJI.settings.levelBalls(thisLevel);
    gameStatus.currentBalls = [];

    for (let x = 1; x <= ESVIJI.settings.board.xMax; x++) {
      gameStatus.currentBalls[x] = [];
      for (let y = 1; y <= ESVIJI.settings.board.yMax; y++) {
        if (y - 7 > x) {
          // put the 'stair' rocks
          gameStatus.currentBalls[x][y] = ESVIJI.settings.rockId;
        } else {
          if (
            x <= ESVIJI.settings.levelColumns(thisLevel) &&
            y <= ESVIJI.settings.levelRows(thisLevel)
          ) {
            // a ball
            gameStatus.currentBalls[x][y] =
              1 + Math.floor(Math.random() * nbBalls);
          } else {
            // empty
            gameStatus.currentBalls[x][y] = ESVIJI.settings.emptyId;
          }
        }
      }
    }

    // add rocks
    let nbRocks = ESVIJI.settings.levelRocks(thisLevel);
    let positionedRocks = 0;
    let rockX;
    let rockY;
    while (positionedRocks < nbRocks) {
      rockX =
        1 + Math.floor(Math.random() * ESVIJI.settings.levelRows(thisLevel));
      rockY =
        1 + Math.floor(Math.random() * ESVIJI.settings.levelColumns(thisLevel));
      if (gameStatus.currentBalls[rockX][rockY] !== ESVIJI.settings.rockId) {
        gameStatus.currentBalls[rockX][rockY] = ESVIJI.settings.rockId;
        positionedRocks++;
      }
    }
  }

  function drawBall(x, y, ballType, ballId) {
    var ball = svgUse(ballType, ballId);

    ball.attr({
      x: x,
      y: y,
    });
    $('#board').append(ball);

    return ball;
  }

  function drawSpring(y) {
    var spring = svgUse('spring', 'playableSpring');

    spring.attr({
      // TODO: replace magic value with computation
      x: 278,
      y: y,
    });
    $('#board').append(spring);

    return spring;
  }

  function eraseSpring() {
    $('#playableSpring').remove();
    drawnSpring = null;
  }

  function svgUse(refId, useId) {
    var use = $(document.createElementNS('http://www.w3.org/2000/svg', 'use'));
    if (useId !== undefined) {
      use.attr({
        id: useId,
      });
    }

    var ref = $('#' + refId);
    if ($(ref).attr('width') !== undefined) {
      use.attr({
        width: $(ref).attr('width'),
      });
    }

    if ($(ref).attr('height') !== undefined) {
      use.attr({
        height: $(ref).attr('height'),
      });
    }

    use
      .get(0)
      .setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + refId);
    return use;
  }

  function drawBalls() {
    drawnCurrentBalls = [];
    for (let x = 1; x <= 7; x++) {
      drawnCurrentBalls[x] = [];
      for (let y = 1; y <= 7; y++) {
        if (gameStatus.currentBalls[x][y] == ESVIJI.settings.emptyId) {
          drawnCurrentBalls[x][y] = null;
        } else {
          let ballX = xToSvg(x);
          let ballY = yToSvg(y);
          if (gameStatus.currentBalls[x][y] === ESVIJI.settings.rockId) {
            drawnCurrentBalls[x][y] = drawBall(ballX, ballY, 'rock');
          } else {
            drawnCurrentBalls[x][y] = drawBall(
              ballX,
              ballY,
              ESVIJI.settings.balls[gameStatus.currentBalls[x][y] - 1]
            );
          }
        }
      }
    }
  }

  function eraseBalls() {
    $('#play use').remove();
  }

  function getValidBalls() {
    var x;
    var y;
    var dirX;
    var dirY;
    var found;

    validBalls = [];

    for (let yStart = 1; yStart <= 13; yStart++) {
      x = 10;
      y = yStart;
      dirX = -1;
      dirY = 0;
      found = false;
      while (!found) {
        if (y == 1 && dirY == -1) {
          found = true;
        } else {
          if (x == 1 && dirX == -1) {
            dirX = 0;
            dirY = -1;
          } else {
            let nextBall = gameStatus.currentBalls[x + dirX][y + dirY];
            if (nextBall == ESVIJI.settings.rockId) {
              if (dirX == -1) {
                dirX = 0;
                dirY = -1;
              } else {
                found = true;
              }
            } else {
              if (nextBall == ESVIJI.settings.emptyId) {
                x += dirX;
                y += dirY;
              } else {
                drawnCurrentBalls[x + dirX][y + dirY].attr(
                  'data-valid',
                  'true'
                );
                if (validBalls.indexOf(nextBall) == -1) {
                  validBalls.push(nextBall);
                }

                found = true;
              }
            }
          }
        }
      }
    }
  }

  function gameOver() {
    var l = highScores.length;
    var positioned = false;
    var message = 'This is your score';

    // Google Analytics tracking of level and score at the end of the game
    ga('set', 'dimension2', gameStatus.level);
    ga('set', 'dimension3', gameStatus.score);
    ga('set', 'page', '/gameover');
    ga('send', 'pageview');

    lastGameDate = Date();
    lastGameScore = gameStatus.score;

    if (l === 0) {
      message = 'This is your first score, play again!';
      highScores = [{ score: lastGameScore, date: lastGameDate }];
    } else {
      for (let i = 0; i < l; i++) {
        if (!positioned && highScores[i].score <= gameStatus.score) {
          highScores.splice(i, 0, { score: lastGameScore, date: lastGameDate });
          highScores = highScores.slice(0, 10);
          positioned = true;

          if (i === 0) {
            message = 'Congrats, this is your best score!';
          } else {
            message = 'Nice score! But not your best… ;-)';
          }

          break;
        }
      }

      if (!positioned && l < 10) {
        highScores.push({ score: lastGameScore, date: lastGameDate });
        message = 'Nice score, but can you do better?';
      }
    }

    storeSet('highScores', highScores);
    gameStatus.playing = false;
    storeSet('gameStatus', {
      playing: false,
    });

    $('#gameover .message').text(message);
    $('#gameover .score').text(gameStatus.score);

    showScreen('gameover');
  }

  function removeLife() {
    gameStatus.lives--;
    gameStatus.levelLostLives++;
    playSoundEffect('soundLifeDown');
    drawLives();
    $('#play .lives').attr('class', 'lives changeDown');
    window.setTimeout(function () {
      $('#play .lives').attr('class', 'lives');
    }, 1000);

    if (gameStatus.lives === 0) {
      gameOver();
    }
  }

  function addLives(nbLives) {
    gameStatus.lives += nbLives;
    playSoundEffect('soundLifeUp');
    drawLives();
    $('#play .lives').attr('class', 'lives changeUp');
    window.setTimeout(function () {
      $('#play .lives').attr('class', 'lives');
    }, 1000);
  }

  function addScore(scoreToAdd) {
    let oldScore = gameStatus.score;
    gameStatus.score += ESVIJI.settings.points(scoreToAdd, gameStatus.level);
    increaseScore();
    $('#play .score').attr('class', 'score changeUp');
    window.setTimeout(function () {
      $('#play .score').attr('class', 'score');
    }, 1000);

    let hundreds =
      Math.floor(gameStatus.score / ESVIJI.settings.extraLifePoints) -
      Math.floor(oldScore / ESVIJI.settings.extraLifePoints);
    if (hundreds > 0) {
      addLives(hundreds);
    }
  }

  function increaseScore() {
    let currentDrawnScore = parseInt($('#play .score').text(), 10);
    if (currentDrawnScore < gameStatus.score) {
      $('#play .score').text(
        currentDrawnScore +
          Math.ceil((gameStatus.score - currentDrawnScore) / 3)
      );
      window.setTimeout(increaseScore, 100);
    }
  }

  function drawScore() {
    $('#play .score').text(gameStatus.score);
  }

  function drawLevel() {
    $('#play .level').text(gameStatus.level);
  }

  function drawLives() {
    $('#play .lives').text(gameStatus.lives);
  }

  function xToSvg(x) {
    return (x - 1) * 32 + 6;
  }

  function yToSvg(y) {
    return ESVIJI.settings.board.height - 32 * y - 6;
  }

  function svgToX(coordX) {
    return (coordX - 6) / 32 + 1;
  }

  function svgToY(coordY) {
    return Math.round((ESVIJI.settings.board.height - coordY - 6) / 32);
  }

  function pixelsToSvgY(coordY) {
    return (
      ((coordY - boardOffsetY) * ESVIJI.settings.board.height) / boardHeight
    );
  }

  function playSoundEffect(type) {
    if (gameStatus.preferences.sound) {
      soundEffects.play(type);
    }
  }

  return {
    init: init,
    optimizeViewport: optimizeViewport,
  };
})();

document.addEventListener(
  'DOMContentLoaded',
  function (event) {
    event.preventDefault();
    ESVIJI.game.init();
  },
  false
);

// Optimize viewport and board sizes after resize and orientation change
window.addEventListener('resize', function (event) {
  event.preventDefault();
  window.setTimeout(ESVIJI.game.optimizeViewport, 500);
});

window.addEventListener('orientationchange', function (event) {
  event.preventDefault();
  window.setTimeout(ESVIJI.game.optimizeViewport, 500);
});
