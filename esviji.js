var ESVIJI = {};

ESVIJI.settings = {
  'debug': true,
  'board': { 'width': 320, 'height': 460 },
  'pieces': ['piece1', 'piece2', 'piece3', 'piece4', 'piece5', 'piece6', 'piece7', 'piece8', 'piece9', 'piece10', 'piece11', 'piece12', 'piece13', 'piece14'],
  'rocks': ['rock'],
  'emptyId': 0,
  'rockId': -1,
  'launch': { 'lives': 9, 'score': 0, 'level': 1 },
  'turn': { 'posX': 10, 'dirX': -1, 'posY': 8, 'dirY': 0 }  
}

ESVIJI.game = (function(){
  var
    currentPieces = [],
    drawnCurrentPieces = [],
    validPieces = [],
    currentPiece = 0,
    drawnCurrentPiece = null,
    currentPosX = 0,
    currentPosY = 0,
    currentDirX = -1,
    currentDirY = 0,
    dragged = false,
    moveCount = 0,
    cursorY = 0,
    cursorMinY = 0,
    cursorMaxY = 0,
    maxAvailablePieces = 0,
    nbPieces = 0,
    level,
    score,
    lives,
    scoreThisTurn = 0,
    playing = false,
    stopped = false;
    
  function init() {
    cursorMinY = yToSvg(1);
    cursorMaxY = yToSvg(13);
    maxAvailablePieces = ESVIJI.settings['pieces'].length;
    
    $('#main .start').on('click', startPlaying );
  }

  function startPlaying() {
    level = ESVIJI.settings['launch']['level'] - 1; // nextLevel() will add one
    score = ESVIJI.settings['launch']['score'];
    lives = ESVIJI.settings['launch']['lives'] - 1; // nextLevel() will add one
    $('#play').remove();
    if (drawnCurrentPiece !== null) {
      drawnCurrentPiece.remove();
    }
    $('#playPanel').clone().attr('id', 'play').appendTo('#board');
    $('.pauseButton').on('click', pause);
    //  $("#fullscreen").on("click", function() {
    //    fs = new Fullscreen($("#board"));
    //    fs.request();
    //  });
    nextLevel();
  }
  
  function nextLevel() {
    playing = true;
    drawScore();
    level++;
    drawLevel();
    lives++;
    drawLives();
    nbPieces = Math.min(maxAvailablePieces, Math.floor(3 + (level / 3)));

    erasePieces();
    
    initPieces();
    drawPieces();

    getValidPieces();
    currentPiece = validPieces[Math.floor(Math.random() * validPieces.length)];
    startNewTurn();
  }
  
  function startNewTurn() {
    currentPosX = ESVIJI.settings['turn']['posX'];
    currentDirX = ESVIJI.settings['turn']['dirX'];
    currentPosY = ESVIJI.settings['turn']['posY'];
    currentDirY = ESVIJI.settings['turn']['dirY'];
    scoreThisTurn = 0;
    getValidPieces();
    if (validPieces.length == 0) {
      // no more valid piece, end of the turn
      nextLevel();
    } else {
      if (validPieces.indexOf(currentPiece) == -1) {
        removeLife();
        currentPiece = validPieces[Math.floor(Math.random() * validPieces.length)];
      }
      if (playing) {
        drawnCurrentPiece = drawPiece(xToSvg(currentPosX), yToSvg(currentPosY), ESVIJI.settings['pieces'][currentPiece - 1], "playable");

        $("#board").on('mousemove touchmove', cursorMove);
        $("#board").on('mouseup touchend', cursorEnd);
        drawnCurrentPiece.on('mousedown touchstart', cursorStart);
      }
    }
  }

  function cursorStart (event) {
    event.preventDefault();
    dragged = true;
    drawnCurrentPiece.attr({ class: "dragged" });
    if (level < 4) {
      drawPiece(240, yToSvg(currentPosY), 'arrow', 'showAim');
    }
  }

  function cursorMove (event) {
    event.preventDefault();
    if (dragged) {
      if(event.originalEvent.touches && event.originalEvent.touches.length) {
          event = event.originalEvent.touches[0];
      } else if(event.originalEvent.changedTouches && event.originalEvent.changedTouches.length) {
          event = event.originalEvent.changedTouches[0];
      }
      cursorY = Math.min(Math.max(pixelsToSvgY(event.pageY) - 16, cursorMaxY), cursorMinY);
      currentPosY = svgToY(cursorY);
      drawnCurrentPiece.attr({ y: cursorY });
      if (level < 4) {
        $('#showAim').attr({ y: yToSvg(currentPosY) });
      }
    }
  }

  function cursorEnd (event) {
    event.preventDefault();
    if (dragged) {
      if(event.originalEvent.touches && event.originalEvent.touches.length) {
          event = event.originalEvent.touches[0];
      } else if(event.originalEvent.changedTouches && event.originalEvent.changedTouches.length) {
          event = event.originalEvent.changedTouches[0];
      }
      dragged = false;
      drawnCurrentPiece.attr({ class: "" });
      cursorY = Math.min(Math.max(pixelsToSvgY(event.pageY) - 16, cursorMaxY), cursorMinY);
      currentPosY = svgToY(cursorY);
      drawnCurrentPiece.attr({ y: yToSvg(currentPosY) });
      moveCount = 0;
      lastStackedAnimation = 0;
      oldPosX = currentPosX;
      oldPosY = currentPosY;
      $('#showAim').remove();
      stopped = false;
      playUserChoice();
    }
  }  

  function playUserChoice () {
    if (stopped) {
      score += Math.pow(scoreThisTurn, 2);
      drawScore();
      drawnCurrentPiece.remove();
      makePiecesFall();
      startNewTurn();
    } else {
      moveCount++;
      if (currentPosY == 1 && currentDirY == -1) {
        stopped = true;
        if (oldPosY != 1) {
          stackAnimation(drawnCurrentPiece, 'move', (oldPosY - currentPosY) / 10, 'y', yToSvg(oldPosY), yToSvg(currentPosY));
        }
        startAnimation();
      } else {
        if (currentPosX == 1 && currentDirX == -1) {
          currentDirX = 0;
          currentDirY = -1;
          stackAnimation(drawnCurrentPiece, 'move', (oldPosX - currentPosX) / 10, 'x', xToSvg(oldPosX), xToSvg(currentPosX));
          oldPosX = currentPosX;
        } else {
          nextPiece = currentPieces[currentPosX + currentDirX][currentPosY + currentDirY];
          switch (nextPiece) {
            case ESVIJI.settings['rockId']:
              if (currentDirX == -1) {
                currentDirX = 0;
                currentDirY = -1;
                stackAnimation(drawnCurrentPiece, 'move', (oldPosX - currentPosX) / 10, 'x', xToSvg(oldPosX), xToSvg(currentPosX));
                oldPosX = currentPosX;
              } else {
                stopped = true;
                if (oldPosY != 1) {
                  stackAnimation(drawnCurrentPiece, 'move', (oldPosY - currentPosY) / 10, 'y', yToSvg(oldPosY), yToSvg(currentPosY));
                }
                startAnimation();
              }
              break;
            case ESVIJI.settings['emptyId']:
              currentPosX += currentDirX;
              currentPosY += currentDirY;
              playUserChoice();
              break;
            case currentPiece:
              currentPosX += currentDirX;
              currentPosY += currentDirY;
              currentPieces[currentPosX][currentPosY] = ESVIJI.settings['emptyId'];
              stackAnimation(drawnCurrentPieces[currentPosX][currentPosY], 'destroy');
              scoreThisTurn++;
              playUserChoice();
              break;
            default:
              if (scoreThisTurn > 0) {
                currentPiece = nextPiece;
              }
              stopped = true;
              if (currentPosX != oldPosX) {
                stackAnimation(drawnCurrentPiece, 'move', (oldPosX - currentPosX) / 10, 'x', xToSvg(oldPosX), xToSvg(currentPosX));
              } else if (currentPosY != oldPosY) {
                stackAnimation(drawnCurrentPiece, 'move', (oldPosY - currentPosY) / 10, 'y', yToSvg(oldPosY), yToSvg(currentPosY));
              }
              startAnimation();
          }
        }
      }
    }
  }
  
  function stackAnimation(piece, animation, duration, attribute, from, to) {
    switch (animation) {
      case 'move':
        anim = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        anim.setAttributeNS(null, "attributeType", "xml");
        anim.setAttributeNS(null, "attributeName", attribute);
        anim.setAttributeNS(null, "from", from);
        anim.setAttributeNS(null, "to", to);
        if (lastStackedAnimation == 0) {
          anim.setAttributeNS(null, "begin", "indefinite");
        } else {
          anim.setAttributeNS(null, "begin", "anim" + lastStackedAnimation + ".end");
        }
        anim.setAttributeNS(null, "dur", duration + "s");
        anim.setAttributeNS(null, "fill", "freeze");
        anim.setAttributeNS(null, "id", "anim" + (lastStackedAnimation + 1));
        piece.append(anim);
        lastStackedAnimation++;
        break;
      case 'destroy':
        piece.remove();
        break;
    }
  }
  
  function startAnimation() {
    $('#anim' + lastStackedAnimation)[0].addEventListener("end", function(event) { playUserChoice(); }, false);
    $('#anim1')[0].beginElement();
  }
  
  function makePiecesFall() {
    var abovePieces;
    
    for(x = 1; x <= 6; x++) {
      for (y = 1; y <= 7; y++) {
        if (currentPieces[x][y] == ESVIJI.settings['emptyId']) {
          abovePieces = 0;
          for (z = y; z <= 6; z++) {
            if (currentPieces[x][z + 1] != ESVIJI.settings['emptyId'] && currentPieces[x][z + 1] != ESVIJI.settings['rockId']) {
              abovePieces++;
            }
            if (currentPieces[x][z + 1] == ESVIJI.settings['rockId']) {
              z = 7;
            } else {
              currentPieces[x][z] = currentPieces[x][z + 1];
              currentPieces[x][z + 1] = ESVIJI.settings['emptyId'];
              if (drawnCurrentPieces[x][z + 1] != null) {
                drawnCurrentPieces[x][z] = drawnCurrentPieces[x][z + 1];
                drawnCurrentPieces[x][z].attr({'y': yToSvg(z)});
                drawnCurrentPieces[x][z + 1] = null;
              }
            }
          }
          if (abovePieces > 0) {
            y--;
          }
        }
      }
    }
  }
  
  function initPieces() {
    currentPieces = [];
        
    for(x = 1; x <= 9; x++) {
      currentPieces[x] = [];
      for (y = 1; y <= 13; y++) {
        if (x > Math.max(Math.min(level, 6), 3)) {
          currentPieces[x][y] = ESVIJI.settings['emptyId'];
        } else {
          if (y > Math.max(Math.min(level, 7), 3)) {
            if (y - 7 > x) {
              currentPieces[x][y] = ESVIJI.settings['rockId'];
            } else {
              currentPieces[x][y] = ESVIJI.settings['emptyId'];
            }
          } else {
            currentPieces[x][y] = 1 + Math.floor(Math.random() * nbPieces);
          }
        }
      }
    }
    // add rocks in the middle after level 10
    if (level > 8) {
      nbRocks = Math.floor((level - 6) / 3);
      positionedRocks = 0;
      while (positionedRocks < nbRocks) {
        rock_x = 1 + Math.floor(Math.random() * 6);
        rock_y = 1 + Math.floor(Math.random() * 6);
        if (currentPieces[rock_x][rock_y] != ESVIJI.settings['rockId']) {
          currentPieces[rock_x][rock_y] = ESVIJI.settings['rockId'];
          positionedRocks++;
        }
      }
    }
  }
  
  function drawPiece(x, y, pieceType, pieceId) {
    var piece = svgUse(pieceType, pieceId);
    piece.attr({ x: x, y: y });
    $("#board").append(piece);
    return piece;
  }

  function svgUse(refId, useId) {
    var use = $(document.createElementNS("http://www.w3.org/2000/svg","use"));
    if (useId !== undefined) {
      use.attr({ id: useId });
    }
    use.get(0).setAttributeNS("http://www.w3.org/1999/xlink","href","#" + refId);
    return use;
  }
    
  function drawPieces() {
    drawnCurrentPieces = [];
    for(x = 1; x <= 7; x++) {
      drawnCurrentPieces[x] = [];
      for (y = 1; y <= 7; y++) {
        if (currentPieces[x][y] != ESVIJI.settings['emptyId']) {
          piece_x = xToSvg(x);
          piece_y = yToSvg(y);
          if (currentPieces[x][y] == ESVIJI.settings['rockId']) {
            rockId = 1 + Math.floor(Math.random() * ESVIJI.settings['rocks'].length)
            drawnCurrentPieces[x][y] = drawPiece(piece_x, piece_y, ESVIJI.settings['rocks'][rockId - 1]);
          } else {
            drawnCurrentPieces[x][y] = drawPiece(piece_x, piece_y, ESVIJI.settings['pieces'][currentPieces[x][y] - 1]);
          }
        }
      }
    }
  }

  function erasePieces() {
    for(x = 1; x <= 9; x++) {
      if (drawnCurrentPieces[x] != undefined) {
        for (y = 1; y <= 13; y++) {
          if (drawnCurrentPieces[x][y] != null) {
            drawnCurrentPieces[x][y].remove();
          }
        }
      }
    }
  }

  function getValidPieces() {
    var x, y, dir_x, dir_y, found;

    validPieces = [];
    
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
            nextPiece = currentPieces[x + dir_x][y + dir_y];
            if (nextPiece == ESVIJI.settings['rockId']) {
              if (dir_x == -1) {
                dir_x = 0;
                dir_y = -1;
              } else {
                found = true;
              }
            } else {
              if (nextPiece == ESVIJI.settings['emptyId']) {
                x += dir_x;
                y += dir_y;
              } else {
                if (validPieces.indexOf(nextPiece) == -1) {
                  validPieces.push(nextPiece);
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
    playing = false;
    level = 0;
    score = 0;
    lives = 0;
    erasePieces();
    if (drawnCurrentPiece !== null) {
      drawnCurrentPiece.remove();
    }
    $('#play').remove();
  }
  
  function pause() {
    $('#pausePanel').clone().attr('id', 'pause').appendTo('#board');
    $('#pause .resume').on('click', function() {
      $('#pause').remove();
    });
    $('#pause .restart').on('click', function() {
      $('#pause').remove();
      startPlaying();
    });
    $('#pause .exit').on('click', function() {
      $('#pause').remove();
      stopPlaying();
    });
  }

  function gameOver() {
    $('#gameOverPanel').clone().attr('id', 'gameOver').appendTo('#board');
    $('#gameOver').find('.score').text('Score: ' + score);
    $('.playagain').on('click', function () {
      $('#gameOver').remove();
      startPlaying();
    });
    $('.exit').on('click', function () {
      $('#gameOver').remove();
      stopPlaying();
    });
    playing = false;
    vibrate(500);
  }

  function removeLife() {
    lives--;
    drawLives();
    vibrate(500);
    if (lives == 0) {
      gameOver();
    }
  }
  
  function drawScore() {
    $('.score').text(score);
  }
  
  function drawLevel() {
    $('.level').text(level);
  }
  
  function drawLives() {
    $('.lives').text(lives);
  }

  function xToSvg(x) {
    return (x - 1) * 32;
  }

  function yToSvg(y) {
    return ESVIJI.settings['board']['height'] - 32 * y;
  }
  
  function svgToY(coordY) {
    y = Math.round((ESVIJI.settings['board']['height'] - coordY) / 32);
    return y;
  }
  
  function pixelsToSvgY(coordY) {
    return coordY * ESVIJI.settings['board']['height'] / $(document).height();
  }
  
  function vibrate(duration) {
    // http://hacks.mozilla.org/2012/01/using-the-vibrator-api-part-of-webapi/
    if (navigator.mozVibrate) {
      navigator.mozVibrate(duration);
    }
  }
  
  function debug(string) {
    if (ESVIJI.settings['debug']) {
//      for (y = 7; y >= 1; y--) {
//        line = '';
//        for(x = 1; x <= 6; x++) {
//          line += currentPieces[x][y] + ' ';
//        }
//        console.log(line);
//      }
      console.log('piece: ' + currentPiece + ' | posXY: ' + currentPosX + '/' + currentPosY + ' | dir: ' + currentDirX + '/' + currentDirY);
      console.log(string);
    }
  }
  
  return {
    init: init
  }
})();
  
document.addEventListener("DOMContentLoaded", function() {
  ESVIJI.game.init();
});