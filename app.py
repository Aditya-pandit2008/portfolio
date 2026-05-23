from __future__ import annotations
from datetime import datetime
from pathlib import Path
import sqlite3
from flask import Flask, request, jsonify, g, send_from_directory, render_template_string

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / 'contact.db'

app = Flask(__name__, static_folder=str(BASE_DIR), static_url_path='')
app.config['JSON_SORT_KEYS'] = False

CREATE_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
);
'''


def get_db() -> sqlite3.Connection:
    db = getattr(g, '_database', None)
    if db is None:
        db = sqlite3.connect(DB_PATH)
        db.row_factory = sqlite3.Row
        g._database = db
    return db


def init_db() -> None:
    db = get_db()
    db.execute(CREATE_TABLE_SQL)
    db.commit()


@app.teardown_appcontext
def close_connection(exception=None):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


@app.after_request
def add_cors_headers(response):
    if request.path.startswith('/api/'):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response


@app.route('/')
def index():
    return send_from_directory(str(BASE_DIR), 'adi.html')


@app.route('/api/contact', methods=['POST', 'OPTIONS'])
def contact_api():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'})

    data = request.get_json(silent=True)
    if not data:
        return jsonify({'status': 'error', 'message': 'Invalid JSON payload.'}), 400

    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip()
    message = (data.get('message') or '').strip()

    if not name or not email or not message:
        return jsonify({'status': 'error', 'message': 'Name, email, and message are required.'}), 400

    if '@' not in email or '.' not in email.split('@')[-1]:
        return jsonify({'status': 'error', 'message': 'Invalid email address.'}), 400

    db = get_db()
    db.execute(
        'INSERT INTO contacts (name, email, message, created_at) VALUES (?, ?, ?, ?)',
        (name, email, message, datetime.utcnow().isoformat())
    )
    db.commit()

    return jsonify({'status': 'success', 'message': 'Your message has been stored in the database.'}), 201


@app.route('/submissions')
def submissions():
    db = get_db()
    rows = db.execute('SELECT id, name, email, message, created_at FROM contacts ORDER BY id DESC').fetchall()
    return render_template_string(
        '''
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Contact Submissions</title>
          <style>
            body { font-family: Inter, Arial, sans-serif; margin: 24px; background: #f3f6f9; color: #102027; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th, td { padding: 12px 14px; border: 1px solid #d8e2ec; }
            th { background: #e1eff5; text-align: left; }
            tr:nth-child(even) { background: #fff; }
            h1 { margin-bottom: 12px; }
            .note { margin-bottom: 18px; color: #455a64; }
          </style>
        </head>
        <body>
          <h1>Contact Submissions</h1>
          <p class="note">Showing the latest messages stored in the SQLite database.</p>
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Email</th><th>Message</th><th>Received</th></tr>
            </thead>
            <tbody>
              {% for row in rows %}
                <tr>
                  <td>{{ row.id }}</td>
                  <td>{{ row.name }}</td>
                  <td>{{ row.email }}</td>
                  <td>{{ row.message }}</td>
                  <td>{{ row.created_at }}</td>
                </tr>
              {% else %}
                <tr><td colspan="5">No submissions yet.</td></tr>
              {% endfor %}
            </tbody>
          </table>
        </body>
        </html>
        ''', rows=rows)


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
