const MAX_BALL_TYPES = 6;
const MAX_ROWS = 7;
const MAX_COLUMNS = 7;

export default {
  // board size and according ball extreme positions
  board: {
    width: 320,
    height: 430,
    columnMax: 9,
    rowMax: 13,
  },

  // special cases on the board
  EMPTY: 0,
  ROCK: -1,

  // Maximum number of different balls
  MAX_BALL_TYPES: MAX_BALL_TYPES,

  // game info at launch time
  launch: {
    lives: 9,
    score: 0,
    level: 0,
  },

  /**
   * Sets the number of rows for a specific game level
   * @param {integer} level The current level
   */
  levelRows: function levelRows(level) {
    return Math.min(MAX_ROWS, 2 + Math.ceil((level + 1) / 2));
  },

  levelColumns: function levelColumns(level) {
    return Math.min(MAX_COLUMNS, 2 + Math.ceil(level / 2));
  },

  levelBalls: function levelBalls(level) {
    return Math.min(MAX_BALL_TYPES, Math.ceil((level + 1) / 2));
  },

  levelRocks: function levelRocks(level) {
    return Math.max(0, Math.min(15, Math.ceil((level - 10) / 2)));
  },

  points: function points(nbHits, level) {
    return Math.pow(nbHits, 4);
  },

  // One extra life every 100 points
  extraLifePoints: 100,

  // One extra life every time a new level is finished
  extraLifeLevel: 0,

  // Game info at new turn start
  turn: {
    posX: 9,
    dirX: -1,
    posY: 8,
    dirY: 0,
  },

  // animation settings
  durationMove: 0.15,
  durationMorph: 0.5,
};
