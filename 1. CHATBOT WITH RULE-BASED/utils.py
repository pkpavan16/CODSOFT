import ast
import json
import operator
import re
from datetime import datetime
from difflib import SequenceMatcher, get_close_matches
from pathlib import Path


def current_timestamp():
    return datetime.now().isoformat(timespec="seconds")


def today_key():
    return datetime.now().strftime("%Y-%m-%d")


def normalize_text(text):
    text = (text or "").lower().strip()
    text = re.sub(r"[^\w\s+\-*/().]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def load_json(path, default):
    path = Path(path)
    if not path.exists():
        return default
    try:
        with path.open("r", encoding="utf-8") as file:
            return json.load(file)
    except (json.JSONDecodeError, OSError):
        return default


def save_json(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)


def fuzzy_score(message, keywords):
    words = message.split()
    best_score = 0
    best_keyword = None

    for keyword in keywords:
        normalized_keyword = normalize_text(keyword)
        if not normalized_keyword:
            continue
        if normalized_keyword in message:
            return 100, keyword

        candidates = words + [" ".join(words[index:index + 2]) for index in range(max(len(words) - 1, 0))]
        close_matches = get_close_matches(normalized_keyword, candidates, n=1, cutoff=0.0)
        candidate = close_matches[0] if close_matches else message
        score = int(SequenceMatcher(None, normalized_keyword, candidate).ratio() * 100)
        if score > best_score:
            best_score = score
            best_keyword = keyword

    return best_score, best_keyword


# Supported operators for mathematical evaluation
OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.USub: operator.neg,
}


def safe_eval(expr_str):
    # Only allow safe math characters: digits, decimals, operators, parentheses, space
    if not re.match(r"^[0-9+\-*/().\s]+$", expr_str):
        raise ValueError("Invalid mathematical characters")
    try:
        node = ast.parse(expr_str, mode="eval")
        def eval_(n):
            if isinstance(n, ast.Expression):
                return eval_(n.body)
            elif isinstance(n, ast.Constant):
                if not isinstance(n.value, (int, float)):
                    raise TypeError("Only integers and floats are supported")
                return n.value
            elif isinstance(n, ast.BinOp):
                left = eval_(n.left)
                right = eval_(n.right)
                op_type = type(n.op)
                if op_type not in OPERATORS:
                    raise TypeError(f"Unsupported binary operator: {op_type}")
                if op_type == ast.Div and right == 0:
                    raise ZeroDivisionError("Division by zero")
                return OPERATORS[op_type](left, right)
            elif isinstance(n, ast.UnaryOp):
                operand = eval_(n.operand)
                op_type = type(n.op)
                if op_type not in OPERATORS:
                    raise TypeError(f"Unsupported unary operator: {op_type}")
                return OPERATORS[op_type](operand)
            else:
                raise TypeError(f"Unsupported syntax tree node: {type(n).__name__}")
        return eval_(node)
    except Exception as e:
        raise ValueError(str(e))

