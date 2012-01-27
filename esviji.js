var ESVIJI = {};

ESVIJI.game = (function(){
  var EMPTY= 0,
    ROCK = -1,
    pieces = ['piece1', 'piece2', 'piece3', 'piece4', 'piece5', 'piece6'],
    rocks = ['rock'],
    currentPieces = [],
    drawnCurrentPieces = [],
    validPieces = [],
    currentPiece = 0,
    currentPosX = 0,
    currentPosY = 0,
    maxAvailablePieces = 0,
    nbPieces = 0,
    level = 0,
    score = 0,
    scoreThisTurn = 0,
    lives = 10;
    
  function init() {
    maxAvailablePieces = pieces.length;
    drawScore();
    nextLevel();
  }
  
  function nextLevel() {
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
  
  function xToCoord(x) {
    return (x - 1) * 32;
  }

  function yToCoord(y) {
    return 480 - 32 * y;
  }
  
  function startNewTurn() {
    currentPosX = 10;
    currentPosY = 8;
    scoreThisTurn = 0;
    currentDirX = -1;
    currentDirY = 0;
    getValidPieces();
    if (validPieces.length == 0) {
      // no more valid piece, end of the turn
      nextLevel();
    } else {
      if (validPieces.indexOf(currentPiece) == -1) {
        lives--;
        drawLives();
        if (lives == 0) {
          gameOver();
        }
        currentPiece = validPieces[Math.floor(Math.random() * validPieces.length)];
      }
      drawnCurrentPiece = drawPiece(xToCoord(currentPosX), yToCoord(currentPosY), pieces[currentPiece - 1]);
//      drawnCurrentPiece.drag(function(dx, dy) {
        // Math.min(Math.max(scaledY(dy) - yBeforeDrag, yToCoord(12) - yBeforeDrag), yToCoord(1) - yBeforeDrag)
//        this.translate(0, scaledY(dy - yBeforeDrag));
//        yBeforeDrag = dy;
//      }, function () {
//        xBeforeDrag = 0;
//        yBeforeDrag = 0;
//      }, function () {
//        yAfterDrag = yBeforeDrag;
//        diff = 1000;
//        for (i = 1; i <= 12; i++) {
//          thisDiff = Math.abs(yAfterDrag - yToCoord(i));
//          if (thisDiff < diff) {
//            diff = thisDiff;
//            currentPosY = i;
//          }
//        }
//        drawnCurrentPiece.animate({'y': yToCoord(currentPosY)}, 500, 'elastic', playUserChoice);
//      });
//      
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
      drawnCurrentPiece.animate({'x': xToCoord(currentPosX), 'y': yToCoord(currentPosY), 'rotate': 360}, 200, 'linear', playUserChoice);
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
    
    for(x = 1; x <= 6; x++) {
      for (y = 1; y <= 5; y++) {
        if (currentPieces[x][y] == EMPTY) {
          abovePieces = 0;
          for (z = y; z <= 5; z++) {
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
                drawnCurrentPieces[x][z].animate({'y': yToCoord(z)}, 500, 'bounce');
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
        
    for(x = 1; x <= 8; x++) {
      currentPieces[x] = [];
      for (y = 1; y <= 12; y++) {
        if (x > 6) {
          currentPieces[x][y] = EMPTY;
        } else {
          if (y > 6) {
            if (y - 6 > x) {
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
  
  function drawPiece(x, y, pieceType) {
    var piece = $(document.createElementNS("http://www.w3.org/2000/svg","use"))
      .attr({
        transform: "translate(" + x + "," + y + ")"
      });
    piece.get(0).setAttributeNS("http://www.w3.org/1999/xlink","href","#" + pieceType);
    $("#board").append(piece);
    return piece;
  }
  
  function drawPieces() {
    drawnCurrentPieces = [];
    for(x = 1; x <= 6; x++) {
      drawnCurrentPieces[x] = [];
      for (y = 1; y <= 6; y++) {
        if (currentPieces[x][y] != EMPTY) {
          piece_x = xToCoord(x);
          piece_y = yToCoord(y);
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
    for(x = 1; x <= 6; x++) {
      if (drawnCurrentPieces[x] != undefined) {
        for (y = 1; y <= 6; y++) {
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
    
    for (y_start = 1; y_start <= 12; y_start++) {
      x = 9;
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
  
  function drawScore() {
    $('#score').text(score);
  }
  
  function drawLevel() {
    $('#level').text(level);
  }
  
  function drawLives() {
    $('#lives').text(lives);
  }

  return {
    init: init
  }
})();
  
$(document).ready(function () {
  ESVIJI.game.init();
});