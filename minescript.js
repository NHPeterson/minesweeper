"use strict";

// keep track of mouse buttons for the mouseup event
var mouseInt = 0;
// keep track of cleared cells for win condition
var cellsLeft;
// keep track of cells while clearing blanks
var cellCoords = [];
// timer
var timerF;
function gameTimer() {
	timerF = setInterval(function() {
		var timer = document.getElementById("timer");
		var time = parseInt(timer.innerHTML);
		time++;
		timer.innerHTML = time.toString().padStart(3, "0");
	}, 1000);
}
let gameType = 1;

// on page load, assign functions to buttons, load high scores, and create the beginner puzzle
window.onload = function() {
	document.getElementById("beginner").onclick = beginnerButton;
	document.getElementById("intermediate").onclick = intermediateButton;
	document.getElementById("expert").onclick = expertButton;
	document.getElementById("custom").onclick = customButton;
	document.getElementById("height").value = 9;
	document.getElementById("width").value = 9;
	document.getElementById("mines").value = 10;
	if (!localStorage.getItem("mine_score1")) {
		localStorage.setItem("mine_name1", "(none)");
		localStorage.setItem("mine_score1", "(none)");
		localStorage.setItem("mine_name2", "(none)");
		localStorage.setItem("mine_score2", "(none)");
		localStorage.setItem("mine_name3", "(none)");
		localStorage.setItem("mine_score3", "(none)");
	} else {
		document.getElementById("beg_name").innerHTML = localStorage.getItem("mine_name1");
		document.getElementById("beg_score").innerHTML = localStorage.getItem("mine_score1");
		document.getElementById("int_name").innerHTML = localStorage.getItem("mine_name2");
		document.getElementById("int_score").innerHTML = localStorage.getItem("mine_score2");
		document.getElementById("exp_name").innerHTML = localStorage.getItem("mine_name3");
		document.getElementById("exp_score").innerHTML = localStorage.getItem("mine_score3");
	}
	createGame();
}

// create game
function createGame() {
	// get puzzle values
	var heightNum = parseInt(document.getElementById("height").value);
	var widthNum = parseInt(document.getElementById("width").value);
	var minesNum = parseInt(document.getElementById("mines").value);
	cellsLeft = heightNum * widthNum - minesNum;
	document.getElementById("flags").innerHTML = minesNum.toString().padStart(3, "0");
	var gameBoard = document.getElementById("gameboard");
	// remove any previous game
	while (gameBoard.hasChildNodes()) { gameBoard.removeChild(gameBoard.firstChild); }
	clearInterval(timerF);
	document.getElementById("timer").innerHTML = "000";
	// create new tables
	var gameTable = document.createElement("table");
	var mineTable = document.createElement("table");
	gameBoard.appendChild(gameTable);
	gameBoard.appendChild(mineTable);
	gameTable.setAttribute("started", "no");
	mineTable.setAttribute("hidden", "");
	for (var i = 0; i < heightNum; i++) {
		var gameRow = document.createElement("tr");
		var mineRow = document.createElement("tr");
		gameTable.appendChild(gameRow);
		mineTable.appendChild(mineRow);
		for (var j = 0; j < widthNum; j++) {
			var gameCell = document.createElement("td");
			var mineCell = document.createElement("td");
			gameRow.appendChild(gameCell);
			mineRow.appendChild(mineCell);
			gameCell.setAttribute("row", i);
			gameCell.setAttribute("col", j);
			gameCell.setAttribute("class", "");
			gameCell.setAttribute("state", "");
			if (minesNum > 0) {
				minesNum -= 1;
				mineCell.innerHTML = 1;
			} else {
				mineCell.innerHTML = 0;
			}
			// assign mouse events
			gameCell.addEventListener("contextmenu", function(e) {
				e.preventDefault();
			});
			gameCell.addEventListener("mousedown", mouseDown);
			gameCell.addEventListener("mouseup", mouseUp);
			gameCell.addEventListener("mouseout", mouseOut);
		}
	}
}

