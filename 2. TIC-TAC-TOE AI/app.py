import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

from tictactoe_ai import ai_response


ROOT = Path(__file__).parent
HOST = "localhost"
PORT = 8000


class TicTacToeServer(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path in ("/", "/tictactoe-ai.html"):
            self.send_file(ROOT / "tictactoe-ai.html", "text/html")
            return

        self.send_error(404, "File not found")

    def do_POST(self):
        if self.path != "/ai-move":
            self.send_error(404, "Endpoint not found")
            return

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)

        try:
            data = json.loads(body)
            board = data.get("board", [])

            if not isinstance(board, list) or len(board) != 9:
                raise ValueError("Board must contain 9 cells")

            response = ai_response(board)
            self.send_json(response)
        except Exception as exc:
            self.send_json({"error": str(exc)}, status=400)

    def send_file(self, file_path, content_type):
        content = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", f"{content_type}; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def send_json(self, data, status=200):
        content = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)


if __name__ == "__main__":
    server = HTTPServer((HOST, PORT), TicTacToeServer)
    print(f"Tic-Tac-Toe AI running at http://{HOST}:{PORT}")
    server.serve_forever()
