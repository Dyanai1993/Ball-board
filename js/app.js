'use strict';

const WALL = 'WALL';
const FLOOR = 'FLOOR';
const BALL = 'BALL';
const GLUE = 'GLUE';
const GAMER = 'GAMER';
const BOMB = 'BOMB';

const GAMER_IMG = '<img src="img/gamer.png">';
const GLUED_GAMER_IMG = '<img src="img/gamer-purple.png">';
const BOMBED_GAMER_IMG = '<img src="img/dead.jpg">';
const BALL_IMG = '<img src="img/ball.png">';
const GLUE_IMG = '<img src="img/candy.png">';
const BOMB_IMG = '<img src="img/bomb.jpg">';
var gGamerImg;

// Model:
var gBoard;
var gGamerPos;
var gIsGameOn;
var gIsVictory = false
var gIsGamerGlued;
var gIsGamerBombed;
var gEatBallCount;
var gBallOnBoardCount;
var gBallInterval;
var gGlueInterval;
var gBombInterval;

function onInitGame() {
  gGamerPos = { i: 2, j: 9 };
  gIsGameOn = true;
  gIsGamerGlued = false;
  gIsGamerBombed = false
  gEatBallCount = 0;
  gBallOnBoardCount = 2;
 
  gBoard = buildBoard();
  renderBoard(gBoard);

  gBallInterval = setInterval(addBall, 5000);
  gGlueInterval = setInterval(addGlue, 7000);
  gBombInterval = setInterval(addBomb, 10000);

  var elModal = document.querySelector('.modal');
  elModal.style.display = 'none';
  var elEatBallsCount = document.querySelector('.balls-count span');
  elEatBallsCount.innerText = gEatBallCount;
}

function buildBoard() {
  // Put FLOOR everywhere and WALL at edges
  const rowCount = 10;
  const colCount = 12;
  const board = [];
  for (var i = 0; i < rowCount; i++) {
    board[i] = [];
    for (var j = 0; j < colCount; j++) {
      board[i][j] = { type: FLOOR, gameElement: null };
      if (i === 0 || i === rowCount - 1 || j === 0 || j === colCount - 1) {
        board[i][j].type = WALL;
      }
    }
  }

  addPassages(board);

  // Place the gamer and two balls
  board[gGamerPos.i][gGamerPos.j].gameElement = GAMER;
  board[5][5].gameElement = BALL;
  board[7][2].gameElement = BALL;

  return board;
}

function addPassages(board) {
  const middleRows = Math.floor(board.length / 2);
  const middleCols = Math.floor(board[0].length / 2);
  board[0][middleCols].type = FLOOR;
  board[board.length - 1][middleCols].type = FLOOR;
  board[middleRows][0].type = FLOOR;
  board[middleRows][board[0].length - 1].type = FLOOR;
}

// Render the board to an HTML table
function renderBoard(board) {
  var strHTML = '';
  for (var i = 0; i < board.length; i++) {
    strHTML += '<tr>';
    for (var j = 0; j < board[0].length; j++) {
      const currCell = board[i][j];
      var cellClass = getClassName({ i: i, j: j }) + ' ';
      cellClass += currCell.type === WALL ? 'wall' : 'floor';

      strHTML += `<td class="cell ${cellClass}"
	              onclick="moveTo(${i},${j})" >`;

      if (currCell.gameElement === GAMER) {
        strHTML += GAMER_IMG;
      } else if (currCell.gameElement === BALL) {
        strHTML += BALL_IMG;
      }

      strHTML += '</td>';
    }
    strHTML += '</tr>';
  }

  const elBoard = document.querySelector('.board');
  elBoard.innerHTML = strHTML;
}

// Move the player to a specific location
function moveTo(i, j) {
  if (!gIsGameOn || gIsGamerGlued) return;

  // Handling passages
  if (j === -1) j = gBoard[0].length - 1;
  else if (j === gBoard[0].length) j = 0;
  else if (i === -1) i = gBoard.length - 1;
  else if (i === gBoard.length) i = 0;

  // Calculate distance to make sure we are moving to a neighbor cell
  const iAbsDiff = Math.abs(i - gGamerPos.i);
  const jAbsDiff = Math.abs(j - gGamerPos.j);

  if (
    (iAbsDiff === 1 && jAbsDiff === 0) ||
    (jAbsDiff === 1 && iAbsDiff === 0) ||
    iAbsDiff === gBoard.length - 1 ||
    jAbsDiff === gBoard[0].length - 1
  ) {
    const targetCell = gBoard[i][j];
    if (targetCell.type === WALL) return;
    // If the clicked Cell is one of the four allowed
    if (targetCell.gameElement === BALL) handleBall();
    else if (targetCell.gameElement === GLUE) handleGlue();
    else if (targetCell.gameElement === BOMB){
		handleBomb();
		bombedNegs(gBoard,i,j);
	} 
    gBoard[gGamerPos.i][gGamerPos.j].gameElement = null;
    renderCell(gGamerPos, '');

    // Move to next pos
    targetCell.gameElement = GAMER;
    gGamerPos = { i, j };
    if (gIsGamerGlued) gGamerImg = GLUED_GAMER_IMG;
    else if (gIsGamerBombed) gGamerImg = BOMBED_GAMER_IMG;
    else gGamerImg = GAMER_IMG;

    renderCell(gGamerPos, gGamerImg);
  }
}

