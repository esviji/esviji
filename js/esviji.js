// ## Create the main object

var ESVIJI = {};

// ## Add default settings

ESVIJI.settings = {
  version: '1.5.1',
  // board size and according ball extreme positions
  'board': {
    'width': 320,
    'height': 460,
    'xMax': 10,
    'yMax': 13
  },
  // list of available ball "names"
  'balls': ['ball1', 'ball2', 'ball3', 'ball4', 'ball5', 'ball6'],
  // list of available rock "names" (only one for now)
  'rocks': ['rock'],
  // special ids for the game matrix
  'emptyId': 0,
  'rockId': -1,
  // game info at launch time
  'launch': {
    'lives': 9,
    'score': 0,
    'level': 1
  },
  // game info at new turn start
  'turn': {
    'posX': 10,
    'dirX': -1,
    'posY': 8,
    'dirY': 0
  },
  // animation settings
  'durationMove': 0.15,
  'durationMorph': 0.5
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
    highScores = store.get('highScores') || [ ],
    lastGameDate = '',
    gameStatus = store.get('gameStatus') || {
      'currentBalls': [],
      'currentBall': 0,
      'level': 0,
      'score': 0,
      'lives': 0,
      'playing': false
    },
    useStored = false,
    sounds = {},
    clickType = 'click';

  // Initialization
  function init() {
    if (Modernizr.touch) {
      clickType = 'touchstart';
    }
    $('.version').text(ESVIJI.settings.version);
    viewportOptimize();
    cursorMinY = yToSvg(1);
    cursorMaxY = yToSvg(ESVIJI.settings.board.yMax);
    maxAvailableBalls = ESVIJI.settings.balls.length;
    // Available sounds
    sounds = {
      'error': {
        'sound': T("tri", T("tri", 2, 30, 880).kr(), 0.25),
        'dur': 1000
      },
      'destroy': {
        'sound': T("*", T("sin", 440), T("sin", 880)).set({mul: 0.25}),
        'dur': 100
      },
      'lostLife': {
        'sound': T("*", T("sin", 523.35), T("sin", 659.25), T("sin", 783.99)).set({mul: 0.25}),
        'dur': 300
      }
    };
    run();
  }

  function run() {
    showInstall();
    if (typeof gameStatus.playing === 'undefined' || gameStatus.playing === false) {
      startMain();
    } else {
      useStored = true;
      startPlaying();
    }
  }

  function viewportOptimize() {
    if (viewportWidth != document.body.clientWidth || viewportHeight != document.body.clientHeight) {
      viewportWidth = document.body.clientWidth;
      viewportHeight = document.body.clientHeight;
      //console.log(viewportWidth + ' / ' + viewportHeight);
      if (viewportHeight / viewportWidth > ESVIJI.settings.board.height / ESVIJI.settings.board.width) {
        // tall
        boardWidth = viewportWidth;
        boardHeight = ESVIJI.settings.board.height / ESVIJI.settings.board.width * boardWidth;
        boardOffsetY = viewportHeight - boardHeight; // top empty area height
        $('body').addClass('tall').removeClass('large');
      } else {
        // large
        boardHeight = viewportHeight;
        boardWidth = ESVIJI.settings.board.width / ESVIJI.settings.board.height * boardHeight;
        boardOffsetY = 0;
        $('body').addClass('large').removeClass('tall');
      }
    }
  }

  function startMain() {
    $('#main .start').one(clickType, startPlaying);
    $('#main .tutorial').one(clickType, startTutorial);
    $('#main .scores').one(clickType, startScores);
  }

  function startPlaying(event) {
    if (undefined !== event) {
      event.preventDefault();
    }
    hidePanel('main');
    if (!useStored) {
      gameStatus.level = ESVIJI.settings.launch.level;
      gameStatus.score = ESVIJI.settings.launch.score;
      gameStatus.lives = ESVIJI.settings.launch.lives;
      hidePanel('play');
      if (drawnCurrentBall !== null) {
        drawnCurrentBall.remove();
        drawnCurrentBall = null;
      }
    }
    showPanel('play');
    drawLevel();
    drawScore();
    drawLives();
    $('#play .pauseButton').one(clickType, pause);
    nextLevel();
  }

  function startTutorial() {
    hidePanel('main');
    showPanel('tutorial');
    $('#tutorial .pauseButton').one(clickType, endTutorial);
    $('#tutoAnimEnd')[0].addEventListener('endEvent', endTutorial, false);
    $('#tutoAnimStart')[0].beginElement();
  }

  function endTutorial(event) {
    event.preventDefault();
    hidePanel('tutorial');
    showPanel('main');
    startMain(event);
  }

  function startScores() {
    var l = highScores.length,
        scoresToShow = Math.min(l, 9);

    hidePanel('main');
    showPanel('scores');

    for (i = 0; i < scoresToShow; i++) {
      $('#scores .highscores text').eq(i).text(highScores[i].score);
      if (lastGameDate === highScores[i].date) {
        $('#scores .highscores text').eq(i).attr('class', 'thisone');
      }
    }
    $('#scores .exit').one(clickType, endScores);
  }

  function endScores(event) {
    event.preventDefault();
    hidePanel('scores');
    showPanel('main');
    startMain();
  }

  function showPanel(panel) {
    if ( $('#' + panel).length === 0 && $('#' + panel + 'Panel').length === 1) {
      $('#' + panel + 'Panel').clone().attr('id', panel).appendTo('#board');
      $('#' + panel + 'Panel').remove();
      if (panel === 'pause' || panel === 'gameOver') {
        $('#play').css('opacity', 0.3);
      }
      // Google Analytics tracking of activated panel
      _gaq.push(['_trackPageview', '/' + panel + '/']);
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
    if (!useStored) {
      initBalls();
      drawBalls();
      getValidBalls();
      gameStatus.currentBall = validBalls[Math.floor(Math.random() * validBalls.length)];
    } else {
      drawBalls();
    }
    stackedAnimationToStart = 1;
    lastStackedAnimation = 0;
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

    if (validBalls.length === 0) {
      // no more valid ball, end of the turn
      drawnCurrentBall.remove(); // TODO: animate
      drawnCurrentBall = null;
      gameStatus.level++;
      drawLevel();
      $('#play .level').attr('class', 'level changeUp');
      window.setTimeout(function() { $('#play .level').attr('class', 'level'); }, 2000);
      gameStatus.lives++;
      drawLives();
      $('#play .lives').attr('class', 'lives changeUp');
      window.setTimeout(function() { $('#play .lives').attr('class', 'lives'); }, 2000);
      nextLevel();
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
        notPlayableAnimMain.addEventListener("beginEvent", function () { playSound('error'); }, false);
        notPlayableAnimMain.addEventListener("endEvent", notPlayable, false);
        drawnCurrentBall.append(notPlayableAnimMain);
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
        store.set('gameStatus', gameStatus);
        useStored = false;
        if (gameStatus.playing) {
          if (drawnCurrentBall === null) {
            drawnCurrentBall = drawBall(xToSvg(currentPosX), yToSvg(currentPosY), ESVIJI.settings.balls[gameStatus.currentBall - 1], 'playable');
          }
          $('#play .playzone').on('mousedown touchstart', cursorStart);
          $('#play .playzone').on('mousemove touchmove', cursorMove);
          $('#play .playzone').on('mouseup touchend', cursorEnd);
          Mousetrap.bind('up', keyUp);
          Mousetrap.bind('down', keyDown);
          Mousetrap.bind(['enter', 'space'], keyEnter);
        }
      }
    }
  }

  function notPlayable() {
    drawnCurrentBall.remove();
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
    moveCount = 0;
    oldPosX = currentPosX;
    oldPosY = currentPosY;
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
      'class': 'dragged',
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
      drawnCurrentBall.attr({
        'class': ''
      });
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
      endOfMove();
    } else {
      if (currentPosX == 1 && currentDirX == -1) {
        // Against the left wall, should now go down
        currentDirX = 0;
        currentDirY = -1;
        animStackMove(drawnCurrentBall, (oldPosX - currentPosX) * ESVIJI.settings.durationMove, 'x', xToSvg(oldPosX), xToSvg(currentPosX));
        oldPosX = currentPosX;
        playUserChoice();
      } else {
        // Neither floor nor wall, so what is it?
        nextBall = gameStatus.currentBalls[currentPosX + currentDirX][currentPosY + currentDirY];
        switch (nextBall) {
          case ESVIJI.settings.rockId:
            // A rock...
            if (currentDirX == -1) {
              // ...at our left, should no go down
              currentDirX = 0;
              currentDirY = -1;
              animStackMove(drawnCurrentBall, (oldPosX - currentPosX) * ESVIJI.settings.durationMove, 'x', xToSvg(oldPosX), xToSvg(currentPosX));
              oldPosX = currentPosX;
              playUserChoice();
            } else {
              // ...under us, no more possible move
              if (oldPosY != currentPosY) {
                animStackMove(drawnCurrentBall, (oldPosY - currentPosY) * ESVIJI.settings.durationMove, 'y', yToSvg(oldPosY), yToSvg(currentPosY));
              }
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
    for (x = 1; x <= 6; x++) {
      for (y = 1; y <= 7; y++) {
        if (drawnCurrentBalls[x][y] !== null) {
          drawnCurrentBalls[x][y].attr({
            'y': yToSvg(y)
          });
        }
      }
    }
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

    anim = svgAnimate({
      "attributeName": attribute,
      "from": from,
      "to": to,
      "begin": begin,
      "dur": duration + "s",
      "fill": "freeze",
      "id": "anim" + (lastStackedAnimation + 1)
    });
    ball.append(anim);

    lastStackedAnimation++;
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
    ballTo.append(animMoveTo);

    lastStackedAnimation += 4;
  }

  function animStackDestroy(ball, begin) {
    begin = begin || ("anim" + lastStackedAnimation + ".end");

    // rotate
    var animRotate = svgAnimateTransform({
      "attributeName": "transform",
      "type": "rotate",
      "from": "0 " + (parseInt(ball.attr('x'), 10) + 16) + " " + (parseInt(ball.attr('y'), 10) + 16),
      "to": "360 " + (parseInt(ball.attr('x'), 10) + 16) + " " + (parseInt(ball.attr('y'), 10) + 16),
      "begin": begin,
      "dur": ESVIJI.settings.durationMove * 2 + "s",
      "fill": "freeze",
      "id": "anim" + (lastStackedAnimation + 1)
    });
    animRotate.addEventListener("beginEvent", function(event) {
      playSound('destroy');
    }, false);
    ball.append(animRotate);

    // opacity
    var animOpacity = svgAnimate({
      "attributeName": "opacity",
      "to": "0",
      "begin": begin,
      "dur": ESVIJI.settings.durationMove * 2 + "s",
      "fill": "freeze",
      "id": "anim" + (lastStackedAnimation + 2)
    });
    animOpacity.addEventListener("endEvent", function(event) {
      thisBall = $(event.currentTarget.parentElement);
      thisBall.remove();
    }, false);
    ball.append(animOpacity);

    lastStackedAnimation += 2;
  }

  function endOfMove() {
    $('#anim' + lastStackedAnimation)[0].addEventListener("endEvent", function(event) {
      drawnCurrentBall.remove();
      $('#morph').remove();
      drawnCurrentBall = drawBall(xToSvg(ESVIJI.settings.turn.posX), yToSvg(ESVIJI.settings.turn.posY), ESVIJI.settings.balls[gameStatus.currentBall - 1], 'playable');
    });

    makeBallsFall();
  }

  function makeBallsFall() {
    var aboveBalls;

    lastStackedAnimationBeforeFall = lastStackedAnimation;
    for (x = 1; x <= 6; x++) {
      for (y = 1; y <= 7; y++) {
        if (gameStatus.currentBalls[x][y] == ESVIJI.settings.emptyId) {
          aboveBalls = 0;
          for (z = y; z <= 6; z++) {
            if (gameStatus.currentBalls[x][z + 1] == ESVIJI.settings.rockId) {
              z = 7;
            } else {
              if (gameStatus.currentBalls[x][z + 1] != ESVIJI.settings.emptyId) {
                aboveBalls++;
                gameStatus.currentBalls[x][z] = gameStatus.currentBalls[x][z + 1];
                gameStatus.currentBalls[x][z + 1] = ESVIJI.settings.emptyId;
                // Follow through and overlapping action: http://uxdesign.smashingmagazine.com/2012/10/30/motion-animation-new-mobile-ux-design-material/
                dur = ESVIJI.settings.durationMove * (1 + aboveBalls / 3);
                animStackMove(drawnCurrentBalls[x][z + 1], dur, 'y', yToSvg(z + 1), yToSvg(z), 'anim' + lastStackedAnimationBeforeFall + '.end');
                drawnCurrentBalls[x][z] = drawnCurrentBalls[x][z + 1];
                drawnCurrentBalls[x][z + 1] = null;
              }
            }
          }
          if (aboveBalls > 0) {
            // for multiple empty lines
            y--;
          }
        }
      }
    }

    if (lastStackedAnimation >= stackedAnimationToStart) {
      $('#anim' + lastStackedAnimation)[0].addEventListener("endEvent", function(event) {
        endOfTurn();
      }, false);
      $('#anim' + stackedAnimationToStart)[0].beginElement();
    } else {
      endOfTurn();
    }
  }

  function initBalls(thisLevel) {
    thisLevel = thisLevel || gameStatus.level;
    nbBalls = Math.min(maxAvailableBalls, Math.floor(3 + (thisLevel / 3)));
    gameStatus.currentBalls = [];

    for (x = 1; x <= ESVIJI.settings.board.xMax; x++) {
      gameStatus.currentBalls[x] = [];
      for (y = 1; y <= ESVIJI.settings.board.yMax; y++) {
        if (y - 7 > x) {
          // put the "stair" rocks
          gameStatus.currentBalls[x][y] = ESVIJI.settings.rockId;
        } else {
          if ((x <= Math.max(Math.min(thisLevel, 6), 3)) && (y <= Math.max(Math.min(thisLevel, 7), 3))) {
            // a ball
            gameStatus.currentBalls[x][y] = 1 + Math.floor(Math.random() * nbBalls);
          } else {
            // empty
            gameStatus.currentBalls[x][y] = ESVIJI.settings.emptyId;
          }
        }
      }
    }
    // add rocks in the middle after level 10
    if (thisLevel > 8) {
      nbRocks = Math.floor((thisLevel - 6) / 3);
      positionedRocks = 0;
      while (positionedRocks < nbRocks) {
        rock_x = 1 + Math.floor(Math.random() * 6);
        rock_y = 1 + Math.floor(Math.random() * 6);
        if (gameStatus.currentBalls[rock_x][rock_y] !== ESVIJI.settings.rockId) {
          gameStatus.currentBalls[rock_x][rock_y] = ESVIJI.settings.rockId;
          positionedRocks++;
        }
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

  function stopPlaying() {
    gameStatus.playing = false;
    gameStatus.level = 0;
    gameStatus.score = 0;
    gameStatus.lives = 0;
    eraseBalls();
    if (drawnCurrentBall !== null) {
      drawnCurrentBall.remove();
    }
    hidePanel('play');
    showPanel('main');
    store.set('gameStatus', {
      'playing': false
    });
    run();
  }

  function pause() {
    showPanel('pause');
    $('#pause .resume').one(clickType, function(e) {
      e.preventDefault();
      hidePanel('pause');
      $('#play .pauseButton').one(clickType, pause);
    });
    $('#pause .restart').one(clickType, function(e) {
      e.preventDefault();
      hidePanel('pause');
      store.set('gameStatus', {
        'playing': false
      });
      startPlaying();
    });
    $('#pause .exit').one(clickType, function(e) {
      e.preventDefault();
      hidePanel('pause');
      stopPlaying();
    });
  }

  function gameOver() {
    var l = highScores.length,
        positioned = false;

    lastGameDate = Date();
    showPanel('gameOver');

    // Google Analytics tracking of level and score at the end of the game
    _gaq.push(['_trackPageview', '/play/level/' + gameStatus.level]);
    _gaq.push(['_trackPageview', '/play/score/' + gameStatus.score]);

    $('#gameOver').find('.score').text('Score: ' + gameStatus.score);
    for (i = 0; i < l; i++) {
      if (!positioned && (highScores[i] === undefined || highScores[i].score <= gameStatus.score)) {
        for (j = l; j > i; j--) {
          highScores[j] = highScores[j - 1];
        }
        highScores[i] = { 'score': gameStatus.score, 'date': lastGameDate};
        positioned = true;
      }
    }
    if (!positioned) {
      highScores[l] = { 'score': gameStatus.score, 'date': lastGameDate};
    }
    store.set('highScores', highScores);
    gameStatus.playing = false;
    store.set('gameStatus', {
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
    playSound('lostLife');
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
    drawLives();
    $('#play .lives').attr('class', 'lives changeUp');
    window.setTimeout(function() { $('#play .lives').attr('class', 'lives'); }, 2000);
  }

  function addScore(scoreToAdd) {
    oldScore = gameStatus.score;
    gameStatus.score += Math.pow(scoreToAdd, 3);
    increaseScore();
    $('#play .score').attr('class', 'score changeUp');
    window.setTimeout(function() { $('#play .score').attr('class', 'score'); }, 2000);
    hundreds = Math.floor(gameStatus.score / 100) - Math.floor(oldScore / 100);
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
    sounds[type].sound.play();
    window.setTimeout(function() { sounds[type].sound.pause(); }, sounds[type].dur);
  }

  function vibrate(duration) {
    if ('function' === typeof(navigator.vibrate)) {
      navigator.vibrate(duration);
    }
  }

  function debug(string) {
    console.log(string);
    matrix = '';
    for (y = ESVIJI.settings.board.yMax; y >= 1; y--) {
      for (x = 1; x <= ESVIJI.settings.board.xMax; x++) {
        matrix += gameStatus.currentBalls[x][y] + ' ';
      }
      matrix += "\n";
    }
    console.log(matrix);
    console.log('ball: ' + gameStatus.currentBall + ' | posXY: ' + currentPosX + '/' + currentPosY + ' | dirXY: ' + currentDirX + '/' + currentDirY + ' | stackedAnimationToStart: ' + stackedAnimationToStart + ' | lastStackedAnimation: ' + lastStackedAnimation);
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
      console.log('Install failed, error: ' + this.error.name);
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
        console.log('Error checking installation status: ' + this.error.message);
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

/***************************************************************************************
 * Hide address bar in mobile browsers
 * http://mobile.tutsplus.com/tutorials/mobile-web-apps/remove-address-bar/
 ***************************************************************************************/

function hideAddressBar()
{
  if (!window.location.hash) {
      // Enlarge desktop browser viewport
      // if (document.height < window.outerHeight) {
      //     document.body.style.height = (window.outerHeight + 50) + 'px';
      // }
      setTimeout(function() {
        window.scrollTo(0, 1);
      }, 50);
  }
}

window.addEventListener('load', function() {
  if (!window.pageYOffset) {
    hideAddressBar();
  }
});
window.addEventListener('orientationchange', hideAddressBar);

/***************************************************************************************
 * appcache
 ***************************************************************************************/

// Check if a new cache is available on page load.
window.addEventListener('load', function(e) {
  window.applicationCache.addEventListener('updateready', function(e) {
    if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
      // Browser downloaded a new app cache.
      // Swap it in and reload the page to get the new hotness.
      window.applicationCache.swapCache();
      if (confirm('A new version is available. Do you want it right now, without losing your game?')) {
        window.location.reload();
      }
    }
  }, false);
}, false);
