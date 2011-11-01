window.onload = function(){
  esviji.run();
}

var esviji = {
  EMPTY: 0,
  ROCK: -1,
  board: null,
  theme: 'metro',
  themes: {
    'metro': {
      'rock': 'metro',
      'regularPieces': ['m1', 'm2', 'm3', 'm3bis', 'm4', 'm5', 'm6', 'm7', 'm7bis', 'm8', 'm9', 'm10', 'm11', 'm12', 'm13', 'm14']
    }
  },
  currentPieces: [],
  drawnCurrentPieces: [],
  validPieces: [],
  currentPiece: 0,
  currentPosX: 9,
  currentPosY: 7,
  maxAvailablePieces: 0,
  nbPieces: 0,
  level: 0,
  score: 0,
  scoreThisTurn: 0,
  drawnScore: null,
  lives: 10,
  drawnLevelAndLives: null,
  
  init: function init() {
    esviji.board = Raphael('board', 320, 480);

    var header = esviji.board.path('M 0 0 l 0 225 l 35 0 l 0 -35 l 35 0 l 0 -35 l 35 0 l 0 -35 l 35 0 l 0 -35 l 35 0 l 0 -35 l 35 0 l 120 0 l 0 -50 z'),
        title = esviji.board.print(0, 40, "esviji", esviji.board.getFont('ChewyRegular'), 60);
        
    esviji.drawScore();
    esviji.drawLevel();
    esviji.drawLives();

    header.attr({
      'fill': '#9999cc',
      'stroke': '#666699',
      'stroke-width': 2
    });

    title.attr({
      'fill': '#666699',
      'stroke': '#333366',
      'stroke-width': 2
    });

    esviji.maxAvailablePieces = esviji.themes[esviji.theme].regularPieces.length;
    
  },
    
  nextLevel: function nextLevel() {
    esviji.level++;
    esviji.drawLevel();
    esviji.lives++;
    esviji.drawLives();
    esviji.nbPieces = Math.min(esviji.maxAvailablePieces, Math.floor(5 + (esviji.level / 5)));

    esviji.initPieces();
    esviji.drawPieces();

    esviji.startNewTurn();
  },
  
  xToCoord: function xToCoord(x) {
    return x * 35 - 30;
  },

  yToCoord: function yToCoord(y) {
    return 480 - 35 * y;
  },
  
  startNewTurn: function startNewTurn() {
    esviji.currentPosX = 9;
    esviji.currentPosY = 8;
    esviji.scoreThisTurn = 0;
    esviji.currentDirX = -1;
    esviji.currentDirY = 0;
    esviji.getValidPieces();
    if (esviji.validPieces.length == 0) {
      // TODO: can it really happen?
      esviji.nextLevel();
    } else {
      if (esviji.validPieces.indexOf(esviji.currentPiece) == -1) {
        esviji.lives--;
        esviji.drawLives();
        if (esviji.lives == 0) {
          gameOver = esviji.board.print(5, 200, "Game Over", esviji.board.getFont('ChewyRegular'), 64).attr({'fill': 'red', 'stroke': 'black', 'stroke-width': 2});
          //TODO: really stop the game
        }
        esviji.currentPiece = esviji.validPieces[Math.floor(Math.random() * esviji.validPieces.length)];
      }
      pieceFile = 'themes/' + esviji.theme + '/' + esviji.themes[esviji.theme].regularPieces[esviji.currentPiece - 1] + '.svg';
      esviji.drawnCurrentPiece = esviji.board.image(pieceFile, esviji.xToCoord(esviji.currentPosX), esviji.yToCoord(esviji.currentPosY), 30, 30);
      esviji.drawnCurrentPiece.drag(function(dx, dy) {
        this.attr({
          x: esviji.xToCoord(9),
          y: Math.min(Math.max(yBeforeDrag + dy, esviji.yToCoord(12)), esviji.yToCoord(1))
        });
      }, function () {
        xBeforeDrag = this.attr('x');
        yBeforeDrag = this.attr('y');
      }, function () {
        yAfterDrag = this.attr('y');
        diff = 1000; 
        for (i = 1; i <= 12; i++) {
          thisDiff = Math.abs(yAfterDrag - esviji.yToCoord(i));
          if (thisDiff < diff) {
            diff = thisDiff;
            esviji.currentPosY = i;
          }
        }
        esviji.drawnCurrentPiece.animate({'y': esviji.yToCoord(esviji.currentPosY)}, 500, 'elastic', esviji.playUserChoice);
      });
      
    }
  },
  
  playUserChoice: function playUserChoice () {
    var stopped = false;
    if (esviji.currentPosY == 1 && esviji.currentDirY == -1) {
      stopped = true;
    } else {
      if (esviji.currentPosX == 1 && esviji.currentDirX == -1) {
        esviji.currentDirX = 0;
        esviji.currentDirY = -1;
      } else {
        nextPiece = esviji.currentPieces[esviji.currentPosX + esviji.currentDirX][esviji.currentPosY + esviji.currentDirY];
        if (nextPiece == esviji.ROCK) {
          if (esviji.currentDirX == -1) {
            esviji.currentDirX = 0;
            esviji.currentDirY = -1;
          } else {
            stopped = true;
          }
        } else {
          if (nextPiece == esviji.EMPTY) {
            esviji.currentPosX += esviji.currentDirX;
            esviji.currentPosY += esviji.currentDirY;
          } else {
            if (nextPiece == esviji.currentPiece) {
              esviji.currentPosX += esviji.currentDirX;
              esviji.currentPosY += esviji.currentDirY;
              esviji.currentPieces[esviji.currentPosX][esviji.currentPosY] = esviji.EMPTY;
              esviji.drawnCurrentPieces[esviji.currentPosX][esviji.currentPosY].remove();
              esviji.scoreThisTurn++;
            } else {
              if (esviji.scoreThisTurn > 0) {
                esviji.currentPiece = nextPiece;
              }
              stopped = true;
            }
          }
        }
      }
    }
    if (!stopped) {
      esviji.drawnCurrentPiece.animate({'x': esviji.xToCoord(esviji.currentPosX), 'y': esviji.yToCoord(esviji.currentPosY), 'rotate': 360}, 200, 'linear', esviji.playUserChoice);
    } else {
      esviji.score += Math.pow(esviji.scoreThisTurn, 2);
      esviji.drawScore();
      esviji.drawnCurrentPiece.remove();
      esviji.makePiecesFall();
      esviji.startNewTurn();
    }
  },
  
  makePiecesFall: function makePiecesFall() {
    var abovePieces;
    
    for(x = 1; x <= 6; x++) {
      for (y = 1; y <= 5; y++) {
        if (esviji.currentPieces[x][y] == esviji.EMPTY) {
          abovePieces = 0;
          for (z = y; z <= 5; z++) {
            if (esviji.currentPieces[x][z + 1] != esviji.EMPTY) {
              abovePieces++;
            }
            esviji.currentPieces[x][z] = esviji.currentPieces[x][z + 1];
            esviji.currentPieces[x][z + 1] = esviji.EMPTY;
            if (esviji.drawnCurrentPieces[x][z + 1] != null) {
              esviji.drawnCurrentPieces[x][z] = esviji.drawnCurrentPieces[x][z + 1];
              esviji.drawnCurrentPieces[x][z].animate({'y': esviji.yToCoord(z)}, 500, 'bounce');
              esviji.drawnCurrentPieces[x][z + 1] = null;
            }
          }
          if (abovePieces > 0) {
            y--;
          }
        }
      }
    }
  },
  
  initPieces: function initPieces() {
    esviji.currentPieces = [];
        
    for(x = 1; x <= 8; x++) {
      esviji.currentPieces[x] = [];
      for (y = 1; y <= 12; y++) {
        if (x > 6) {
          esviji.currentPieces[x][y] = esviji.EMPTY;
        } else {
          if (y > 6) {
            if (y - 6 > x) {
              esviji.currentPieces[x][y] = esviji.ROCK;
            } else {
              esviji.currentPieces[x][y] = esviji.EMPTY;
            }
          } else {
            esviji.currentPieces[x][y] = 1 + Math.floor(Math.random() * esviji.nbPieces);
          }
        }
      }
    }
    
    // add rocks in the middle after level 10
    if (esviji.level > 10) {
      nbRocks = Math.floor((esviji.level - 5) / 5);
      positionedRocks = 0;
      while (positionedRocks < nbRocks) {
        rock_x = 1 + Math.floor(Math.random() * 6);
        rock_y = 1 + Math.floor(Math.random() * 6);
        if (esviji.currentPieces[rock_x][rock_y] != esviji.ROCK) {
          esviji.currentPieces[rock_x][rock_y] = esviji.ROCK;
          positionedRocks++;
        }
      }
    }
  },
  
  drawPieces: function drawPieces() {
    esviji.drawnCurrentPieces = [];
    for(x = 1; x <= 6; x++) {
      esviji.drawnCurrentPieces[x] = [];
      for (y = 1; y <= 6; y++) {
        if (esviji.currentPieces[x][y] != esviji.EMPTY) {
          if (esviji.currentPieces[x][y] == esviji.ROCK) {
            pieceFile = 'themes/' + esviji.theme + '/' + esviji.themes[esviji.theme].rock + '.svg';
          } else {
            pieceFile = 'themes/' + esviji.theme + '/' + esviji.themes[esviji.theme].regularPieces[esviji.currentPieces[x][y] - 1] + '.svg';
          }
          piece_x = x * 35 - 30;
          piece_y = 480 - 35 * y;
          esviji.drawnCurrentPieces[x][y] = esviji.board.image(pieceFile, piece_x, -30, 30, 30);
          esviji.drawnCurrentPieces[x][y].animate({'y': piece_y}, 2000, 'bounce');
        }
      }
    }
  },

  getValidPieces: function getValidPieces() {
    var x, y, dir_x, dir_y, found;

    esviji.validPieces = [];
    
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
            nextPiece = esviji.currentPieces[x + dir_x][y + dir_y];
            if (nextPiece == esviji.ROCK) {
              if (dir_x == -1) {
                dir_x = 0;
                dir_y = -1;
              } else {
                found = true;
              }
            } else {
              if (nextPiece == esviji.EMPTY) {
                x += dir_x;
                y += dir_y;
              } else {
                if (esviji.validPieces.indexOf(nextPiece) == -1) {
                  esviji.validPieces.push(nextPiece);
                }
                found = true;
              }
            }
          }
        }
      }
    } 
  },
  
  drawScore: function drawScore() {
    if (esviji.drawnScore != null) {
      esviji.drawnScore.remove();
    }
    esviji.drawnScore = esviji.board.print(170, 28, "score: " + esviji.score, esviji.board.getFont('ChewyRegular'), 28);
    esviji.drawnScore.attr({'fill': '#333366'});
  },
  
  drawLevel: function drawLevel() {
    if (esviji.drawnLevel != null) {
      esviji.drawnLevel.remove();
    }
    esviji.drawnLevel = esviji.board.print(10,100, 'level ' + esviji.level, esviji.board.getFont('ChewyRegular'), 20);
    esviji.drawnLevel.attr({'fill': '#333366'});
  },
  
  drawLives: function drawLives() {
    if (esviji.drawnLives != null) {
      esviji.drawnLives.remove();
    }
    esviji.drawnLives = esviji.board.print(10, 130, esviji.lives + ' lives', esviji.board.getFont('ChewyRegular'), 20);
    esviji.drawnLives.attr({'fill': '#333366'});
  },

  run: function run() {
    esviji.init();
    esviji.nextLevel();
  }
}