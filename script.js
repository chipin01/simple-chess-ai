var startingPos = 'k7/5p2/8/8/8/8/5P2/K7 w - - 0 1',
    board,
    game = new Chess(startingPos);
var games = [];
document.getElementById('file-selector')
    .addEventListener('change', function () {

        var fr = new FileReader();
        fr.onload = function () {
            var pgns = fr.result.split("\n[Event ");

            for (var i = 0; i < 1500; i++) {
                pgns[i] = "[Event " + pgns[i];
                var new_game = new Chess();
                new_game.load_pgn(pgns[i]);
                games.push(new_game);
            }

            // game.load_pgn(fr.result);
        }

        fr.readAsText(this.files[0]);
    });

/*The "AI" part starts here */

var minimaxRoot = function (depth, game, isMaximisingPlayer) {

    var newGameMoves = game.ugly_moves();
    var bestMove = -9999;
    var bestMoveFound;

    //$('#positions-per-s').text("best move: " + rand + "; " + JSON.stringify(bestMoveFound));

    for (var i = 0; i < newGameMoves.length; i++) {
        var newGameMove = newGameMoves[i];
        game.ugly_move(newGameMove);
        var value = minimax(depth - 1, game, -10000, 10000, !isMaximisingPlayer);
        game.undo();
        if (value >= bestMove) {
            bestMove = value;
            bestMoveFound = newGameMove;
        }
    }

    return bestMoveFound;
};

var minimax = function (depth, game, alpha, beta, isMaximisingPlayer) {
    positionCount++;
    if (depth === 0) {
        return -evaluateBoard(game.board());
    }

    var newGameMoves = game.ugly_moves();

    if (isMaximisingPlayer) {
        var bestMove = -9999;
        for (var i = 0; i < newGameMoves.length; i++) {
            game.ugly_move(newGameMoves[i]);
            bestMove = Math.max(bestMove, minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
            game.undo();
            alpha = Math.max(alpha, bestMove);
            if (beta <= alpha) {
                return bestMove;
            }
        }
        return bestMove;
    } else {
        var bestMove = 9999;
        for (var i = 0; i < newGameMoves.length; i++) {
            game.ugly_move(newGameMoves[i]);
            bestMove = Math.min(bestMove, minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
            game.undo();
            beta = Math.min(beta, bestMove);
            if (beta <= alpha) {
                return bestMove;
            }
        }
        return bestMove;
    }
};


var REVERSE_SIMPLE = [
    'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8',
    'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
    'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
    'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
    'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
    'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
    'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
    'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1',
];
    
var fromChessJsPos = function (pos) {
   return (pos % 8) + 8 * Math.floor(pos / 16);
}

var toChessJsPos = function (pos) {
    return (pos % 8) + 16 * Math.floor(pos / 8);
}

var getNextKnightMoves = function (pos) {
    pos = toChessJsPos(pos);
    var legalKnightSquare = [];
    var knightOffsets = [-18, -33, -31, -14, 18, 33, 31, 14];
    for (var i = 0; i < knightOffsets.length; i++) {
        var knightOffsetSquare = pos + knightOffsets[i];
        if (knightOffsetSquare & 0x88) continue;
        legalKnightSquare.push(fromChessJsPos(knightOffsetSquare));
    }
    return legalKnightSquare;
}

var findShortestKnight = function (pos, tarPos) {
    var queue = [pos];
    var visited = new Array(64);

    while (queue.length !== 0) {
        var curMove = queue.shift();
        var step = visited[curMove] ? visited[curMove] : 0;

        if (curMove === tarPos) {
            return step;
        }

        var nextMoves = getNextKnightMoves(curMove);
        for (var i = 0; i < nextMoves.length; i++) {
            if (visited[nextMoves[i]] !== undefined) continue;

            visited[nextMoves[i]] = step + 1;
            queue.push(nextMoves[i]);
        }
    }

    return -1;
}




var findShortestRook = function (pos, tarPos) {
    var absRook = Math.abs(pos - tarPos);
    if (pos === tarPos) {
        return 0;
    }
    if (absRook % 8 === 0) {
        return 1;
    }
    var jsRookPos = toChessJsPos(pos);
    var jsRooktarPos = toChessJsPos(tarPos);
    if (Math.abs(jsRookPos - jsRooktarPos) <= 7) {
        return 1;
    }
    return 2;
}
var findShortestBishop = function (pos, tarPos) {
    var absBishopDif = Math.abs(pos - tarPos);
    var simplePosBishop = fromChessJsPos(pos);
    var simpletarPosBishop = fromChessJsPos(tarPos);
    var squareColorPos = game.square_color(REVERSE_SIMPLE[simplePosBishop]);
    var squareColortarPos = game.square_color(REVERSE_SIMPLE[simpletarPosBishop]);
    if (pos === tarPos) {
        return 0;
    }
    else if (absBishopDif % 15 === 0 || absBishopDif % 17 === 0) {
        return 1;
    }
    else if (squareColorPos !== squareColortarPos) {
        return -1;
    }
    else {
        return 2;
    }
}



var findShortestQueen = function (pos, tarPos) {
    var bishopQueen = findShortestBishop(pos, tarPos);
    var rookQueen = findShortestRook(pos, tarPos);
    if (pos === tarPos) {
        return 0;
    }
    if (bishopQueen !== -1) {
        return Math.min(bishopQueen, rookQueen);
    }
    return rookQueen;
}

var findShortestPawn = function (pos, tarPos, isWhite) {
    if (pos === tarPos) {
        return 0;
    }
    if (pos % 8 !== tarPos % 8) {
        return -1;
    }
    if (isWhite) {
        if (Math.floor(pos / 8) === 6) {
            if (pos - 8 === tarPos) {
                return 1;
            }
            return Math.abs(pos - tarPos) / 8 - 1;
        }
        return Math.abs(pos - tarPos) / 8;
    }
    else {
        if (Math.floor(pos / 8) === 1) {
            if (pos + 8 === tarPos) {
                return 1;
            }
            return Math.abs(pos - tarPos) / 8 - 1;
        }
        return Math.abs(pos - tarPos) / 8;
    }
}

var findShortestKing = function (pos, tarPos) {
    if (pos === tarPos) {
        return 0;
    }
    var kingDistanceRank = Math.abs((pos % 8) - (tarPos % 8));
    var kingDistanceFile = Math.abs((Math.floor(pos / 8)) - (Math.floor(tarPos / 8)));
    return Math.max(kingDistanceRank, kingDistanceFile);
}

var moveNumber = 1;

var evaluateBoard = function (board) {
    // var tempBoard = new ChessBoard('fen...');
    var totalEvaluation = 0;
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            totalEvaluation = totalEvaluation + getPieceValue(board[i][j], i, j);
        }
    }
    return totalEvaluation;
};

