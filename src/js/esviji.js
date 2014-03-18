// ## Create the main object

var ESVIJI = {};

// ## Add default settings

ESVIJI.settings = {
  version: '%VERSION%',
  // board size and according ball extreme positions
  board: {
    width: 320,
    height: 460,
    xMax: 10,
    yMax: 13
  },
  // list of available ball "names"
  balls: ['ball1', 'ball2', 'ball3', 'ball4', 'ball5', 'ball6'],
  // list of available rock "names" (only one for now)
  rocks: ['rock'],
  // special ids for the game matrix
  emptyId: 0,
  rockId: -1,
  // game info at launch time
  launch: {
    lives: 9,
    score: 0,
    level: 0
  },
  // game difficulty levels
  difficulties: {
    Beginner: {
      rows: function rows(level) {
        return 3;
      },
      columns: function columns(level) {
        return 3;
      },
      balls: function balls(level) {
        return Math.max(2, Math.min(3, 2 + Math.floor((level - 1) / 3)));
      },
      rocks: function rocks(level) {
        return 0;
      },
      points: function points(nbHits) {
        return nbHits;
      },
      extraLifePoints: 100,
      extraLifeLevel: 0
    },
    Easy: {
      rows: function rows(level) {
        return Math.max(3, Math.min(6, 3 + Math.floor((level - 1) / 3)));
      },
      columns: function columns(level) {
        return Math.max(3, Math.min(6, 3 + Math.floor((level - 1) / 3)));
      },
      balls: function balls(level) {
        return Math.max(2, Math.min(5, 2 + Math.floor((level - 1) / 2)));
      },
      rocks: function rocks(level) {
        return Math.min(5, Math.floor((level - 1) / 5));
      },
      points: function points(nbHits) {
        return Math.pow(nbHits, 2);
      },
      extraLifePoints: 100,
      extraLifeLevel: 1
    },
    Hard: {
      rows: function rows(level) {
        return Math.max(5, Math.min(7, 5 + Math.floor((level - 1) / 3)));
      },
      columns: function columns(level) {
        return Math.max(5, Math.min(6, 5 + Math.floor((level - 1) / 3)));
      },
      balls: function balls(level) {
        return Math.max(4, Math.min(6, 4 + Math.floor((level - 1) / 2)));
      },
      rocks: function rocks(level) {
        return Math.min(10, Math.floor((level - 1) / 4));
      },
      points: function points(nbHits) {
        return Math.pow(nbHits, 3);
      },
      extraLifePoints: 100,
      extraLifeLevel: 1
    },
    Crazy: {
      rows: function rows(level) {
        return Math.min(7, 2 + level);
      },
      columns: function columns(level) {
        return Math.min(7, 2 + level);
      },
      balls: function balls(level) {
        return Math.min(6, 1 + level);
      },
      rocks: function rocks(level) {
        return Math.max(0, Math.min(20, level - 6));
      },
      points: function points(nbHits) {
        return Math.pow(nbHits, 4);
      },
      extraLifePoints: 100,
      extraLifeLevel: 0
    }
  },
  // game info at new turn start
  turn: {
    posX: 10,
    dirX: -1,
    posY: 8,
    dirY: 0
  },
  // animation settings
  durationMove: 0.15,
  durationMorph: 0.5
};

