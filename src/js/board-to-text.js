import settings from './settings.js';

export default function boardToText(board, ball = undefined) {
  const items = ['⬛️', '➖', '🟠', '🟢', '🔵', '🟣', '🟤', '🔴'];
  let textLines = [];
  let textRow;
  for (let row = 1; row <= settings.board.rowMax; row++) {
    textRow = settings.board.rowMax - row;
    textLines[textRow] = '';
    for (let column = 1; column <= settings.board.columnMax; column++) {
      if (textRow <= 5 && column <= 5 - textRow) {
        textLines[textRow] += items[0];
      } else {
        textLines[textRow] += items[board[column][row] + 1];
      }
    }
    if (ball !== undefined && row === settings.turn.posY) {
      textLines[textRow] += items[ball + 1];
    } else {
      textLines[textRow] += items[1];
    }
  }

  return '\n\n⬛️⬛️⬛️⬛️⬛️⬛️⬛️⬛️⬛️⬛️\n' + textLines.join('\n');
}
