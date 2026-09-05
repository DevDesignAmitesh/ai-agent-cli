from http.server import BaseHTTPRequestHandler, HTTPServer
import cgi
import os
import json
import main


class RequestHandler(BaseHTTPRequestHandler):

    # POST /upload-and-transcribe or /transcribe
    def do_POST(self):

        if self.path == "/transcribe":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)

            try:
                data = json.loads(body)
                filename = data["fileName"]
            except (json.JSONDecodeError, KeyError, TypeError):
                self.send_response(400)
                self.end_headers()
                return

            print("Received:", data)
            transcribed_response = main.transcribe(filename)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(transcribed_response).encode())
            return

server = HTTPServer(("localhost", 8000), RequestHandler)

print("Server running at http://localhost:8000")

server.serve_forever()