// ## Add the game engine
ESVIJI.game = (function () {
  // Initial values
  var
    viewportWidth = 0,
    viewportHeight = 0,
    boardWidth,
    boardHeight,
    boardOffsetY,
    drawnCurrentBalls = [],
    validBalls = [],
    drawnCurrentBall = null,
    stackedAnimationToStart = 1,
    lastStackedAnimation = 0,
    currentPosX = 0,
    currentPosY = 0,
    currentDirX = -1,
    currentDirY = 0,
    dragged = false,
    moveCount = 0,
    cursorY = 0,
    cursorMinY = 0,
    cursorMaxY = 0,
    maxAvailableBalls = 0,
    nbBalls = 0,
    scoreThisTurn = 0,
    lastHitBall = ESVIJI.settings.rockId,
    highScores = [ ],
    lastGameDate = '',
    gameStatus = { },
    useStored = false,
    sounds,
    clickType = 'click';

  // Initialization
  function init() {
    if (Modernizr.inlinesvg) {
      $('#description').hide();
    } else {
      // Add this message using JS to prevent indexing it in search engines
      $('#description p.icon').before('<p>Your browser doesn\'t seem to support inline SVG. Learn about this game on <a href="http://esviji.com/">esviji.com</a>.</p>');
      $('svg').hide();
      return;
    }
    if (Modernizr.touch) {
      // TODO: Should not be necessary, devices can have both mouse and touch
      clickType = 'touchstart';
    }
    if (!Modernizr.testProp('vibrate')) {
      $('.prefsVibration,.label.vibration').hide();
    }

    if (!ESVIJI.settings.version.match(/VERSION/)) {
      if ($('.version') === ESVIJI.settings.version) {
        // Send version to Google Analitycs only if it is set in the source
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
          sequence: []
        },
        preferences: {
          sound: true,
          vibration: true,
          difficulty: 'Beginner'
        }
      };
    }

    viewportOptimize();
    cursorMinY = yToSvg(1);
    cursorMaxY = yToSvg(ESVIJI.settings.board.yMax);
    maxAvailableBalls = ESVIJI.settings.balls.length;

    // Deal with localStore content that has been set when there was less data
    if (undefined === gameStatus.levelReplay) {
      // v1.6.7
      gameStatus.levelReplay = {
        'lostLives': 0,
        'level': 0,
        'balls': [],
        'sequence': []
      };
    }
    if (undefined === gameStatus.preferences) {
      // v1.6.8
      gameStatus.preferences = {
        'sound': true
      };
    }
    if (undefined === gameStatus.preferences.difficulty) {
      // v1.8.0
      gameStatus.preferences.difficulty = 'Beginner';
    }
    if (highScores.length === 0 || (highScores.length > 0 && undefined === highScores.Beginner)) {
      // v1.8.1
      oldHighScores = highScores;
      highScores = {
        Beginner: [],
        Easy: [],
        Hard: oldHighScores,
        Crazy: []
      };
      storeSet('highScores', highScores);
    }
    if (undefined === gameStatus.preferences.vibration) {
      // v1.13.0
      gameStatus.preferences.vibration = true;
    }

    // Available sounds
    sounds = new Howl({
      "urls": ["sounds/sprite.ogg", "sounds/sprite.mp3"],
      "sprite": {
        "fall": [0, 204.05895691609976],
        "hit-floor": [2000, 2000],
        "hit-other-ball-ko": [5000, 468.7528344671206],
        "hit-other-ball-ok": [7000, 500],
        "hit-same-ball": [9000, 1000],
        "hit-wall": [11000, 1835.941043083901],
        "level": [14000, 2947.0068027210878],
        "life-down": [18000, 1000],
        "life-up": [20000, 1000],
        "throw": [22000, 797.1201814058943]
      },
      buffer: true
    });

    run();
  }

  function storeSet(item, value) {
    if (!store.disabled) {
      store.set(item, value);
    }
  }

  function viewportOptimize() {
    if (viewportWidth != document.body.clientWidth || viewportHeight != document.body.clientHeight) {
      viewportWidth = document.body.clientWidth;
      viewportHeight = document.body.clientHeight;
      if (viewportHeight / viewportWidth > ESVIJI.settings.board.height / ESVIJI.settings.board.width) {
        // tall
        boardWidth = viewportWidth;
        boardHeight = ESVIJI.settings.board.height / ESVIJI.settings.board.width * boardWidth;
        boardOffsetY = viewportHeight - boardHeight; // top empty area height
      } else {
        // large
        boardHeight = viewportHeight;
        boardWidth = ESVIJI.settings.board.width / ESVIJI.settings.board.height * boardHeight;
        boardOffsetY = 0;
      }
    }
  }

  function run() {
    if (typeof gameStatus.playing === 'undefined' || gameStatus.playing === false) {
      showPanel('main');
      startMain();
    } else {
      useStored = true;
      startPlaying();
    }
  }

  function startMain(difficulty) {
    $('#pulse')[0].beginElement();
    $('#main .start').one(clickType, startDifficulty);
    $('#main .scores').one(clickType, startScores);
    $('#main .settings').one(clickType, startSettings);
  }

  function startDifficulty() {
    hidePanel('main');
    showPanel('difficulty');
    $('#difficulty .beginner').one(clickType, function (event) {
      event.preventDefault();
      gameStatus.preferences.difficulty = 'Beginner';
      hidePanel('difficulty');
      startPlaying();
    });
    $('#difficulty .easy').one(clickType, function (event) {
      event.preventDefault();
      gameStatus.preferences.difficulty = 'Easy';
      hidePanel('difficulty');
      startPlaying();
    });
    $('#difficulty .hard').one(clickType, function (event) {
      event.preventDefault();
      gameStatus.preferences.difficulty = 'Hard';
      hidePanel('difficulty');
      startPlaying();
    });
    $('#difficulty .crazy').one(clickType, function (event) {
      event.preventDefault();
      gameStatus.preferences.difficulty = 'Crazy';
      hidePanel('difficulty');
      startPlaying();
    });
    $('#difficulty .exit').one(clickType, endDifficulty);
  }

  function endDifficulty(event) {
    event.preventDefault();
    hidePanel('difficulty');
    showPanel('main');
    startMain();
  }

  function startPlaying(event) {
    if (undefined !== event) {
      event.preventDefault();
    }
    if (!useStored) {
      gameStatus.level = ESVIJI.settings.launch.level;
      gameStatus.score = ESVIJI.settings.launch.score;
      gameStatus.lives = ESVIJI.settings.launch.lives;
      hidePanel('play');
      if (null !== drawnCurrentBall) {
        drawnCurrentBall.remove();
      }
      drawnCurrentBall = null;
    }
    showPanel('play');
    drawLevel();
    drawScore();
    drawLives();
    $('#play .pauseButton').one(clickType, startPause);
    nextLevel();
  }

  function stopPlaying() {
    gameStatus.playing = false;
    gameStatus.level = 0;
    gameStatus.score = 0;
    gameStatus.lives = 0;
    eraseBalls();
    if (null !== drawnCurrentBall) {
      drawnCurrentBall.remove();
    }
    hidePanel('play');
    storeSet('gameStatus', {
      'playing': false
    });
    run();
  }

  function startTutorial() {
    hidePanel('settings');
    showPanel('tutorial');
    $('#tutorial .pauseButton').one(clickType, endTutorial);
    $('#tutoAnimEnd')[0].addEventListener('endEvent', endTutorial, false);
    $('#tutoAnimStart')[0].beginElement();
  }

  function endTutorial(event) {
    event.preventDefault();
    hidePanel('tutorial');
    showPanel('settings');
    startSettings();
  }

  function startScores() {
    var difficulty = gameStatus.preferences.difficulty;

    hidePanel('main');
    showPanel('scores');

    $('#scores .difficulty text').text(difficulty);
    $('#scores .difficulty').bind(clickType, function() {
      var nextDifficulty = {
            Beginner: 'Easy',
            Easy: 'Hard',
            Hard: 'Crazy',
            Crazy: 'Beginner'
          },
          difficulty = nextDifficulty[$(this).find('text').text()];

      $('#scores .difficulty text').text(difficulty);
      writeScores(difficulty);
    });

    writeScores(difficulty);

    $('#scores .exit').one(clickType, endScores);
  }

  function writeScores(difficulty) {
    for (i = 0; i < 10; i++) {
      if (undefined !== highScores[difficulty][i]) {
        $('#scores .highscores text').eq(i).text(highScores[difficulty][i].score);
        if (difficulty === gameStatus.preferences.difficulty && lastGameDate === highScores[difficulty][i].date) {
          $('#scores .highscores text').eq(i).attr('class', 'thisone');
        }
      } else {
        $('#scores .highscores text').eq(i).text('-').attr('class', '');
      }
    }
  }

  function endScores(event) {
    event.preventDefault();
    hidePanel('scores');
    showPanel('main');
    startMain();
  }

  function startSettings() {
    hidePanel('main');
    showPanel('settings');

    $('#settings .prefsSound text').text(gameStatus.preferences.sound ? 'On' : 'Off');
    $('#settings .prefsSound').bind(clickType, function() {
      gameStatus.preferences.sound = !gameStatus.preferences.sound;
      storeSet('gameStatus', gameStatus);
      $('#settings .prefsSound text').text(gameStatus.preferences.sound ? 'On' : 'Off');
    });

    $('#settings .prefsVibration text').text(gameStatus.preferences.vibration ? 'On' : 'Off');
    $('#settings .prefsVibration').bind(clickType, function() {
      gameStatus.preferences.vibration = !gameStatus.preferences.vibration;
      storeSet('gameStatus', gameStatus);
      $('#settings .prefsVibration text').text(gameStatus.preferences.vibration ? 'On' : 'Off');
    });

    $('#settings .tutorial').one(clickType, startTutorial);

    $('#settings .exit').one(clickType, endSettings);

    showInstall();
  }

  function endSettings(event) {
    event.preventDefault();
    hidePanel('settings');
    showPanel('main');
    startMain();
  }

  function startPause() {
    showPanel('pause');
    $('#pause .resume').one(clickType, function(e) {
      e.preventDefault();
      hidePanel('pause');
      $('#play .pauseButton').one(clickType, startPause);
    });

    $('#pause .restart').one(clickType, function(e) {
      e.preventDefault();
      hidePanel('pause');
      storeSet('gameStatus', {
        'playing': false
      });
      startPlaying();
    });

    $('#pause .prefsSound text').text(gameStatus.preferences.sound ? 'On' : 'Off');
    $('#pause .prefsSound').bind(clickType, function() {
      gameStatus.preferences.sound = !gameStatus.preferences.sound;
      storeSet('gameStatus', gameStatus);
      $('#pause .prefsSound text').text(gameStatus.preferences.sound ? 'On' : 'Off');
    });

    $('#pause .prefsVibration text').text(gameStatus.preferences.vibration ? 'On' : 'Off');
    $('#pause .prefsVibration').bind(clickType, function() {
      gameStatus.preferences.vibration = !gameStatus.preferences.vibration;
      storeSet('gameStatus', gameStatus);
      $('#pause .prefsVibration text').text(gameStatus.preferences.vibration ? 'On' : 'Off');
    });

    $('#pause .exit').one(clickType, function(e) {
      e.preventDefault();
      hidePanel('pause');
      stopPlaying();
    });
  }

  // There is no z-index in SVG, so we need to "create" panel we want on top of all others
  function showPanel(panel) {
    if ( $('#' + panel).length === 0 && $('#' + panel + 'Panel').length === 1) {
      $('#' + panel + 'Panel').clone().attr('id', panel).appendTo('#board');
      $('#' + panel + 'Panel').remove();
      if (panel === 'pause' || panel === 'gameOver') {
        $('#play').css('opacity', 0.3);
      }
      // Google Analytics tracking of activated panel
      offlineAnalytics.push({ name: 'view', value: '/' + (panel === 'main' ? '' : panel + '/') });
    }
  }

  function hidePanel(panel) {
    if ($('#' + panel).length === 1 && $('#' + panel + 'Panel').length === 0) {
      $('#' + panel).clone().attr('id', panel + 'Panel').appendTo('#board defs');
      $('#' + panel).remove();
      if (panel === 'pause' || panel === 'gameOver') {
        $('#play').css('opacity', 1);
      }
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
      window.setTimeout(function() { $('#play .level').attr('class', 'level'); }, 2000);
      initBalls();
      drawBalls();
      getValidBalls();
      gameStatus.currentBall = validBalls[Math.floor(Math.random() * validBalls.length)];
    }

    // TODO: remove "null" values from gameStatus.currentBalls
    gameStatus.levelReplay = {
      'lostLives': 0,
      'level': gameStatus.level,
      'balls': gameStatus.currentBalls.map(function(a) { return a === null ? null : a.slice(); }), // clone the array (https://twitter.com/naholyr/status/311112698421198848)
      'sequence': []
    };

    playSound('level');
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
      if (null !== drawnCurrentBall) {
        drawnCurrentBall.remove(); // TODO: animate
        drawnCurrentBall = null;
      }

      if (ESVIJI.settings.difficulties[gameStatus.preferences.difficulty].extraLifeLevel > 0) {
        gameStatus.lives += ESVIJI.settings.difficulties[gameStatus.preferences.difficulty].extraLifeLevel;
        drawLives();
        $('#play .lives').attr('class', 'lives changeUp');
        window.setTimeout(function() { $('#play .lives').attr('class', 'lives'); }, 2000);
      }

      // Push to the server levels completed without any lost life
      if (gameStatus.levelReplay.lostLives === 0) {
        // TODO
        // call the API
        //console.log(JSON.stringify(gameStatus.levelReplay));
      }

      makeEverythingFall();
    } else {
      if (validBalls.indexOf(gameStatus.currentBall) == -1) {
        var notPlayableAnimMain = svgAnimate({
          "attributeName": "opacity",
          "from": "0",
          "to": "1",
          "begin": "indefinite",
          "dur": "0.5s",
          "repeatCount": "4",
          "fill": "freeze",
          "id": "notPlayableAnim"
        });
        notPlayableAnimMain.addEventListener('beginEvent', function () { playSound('error'); }, false);
        notPlayableAnimMain.addEventListener('endEvent', notPlayable, false);
        if (null !== drawnCurrentBall) {
          drawnCurrentBall.append(notPlayableAnimMain);
        }
        $('[data-valid=true]').each(function() {
          that = $(this);
          var notPlayableAnim = svgAnimate({
            "attributeName": "opacity",
            "from": "0",
            "to": "1",
            "begin": "notPlayableAnim.begin",
            "dur": "0.5s",
            "repeatCount": "4",
            "fill": "freeze"
          });
          that.append(notPlayableAnim);
        });
        notPlayableAnimMain.beginElement();
      } else {
        storeSet('gameStatus', gameStatus);
        useStored = false;
        if (gameStatus.playing) {
          if (null !== drawnCurrentBall && undefined !== drawnCurrentBall) {
            drawnCurrentBall.remove();
          }
          drawnCurrentBall = drawBall(xToSvg(currentPosX), yToSvg(currentPosY), ESVIJI.settings.balls[gameStatus.currentBall - 1], 'playable');
          $('#play .playzone').on('mousedown touchstart', cursorStart);
          $('#play .playzone').on('mousemove touchmove', cursorMove);
          $('#play .playzone').on('mouseup touchend', cursorEnd);
          $('#play .playzone').on('touchcancel', startNewTurn);
          Mousetrap.bind('up', keyUp);
          Mousetrap.bind('down', keyDown);
          Mousetrap.bind(['enter', 'space'], keyEnter);
          Mousetrap.bind('esc', function() { console.log('esc'); startNewTurn(); });
        }
      }
    }
  }

  function notPlayable() {
    if (null !== drawnCurrentBall) {
      drawnCurrentBall.remove();
    }
    drawnCurrentBall = null;
    removeLife();
    gameStatus.currentBall = validBalls[Math.floor(Math.random() * validBalls.length)];
    startNewTurn();
  }

  function keyUp(event) {
    cursorY = Math.min(Math.max(yToSvg(currentPosY + 1), cursorMaxY), cursorMinY);
    currentPosY = svgToY(cursorY);
    drawnCurrentBall.attr({
      y: cursorY
    });
  }

  function keyDown(event) {
    cursorY = Math.min(Math.max(yToSvg(currentPosY - 1), cursorMaxY), cursorMinY);
    currentPosY = svgToY(cursorY);
    drawnCurrentBall.attr({
      y: cursorY
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
      'class': ''
    });
    moveCount = 0;
    oldPosX = currentPosX;
    oldPosY = currentPosY;

    cursorY = yToSvg(currentPosY);
    drawnCurrentBall.attr({
      y: cursorY
    });
    currentPosY = svgToY(cursorY);

    gameStatus.levelReplay.sequence.push({
      'ball': gameStatus.currentBall,
      'position': currentPosY
    });

    playSound('throw');
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
      y: cursorY
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
      y: cursorY
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
        y: yToSvg(currentPosY)
      });
      moveCount = 0;
      oldPosX = currentPosX;
      oldPosY = currentPosY;

      gameStatus.levelReplay.sequence.push({
        'ball': gameStatus.currentBall,
        'position': currentPosY
      });

      playSound('throw');
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
        playSound('hit-floor');
      });
      endOfMove();
    } else {
      if (currentPosX == 1 && currentDirX == -1) {
        // Against the left wall, should now go down
        currentDirX = 0;
        currentDirY = -1;
        animStackMove(drawnCurrentBall, (oldPosX - currentPosX) * ESVIJI.settings.durationMove, 'x', xToSvg(oldPosX), xToSvg(currentPosX));
        $('#anim' + lastStackedAnimation)[0].addEventListener('endEvent', function(event) {
          playSound('hit-wall');
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
                playSound('hit-wall');
              }, false);
              playUserChoice();
            } else {
              // ...under us, no more possible move
              if (oldPosY != currentPosY) {
                animStackMove(drawnCurrentBall, (oldPosY - currentPosY) * ESVIJI.settings.durationMove, 'y', yToSvg(oldPosY), yToSvg(currentPosY));
              }
              $('#anim' + lastStackedAnimation)[0].addEventListener('endEvent', function(event) {
                playSound('hit-floor');
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
            playSound('hit-same-ball');
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
    var anim = document.createElementNS("http://www.w3.org/2000/svg", type || "animate");
    anim.setAttributeNS(null, "attributeType", "xml");
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
      "attributeName": attribute,
      "from": from,
      "to": to,
      "begin": begin,
      "dur": duration + "s",
      "fill": "freeze",
      "id": "anim" + lastStackedAnimation
    });
    anim.attribute = attribute;
    anim.attributeTo = to;
    anim.addEventListener('endEvent', function (event) {
      // Set new attribute value at the end of the animation
      $(event.currentTarget.parentElement).attr(event.currentTarget.attribute, event.currentTarget.attributeTo);
      // Remove the animation
      $(event.currentTarget).remove();
    }, false);
    ball.append(anim);
  }

  function animStackMorph(ballFrom, ballToId, x, y, attribute, from, to) {
    var ballTo = svgUse("ball" + ballToId, "morph");
    ballTo.attr({
      x: x,
      y: y,
      opacity: 0
    });
    $("#play").append(ballTo);

    // opacity from
    animOpacityFrom = svgAnimate({
      "attributeName": "opacity",
      "to": "0",
      "begin": "anim" + lastStackedAnimation + ".end",
      "dur": ESVIJI.settings.durationMorph + "s",
      "fill": "freeze",
      "id": "anim" + (lastStackedAnimation + 1)
    });
    ballFrom.append(animOpacityFrom);

    // move
    animMoveFrom = svgAnimate({
      "attributeName": attribute,
      "from": from,
      "to": to,
      "begin": "anim" + lastStackedAnimation + ".end",
      "dur": ESVIJI.settings.durationMorph + "s",
      "fill": "freeze",
      "id": "anim" + (lastStackedAnimation + 2)
    });
    ballFrom.append(animMoveFrom);

    // opacity to
    animOpacityTo = svgAnimate({
      "attributeName": "opacity",
      "to": "1",
      "begin": "anim" + lastStackedAnimation + ".end",
      "dur": ESVIJI.settings.durationMorph + "s",
      "fill": "freeze",
      "id": "anim" + (lastStackedAnimation + 3)
    });
    ballTo.append(animOpacityTo);

    // move
    animMoveTo = svgAnimate({
      "attributeName": attribute,
      "from": from,
      "to": to,
      "begin": "anim" + lastStackedAnimation + ".end",
      "dur": ESVIJI.settings.durationMorph + "s",
      "fill": "freeze",
      "id": "anim" + (lastStackedAnimation + 4)
    });
    animMoveTo.addEventListener('beginEvent', function(event) {
      playSound('hit-other-ball-ok');
    }, false);
    ballTo.append(animMoveTo);

    lastStackedAnimation += 4;
  }

  function animStackDestroy(ball, begin) {
    begin = begin || ((lastStackedAnimation === 0) ? "indefinite" : ("anim" + lastStackedAnimation + ".end"));

    // rotate
    var centerX = parseInt(ball.attr('x'), 10) + 16,
        centerY = parseInt(ball.attr('y'), 10) + 16,
        animRotate = svgAnimateTransform({
          "attributeName": "transform",
          "type": "rotate",
          "from": "0 " + centerX + " " + centerY,
          "to": "360 " + centerX + " " + centerY,
          "begin": begin,
          "dur": ESVIJI.settings.durationMove * 2 + "s",
          "fill": "freeze",
          "id": "anim" + (lastStackedAnimation + 1)
        });
    animRotate.addEventListener('beginEvent', function(event) {
      playSound('hit-same-ball');
    }, false);
    ball.append(animRotate);

    // opacity
    var animOpacity = svgAnimate({
      "attributeName": "opacity",
      "to": "0",
      "begin": "anim" + (lastStackedAnimation + 1) + ".begin",
      "dur": ESVIJI.settings.durationMove * 2 + "s",
      "fill": "freeze",
      "id": "anim" + (lastStackedAnimation + 2)
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
        playSound('hit-other-ball-ko');
      }
      drawnCurrentBall = drawBall(xToSvg(ESVIJI.settings.turn.posX), yToSvg(ESVIJI.settings.turn.posY), ESVIJI.settings.balls[gameStatus.currentBall - 1], 'playable');
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
                // Follow through and overlapping action: http://uxdesign.smashingmagazine.com/2012/10/30/motion-animation-new-mobile-ux-design-material/
                dur = dur * (1 + aboveBalls / 3);
                // TODO: add an easing to the fall animation
                animStackMove(drawnCurrentBalls[x][y], dur, 'y', yToSvg(z), yToSvg(y), 'anim' + lastStackedAnimationBeforeFall + '.end');
                // TODO: make the sound later as for piles of falling balls
                $('#anim' + lastStackedAnimation)[0].addEventListener('beginEvent', function(event) {
                  playSound('fall');
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
    nbBalls = ESVIJI.settings.difficulties[gameStatus.preferences.difficulty].balls(thisLevel);
    gameStatus.currentBalls = [];

    for (x = 1; x <= ESVIJI.settings.board.xMax; x++) {
      gameStatus.currentBalls[x] = [];
      for (y = 1; y <= ESVIJI.settings.board.yMax; y++) {
        if (y - 7 > x) {
          // put the "stair" rocks
          gameStatus.currentBalls[x][y] = ESVIJI.settings.rockId;
        } else {
          if ((x <= ESVIJI.settings.difficulties[gameStatus.preferences.difficulty].columns(thisLevel)) && (y <= ESVIJI.settings.difficulties[gameStatus.preferences.difficulty].rows(thisLevel))) {
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
    nbRocks = ESVIJI.settings.difficulties[gameStatus.preferences.difficulty].rocks(thisLevel);
    positionedRocks = 0;
    while (positionedRocks < nbRocks) {
      rock_x = 1 + Math.floor(Math.random() * ESVIJI.settings.difficulties[gameStatus.preferences.difficulty].rows(thisLevel));
      rock_y = 1 + Math.floor(Math.random() * ESVIJI.settings.difficulties[gameStatus.preferences.difficulty].columns(thisLevel));
      if (gameStatus.currentBalls[rock_x][rock_y] !== ESVIJI.settings.rockId) {
        gameStatus.currentBalls[rock_x][rock_y] = ESVIJI.settings.rockId;
        positionedRocks++;
      }
    }
  }

  function drawBall(x, y, ballType, ballId) {
    var ball = svgUse(ballType, ballId);
    ball.attr({
      x: x,
      y: y
    });
    $("#play").append(ball);
    return ball;
  }

  function svgUse(refId, useId) {
    var use = $(document.createElementNS("http://www.w3.org/2000/svg", "use"));
    if (useId !== undefined) {
      use.attr({
        id: useId
      });
    }
    use.get(0).setAttributeNS("http://www.w3.org/1999/xlink", "href", "#" + refId);
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
          ball_x = xToSvg(x);
          ball_y = yToSvg(y);
          if (gameStatus.currentBalls[x][y] == ESVIJI.settings.rockId) {
            rockId = 1 + Math.floor(Math.random() * ESVIJI.settings.rocks.length);
            drawnCurrentBalls[x][y] = drawBall(ball_x, ball_y, ESVIJI.settings.rocks[rockId - 1]);
          } else {
            drawnCurrentBalls[x][y] = drawBall(ball_x, ball_y, ESVIJI.settings.balls[gameStatus.currentBalls[x][y] - 1]);
          }
        }
      }
    }
  }

  function eraseBalls() {
    $('#play use').remove();
  }

  function getValidBalls() {
    var x, y, dir_x, dir_y, found;

    validBalls = [];

    for (y_start = 1; y_start <= 13; y_start++) {
      x = 10;
      y = y_start;
      dir_x = -1;
      dir_y = 0;
      found = false;
      while (!found) {
        if (y == 1 && dir_y == -1) {
          found = true;
        } else {
          if (x == 1 && dir_x == -1) {
            dir_x = 0;
            dir_y = -1;
          } else {
            nextBall = gameStatus.currentBalls[x + dir_x][y + dir_y];
            if (nextBall == ESVIJI.settings.rockId) {
              if (dir_x == -1) {
                dir_x = 0;
                dir_y = -1;
              } else {
                found = true;
              }
            } else {
              if (nextBall == ESVIJI.settings.emptyId) {
                x += dir_x;
                y += dir_y;
              } else {
                drawnCurrentBalls[x + dir_x][y + dir_y].attr('data-valid', 'true');
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
    var l = highScores[gameStatus.preferences.difficulty].length,
        positioned = false;

    // Google Analytics tracking of level and score at the end of the game
    offlineAnalytics.push({ name: 'level', value: gameStatus.level });
    offlineAnalytics.push({ name: 'score', value: gameStatus.score });

    lastGameDate = Date();
    showPanel('gameOver');

    $('#gameOver').find('.score').text('Score: ' + gameStatus.score);
    for (i = 0; i < l; i++) {
      if (!positioned && (highScores[gameStatus.preferences.difficulty][i] === undefined || highScores[gameStatus.preferences.difficulty][i].score <= gameStatus.score)) {
        for (j = l; j > i; j--) {
          highScores[gameStatus.preferences.difficulty][j] = highScores[gameStatus.preferences.difficulty][j - 1];
        }
        highScores[gameStatus.preferences.difficulty][i] = { 'score': gameStatus.score, 'date': lastGameDate};
        positioned = true;
      }
    }
    if (!positioned) {
      highScores[gameStatus.preferences.difficulty][l] = { 'score': gameStatus.score, 'date': lastGameDate};
    }
    storeSet('highScores', highScores);
    gameStatus.playing = false;
    storeSet('gameStatus', {
      'playing': false
    });

    // buttons
    $('#gameOver .scores').one(clickType, function() {
      hidePanel('gameOver');
      hidePanel('play');
      showPanel('main');
      startScores();
    });
    $('#gameOver .playagain').one(clickType, function() {
      hidePanel('gameOver');
      startPlaying();
    });
    $('#gameOver .exit').one(clickType, function() {
      hidePanel('gameOver');
      stopPlaying();
    });
  }

  function removeLife() {
    gameStatus.lives--;
    gameStatus.levelLostLives++;
    playSound('life-down');
    vibrate(500);
    drawLives();
    $('#play .lives').attr('class', 'lives changeDown');
    window.setTimeout(function() { $('#play .lives').attr('class', 'lives'); }, 2000);
    if (gameStatus.lives === 0) {
      gameOver();
    }
  }

  function addLives(nbLives) {
    gameStatus.lives += nbLives;
    playSound('life-up');
    drawLives();
    $('#play .lives').attr('class', 'lives changeUp');
    window.setTimeout(function() { $('#play .lives').attr('class', 'lives'); }, 2000);
  }

  function addScore(scoreToAdd) {
    oldScore = gameStatus.score;
    gameStatus.score += ESVIJI.settings.difficulties[gameStatus.preferences.difficulty].points(scoreToAdd);
    increaseScore();
    $('#play .score').attr('class', 'score changeUp');
    window.setTimeout(function() { $('#play .score').attr('class', 'score'); }, 2000);
    hundreds = Math.floor(gameStatus.score / ESVIJI.settings.difficulties[gameStatus.preferences.difficulty].extraLifePoints) - Math.floor(oldScore / ESVIJI.settings.difficulties[gameStatus.preferences.difficulty].extraLifePoints);
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
    return (x - 1) * 32;
  }

  function yToSvg(y) {
    return ESVIJI.settings.board.height - 32 * y;
  }

  function svgToX(coordX) {
    return coordX / 32 + 1;
  }

  function svgToY(coordY) {
    return Math.round((ESVIJI.settings.board.height - coordY) / 32);
  }

  function pixelsToSvgY(coordY) {
    return (coordY - boardOffsetY) * ESVIJI.settings.board.height / boardHeight;
  }

  function playSound(type) {
    if (gameStatus.preferences.sound && sounds._loaded) {
      sounds.play(type);
    }
  }

  function vibrate(duration) {
    if (Modernizr.testProp('vibrate') && gameStatus.preferences.vibration) {
      navigator.vibrate = navigator.vibrate || navigator.mozVibrate || navigator.webkitVibrate;
      navigator.vibrate(duration);
    }
  }

  function install() {
    var manifestUrl = location.href.substring(0, location.href.lastIndexOf('/')) + '/manifest.webapp';
    var request = window.navigator.mozApps.install(manifestUrl);
    request.onsuccess = function() {
      // var appRecord = this.result;
      alert('Installation successful!');
      $('#installButton').css('display', 'none');
    };
    request.onerror = function() {
      // Display the error information from the DOMError object
      console.error('Install failed, error: ' + this.error.name);
    };
  }

  function showInstall() {
    if (undefined !== navigator.mozApps) {
      var request = navigator.mozApps.getSelf();
      request.onsuccess = function() {
        if (request.result) {
          // we're installed, nothing to do
        } else {
          $('#installButton').css('display', 'block').one(clickType, install);
        }
      };
      request.onerror = function() {
        console.error('Error checking installation status: ' + this.error.message);
      };
    }
  }

  return {
    init: init,
    viewportOptimize: viewportOptimize
  };
})();

document.addEventListener('DOMContentLoaded', function() {
  ESVIJI.game.init();
});

window.addEventListener('resize', ESVIJI.game.viewportOptimize);
window.addEventListener('orientationchange', ESVIJI.game.viewportOptimize);

/***************************************************************************************
 * appcache
 ***************************************************************************************/

// Check if a new cache is available
if (window.applicationCache) {
  window.applicationCache.addEventListener('updateready', function(e) {
    if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
      // Browser downloaded a new app cache
      // Swap it in and reload the page to get the new version
      window.applicationCache.swapCache();
      window.location.reload();
    }
  }, false);
}
