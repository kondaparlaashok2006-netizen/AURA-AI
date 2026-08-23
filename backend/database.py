import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


def get_connection():
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is missing. Add it to the backend .env file."
        )

    return psycopg.connect(
        DATABASE_URL,
        connect_timeout=10
    )


def test_connection():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
                result = cur.fetchone()

        print("AURA DATABASE: CONNECTED")
        print("PostgreSQL test result:", result)
        return True

    except Exception as error:
        print("AURA DATABASE ERROR:", error)
        return False


def get_user(username):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, username, display_name
                FROM aura_users
                WHERE username = %s
                """,
                (username,)
            )
            return cur.fetchone()


def create_user(username, display_name):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO aura_users
                    (username, display_name)
                VALUES
                    (%s, %s)
                RETURNING id, username, display_name
                """,
                (username, display_name)
            )
            return cur.fetchone()


def update_user_name(username, display_name):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE aura_users
                SET display_name = %s,
                    last_seen = CURRENT_TIMESTAMP
                WHERE username = %s
                RETURNING id, username, display_name
                """,
                (display_name, username)
            )
            return cur.fetchone()


def update_last_seen(username):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE aura_users
                SET last_seen = CURRENT_TIMESTAMP
                WHERE username = %s
                """,
                (username,)
            )


def save_conversation(username, user_message, aura_response):
    user = get_user(username)

    if not user:
        return False

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO aura_conversations
                    (user_id, user_message, aura_response)
                VALUES
                    (%s, %s, %s)
                """,
                (
                    user[0],
                    user_message,
                    aura_response
                )
            )

    return True


def save_search(username, search_type, search_text):
    user = get_user(username)

    if not user:
        return False

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO aura_searches
                    (user_id, search_type, search_text)
                VALUES
                    (%s, %s, %s)
                """,
                (
                    user[0],
                    search_type,
                    search_text
                )
            )

    return True


def get_conversation_history(username, limit=20):
    user = get_user(username)

    if not user:
        return []

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT user_message, aura_response
                FROM aura_conversations
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (user[0], limit)
            )

            rows = cur.fetchall()

    rows.reverse()

    return [
        {
            "user": row[0],
            "aura": row[1]
        }
        for row in rows
    ]