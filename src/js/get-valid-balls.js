import settings from './settings.js';

export function getTargetForRow(currentBalls, row) {
  let column = 10;
  let columnDirection = -1;
  let rowDirection = 0;
  let path = [];

  while (true) {
    if (row === 1 && rowDirection === -1) {
      // This is the lower left corner, it's over
      return false;
    } else {
      if (column === 1 && columnDirection === -1) {
        // Hit the wall, now go down
        columnDirection = 0;
        rowDirection = -1;
      } else {
        let nextBall =
          currentBalls[column + columnDirection][row + rowDirection];
        if (nextBall === settings.ROCK) {
          // Hit a rock
          if (columnDirection === -1) {
            // we were going left, now go down
            columnDirection = 0;
            rowDirection = -1;
          } else {
            // Blocked on a rock, it's over
            return false;
          }
        } else {
          if (nextBall === settings.EMPTY) {
            // Nothing there, let's continue
            column += columnDirection;
            row += rowDirection;
            path.push({
              row: row,
              column: column,
            });
          } else {
            return {
              ball: nextBall,
              row: row + rowDirection,
              column: column + columnDirection,
              path: path,
            };
          }
        }
      }
    }
  }
}

export default function getValidBalls(currentBalls) {
  let validBalls = {
    balls: [],
    positions: [],
  };

  for (let row = 1; row <= settings.board.rowMax; row++) {
    let target = getTargetForRow(currentBalls, row);
    if (target) {
      if (validBalls.balls.indexOf(target.ball) === -1) {
        validBalls.balls.push(target.ball);
      }
      validBalls.positions.push({
        row: target.row,
        column: target.column,
      });
    }
  }
  return validBalls;
}
