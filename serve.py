#!/usr/bin/env python3
"""Simple dev server that serves the site with proper CORS for local JSON loading."""

import http.server
import os
import sys

PORT = 8080

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def do_GET(self):
        # Serve site/index.html for root
        if self.path == '/' or self.path == '/index.html':
            self.path = '/site/index.html'
        elif self.path.startswith('/assets/'):
            self.path = '/site' + self.path
        return super().do_GET()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    with http.server.HTTPServer(('', port), Handler) as httpd:
        print(f"\n  AI Agent Trends 서버 실행 중")
        print(f"  http://localhost:{port}\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n서버 종료")
