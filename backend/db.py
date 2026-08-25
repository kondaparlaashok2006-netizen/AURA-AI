import sqlite3
import hashlib
import secrets
from pathlib import Path
from datetime import datetime, timezone

DB_PATH = Path(__file__).resolve().parent / "aura.db"

def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = connect()
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        timezone TEXT NOT NULL DEFAULT 'UTC',
        created_at TEXT NOT NULL
    );
    """)
    conn.commit()
    conn.close()

def hash_password(password):
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120000).hex()
    return f"{salt}${digest}"

def verify_password(password, stored):
    try:
        salt, digest = stored.split("$", 1)
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120000).hex()
        return secrets.compare_digest(actual, digest)
    except Exception:
        return False

def create_user(name, username, password, tz):
    conn = connect()
    try:
        cur = conn.execute(
            "INSERT INTO users(name,username,password_hash,timezone,created_at) VALUES(?,?,?,?,?)",
            (name, username.lower().strip(), hash_password(password), tz, datetime.now(timezone.utc).isoformat())
        )
        conn.commit()
        return cur.lastrowid
    finally:
        conn.close()

def get_user(user_id):
    conn = connect()
    try:
        return conn.execute(
            "SELECT id,name,username,timezone FROM users WHERE id=?", (user_id,)
        ).fetchone()
    finally:
        conn.close()

def get_user_by_username(username):
    conn = connect()
    try:
        return conn.execute("SELECT * FROM users WHERE username=?", (username.lower().strip(),)).fetchone()
    finally:
        conn.close()
