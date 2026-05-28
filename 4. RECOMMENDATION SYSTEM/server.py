import http.server
import socketserver
import webbrowser
import threading
import time

PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Serve the current directory
        super().__init__(*args, directory=".", **kwargs)

def open_browser():
    """Wait for the server to start, then open the system default web browser."""
    time.sleep(1.0)
    print(f"Opening browser at http://localhost:{PORT}...")
    webbrowser.open(f"http://localhost:{PORT}")

if __name__ == "__main__":
    # Run the browser launcher in a daemon thread so it doesn't block the server startup
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Start the server on all interfaces (localhost and local network)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"PulseRec dashboard is running on port {PORT}.")
        print("Press Ctrl+C to stop the server.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
