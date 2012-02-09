var ESVIJI = {};

ESVIJI.game = (function(){
  var
    BOARD_WIDTH = 320,
    BOARD_HEIGHT = 460,
    EMPTY = 0,
    ROCK = -1,
    pieces = ['piece1', 'piece2', 'piece3', 'piece4', 'piece5', 'piece6', 'piece7', 'piece8', 'piece9', 'piece10', 'piece11', 'piece12', 'piece13', 'piece14'],
    rocks = ['rock'],
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
    cursorY = 0,
    cursorMinY = 0,
    cursorMaxY = 0,
    maxAvailablePieces = 0,
    nbPieces = 0,
    level,
    score,
    lives,
    scoreThisTurn = 0,
    playing = false;
    
  function init() {
    level = 0;
    score = 0;
    lives = 10;
    cursorMinY = yToSvg(1);
    cursorMaxY = yToSvg(13);
    maxAvailablePieces = pieces.length;
    drawScore();
    nextLevel();
  }
  
  function nextLevel() {
    playing = true;
    level++;
    drawLevel();
    lives++;
    drawLives();
    nbPieces = Math.min(maxAvailablePieces, Math.floor(5 + (level / 5)));

    initPieces();
    erasePieces();
    drawPieces();

    startNewTurn();
  }
  
  function xToSvg(x) {
    return (x - 1) * 32;
  }

  function yToSvg(y) {
    return BOARD_HEIGHT - 32 * y;
  }
  
  function svgToY(coordY) {
    y = Math.round((BOARD_HEIGHT - coordY) / 32);
    return y;
  }
  
  function pixelsToSvgY(coordY) {
    return coordY * BOARD_HEIGHT / $(document).height();
  }
  
  function startNewTurn() {
    currentPosX = 10;
    currentDirX = -1;
    currentPosY = 7;
    currentDirY = 0;
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
        drawnCurrentPiece = drawPiece(xToSvg(currentPosX), yToSvg(currentPosY), pieces[currentPiece - 1], "playable");
        $("#board").on('mousemove', function(event) {
          event.preventDefault();
          if (dragged) {
            cursorY = Math.min(Math.max(pixelsToSvgY(event.pageY) - 16, cursorMaxY), cursorMinY);
            currentPosY = svgToY(cursorY);
            drawnCurrentPiece.attr({ y: cursorY });
            if (level < 4) {
              $('#showAim').attr({ y: yToSvg(currentPosY) });
            }
          }
        });
        $("#board").on('mouseup', function(event) {
          event.preventDefault();
          if (dragged) {
            dragged = false;
            drawnCurrentPiece.attr({ class: "" });
            cursorY = Math.min(Math.max(pixelsToSvgY(event.pageY) - 16, cursorMaxY), cursorMinY);
            currentPosY = svgToY(cursorY);
            drawnCurrentPiece.attr({ y: cursorY });
            if (level < 4) {
              $('#showAim').remove();
            }
            currentPosY = svgToY(cursorY);
            playUserChoice();
          }
        });
        drawnCurrentPiece.on('mousedown', function(event) {
          event.preventDefault();
          dragged = true;
          drawnCurrentPiece.attr({ class: "dragged" });
          if (level < 4) {
            drawPiece(240, yToSvg(currentPosY), 'arrow', 'showAim');
          }
        });
      }
    }
  }
  
  function playUserChoice () {
    var stopped = false;
    if (currentPosY == 1 && currentDirY == -1) {
      stopped = true;
    } else {
      if (currentPosX == 1 && currentDirX == -1) {
        currentDirX = 0;
        currentDirY = -1;
      } else {
        nextPiece = currentPieces[currentPosX + currentDirX][currentPosY + currentDirY];
        if (nextPiece == ROCK) {
          if (currentDirX == -1) {
            currentDirX = 0;
            currentDirY = -1;
          } else {
            stopped = true;
          }
        } else {
          if (nextPiece == EMPTY) {
            currentPosX += currentDirX;
            currentPosY += currentDirY;
          } else {
            if (nextPiece == currentPiece) {
              currentPosX += currentDirX;
              currentPosY += currentDirY;
              currentPieces[currentPosX][currentPosY] = EMPTY;
              drawnCurrentPieces[currentPosX][currentPosY].remove();
              scoreThisTurn++;
            } else {
              if (scoreThisTurn > 0) {
                currentPiece = nextPiece;
              }
              stopped = true;
            }
          }
        }
      }
    }
    if (!stopped) {
      drawnCurrentPiece.attr({ x: xToSvg(currentPosX), y: yToSvg(currentPosY) });
      playUserChoice();
    } else {
      score += Math.pow(scoreThisTurn, 2);
      drawScore();
      drawnCurrentPiece.remove();
      makePiecesFall();
      startNewTurn();
    }
  }
  
  function makePiecesFall() {
    var abovePieces;
    
    for(x = 1; x <= 7; x++) {
      for (y = 1; y <= 7; y++) {
        if (currentPieces[x][y] == EMPTY) {
          abovePieces = 0;
          for (z = y; z <= 6; z++) {
            if (currentPieces[x][z + 1] != EMPTY && currentPieces[x][z + 1] != ROCK) {
              abovePieces++;
            }
            if (currentPieces[x][z + 1] == ROCK) {
              z = 5;
            } else {
              currentPieces[x][z] = currentPieces[x][z + 1];
              currentPieces[x][z + 1] = EMPTY;
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
        if (x > Math.max(Math.min(level, 7), 3)) {
          currentPieces[x][y] = EMPTY;
        } else {
          if (y > Math.max(Math.min(level, 7), 3)) {
            if (y - 7 > x) {
              currentPieces[x][y] = ROCK;
            } else {
              currentPieces[x][y] = EMPTY;
            }
          } else {
            currentPieces[x][y] = 1 + Math.floor(Math.random() * nbPieces);
          }
        }
      }
    }
    // add rocks in the middle after level 10
    if (level > 10) {
      nbRocks = Math.floor((level - 5) / 5);
      positionedRocks = 0;
      while (positionedRocks < nbRocks) {
        rock_x = 1 + Math.floor(Math.random() * 6);
        rock_y = 1 + Math.floor(Math.random() * 6);
        if (currentPieces[rock_x][rock_y] != ROCK) {
          currentPieces[rock_x][rock_y] = ROCK;
          positionedRocks++;
        }
      }
    }
  }
  
  function drawPiece(x, y, pieceType, pieceId) {
    var piece = $(document.createElementNS("http://www.w3.org/2000/svg","use"))
      .attr({
        x: x,
        y: y
      });
    if (pieceId != undefined) {
      piece.attr({ id: pieceId });
    }
    piece.get(0).setAttributeNS("http://www.w3.org/1999/xlink","href","#" + pieceType);
    $("#board").append(piece);
    return piece;
  }
  
  function drawPieces() {
    drawnCurrentPieces = [];
    for(x = 1; x <= 7; x++) {
      drawnCurrentPieces[x] = [];
      for (y = 1; y <= 7; y++) {
        if (currentPieces[x][y] != EMPTY) {
          piece_x = xToSvg(x);
          piece_y = yToSvg(y);
          if (currentPieces[x][y] == ROCK) {
            rockId = 1 + Math.floor(Math.random() * rocks.length)
            drawnCurrentPieces[x][y] = drawPiece(piece_x, piece_y, rocks[rockId - 1]);
          } else {
            drawnCurrentPieces[x][y] = drawPiece(piece_x, piece_y, pieces[currentPieces[x][y] - 1]);
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
            if (nextPiece == ROCK) {
              if (dir_x == -1) {
                dir_x = 0;
                dir_y = -1;
              } else {
                found = true;
              }
            } else {
              if (nextPiece == EMPTY) {
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
  
  function gameOver() {
    var gameoverBackground = $("#boardBackground").clone().attr({
        id: "gameoverBackground"
      }).on("click", function() {
        $("#gameover").remove();
        $("#playagain").remove();
        $("#gameoverBackground").remove();
        init();
      });
    var gameover = $(document.createElementNS("http://www.w3.org/2000/svg","text"))
      .attr({
        id: "gameover",
        x: 160,
        y: 240
      })
      .text("Game Over");
    var playagain = $(document.createElementNS("http://www.w3.org/2000/svg","text"))
      .attr({
        id: "playagain",
        x: 160,
        y: 300
      })
      .text("Play again?");
    $("#board").append(gameoverBackground).append(gameover).append(playagain);
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
    $('#score').text(score);
  }
  
  function drawLevel() {
    $('#level').text(level);
  }
  
  function drawLives() {
    $('#lives').text(lives);
  }

  function vibrate(duration) {
    // http://hacks.mozilla.org/2012/01/using-the-vibrator-api-part-of-webapi/
    if (navigator.mozVibrate) {
      navigator.mozVibrate(duration);
    }
  }
  
  return {
    init: init
  }
})();
  
document.addEventListener("DOMContentLoaded", function() {
//  $("#fullscreen").on("click", function() {
//    fs = new Fullscreen($("#board"));
//    fs.request();
//  });
  ESVIJI.game.init();
});