function handleBall() {
  gEatBallCount++;
  gBallOnBoardCount--;
  const elEatBallsCount = document.querySelector('.balls-count span');
  elEatBallsCount.innerText = gEatBallCount;
  playBallSound();
  checkVictory();
}

function handleGlue() {
  gIsGamerGlued = true;
  setTimeout(() => {
    gIsGamerGlued = false;
    renderCell(gGamerPos, GAMER_IMG);
  }, 3000);
}

function handleBomb() {
  gIsGamerBombed = true;
  playBombSound()
  gameOver(gIsVictory);
}

function addElement(element,elementImg) {
  const emptyPos = getEmptyPos();
  if (!emptyPos) return;
  gBoard[emptyPos.i][emptyPos.j].gameElement = element;
  renderCell(emptyPos, elementImg);
}

function addBall() {
  addElement(BALL,BALL_IMG)
  gBallOnBoardCount++;
}

function addGlue() {
  addElement(GLUE,GLUE_IMG)
  setTimeout(removeElement, 3000, emptyPos);
}

function addBomb() {
  addElement(BOMB,BOMB_IMG)
  setTimeout(removeElement, 5000, emptyPos);
}

function removeElement(elementPos) {
  const cell = gBoard[elementPos.i][elementPos.j];
  if (cell.gameElement === GAMER) return;
  gBoard[elementPos.i][elementPos.j].gameElement = null;
  renderCell(elementPos, '');
}

function getEmptyPos() {
  const emptyPoss = [];
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      if (gBoard[i][j].type !== WALL && !gBoard[i][j].gameElement) {
        emptyPoss.push({ i, j });
      }
    }
  }
  var randIdx = getRandomInt(0, emptyPoss.length);
  return emptyPoss[randIdx];
}

function checkVictory() {
  if (gBallOnBoardCount === 0) {
    gIsVictory = true
    gameOver(gIsVictory);
  }
  return gIsVictory
}

function gameOver(isVictory) {
  gIsGameOn = false;
  clearInterval(gBallInterval);
  clearInterval(gGlueInterval);
  clearInterval(gBombInterval);
  var elModal = document.querySelector('.modal');
  var elHead = document.querySelector('.user-msg')
  elModal.style.display = 'block';
  elHead.innerText = (isVictory) ? 'You Won !' : 'Game Over !'
}

function bombedNegs(board, cellI, cellJ) {
  for (var i = cellI - 1; i <= cellI + 1; i++) {
    if (i < 0 || i >= board.length) continue;
    for (var j =cellJ - 1; j <=cellJ + 1; j++) {
      if (j < 0 || j >= board[i].length) continue;
		  var elCurrCell = document.querySelector(`.cell-${i}-${j}`)
		  elCurrCell.style.backgroundColor = "red";
    }
  }
}

function renderCell(location, value) {
  const cellSelector = '.' + getClassName(location); 
  const elCell = document.querySelector(cellSelector);
  elCell.innerHTML = value;
}

// Move the player by keyboard arrows
function onHandleKey(event) {
  const i = gGamerPos.i;
  const j = gGamerPos.j;

  switch (event.key) {
    case 'ArrowLeft':
      moveTo(i, j - 1);
      break;
    case 'ArrowRight':
      moveTo(i, j + 1);
      break;
    case 'ArrowUp':
      moveTo(i - 1, j);
      break;
    case 'ArrowDown':
      moveTo(i + 1, j);
      break;
  }
}

// Returns the class name for a specific cell
function getClassName(location) {
  const cellClass = 'cell-' + location.i + '-' + location.j;
  return cellClass;
}

function playBallSound() {
  const sound = new Audio('sound/sound.mp4');
  sound.play();
}

function playBombSound() {
	const sound = new Audio('sound/game-over.mp3');
	sound.play();
  }