// mouse down
function mouseDown(e) {
	// make it look like the cell is being clicked down
	if (e.target.getAttribute("class") !== "down") { e.target.setAttribute("class", "down"); }
	// simulate left click for when surrounding cells are activated
	if (e.buttons === 0) {
		mouseInt = 1;
	} else {
		mouseInt = e.buttons;
		// dual click on cleared numbers "clicks" down on surrounding cells
		if (mouseInt === 3 && e.target.getAttribute("state") === "clear") {
			var gameTable = document.getElementById("gameboard").firstChild;
			var targetRow = parseInt(e.target.getAttribute("row"));
			var targetCol = parseInt(e.target.getAttribute("col"));
			for (var i = -1; i < 2; i++) {
				if (gameTable.rows[targetRow + i] === undefined) { continue; }
				for (var j = -1; j < 2; j++) {
					if (gameTable.rows[targetRow + i].cells[targetCol + j] === undefined
					|| gameTable.rows[targetRow + i].cells[targetCol + j].getAttribute("state") === "clear") { continue; }
					gameTable.rows[targetRow + i].cells[targetCol + j].setAttribute("class", "down");
				}
			}
		}
		// if more buttons are clicked then release all
		else if (mouseInt > 3) {
			var gameTable = document.getElementById("gameboard").firstChild;
			var targetRow = parseInt(e.target.getAttribute("row"));
			var targetCol = parseInt(e.target.getAttribute("col"));
			for (var i = -1; i < 2; i++) {
				if (gameTable.rows[targetRow + i] === undefined) { continue; }
				for (var j = -1; j < 2; j++) {
					if (gameTable.rows[targetRow + i].cells[targetCol + j] === undefined
					|| gameTable.rows[targetRow + i].cells[targetCol + j].getAttribute("state") === "clear") { continue; }
					gameTable.rows[targetRow + i].cells[targetCol + j].setAttribute("class", "");
				}
			}
		}
	}
}

// mouse up
function mouseUp(e) {
	if (e.target.className === "down") {
		// left click
		if (mouseInt === 1 && e.target.getAttribute("state") !== "clear") {
			mouseInt = 0;
			// if it's flagged, just release the cell
			if (e.target.getAttribute("state") === "flagged") {
				e.target.setAttribute("class", "");
			} else {
				e.target.setAttribute("state", "clear");
				mineEngine(e.target);
			}
		}
		// right click cycles through flagging
		else if (mouseInt === 2 && e.target.getAttribute("state") !== "clear") {
			mouseInt = 0;
			var flagNode = document.getElementById("flags");
			var flags = parseInt(flagNode.innerHTML);
			e.target.setAttribute("class", "");
			if (e.target.getAttribute("state") === "flagged") {
				e.target.innerHTML = "?";
				e.target.setAttribute("state", "question");
				e.target.style.fontSize = "20px";
				flags += 1;
				flagNode.innerHTML = formatNum3(flags);
			} else if (e.target.getAttribute("state") === "question") {
				e.target.innerHTML = "";
				e.target.setAttribute("state", "");
			} else {
				e.target.innerHTML = "&#128681;";
				e.target.setAttribute("state", "flagged");
				e.target.style.fontSize = "14px";
				flags -= 1;
				flagNode.innerHTML = formatNum3(flags);
			}
		}
		// dual click on revealed cell reveals all non-flagged surrounding cells
		else if (mouseInt === 3 && e.target.getAttribute("state") === "clear") {
			// only complete on releasing both (releasing one button does nothing)
			if (e.buttons === 0) {
				mouseInt = 0;
				var gameTable = document.getElementById("gameboard").firstChild;
				var targetRow = parseInt(e.target.getAttribute("row"));
				var targetCol = parseInt(e.target.getAttribute("col"));
				var cellNum = parseInt(e.target.innerHTML);
				var flags = 0;
				// only reveal if the clicked cell number equals the number of flags touching
				for (var i = -1; i < 2; i++) {
					if (gameTable.rows[targetRow + i] === undefined) { continue; }
					for (var j = -1; j < 2; j++) {
						if (gameTable.rows[targetRow + i].cells[targetCol + j] === undefined
						|| gameTable.rows[targetRow + i].cells[targetCol + j].getAttribute("state") === "clear") { continue; }
						if (gameTable.rows[targetRow + i].cells[targetCol + j].getAttribute("state") === "flagged") {
							flags += 1;
						}
					}
				}
				if (cellNum === flags) {
					for (var i = -1; i < 2; i++) {
						if (gameTable.rows[targetRow + i] === undefined) { continue; }
						for (var j = -1; j < 2; j++) {
							if (gameTable.rows[targetRow + i].cells[targetCol + j] === undefined
							|| gameTable.rows[targetRow + i].cells[targetCol + j].getAttribute("state") === "clear") { continue; }
							if (gameTable.rows[targetRow + i].cells[targetCol + j].getAttribute("state") === "flagged") {
								gameTable.rows[targetRow + i].cells[targetCol + j].setAttribute("class", "");
							} else {
								gameTable.rows[targetRow + i].cells[targetCol + j].setAttribute("state", "clear");
								mineEngine(gameTable.rows[targetRow + i].cells[targetCol + j]);
							}
						}
					}
				} else {
					for (var i = -1; i < 2; i++) {
						if (gameTable.rows[targetRow + i] === undefined) { continue; }
						for (var j = -1; j < 2; j++) {
							if (gameTable.rows[targetRow + i].cells[targetCol + j] === undefined
							|| gameTable.rows[targetRow + i].cells[targetCol + j].getAttribute("state") === "clear") { continue; }
							gameTable.rows[targetRow + i].cells[targetCol + j].setAttribute("class", "");
						}
					}
				}
			}
		}
		// any other mouse button / combination just releases the cell
		else if (e.target.getAttribute("state") !== "clear") {
			mouseInt = 0;
			e.target.setAttribute("class", "");
		}
	}
}

