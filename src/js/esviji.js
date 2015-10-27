// ## Create the main object

var ESVIJI = {};

// ## Add default settings

ESVIJI.settings = {
  version: '%VERSION%',

  // board size and according ball extreme positions
  board: {
    width: 320,
    height: 430,
    xMax: 9,
    yMax: 13,
  },

  // list of available ball 'names'
  balls: ['ball1', 'ball2', 'ball3', 'ball4', 'ball5', 'ball6'],

  // list of available rock 'names' (only one for now)
  rocks: ['rock'],

  // special ids for the game matrix
  emptyId: 0,
  rockId: -1,

  // game info at launch time
  launch: {
    lives: 9,
    score: 0,
    level: 0,
  },

  // settings based on levels
  levelRows: function levelRows(level) {
    return Math.min(7, 2 + level);
  },

  levelColumns: function levelColumns(level) {
    return Math.min(7, 2 + level);
  },

  levelBalls: function levelBalls(level) {
    return Math.min(6, 1 + level);
  },

  levelRocks: function levelRocks(level) {
    return Math.max(0, Math.min(20, level - 6));
  },

  points: function points(nbHits) {
    return Math.pow(nbHits, 4);
  },

  // One extra life every 100 points
  extraLifePoints: 100,

  // One extra life every time a new level is finished
  extraLifeLevel: 1,

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

// ## Add the game engine
ESVIJI.game = (function() {
  // Initial values
  var currentScreen = '';
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
  var highScores = [ ];
  var lastGameDate = '';
  var lastGameScore;
  var gameStatus = { };
  var useStored = false;
  var sounds;
  var clickType = 'click';

  // For viewport units issues
  var iOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);

  // Initialization
  function init() {

    if (Modernizr.inlinesvg) {
      $('#description').hide();
    } else {
      // Add this message using JS to prevent indexing it in search engines
      $('#description p.icon').before('<p>Your browser doesn\'t seem to support inline SVG. Learn about this game on <a href="http://esviji.com/">esviji.com</a>.</p>');
      return;
    }

    if (Modernizr.touch) {
    // if (iOS) {
      // https://github.com/rodneyrehm/viewport-units-buggyfill/issues/35
      window.viewportUnitsBuggyfill.init({ force: true });
    // }
      // Prevent double events for touch + click
      // TODO: Should not be necessary, devices can have both mouse and touch
      clickType = 'touchstart';
    }

    if (!ESVIJI.settings.version.match(/VERSION/)) {
      if ($('.version').text() === ESVIJI.settings.version) {
        // Send version to Google Analytics only if it is set in the source
        offlineAnalytics.push({name: 'version', value: ESVIJI.settings.version });
      }
    }

    if (!store.disabled) {
      highScores = store.get('highScores') || [ ];
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

    viewportOptimize();
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

    if (gameStatus.preferences.difficulty !== undefined && highScores.Crazy !== undefined) {
      // v2.0.0, no more difficulty choice, keep only 'crazy' scores
      gameStatus.preferences.difficulty = undefined;
      highScores = highScores.Crazy;
      storeSet('highScores', highScores);

      // no more vibration
      gameStatus.preferences.vibration = undefined;
    }

    // Available sounds
    sounds = new Howl({
      src: ['sounds/sprite.ogg', 'sounds/sprite.mp3'],
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
    });

    if (gameStatus.preferences.sound) {
      $('#home .sound').addClass('on');
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
    $('#home .controls .about').bind('click', function(event) {
      event.preventDefault();
      showScreen('about');
    });

    // Play screen buttons
    $('#play .controls .pause').bind('click', function(event) {
      event.preventDefault();
      showScreen('pause');
    });

    // Pause screen buttons
    $('#pause .controls .resume').bind('click', function(event) {
      event.preventDefault();
      showScreen('play');
    });

    $('#pause .controls .restart').bind('click', function(event) {
      event.preventDefault();
      storeSet('gameStatus', {
        playing: false,
      });

      startPlaying();
    });

    $('#pause .controls .sound').bind('click', toggleSound);
    $('#pause .controls .exit').bind('click', stopPlaying);

    // Game over screen buttons
    $('#gameover .controls .restart').bind('click', function(event) {
      event.preventDefault();
      storeSet('gameStatus', {
        playing: false,
      });
      startPlaying();
    });

    $('#gameover .controls .exit').bind('click', stopPlaying);

    // Scores screen button
    $('#scores .controls .exit').bind('click', function(event) {
      event.preventDefault();
      showScreen('home');
    });

    // About screen buttons
    $('#about .controls .exit').bind('click', function(event) {
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

  function viewportOptimize() {
    var vw = document.body.clientWidth;
    var vh = document.body.clientHeight;

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

    // console.log('vw = ' + vw + ' / vh = ' + vh);
    // console.log('boardWidth = ' + boardWidth + ' / boardHeight = ' + boardHeight);
    // console.log('boardOffsetY = ', boardOffsetY);
  }

  function run() {
    if (typeof gameStatus.playing === 'undefined' || gameStatus.playing === false) {
      showScreen('home');
    } else {
      useStored = true;
      startPlaying();
    }
  }

  function showScreen(screen) {
    // Remove focus from the button that led to this screen
    $(':focus').trigger('blur');

    // Hide current screen only if there's one…
    if (gameStatus.currentScreen !== '') {
      $('#' + gameStatus.currentScreen).attr('aria-hidden', 'true');
    }

    // Show new screen
    $('#' + screen).attr('aria-hidden', 'false');
    gameStatus.currentScreen = screen;

    // "Show" current screen in URL
    // history.pushState(null, '/' + screen, (screen === 'home' ? '/' : screen));

    // Google Analytics tracking of activated screen
    offlineAnalytics.push({ name: 'view', value: '/' + (screen === 'home' ? '' : screen) });
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

      if (drawnSpring !== null) {
        drawnSpring.remove();
      }

      drawnSpring = null;
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
    if (drawnSpring !== null) {
      drawnSpring.remove();
    }

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
    for (i = 0; i < 10; i++) {
      if (highScores[i] !== undefined && highScores[i].score !== 0) {
        if (lastGameDate === highScores[i].date) {
          thisone = true;
          $('.highscores').append('<li class="thisone">' + highScores[i].score + '</li>');
        } else {
          $('.highscores').append('<li>' + highScores[i].score + '</li>');
        }
      }
    }

    if (!thisone && lastGameDate !== '' && lastGameScore !== undefined) {
      $('.highscores').append('<li>…</li>');
      $('.highscores').append('<li class="tryagain">' + lastGameScore + '</li>');
    }
  }

  function nextLevel() {
    gameStatus.playing = true;
    eraseBalls();
    if (useStored) {
      drawBalls();
    } else {
      gameStatus.level++;
      drawLevel();
      $('#play .level').attr('class', 'level changeUp');
      window.setTimeout(function() {
          $('#play .level').attr('class', 'level');
        }, 1000);

      initBalls();
      drawBalls();
      getValidBalls();
      gameStatus.currentBall = validBalls[Math.floor(Math.random() * validBalls.length)];
    }

    // TODO: remove 'null' values from gameStatus.currentBalls

    // clone the array (https://twitter.com/naholyr/status/311112698421198848)
    var replayBalls = gameStatus.currentBalls.map(function(a) {
        return a === null ? null : a.slice();
      });

    gameStatus.levelReplay = {
      lostLives: 0,
      level: gameStatus.level,
      balls: replayBalls,
      sequence: [],
    };

    playSound('soundLevel');
    startNewTurn();
  }

  function startNewTurn() {
    currentPosX = ESVIJI.settings.turn.posX;
    currentDirX = ESVIJI.settings.turn.dirX;
    currentPosY = ESVIJI.settings.turn.posY;
    currentDirY = ESVIJI.settings.turn.dirY;
    scoreThisTurn = 0;
    lastHitBall = ESVIJI.settings.rockId;
    getValidBalls();

    stackedAnimationToStart = 1;
    lastStackedAnimation = 0;

    if (validBalls.length === 0) {
      // no more valid ball, end of the turn
      if (drawnCurrentBall !== null) {
        drawnCurrentBall.remove();
        drawnCurrentBall = null;
      }

      if (drawnSpring !== null) {
        drawnSpring.remove();
        drawnSpring = null;
      }

      if (ESVIJI.settings.extraLifeLevel > 0) {
        gameStatus.lives += ESVIJI.settings.extraLifeLevel;
        drawLives();
        $('#play .lives').attr('class', 'lives changeUp');
        window.setTimeout(function() { $('#play .lives').attr('class', 'lives'); }, 1000);
      }

      // TODO: Push to the server levels completed without any life lost
      // if (gameStatus.levelReplay.lostLives === 0) {
      //  console.log(JSON.stringify(gameStatus.levelReplay));
      // }

      makeEverythingFall();
    } else {
      if (validBalls.indexOf(gameStatus.currentBall) == -1) {
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

        notPlayableAnimMain.addEventListener('beginEvent', function() {
            playSound('error');
          }, false);

        notPlayableAnimMain.addEventListener('endEvent', notPlayable, false);
        if (drawnCurrentBall !== null) {
          drawnCurrentBall.append(notPlayableAnimMain);
        }

        $('[data-valid=true]').each(function() {
          that = $(this);
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

          if (drawnSpring !== null && drawnSpring !== undefined) {
            drawnSpring.remove();
          }

          drawnCurrentBall = drawBall(xToSvg(currentPosX), yToSvg(currentPosY), ESVIJI.settings.balls[gameStatus.currentBall - 1], 'playable');
          drawnCurrentBall.attr({
            class: 'throwable',
          });
          drawnSpring = drawSpring(xToSvg(currentPosX), yToSvg(currentPosY));
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
          Mousetrap.bind('p', function() {
            showScreen('pause');
          });
        }
      }
    }
  }

  function notPlayable() {
    if (drawnCurrentBall !== null) {
      drawnCurrentBall.remove();
    }

    drawnCurrentBall = null;

    if (drawnSpring !== null) {
      drawnSpring.remove();
    }

    drawnSpring = null;

    removeLife();
    gameStatus.currentBall = validBalls[Math.floor(Math.random() * validBalls.length)];
    startNewTurn();
  }

  function keyUp(event) {
    cursorY = Math.min(Math.max(yToSvg(currentPosY + 1), cursorMaxY), cursorMinY);
    currentPosY = svgToY(cursorY);
    drawnCurrentBall.attr({
      y: cursorY,
    });
    drawnSpring.attr({
      y: cursorY,
    });
  }

  function keyDown(event) {
    cursorY = Math.min(Math.max(yToSvg(currentPosY - 1), cursorMaxY), cursorMinY);
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
    oldPosX = currentPosX;
    oldPosY = currentPosY;

    drawnSpring.remove();
    drawnSpring = null;

    cursorY = yToSvg(currentPosY);
    drawnCurrentBall.attr({
      y: cursorY,
    });
    currentPosY = svgToY(cursorY);

    gameStatus.levelReplay.sequence.push({
      ball: gameStatus.currentBall,
      position: currentPosY,
    });

    playSound('soundThrow');
    playUserChoice();
  }

  function cursorStart(event) {
    event.preventDefault();
    dragged = true;
    if (event.originalEvent.touches && event.originalEvent.touches.length) {
      event = event.originalEvent.touches[0];
    } else if (event.originalEvent.changedTouches && event.originalEvent.changedTouches.length) {
      event = event.originalEvent.changedTouches[0];
    }

    cursorY = Math.min(Math.max(pixelsToSvgY(event.pageY) - 16, cursorMaxY), cursorMinY);
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
    } else if (event.originalEvent.changedTouches && event.originalEvent.changedTouches.length) {
      event = event.originalEvent.changedTouches[0];
    }

    // event.pageY seems to be returning weird values when movement starts
    cursorY = Math.min(Math.max(pixelsToSvgY(event.pageY) - 16, cursorMaxY), cursorMinY);
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
      } else if (event.originalEvent.changedTouches && event.originalEvent.changedTouches.length) {
        event = event.originalEvent.changedTouches[0];
      }

      dragged = false;
      Mousetrap.unbind('up');
      Mousetrap.unbind('down');
      Mousetrap.unbind(['enter', 'space']);
      $('#play .playzone').off('mousedown touchstart');
      $('#play .playzone').off('mousemove touchmove');
      $('#play .playzone').off('mouseup touchend');
      cursorY = Math.min(Math.max(pixelsToSvgY(event.pageY) - 16, cursorMaxY), cursorMinY);
      currentPosY = svgToY(cursorY);
      drawnCurrentBall.attr({
        y: yToSvg(currentPosY),
        class: '',
      });

      moveCount = 0;
      oldPosX = currentPosX;
      oldPosY = currentPosY;

      drawnSpring.remove();
      drawnSpring = null;

      gameStatus.levelReplay.sequence.push({
        ball: gameStatus.currentBall,
        position: currentPosY,
      });

      playSound('soundThrow');
      playUserChoice();
    }
  }

  function playUserChoice() {
    moveCount++;
    if (currentPosY == 1 && currentDirY == -1) {
      // Against the floor, no more possible move
      if (oldPosY != 1) {
        animStackMove(drawnCurrentBall, (oldPosY - currentPosY) * ESVIJI.settings.durationMove, 'y', yToSvg(oldPosY), yToSvg(currentPosY));
      }

      $('#anim' + lastStackedAnimation)[0].addEventListener('beginEvent', function(event) {
        playSound('soundHitFloor');
      });

      endOfMove();
    } else {
      if (currentPosX == 1 && currentDirX == -1) {
        // Against the left wall, should now go down
        currentDirX = 0;
        currentDirY = -1;
        animStackMove(drawnCurrentBall, (oldPosX - currentPosX) * ESVIJI.settings.durationMove, 'x', xToSvg(oldPosX), xToSvg(currentPosX));
        $('#anim' + lastStackedAnimation)[0].addEventListener('endEvent', function(event) {
          playSound('soundHitWall');
        }, false);

        oldPosX = currentPosX;
        playUserChoice();
      } else {
        // Neither floor nor wall, so what is it?
        nextBall = gameStatus.currentBalls[currentPosX + currentDirX][currentPosY + currentDirY];
        switch (nextBall) {
          case ESVIJI.settings.rockId:

            // A rock...
            if (currentDirX == -1) {
              // ...at our left, should now go down
              currentDirX = 0;
              currentDirY = -1;
              animStackMove(drawnCurrentBall, (oldPosX - currentPosX) * ESVIJI.settings.durationMove, 'x', xToSvg(oldPosX), xToSvg(currentPosX));
              oldPosX = currentPosX;
              $('#anim' + lastStackedAnimation)[0].addEventListener('endEvent', function(event) {
                playSound('soundHitWall');
              }, false);

              playUserChoice();
            } else {
              // ...under us, no more possible move
              if (oldPosY != currentPosY) {
                animStackMove(drawnCurrentBall, (oldPosY - currentPosY) * ESVIJI.settings.durationMove, 'y', yToSvg(oldPosY), yToSvg(currentPosY));
              }

              $('#anim' + lastStackedAnimation)[0].addEventListener('endEvent', function(event) {
                playSound('soundHitFloor');
              }, false);

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
            currentPosXBefore = currentPosX;
            currentPosYBefore = currentPosY;
            currentPosX += currentDirX;
            currentPosY += currentDirY;
            gameStatus.currentBalls[currentPosX][currentPosY] = ESVIJI.settings.emptyId;
            if (currentPosXBefore != oldPosX) {
              animStackMove(drawnCurrentBall, (oldPosX - currentPosXBefore) * ESVIJI.settings.durationMove, 'x', xToSvg(oldPosX), xToSvg(currentPosXBefore));
              oldPosX = currentPosXBefore;
            } else if (currentPosYBefore != oldPosY) {
              animStackMove(drawnCurrentBall, (oldPosY - currentPosYBefore) * ESVIJI.settings.durationMove, 'y', yToSvg(oldPosY), yToSvg(currentPosYBefore));
              oldPosY = currentPosYBefore;
            }

            animStackDestroy(drawnCurrentBalls[currentPosX][currentPosY]);
            scoreThisTurn++;
            playSound('soundHitSameBall');
            playUserChoice();
            break;

          default:
            lastHitBall = nextBall;
            if (currentPosX != oldPosX) {
              animStackMove(drawnCurrentBall, (oldPosX - currentPosX) * ESVIJI.settings.durationMove, 'x', xToSvg(oldPosX), xToSvg(currentPosX));
            } else if (currentPosY != oldPosY) {
              animStackMove(drawnCurrentBall, (oldPosY - currentPosY) * ESVIJI.settings.durationMove, 'y', yToSvg(oldPosY), yToSvg(currentPosY));
            }

            if (scoreThisTurn > 0) {
              gameStatus.currentBall = nextBall;
              if (currentPosX != oldPosX) {
                animStackMorph(drawnCurrentBall, nextBall, xToSvg(currentPosX), yToSvg(currentPosY), 'x', xToSvg(currentPosX), xToSvg(currentPosX + currentDirX));
              } else {
                animStackMorph(drawnCurrentBall, nextBall, xToSvg(currentPosX), yToSvg(currentPosY), 'y', yToSvg(currentPosY), yToSvg(currentPosY + currentDirY));
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
    var anim = document.createElementNS('http://www.w3.org/2000/svg', type || 'animate');
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
      if (lastStackedAnimation === (stackedAnimationToStart - 1)) {
        begin = 'indefinite';
      } else {
        begin = 'anim' + lastStackedAnimation + '.end';
      }
    }

    lastStackedAnimation++;

    anim = svgAnimate({
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
    anim.addEventListener('endEvent', function(event) {
      // Set new attribute value at the end of the animation
      $(event.currentTarget.parentElement).attr(event.currentTarget.attribute, event.currentTarget.attributeTo);

      // Remove the animation
      $(event.currentTarget).remove();
    }, false);

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
    animOpacityFrom = svgAnimate({
      attributeName: 'opacity',
      to: '0',
      begin: 'anim' + lastStackedAnimation + '.end',
      dur: ESVIJI.settings.durationMorph + 's',
      fill: 'freeze',
      id: 'anim' + (lastStackedAnimation + 1),
    });
    ballFrom.append(animOpacityFrom);

    // move
    animMoveFrom = svgAnimate({
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
    animOpacityTo = svgAnimate({
      attributeName: 'opacity',
      to: '1',
      begin: 'anim' + lastStackedAnimation + '.end',
      dur: ESVIJI.settings.durationMorph + 's',
      fill: 'freeze',
      id: 'anim' + (lastStackedAnimation + 3),
    });
    ballTo.append(animOpacityTo);

    // move
    animMoveTo = svgAnimate({
      attributeName: attribute,
      from: from,
      to: to,
      begin: 'anim' + lastStackedAnimation + '.end',
      dur: ESVIJI.settings.durationMorph + 's',
      fill: 'freeze',
      id: 'anim' + (lastStackedAnimation + 4),
    });
    animMoveTo.addEventListener('beginEvent', function(event) {
      playSound('soundHitOtherBallOk');
    }, false);

    ballTo.append(animMoveTo);

    lastStackedAnimation += 4;
  }

  function animStackDestroy(ball, begin) {
    begin = begin || ((lastStackedAnimation === 0) ? 'indefinite' : ('anim' + lastStackedAnimation + '.end'));

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
    animRotate.addEventListener('beginEvent', function(event) {
      playSound('soundHitSameBall');
    }, false);

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
    animOpacity.addEventListener('endEvent', function(event) {
      // Remove the ball after the animation
      $(event.currentTarget.parentElement).remove();
    }, false);

    ball.append(animOpacity);

    lastStackedAnimation += 2;
  }

  function endOfMove() {
    $('#anim' + lastStackedAnimation)[0].addEventListener('endEvent', function(event) {
      drawnCurrentBall.remove();
      $('#morph').remove();
      if (scoreThisTurn === 0) {
        playSound('soundHitOtherBallKo');
      }

      drawnCurrentBall = drawBall(xToSvg(ESVIJI.settings.turn.posX), yToSvg(ESVIJI.settings.turn.posY), ESVIJI.settings.balls[gameStatus.currentBall - 1], 'playable');
      drawnSpring = drawSpring(xToSvg(ESVIJI.settings.turn.posX), yToSvg(ESVIJI.settings.turn.posY));
    });

    makeBallsFall();
  }

  function makeBallsFall() {
    var aboveBalls;

    lastStackedAnimationBeforeFall = lastStackedAnimation;
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

                dur = ESVIJI.settings.durationMove * (z - y);

                // Follow through and overlapping action:
                // http://uxdesign.smashingmagazine.com/2012/10/30/motion-animation-new-mobile-ux-design-material/
                dur = dur * (1 + aboveBalls / 3);

                // TODO: add an easing to the fall animation
                animStackMove(drawnCurrentBalls[x][y], dur, 'y', yToSvg(z), yToSvg(y), 'anim' + lastStackedAnimationBeforeFall + '.end');

                // TODO: make the sound later as for piles of falling balls
                $('#anim' + lastStackedAnimation)[0].addEventListener('beginEvent', function(event) {
                  playSound('soundFall');
                });

                // Let's try again to see if there are new balls above that have to fall
                y = 1;
                z = 8;
            }
          }
        }
      }
    }

    if (lastStackedAnimation >= stackedAnimationToStart) {
      $('#anim' + lastStackedAnimation)[0].addEventListener('endEvent', function(event) {
        endOfTurn();
      }, false);

      // Launch the animation
      $('#anim' + stackedAnimationToStart)[0].beginElement();
    } else {
      endOfTurn();
    }
  }

  function makeEverythingFall() {
    var ballsUnder;

    stackedAnimationToStart = 1;
    lastStackedAnimation = 0;

    for (x = 1; x <= 7; x++) {
      ballsUnder = 0;
      for (y = 1; y <= 7; y++) {
        if (gameStatus.currentBalls[x][y] != ESVIJI.settings.emptyId) {
          dur = ESVIJI.settings.durationMove * (1 + ballsUnder / 3);
          if (lastStackedAnimation === 0) {
            animStackMove(drawnCurrentBalls[x][y], dur * 7, 'y', yToSvg(y), yToSvg(y - 7));
          } else {
            animStackMove(drawnCurrentBalls[x][y], dur * 7, 'y', yToSvg(y), yToSvg(y - 7), 'anim' + stackedAnimationToStart + '.begin');
          }

          drawnCurrentBalls[x][y] = ESVIJI.settings.emptyId;
          ballsUnder++;
        } else {
          ballsUnder = 0;
        }
      }
    }

    if (lastStackedAnimation >= stackedAnimationToStart) {
      $('#anim' + lastStackedAnimation)[0].addEventListener('endEvent', function(event) {
        nextLevel();
      }, false);

      $('#anim' + stackedAnimationToStart)[0].beginElement();
    } else {
      nextLevel();
    }
  }

  function initBalls(thisLevel) {
    thisLevel = thisLevel || gameStatus.level;
    nbBalls = ESVIJI.settings.levelBalls(thisLevel);
    gameStatus.currentBalls = [];

    for (x = 1; x <= ESVIJI.settings.board.xMax; x++) {
      gameStatus.currentBalls[x] = [];
      for (y = 1; y <= ESVIJI.settings.board.yMax; y++) {
        if (y - 7 > x) {
          // put the 'stair' rocks
          gameStatus.currentBalls[x][y] = ESVIJI.settings.rockId;
        } else {
          if ((x <= ESVIJI.settings.levelColumns(thisLevel)) && (y <= ESVIJI.settings.levelRows(thisLevel))) {
            // a ball
            gameStatus.currentBalls[x][y] = 1 + Math.floor(Math.random() * nbBalls);
          } else {
            // empty
            gameStatus.currentBalls[x][y] = ESVIJI.settings.emptyId;
          }
        }
      }
    }

    // add rocks
    nbRocks = ESVIJI.settings.levelRocks(thisLevel);
    positionedRocks = 0;
    while (positionedRocks < nbRocks) {
      rockX = 1 + Math.floor(Math.random() * ESVIJI.settings.levelRows(thisLevel));
      rockY = 1 + Math.floor(Math.random() * ESVIJI.settings.levelColumns(thisLevel));
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

  function drawSpring(x, y) {
    var spring = svgUse('spring', 'playableSpring');
    spring.attr({
      x: x + 16,
      y: y,
    });
    $('#board').append(spring);
    return spring;
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

    use.get(0).setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + refId);
    return use;
  }

  function drawBalls() {
    drawnCurrentBalls = [];
    for (x = 1; x <= 7; x++) {
      drawnCurrentBalls[x] = [];
      for (y = 1; y <= 7; y++) {
        if (gameStatus.currentBalls[x][y] == ESVIJI.settings.emptyId) {
          drawnCurrentBalls[x][y] = null;
        } else {
          ballX = xToSvg(x);
          ballY = yToSvg(y);
          if (gameStatus.currentBalls[x][y] == ESVIJI.settings.rockId) {
            rockId = 1 + Math.floor(Math.random() * ESVIJI.settings.rocks.length);
            drawnCurrentBalls[x][y] = drawBall(ballX, ballY, ESVIJI.settings.rocks[rockId - 1]);
          } else {
            drawnCurrentBalls[x][y] = drawBall(ballX, ballY, ESVIJI.settings.balls[gameStatus.currentBalls[x][y] - 1]);
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

    for (yStart = 1; yStart <= 13; yStart++) {
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
            nextBall = gameStatus.currentBalls[x + dirX][y + dirY];
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
                drawnCurrentBalls[x + dirX][y + dirY].attr('data-valid', 'true');
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

    // Google Analytics tracking of level and score at the end of the game
    offlineAnalytics.push({ name: 'level', value: gameStatus.level });
    offlineAnalytics.push({ name: 'score', value: gameStatus.score });

    lastGameDate = Date();
    lastGameScore = gameStatus.score;

    for (i = 0; i < l; i++) {
      if (!positioned && (highScores[i] === undefined || highScores[i].score <= gameStatus.score)) {
        for (j = l; j > i; j--) {
          highScores[j] = highScores[j - 1];
        }

        highScores[i] = { score: lastGameScore, date: lastGameDate};
        positioned = true;
      }
    }

    if (!positioned) {
      highScores[l] = { score: lastGameScore, date: lastGameDate};
    }

    // TODO: keep only 10 scores? No limit now.
    storeSet('highScores', highScores);
    gameStatus.playing = false;
    storeSet('gameStatus', {
      playing: false,
    });

    showScores();
    showScreen('gameover');
  }

  function removeLife() {
    gameStatus.lives--;
    gameStatus.levelLostLives++;
    playSound('soundLifeDown');
    drawLives();
    $('#play .lives').attr('class', 'lives changeDown');
    window.setTimeout(function() {
        $('#play .lives').attr('class', 'lives');
      }, 1000);

    if (gameStatus.lives === 0) {
      gameOver();
    }
  }

  function addLives(nbLives) {
    gameStatus.lives += nbLives;
    playSound('soundLifeUp');
    drawLives();
    $('#play .lives').attr('class', 'lives changeUp');
    window.setTimeout(function() { $('#play .lives').attr('class', 'lives'); }, 1000);
  }

  function addScore(scoreToAdd) {
    oldScore = gameStatus.score;
    gameStatus.score += ESVIJI.settings.points(scoreToAdd);
    increaseScore();
    $('#play .score').attr('class', 'score changeUp');
    window.setTimeout(function() {
        $('#play .score').attr('class', 'score');
      }, 1000);

    hundreds = Math.floor(gameStatus.score / ESVIJI.settings.extraLifePoints) - Math.floor(oldScore / ESVIJI.settings.extraLifePoints);
    if (hundreds > 0) {
      addLives(hundreds);
    }
  }

  function increaseScore() {
    currentDrawnScore = parseInt($('#play .score').text(), 10);
    if (currentDrawnScore < gameStatus.score) {
      $('#play .score').text(currentDrawnScore + Math.ceil((gameStatus.score - currentDrawnScore) / 3));
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
    return (coordY - boardOffsetY) * ESVIJI.settings.board.height / boardHeight;
  }

  function playSound(type) {
    if (gameStatus.preferences.sound && sounds._loaded) {
      sounds.play(type);
    }
  }

  return {
    init: init,
    viewportOptimize: viewportOptimize,
  };
})();

document.addEventListener('DOMContentLoaded', function() {
  ESVIJI.game.init();
});

// Optimize viewport and board sizes after resize and orientation change
window.addEventListener('resize', function() {
    window.setTimeout(ESVIJI.game.viewportOptimize, 500);
  });

window.addEventListener('orientationchange', function() {
    window.setTimeout(ESVIJI.game.viewportOptimize, 500);
  });
