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
  validPieces: [],
  currentPiece: 0,
  currentPosX: 9,
  currentPosY: 7,
  maxAvailablePieces: 0,
  nbPieces: 0,
  level: 0,
  score: 0,
  
  init: function init() {
    esviji.board = Raphael(document.body, 320, 480);

    var border = esviji.board.rect(0.5, 0.5, 319, 479),
        header = esviji.board.path('M 0 0 l 0 225 l 35 0 l 0 -35 l 35 0 l 0 -35 l 35 0 l 0 -35 l 35 0 l 0 -35 l 35 0 l 0 -35 l 35 0 l 120 0 l 0 -50 z'),
        title = esviji.board.print(0, 40, "esviji", esviji.board.getFont('ChewyRegular'), 60),
        copyright = esviji.board.print(10, 70, "(c) Nicolas Hoizey", esviji.board.getFont('ChewyRegular'), 9),
        score = esviji.board.print(220, 25, "score: 0", esviji.board.getFont('ChewyRegular'), 25);

    header.attr({
      'fill': '#9999cc',
      'stroke': '#666699',
      'stroke-width': 1
    });

    esviji.maxAvailablePieces = esviji.themes[esviji.theme].regularPieces.length;
  },
    
  play: function play() {
    esviji.nextLevel();
    esviji.getNewPiece();
    /*
    esviji.playUserChoice();
    while (esviji.validPieces.length > 0) {
      esviji.waitForUser();
      esviji.playUserChoice();
    }
    esviji.play();
    */
  },
    
  nextLevel: function nextLevel() {
    esviji.level++;
    esviji.nbPieces = Math.min(esviji.maxAvailablePieces, Math.floor(5 + (esviji.level / 5)));

    esviji.initPieces();
    esviji.drawPieces();
  },
  
  xToCoord: function xToCoord(x) {
    return x * 35 - 30;
  },

  yToCoord: function yToCoord(y) {
    return 480 - 35 * y;
  },
  
  getNewPiece: function getNewPiece() {
    esviji.currentPosX = 9;
    esviji.currentPosY = 8;
    esviji.getValidPieces();
    esviji.currentPiece = esviji.validPieces[Math.floor(Math.random() * esviji.validPieces.length)];
    pieceFile = 'themes/' + esviji.theme + '/' + esviji.themes[esviji.theme].regularPieces[esviji.currentPiece - 1] + '.svg';
    esviji.drawnCurrentPiece = esviji.board.image(pieceFile, esviji.xToCoord(esviji.currentPosX), esviji.yToCoord(esviji.currentPosY), 30, 30);
    esviji.drawnCurrentPiece.drag(function(dx, dy) {
      console.log('during drag: dy = ' + dy + ' / yBeforeDrag + dy = ' + (yBeforeDrag + dy));
      this.attr({
        x: esviji.xToCoord(9),
        y: Math.min(Math.max(yBeforeDrag + dy, esviji.yToCoord(12)), esviji.yToCoord(1))
      });
    }, function () {
      xBeforeDrag = this.attr('x');
      yBeforeDrag = this.attr('y');
      console.log('before drag: x=' + xBeforeDrag + ' / y=' + yBeforeDrag);
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
      console.log('after drag: y = ' + esviji.currentPosY);
      esviji.drawnCurrentPiece.animate({'y': esviji.yToCoord(esviji.currentPosY)}, 500, 'bounce');
    });
  },
  
  playUserChoice: function playUserChoice () {
    var stopped = false;

    esviji.currentDirX = -1;
    esviji.currentDirY = 0;

    while (!stopped) {
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
              esviji.moveOnce();
            } else {
              if (nextPiece == esviji.currentPiece) {
                esviji.moveOnce();
              } else {
                esviji.currentPiece = nextPiece;
                stopped = true;
              }
            }
          }
        }
      }
    }
  },
  
  moveOnce: function moveOnce() {
    esviji.currentPosX += esviji.currentDirX;
    esviji.currentPosY += esviji.currentDirY;
    piece_x = esviji.currentPosX * 35 - 30;
    piece_y = 480 - 35 * esviji.currentPosY;
    anim = Raphael.animation({'x': piece_x, 'y': piece_y}, 1000, 'linear');
    esviji.drawnCurrentPiece.animate(anim.delay(1000));
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
    for(x = 1; x <= 6; x++) {
      for (y = 1; y <= 6; y++) {
        if (esviji.currentPieces[x][y] != esviji.EMPTY) {
          if (esviji.currentPieces[x][y] == esviji.ROCK) {
            pieceFile = 'themes/' + esviji.theme + '/' + esviji.themes[esviji.theme].rock + '.svg';
          } else {
            pieceFile = 'themes/' + esviji.theme + '/' + esviji.themes[esviji.theme].regularPieces[esviji.currentPieces[x][y] - 1] + '.svg';
          }
          piece_x = x * 35 - 30;
          piece_y = 480 - 35 * y;
          drawnPiece = esviji.board.image(pieceFile, piece_x, -30, 30, 30);
          drawnPiece.animate({'y': piece_y}, 2000, 'bounce');
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
  
  run: function run() {
    esviji.init();
    esviji.play();
  }
}