// mouse out releases cell(s)
function mouseOut(e) {
	if (e.target.getAttribute("state") !== "clear") {
		e.target.setAttribute("class", "");
	} else if (mouseInt >= 3) {
		var gameTable = document.getElementById("gameboard").firstChild;
		var targetRow = parseInt(e.target.getAttribute("row"));
		var targetCol = parseInt(e.target.getAttribute("col"));
		for (var i = -1; i < 2; i++) {
			if (gameTable.rows[targetRow + i] === undefined) { continue; }
			for (var j = -1; j < 2; j++) {
				if (gameTable.rows[targetRow + i].cells[targetCol + j] === undefined
				|| gameTable.rows[targetRow + i].cells[targetCol + j].getAttribute("state") === "clear") { continue; }
				gameTable.rows[targetRow + i].cells[targetCol + j].setAttribute("class", "");
			}
		}
	}
	mouseInt = 0;
}

// engine
function mineEngine(targetCell) {
	var gameTable = document.getElementById("gameboard").firstChild;
	var mineTable = gameTable.nextSibling;
	var targetRow = parseInt(targetCell.getAttribute("row"));
	var targetCol = parseInt(targetCell.getAttribute("col"));
	// on the first click, generate the mine positions and start the timer
	if (gameTable.getAttribute("started") === "no") {
		gameTable.setAttribute("started", "yes");
		gameTimer();
		// at least once, and until the clicked cell is not a mine
		do {
			// randomize vertically
			for (var i = 0; i < mineTable.rows[0].cells.length; i++) {
				for (var j = mineTable.rows.length - 1; j > 0; j--) {
					var r = Math.floor(Math.random() * (j + 1));
					var s = mineTable.rows[j].cells[i].innerHTML;
					mineTable.rows[j].cells[i].innerHTML = mineTable.rows[r].cells[i].innerHTML;
					mineTable.rows[r].cells[i].innerHTML = s;
				}
			}
			// randomize horizontally
			for (var i = 0; i < mineTable.rows.length; i++) {
				for (var j = mineTable.rows[i].cells.length - 1; j > 0; j--) {
					var c = Math.floor(Math.random() * (j + 1));
					var d = mineTable.rows[i].cells[j].innerHTML;
					mineTable.rows[i].cells[j].innerHTML = mineTable.rows[i].cells[c].innerHTML;
					mineTable.rows[i].cells[c].innerHTML = d;
				}
			}
		} while (mineTable.rows[targetRow].cells[targetCol].innerHTML === "1")
	}
	// reveal the number
	if (mineTable.rows[targetRow].cells[targetCol].innerHTML === "0") {
		// count how many mines are nearby
		var touching = 0;
		for (var i = -1; i < 2; i++) {
			if (mineTable.rows[targetRow + i] === undefined) { continue; }
			for (var j = -1; j < 2; j++) {
				if (mineTable.rows[targetRow + i].cells[targetCol + j] === undefined) { continue; }
				touching += parseInt(mineTable.rows[targetRow + i].cells[targetCol + j].innerHTML);
			}
		}
		// use the count to assign the number
		switch (touching) {
			// if blank, "click" each surrounding cell
			case 0:
				targetCell.innerHTML = "";
				for (var i = -1; i < 2; i++) {
					if (gameTable.rows[targetRow + i] === undefined) { continue; }
					for (var j = -1; j < 2; j++) {
						if (gameTable.rows[targetRow + i].cells[targetCol + j] === undefined
						|| (i === 0 && j === 0)
						|| gameTable.rows[targetRow + i].cells[targetCol + j].getAttribute("state") === "clear"
						|| gameTable.rows[targetRow + i].cells[targetCol + j].getAttribute("state") === "flagged") { continue; }
						var coordsStr = (targetRow + i).toString() + "," + (targetCol + j).toString();
						if (cellCoords.indexOf(coordsStr) === -1) {
							cellCoords.push(coordsStr);
						}
					}
				}
				if (targetCell.getAttribute("state") === "clear") {
					// for each entry in the array, clear the cell
					var newRow;
					var newCol;
					var tempCoords;
					while (cellCoords.length > 0) {
						tempCoords = cellCoords.shift().split(",");
						newRow = parseInt(tempCoords[0]);
						newCol = parseInt(tempCoords[1]);
						mineEngine(gameTable.rows[newRow].cells[newCol]);
					}
				}
				break;
			case 1:
				targetCell.innerHTML = 1;
				targetCell.style.color = "blue";
				break;
			case 2:
				targetCell.innerHTML = 2;
				targetCell.style.color = "green";
				break;
			case 3:
				targetCell.innerHTML = 3;
				targetCell.style.color = "red";
				break;
			case 4:
				targetCell.innerHTML = 4;
				targetCell.style.color = "purple";
				break;
			case 5:
				targetCell.innerHTML = 5;
				targetCell.style.color = "maroon";
				break;
			case 6:
				targetCell.innerHTML = 6;
				targetCell.style.color = "teal";
				break;
			case 7:
				targetCell.innerHTML = 7;
				targetCell.style.color = "black";
				break;
			case 8:
				targetCell.innerHTML = 8;
				targetCell.style.color = "darkgray";
				break;
		}
		if (targetCell.getAttribute("state") !== "clear") {
			targetCell.setAttribute("state", "clear");
			targetCell.setAttribute("class", "down");
		}
		// if the last non-mine cell is revealed, win game
		cellsLeft -= 1;
		if (cellsLeft === 0) {
			clearInterval(timerF);
			gameTable.setAttribute("started", "no");
			for (var i = 0; i < gameTable.rows.length; i++) {
				for (var j = 0; j < gameTable.rows[i].cells.length; j++) {
					gameTable.rows[i].cells[j].removeEventListener("mousedown", mouseDown);
					gameTable.rows[i].cells[j].removeEventListener("mouseup", mouseUp);
					gameTable.rows[i].cells[j].removeEventListener("mouseout", mouseOut);
					if (gameTable.rows[i].cells[j].getAttribute("state") !== "flagged"
						&& mineTable.rows[i].cells[j].innerHTML === "1") {
						gameTable.rows[i].cells[j].innerHTML = "&#128681;";
						gameTable.rows[i].cells[j].style.fontSize = "14px";
					}
				}
			}
			let timeScore = parseInt(document.getElementById("timer").innerHTML);
			if (gameType === 1 && (localStorage.getItem("mine_score1") === "(none)" || localStorage.getItem("mine_score1") > timeScore)) {
				setTimeout(function() {
					let hiName = prompt("New best time! Enter your name:");
					if (hiName) {
						localStorage.setItem("mine_name1", hiName);
						document.getElementById("beg_name").innerHTML = hiName;
						localStorage.setItem("mine_score1", timeScore);
						document.getElementById("beg_score").innerHTML = timeScore;
					}
				}, 100);
			} else if (gameType === 2 && (localStorage.getItem("mine_score2") === "(none)" || localStorage.getItem("mine_score2") > timeScore)) {
				setTimeout(function() {
					let hiName = prompt("New best time! Enter your name:");
					if (hiName) {
						localStorage.setItem("mine_name2", hiName);
						document.getElementById("int_name").innerHTML = hiName;
						localStorage.setItem("mine_score2", timeScore);
						document.getElementById("int_score").innerHTML = timeScore;
					}
				}, 100);
			} else if (gameType === 3 && (localStorage.getItem("mine_score3") === "(none)" || localStorage.getItem("mine_score3") > timeScore)) {
				setTimeout(function() {
					let hiName = prompt("New best time! Enter your name:");
					if (hiName) {
						localStorage.setItem("mine_name3", hiName);
						document.getElementById("exp_name").innerHTML = hiName;
						localStorage.setItem("mine_score3", timeScore);
						document.getElementById("exp_score").innerHTML = timeScore;
					}
				}, 100);
			} else {
				setTimeout(function() { alert("You win!"); }, 100);
			}
		}
	}
	// if mine clicked, lose game
	else {
		clearInterval(timerF);
		gameTable.setAttribute("started", "no");
		for (var i = 0; i < gameTable.rows.length; i++) {
			for (var j = 0; j < gameTable.rows[i].cells.length; j++) {
				gameTable.rows[i].cells[j].removeEventListener("mousedown", mouseDown);
				gameTable.rows[i].cells[j].removeEventListener("mouseup", mouseUp);
				gameTable.rows[i].cells[j].removeEventListener("mouseout", mouseOut);
				if (gameTable.rows[i].cells[j].getAttribute("state") === "flagged"
					&& mineTable.rows[i].cells[j].innerHTML === "0") {
					gameTable.rows[i].cells[j].innerHTML = "&#10060;";
				} else if (gameTable.rows[i].cells[j].getAttribute("state") !== "flagged"
					&& mineTable.rows[i].cells[j].innerHTML === "1") {
					gameTable.rows[i].cells[j].innerHTML = "&#128163;";
					gameTable.rows[i].cells[j].setAttribute("class", "down");
					gameTable.rows[i].cells[j].style.fontSize = "14px";
				}
			}
		}
		targetCell.style.backgroundColor = "red";
		setTimeout(function() { alert("You lose!"); }, 10);
	}
}

