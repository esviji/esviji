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
  maxAvailablePieces: 0,
  nbPieces: 0,
  level: 10,
  
  init: function init() {
    theGame.board = Raphael(document.body, 320, 480);

    var border = theGame.board.rect(0.5, 0.5, 319, 479),
        header = theGame.board.path('M 0 0 l 0 235 l 200 -200 l 120 0 l 0 -35 z'),
        title = theGame.board.print(0, 40, "esviji", theGame.board.getFont('ChewyRegular'), 60),
        score = theGame.board.print(220, 20, "score: 0", theGame.board.getFont('ChewyRegular'), 20);

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
    theGame.currentPieces = theGame.initPieces();
    theGame.drawPieces(theGame.currentPieces);
  },
  
  initPieces: function initPieces() {
    var pieces = [];
        
    for(x = 1; x <= 6; x++) {
      pieces[x] = [];
      for (y = 1; y <= 6; y++) {
        pieces[x][y] = 1 + Math.floor(Math.random() * theGame.nbPieces);
      }
    }
    
    // add rocks in the middle after level 10
    if (theGame.level > 10) {
      for(z = 1; z <= Math.floor(theGame.level / 5); z++) {
        rock_x = 1 + Math.floor(Math.random() * 6);
        rock_y = 1 + Math.floor(Math.random() * 6);
        pieces[rock_x][rock_y] = theGame.ROCK;
      }
    }
    return pieces;
  },
  
  drawPieces: function drawPieces(pieces) {
    for(x = 1; x <= 6; x++) {
      for (y = 1; y <= 6; y++) {
        if (pieces[x][y] != theGame.EMPTY) {
          if (pieces[x][y] == theGame.ROCK) {
            piece_fichier = 'themes/' + theGame.theme + '/' + theGame.themes[theGame.theme].rock + '.svg';
          } else {
            piece_fichier = 'themes/' + theGame.theme + '/' + theGame.themes[theGame.theme].regularPieces[pieces[x][y] - 1] + '.svg';
          }
          piece_x = x * 35 - 30;
          piece_y = 480 - 35 * y;
          drawnPiece = theGame.board.image(piece_fichier, piece_x, -30, 30, 30);
          drawnPiece.animate({'y': piece_y}, 2000, 'bounce');
        }
      }
    }
  },

  getValidPieces: function getValidPieces() {
  },
  
  run: function run() {
    theGame.init();
  }
}