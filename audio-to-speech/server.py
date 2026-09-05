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

        print("Path:", self.path)
        print("Content-Type:", self.headers.get("Content-Type"))
        print("Content-Length:", self.headers.get("Content-Length"))

        if self.path != "/upload-and-transcribe":
            print("\n--- POST REQUEST ---")
            self.send_response(404)
            self.end_headers()
            return

        content_type = self.headers.get("Content-Type", "")

        if content_type.startswith("multipart/form-data"):

            print("Parsing multipart data...")

            form = cgi.FieldStorage(
              fp=self.rfile,
              headers=self.headers,
              environ={
                "REQUEST_METHOD": "POST",
                "CONTENT_TYPE": content_type,
              }
            )

            print("Fields:", form.keys())

            if "audio" not in form:
                print("❌ No audio field")
                self.send_response(400)
                self.end_headers()
                return

            print("✅ Audio field found")

            fileitem = form["audio"]

            print("Filename:", fileitem.filename)
            print("Content type:", fileitem.type)

            if fileitem.filename:

                filename = os.path.basename(fileitem.filename)

                print("Saving:", filename)

                with open(filename, "wb") as f:
                    f.write(fileitem.file.read())

                print("File saved")

                # --------------------------------
                # YOUR PROCESSING GOES HERE
                # --------------------------------

                print("RUNNING AUDIO PROCESS")

                # process it:
                transcribed_response = main.transcribe(filename)

                # --------------------------------

                self.send_response(200)
                self.send_header("Content-Type", "text/plain")
                self.end_headers()

                self.wfile.write(json.dumps(transcribed_response).encode())

                return

        self.send_response(400)
        self.end_headers()

server = HTTPServer(("localhost", 8000), RequestHandler)

print("Server running at http://localhost:8000")

server.serve_forever()

