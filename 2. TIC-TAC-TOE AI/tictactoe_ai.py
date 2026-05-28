"""
Tic-Tac-Toe AI Agent

Human player: X
AI agent: O
Algorithm: Minimax with Alpha-Beta Pruning
"""

import math


WIN_LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
]


def create_board():
    return [""] * 9


def check_winner(board):
    for line in WIN_LINES:
        a, b, c = line
        if board[a] and board[a] == board[b] == board[c]:
            return {"winner": board[a], "line": line}

    if all(board):
        return {"winner": "tie", "line": []}

    return None


def empty_cells(board):
    return [index for index, value in enumerate(board) if value == ""]


def minimax(board, depth, is_ai_turn, alpha, beta):
    result = check_winner(board)

    if result:
        if result["winner"] == "O":
            return 10 - depth
        if result["winner"] == "X":
            return depth - 10
        return 0

    if is_ai_turn:
        best_score = -math.inf

        for index in empty_cells(board):
            board[index] = "O"
            score = minimax(board, depth + 1, False, alpha, beta)
            board[index] = ""

            best_score = max(best_score, score)
            alpha = max(alpha, best_score)

            if beta <= alpha:
                break

        return best_score

    best_score = math.inf

    for index in empty_cells(board):
        board[index] = "X"
        score = minimax(board, depth + 1, True, alpha, beta)
        board[index] = ""

        best_score = min(best_score, score)
        beta = min(beta, best_score)

        if beta <= alpha:
            break

    return best_score


def ai_best_move(board):
    best_score = -math.inf
    move = None

    for index in empty_cells(board):
        board[index] = "O"
        score = minimax(board, 0, False, -math.inf, math.inf)
        board[index] = ""

        if score > best_score:
            best_score = score
            move = index

    return move, best_score


def ai_response(board):
    board = [cell if cell in ("X", "O") else "" for cell in board]
    result = check_winner(board)

    if result:
        return {"board": board, "move": None, "result": result}

    move, score = ai_best_move(board)

    if move is not None:
        board[move] = "O"

    return {
        "board": board,
        "move": move,
        "score": score,
        "result": check_winner(board),
    }


def print_board(board):
    values = [cell or str(index + 1) for index, cell in enumerate(board)]
    print()
    print(f" {values[0]} | {values[1]} | {values[2]}")
    print("---+---+---")
    print(f" {values[3]} | {values[4]} | {values[5]}")
    print("---+---+---")
    print(f" {values[6]} | {values[7]} | {values[8]}")
    print()


def play_terminal_game():
    board = create_board()

    while not check_winner(board):
        print_board(board)
        move = int(input("Choose your move (1-9): ")) - 1

        if move not in range(9) or board[move]:
            print("Invalid move. Try again.")
            continue

        board[move] = "X"

        if check_winner(board):
            break

        ai_move, _score = ai_best_move(board)
        board[ai_move] = "O"
        print(f"AI played position {ai_move + 1}")

    print_board(board)
    result = check_winner(board)
    print("Result:", result["winner"])


if __name__ == "__main__":
    play_terminal_game()
