from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import main


class RequestHandler(BaseHTTPRequestHandler):

    # POST /upload-and-transcribe or /transcribe
    def do_POST(self):

        if self.path == "/transcribe-chunk":

            content_length = int(
                self.headers.get("Content-Length", 0)
            )

            audio_bytes = self.rfile.read(content_length)

            print(
                f"Received PCM: {len(audio_bytes)} bytes"
            )

            result = main.transcribe_pcm(audio_bytes)

            self.send_response(200)
            self.send_header(
                "Content-Type",
                "application/json"
            )
            self.end_headers()

            self.wfile.write(
                json.dumps(result).encode()
            )

            return

server = HTTPServer(("localhost", 8000), RequestHandler)

print("Server running at http://localhost:8000")

server.serve_forever()