var reverseArray = function (array) {
    return array.slice().reverse();
};

var pawnEvalWhite =
    [
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        [6.0, 5.5, 5.0, 5.0, 5.0, 5.0, 5.5, 6.0],
        [1.5, 1.5, 2.0, 3.0, 3.0, 2.0, 1.5, 1.5],
        [-0.5, -0.5, 0.0, 2.5, 2.5, 0.0, -0.5, -0.5],
        [-0.5, -1.0, 0.0, 2.0, 2.0, -1.5, 0.0, 0.0],
        [0.5, 0.5, -0.5, 0.0, 0.0, -2.0, 0.5, 0.5],
        [0.5, 1.0, 1.0, -2.0, -2.0, 1.0, 1.0, 0.5],
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    ];

var pawnEvalBlack = reverseArray(pawnEvalWhite);

var knightEvalWhite =
    [
        [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0],
        [-4.0, -3.0, 0.0, 0.5, 0.5, 0.0, -3.0, -4.0],
        [-2.0, 0.5, 1.5, 1.0, 1.0, 1.5, 0.5, -2.0],
        [-2.5, -0.5, 2.0, 1.5, 1.5, 3.0, -0.5, -2.5],
        [-2.5, -0.5, 2.5, 1.5, 1.5, 1.0, -0.5, -2.5],
        [-2.0, 0.5, 1.5, 0.0, 0.0, 1.5, 1.0, -2.0],
        [-4.0, -3.0, 0.0, 0.5, 0.5, 0.0, -3.0, -4.0],
        [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0]
    ];
var knightEvalBlack = reverseArray(knightEvalWhite);
var bishopEvalWhite = [
    [-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
    [-1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0],
    [-1.0, 0.0, 0.5, 1.0, 1.0, 0.5, 0.0, -1.0],
    [-1.0, 0.5, 0.5, 1.0, 1.0, 0.5, 0.5, -1.0],
    [-1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0],
    [-1.0, -0.5, 1.5, 0.5, 0.5, 1.5, -0.5, -1.0],
    [-2.0, 2.0, -0.5, -1.0, -1.0, -0.0, 2.0, -2.0],
    [-1.0, -2.0, -1.0, -1.5, -1.5, -1.0, -2.0, -1.0]
];

var bishopEvalBlack = reverseArray(bishopEvalWhite);

var rookEvalWhite = [
    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    [1.0, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.0],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [0.0, 0.0, 0.0, 1.5, 1.5, 0.0, 0.0, 0.0]
];

var rookEvalBlack = reverseArray(rookEvalWhite);

var evalQueen = [
    [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0],
    [-1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0],
    [-1.0, 0.0, 0.5, 0.5, 0.5, 0.5, 0.0, -1.0],
    [-0.5, 0.0, 0.5, 0.5, 0.5, 0.5, 0.0, -0.5],
    [0.0, 0.0, 0.5, 0.5, 0.5, 0.5, 0.0, -0.5],
    [-1.0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.0, -1.0],
    [-1.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, -1.0],
    [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0]
];

var kingEvalWhite = [

    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-2.0, -3.0, -3.0, -4.0, -4.0, -3.0, -3.0, -2.0],
    [-1.0, -2.0, -2.0, -2.0, -2.0, -2.0, -2.0, -1.0],
    [2.0, 2.0, 0.0, 0.0, 0.0, 0.0, 2.0, 2.0],
    [2.0, 3.0, 1.0, 0.0, 0.0, 1.0, 3.0, 2.0]
];

