window.onload = function(){
  esviji.run();
}

var esviji = {
  VIEWPORT_WIDTH: 320,
  VIEWPORT_HEIGHT: 480,
  EMPTY: 0,
  ROCK: -1,
  board: null,
  pieces: [
    {
      'path': 'm 0 0 l 28 0 l 0 28 l -28 0 z',
      'attr': {
        'fill': '45-#900-#c00',
        'stroke': '#900'
      }
    },
    {
      'path': 'm 14 0 l 14 14 l -14 14 l -14 -14 z',
      'attr': {
        'fill': '45-#090-#0c0',
        'stroke': '#090'
      }
    },
    {
      'path': 'm 14 0 l 14 28 l -14 0 l -14 0 z',
      'attr': {
        'fill': '45-#009-#00c',
        'stroke': '#009'
      }
    },
    {
      'path': 'm 0 0 l 14 0 l 14 0 l -14 28 z',
      'attr': {
        'fill': '45-#909-#c0c',
        'stroke': '#909'
      }
    },
    {
      'path': 'm 10 0 l 18 0 l -10 28 l -18 0 z',
      'attr': {
        'fill': '#990',
        'stroke': '#990'
      }
    },
    {
      'path': 'm 0 0 l 28 0 l -5 28 l -18 0 z',
      'attr': {
        'fill': '#099',
        'stroke': '#099'
      }
    },
    {
      'path': 'm 0 10 l 28 -10 l 0 -18 l -28 -10 z',
      'attr': {
        'fill': '#999',
        'stroke': '#999'
      }
    }
  ],
  rocks: [
    {
      'path': 'm 0 0 l 28 28 l 0 -28 l -28 0 z',
      'attr': {
        'fill': '#666',
        'stroke': '#333'
      }
    }
  ],
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
  viewportWidth: 0,
  viewportHeight: 0,
  
  init: function init() {
    esviji.board = new ScaleRaphael('board', esviji.VIEWPORT_WIDTH, esviji.VIEWPORT_HEIGHT);
    esviji.updateViewportSize();

    var windowAddEvent = window.attachEvent || window.addEventListener;
    windowAddEvent('onresize', esviji.updateViewportSize, false);

    var background = esviji.board.rect(1, 21, esviji.VIEWPORT_WIDTH - 1, esviji.VIEWPORT_HEIGHT - 1),
        header = esviji.board.path('M 1 21 l 0 205 l 35 0 l 0 -35 l 35 0 l 0 -35 l 35 0 l 0 -35 l 35 0 l 0 -35 l 35 0 l 0 -35 l 35 0 l 108 0 l 0 -30 z'),
        title = esviji.board.print(0, 60, "esviji", esviji.board.getFont('ChewyRegular'), 60);
        
    esviji.drawScore();

    background.attr({
      'fill': '45-#ccc-#fff:50-#ddd',
      'stroke-width': 0
    });
    
    header.attr({
      'fill': '315-#bfd255-#8eb92a',
      'stroke': '#8eb92a',
      'stroke-width': 1
    });

    title.attr({
      'fill': '#46a800',
      'stroke-width': 0
    });

    esviji.maxAvailablePieces = esviji.pieces.length;
  },
  
  updateViewportSize: function updateViewportSize() {
    // http://andylangton.co.uk/articles/javascript/get-viewport-size-javascript/
    var w = window,
        d = document,
        e = d.documentElement,
        b = d.getElementsByTagName('body')[0];
        
    esviji.viewportWidth = w.innerWidth || e.clientWidth || b.clientWidth;
    esviji.viewportHeight = w.innerHeight || e.clientHeight || b.clientHeight;
    
    esviji.board.changeSize(esviji.viewportWidth, esviji.viewportHeight, true, false);
  },
  
  scaledX: function scaledX(x) {
    return x * esviji.VIEWPORT_WIDTH / esviji.board.width;
  },
  
  scaledY: function scaledY(y) {
    return y * esviji.VIEWPORT_HEIGHT / esviji.board.height;
  },

  nextLevel: function nextLevel() {
    esviji.level++;
    esviji.drawLevel();
    esviji.lives++;
    esviji.drawLives();
    esviji.nbPieces = Math.min(esviji.maxAvailablePieces, Math.floor(5 + (esviji.level / 5)));

    esviji.initPieces();
    esviji.erasePieces();
    esviji.drawPieces();

    esviji.startNewTurn();
  },
  
  xToCoord: function xToCoord(x) {
    return x * 35 - 30;
  },

  yToCoord: function yToCoord(y) {
    return esviji.VIEWPORT_HEIGHT - 35 * y;
  },
  
  startNewTurn: function startNewTurn() {
    esviji.currentPosX = 9;
    esviji.currentPosY = 8;
    esviji.scoreThisTurn = 0;
    esviji.currentDirX = -1;
    esviji.currentDirY = 0;
    esviji.getValidPieces();
    if (esviji.validPieces.length == 0) {
      // no more valid piece, end of the turn
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
      esviji.drawnCurrentPiece = esviji.board.path(esviji.pieces[esviji.currentPiece - 1]['path']);
      esviji.drawnCurrentPiece.attr(esviji.pieces[esviji.currentPiece - 1]['attr']);
      esviji.drawnCurrentPiece.translate(esviji.xToCoord(esviji.currentPosX), esviji.yToCoord(esviji.currentPosY));
      esviji.drawnCurrentPiece.drag(function(dx, dy) {
console.log(dy);
        this.attr({
          x: esviji.xToCoord(9),
          y: Math.min(Math.max(yBeforeDrag + esviji.scaledY(dy), esviji.yToCoord(12)), esviji.yToCoord(1))
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
            if (esviji.currentPieces[x][z + 1] != esviji.EMPTY && esviji.currentPieces[x][z + 1] != esviji.ROCK) {
              abovePieces++;
            }
            if (esviji.currentPieces[x][z + 1] == esviji.ROCK) {
              z = 5;
            } else {
              esviji.currentPieces[x][z] = esviji.currentPieces[x][z + 1];
              esviji.currentPieces[x][z + 1] = esviji.EMPTY;
              if (esviji.drawnCurrentPieces[x][z + 1] != null) {
                esviji.drawnCurrentPieces[x][z] = esviji.drawnCurrentPieces[x][z + 1];
                esviji.drawnCurrentPieces[x][z].animate({'y': esviji.yToCoord(z)}, 500, 'bounce');
                esviji.drawnCurrentPieces[x][z + 1] = null;
              }
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
          piece_x = esviji.xToCoord(x);
          piece_y = esviji.yToCoord(y);
          if (esviji.currentPieces[x][y] == esviji.ROCK) {
            rockId = 1 + Math.floor(Math.random() * esviji.rocks.length)
            esviji.drawnCurrentPieces[x][y] = esviji.board.path(esviji.rocks[rockId - 1]['path']); 
            esviji.drawnCurrentPieces[x][y].attr(esviji.rocks[rockId - 1]['attr']);
            
          } else {
            esviji.drawnCurrentPieces[x][y] = esviji.board.path(esviji.pieces[esviji.currentPieces[x][y] - 1]['path']); 
            esviji.drawnCurrentPieces[x][y].attr(esviji.pieces[esviji.currentPieces[x][y] - 1]['attr']);
          }
          esviji.drawnCurrentPieces[x][y].translate(piece_x, piece_y);
//          esviji.drawnCurrentPieces[x][y].animate({'y': piece_y}, 2000, 'bounce');
        }
      }
    }
  },

  erasePieces: function erasePieces() {
    for(x = 1; x <= 6; x++) {
      if (esviji.drawnCurrentPieces[x] != undefined) {
        for (y = 1; y <= 6; y++) {
          if (esviji.drawnCurrentPieces[x][y] != null) {
            esviji.drawnCurrentPieces[x][y].remove();
          }
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
    esviji.drawnScore = esviji.board.print(170, 38, "score: " + esviji.score, esviji.board.getFont('ChewyRegular'), 24);
    esviji.drawnScore.attr({'fill': '#46a800', 'stroke-width': 0});
  },
  
  drawLevel: function drawLevel() {
    if (esviji.drawnLevel != null) {
      esviji.drawnLevel.remove();
    }
    esviji.drawnLevel = esviji.board.print(10, 110, 'level ' + esviji.level, esviji.board.getFont('ChewyRegular'), 20);
    esviji.drawnLevel.attr({'fill': '#46a800', 'stroke-width': 0});
  },
  
  drawLives: function drawLives() {
    if (esviji.drawnLives != null) {
      esviji.drawnLives.animate({'fill': '#f00'}, 500, 'easeInOut', function() {
        this.animate({'opacity': 0}, 500, 'easeInOut', function() {
          this.remove();
        })
      });
    }
    esviji.drawnLives = esviji.board.print(10, 140, esviji.lives + ' lives', esviji.board.getFont('ChewyRegular'), 20);
    esviji.drawnLives.attr({'fill': '#46a800', 'stroke-width': 0, 'opacity': 0}).animate({'opacity': 1}, 500, 'easeInOut');
  },

  run: function run() {
    esviji.init();
    esviji.nextLevel();
  }
}

if(!Array.indexOf) {
  Array.prototype.indexOf = function(obj) {
    for(var i=0; i<this.length; i++) {
      if(this[i]==obj) {
        return i;
      }
    }
    return -1;
  }
}
	