// beginner
function beginnerButton() {
	if (document.querySelector("[started]").getAttribute("started") === "no" || confirm("This will reset the game!")) {
		document.getElementById("height").value = 9;
		document.getElementById("width").value = 9;
		document.getElementById("mines").value = 10;
		gameType = 1;
		createGame();
	}
}

// intermediate
function intermediateButton() {
	if (document.querySelector("[started]").getAttribute("started") === "no" || confirm("This will reset the game!")) {
		document.getElementById("height").value = 16;
		document.getElementById("width").value = 16;
		document.getElementById("mines").value = 40;
		gameType = 2;
		createGame();
	}
}

// expert
function expertButton() {
	if (document.querySelector("[started]").getAttribute("started") === "no" || confirm("This will reset the game!")) {
		document.getElementById("height").value = 16;
		document.getElementById("width").value = 30;
		document.getElementById("mines").value = 99;
		gameType = 3;
		createGame();
	}
}

// custom
function customButton() {
	if (document.querySelector("[started]").getAttribute("started") === "no" || confirm("This will reset the game!")) {
		var height = document.getElementById("height");
		var width = document.getElementById("width");
		var mines = document.getElementById("mines");
		var heightNum = parseInt(height.value);
		var widthNum = parseInt(width.value);
		var minesNum = parseInt(mines.value);
		// min height / width is 1, min mines is 0, non-int set to int
		if (heightNum < 1 || isNaN(heightNum)) { heightNum = 1; }
		if (widthNum < 1 || isNaN(widthNum)) { widthNum = 1; }
		if (minesNum < 0 || isNaN(minesNum)) { minesNum = 0; }
		height.value = heightNum;
		width.value = widthNum;
		mines.value = minesNum;
		// max mines is one less than the max cells
		if (minesNum >= (heightNum * widthNum)) {
			mines.value = heightNum * widthNum - 1;
		}
		gameType = 4;
		createGame();
	}
}

// pad numbers to 3 digits, including negatives
function formatNum3(num3) {
	if (num3 < 0) {
		num3 = "-" + Math.abs(num3).toString().padStart(3, "0");
	} else {
		num3 = num3.toString().padStart(3, "0");
	}
	return num3;
}