var kingEvalBlack = reverseArray(kingEvalWhite);


var getPieceValue = function (piece, x, y) {
    if (piece === null) {
        return 0;
    }
    var getAbsoluteValue = function (piece, isWhite, x, y) {
        if (piece.type === 'p') {
            // console.log(findShortestPawn(48, 0, true) /*simple squares */);
            return 10 + (isWhite ? pawnEvalWhite[y][x] : pawnEvalBlack[y][x]);
        } else if (piece.type === 'r') {
            // console.log(findShortestRook(1, 69) /* simple squares */)
            return 50 + (isWhite ? rookEvalWhite[y][x] : rookEvalBlack[y][x]);
        } else if (piece.type === 'n') {
            // console.log(findShortestKnight(0, 21) /* simple squares */);
            return 30 + (isWhite ? knightEvalWhite[y][x] : knightEvalBlack[y][x]);
        } else if (piece.type === 'b') {
            // console.log(findShortestBishop(0, 54) /* simple squares */);
            return 33 + (isWhite ? bishopEvalWhite[y][x] : bishopEvalBlack[y][x]);
        } else if (piece.type === 'q') {
            // console.log(findShortestQueen(0, 57) /* simple squares */);
            return 90 + evalQueen[y][x];
        } else if (piece.type === 'k') {
            // console.log(findShortestKing(0, 63) /* simple squares */);
            return 900 + (isWhite ? kingEvalWhite[y][x] : kingEvalBlack[y][x]);
        }
        throw "Unknown piece type: " + piece.type;

    };

    var absoluteValue = getAbsoluteValue(piece, piece.color === 'w', x, y);
    return piece.color === 'w' ? absoluteValue : -absoluteValue;
};


/* board visualization and games state handling */

var onDragStart = function (source, piece, position, orientation) {
    if (game.in_checkmate() === true || game.in_draw() === true ||
        piece.search(/^b/) !== -1) {
        return false;
    }
};

var makeBestMove = function () {
    var bestMove = getBestMove(game);
    game.ugly_move(bestMove);
    board.position(game.fen());
    renderMoveHistory(game.history());
    if (game.game_over()) {
        alert('Game over');
    }
};


var positionCount;
var getBestMove = function (game) {
    if (game.game_over()) {
        alert('Game Over');
    }

    positionCount = 0;
    var depth = parseInt($('#search-depth').find(':selected').text());

    var d = new Date().getTime();
    var bestMove = minimaxRoot(depth, game, true);
    var d2 = new Date().getTime();
    var moveTime = (d2 - d);
    var positionsPerS = (positionCount * 1000 / moveTime);

    $('#position-count').text(positionCount);
    $('#time').text(moveTime / 1000 + 's');
    // $('#positions-per-s').text(positionsPerS);
    return bestMove;
};

var renderMoveHistory = function (moves) {
    var historyElement = $('#move-history').empty();
    historyElement.empty();
    for (var i = 0; i < moves.length; i = i + 2) {
        historyElement.append('<span>' + moves[i] + ' ' + (moves[i + 1] ? moves[i + 1] : ' ') + '</span><br>')
    }
    historyElement.scrollTop(historyElement[0].scrollHeight);

};

var onDrop = function (source, target) {

    var move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    removeGreySquares();
    if (move === null) {
        return 'snapback';
    }

    renderMoveHistory(game.history());
    window.setTimeout(makeBestMove, 250);
};

var onSnapEnd = function () {
    board.position(game.fen());
};

var onMouseoverSquare = function (square, piece) {
    var moves = game.moves({
        square: square,
        verbose: true
    });

    if (moves.length === 0) return;

    greySquare(square);

    for (var i = 0; i < moves.length; i++) {
        greySquare(moves[i].to);
    }
};

var onMouseoutSquare = function (square, piece) {
    removeGreySquares();
};

var removeGreySquares = function () {
    $('#board .square-55d63').css('background', '');
};

var greySquare = function (square) {
    var squareEl = $('#board .square-' + square);

    var background = '#a9a9a9';
    if (squareEl.hasClass('black-3c85d') === true) {
        background = '#696969';
    }

    squareEl.css('background', background);
};

var cfg = {
    draggable: true,
    position: startingPos,
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    onSnapEnd: onSnapEnd
};
board = ChessBoard('board', cfg);