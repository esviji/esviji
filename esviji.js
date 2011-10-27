window.onload = function(){
  theGame.run();
}

var theGame = {
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
  maxAvailablePieces: 0,
  nbPieces: 0,
  level: 0,
  
  init: function init() {
    theGame.board = Raphael(document.body, 320, 480);

    var border = theGame.board.rect(0.5, 0.5, 319, 479),
        header = theGame.board.path('M 0 0 l 0 225 l 35 0 l 0 -35 l 35 0 l 0 -35 l 35 0 l 0 -35 l 35 0 l 0 -35 l 35 0 l 0 -35 l 35 0 l 120 0 l 0 -50 z'),
        title = theGame.board.print(0, 40, "esviji", theGame.board.getFont('ChewyRegular'), 60),
        copyright = theGame.board.print(10, 70, "(c) Nicolas Hoizey", theGame.board.getFont('ChewyRegular'), 9),
        score = theGame.board.print(220, 25, "score: 0", theGame.board.getFont('ChewyRegular'), 25);

    header.attr({
      'fill': '#9999cc',
      'stroke': '#666699',
      'stroke-width': 1
    });

    theGame.maxAvailablePieces = theGame.themes[theGame.theme].regularPieces.length;
    
    theGame.nextLevel();
  },
    
  nextLevel: function nextLevel() {
    theGame.level++;
    theGame.nbPieces = Math.min(theGame.maxAvailablePieces, Math.floor(5 + (theGame.level / 5)));
    theGame.initPieces();
    theGame.drawPieces();
    
    theGame.getValidPieces();
    console.log(theGame.validPieces);
    theGame.currentPiece = theGame.validPieces[Math.floor(Math.random() * theGame.validPieces.length)];
    pieceFile = 'themes/' + theGame.theme + '/' + theGame.themes[theGame.theme].regularPieces[theGame.currentPiece - 1] + '.svg';
    piece_x = 9 * 35 - 30;
    piece_y = 480 - 35 * 7;
    drawnPiece = theGame.board.image(pieceFile, piece_x, piece_y, 30, 30);
  },
  
  initPieces: function initPieces() {
    theGame.currentPieces = [];
        
    for(x = 1; x <= 8; x++) {
      theGame.currentPieces[x] = [];
      for (y = 1; y <= 12; y++) {
        if (x > 6) {
          theGame.currentPieces[x][y] = theGame.EMPTY;
        } else {
          if (y > 6) {
            if (y - 6 > x) {
              theGame.currentPieces[x][y] = theGame.ROCK;
            } else {
              theGame.currentPieces[x][y] = theGame.EMPTY;
            }
          } else {
            theGame.currentPieces[x][y] = 1 + Math.floor(Math.random() * theGame.nbPieces);
          }
        }
      }
    }
    
    // add rocks in the middle after level 10
    if (theGame.level > 10) {
      nbRocks = Math.floor((theGame.level - 5) / 5);
      positionedRocks = 0;
      while (positionedRocks < nbRocks) {
        rock_x = 1 + Math.floor(Math.random() * 6);
        rock_y = 1 + Math.floor(Math.random() * 6);
        if (theGame.currentPieces[rock_x][rock_y] != theGame.ROCK) {
          theGame.currentPieces[rock_x][rock_y] = theGame.ROCK;
          positionedRocks++;
        }
      }
    }
  },
  
  drawPieces: function drawPieces() {
    for(x = 1; x <= 6; x++) {
      for (y = 1; y <= 6; y++) {
        if (theGame.currentPieces[x][y] != theGame.EMPTY) {
          if (theGame.currentPieces[x][y] == theGame.ROCK) {
            pieceFile = 'themes/' + theGame.theme + '/' + theGame.themes[theGame.theme].rock + '.svg';
          } else {
            pieceFile = 'themes/' + theGame.theme + '/' + theGame.themes[theGame.theme].regularPieces[theGame.currentPieces[x][y] - 1] + '.svg';
          }
          piece_x = x * 35 - 30;
          piece_y = 480 - 35 * y;
          drawnPiece = theGame.board.image(pieceFile, piece_x, -30, 30, 30);
          drawnPiece.animate({'y': piece_y}, 2000, 'bounce');
        }
      }
    }
  },

  getValidPieces: function getValidPieces() {
    var x, y, dir_x, dir_y, found;

    theGame.validPieces = [];
    
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
            nextPiece = theGame.currentPieces[x + dir_x][y + dir_y];
            if (nextPiece == theGame.ROCK) {
              if (dir_x == -1) {
                dir_x = 0;
                dir_y = -1;
              } else {
                found = true;
              }
            } else {
              if (nextPiece == theGame.EMPTY) {
                x += dir_x;
                y += dir_y;
              } else {
                if (theGame.validPieces.indexOf(nextPiece) == -1) {
                  theGame.validPieces.push(nextPiece);
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
    theGame.init();
  }
}