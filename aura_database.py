import os
import psycopg
from psycopg.rows import dict_row


class AuraDatabase:

    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL")

        if not self.database_url:
            raise RuntimeError(
                "DATABASE_URL is missing."
            )

    def connect(self):
        return psycopg.connect(
            self.database_url,
            row_factory=dict_row
        )

    # =====================================================
    # USER
    # =====================================================

    def get_or_create_user(
        self,
        username,
        display_name
    ):
        username = username.strip().lower()
        display_name = display_name.strip()

        if not username:
            raise ValueError(
                "Username cannot be empty."
            )

        with self.connect() as conn:

            with conn.cursor() as cursor:

                cursor.execute(
                    """
                    INSERT INTO aura_users
                    (
                        username,
                        display_name
                    )
                    VALUES
                    (%s, %s)

                    ON CONFLICT (username)
                    DO UPDATE SET
                        updated_at =
                            CURRENT_TIMESTAMP

                    RETURNING
                        id,
                        username,
                        display_name,
                        timezone
                    """,
                    (
                        username,
                        display_name
                    )
                )

                return cursor.fetchone()

    def get_user(self, username):

        with self.connect() as conn:

            with conn.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT
                        id,
                        username,
                        display_name,
                        timezone
                    FROM aura_users
                    WHERE username = %s
                    """,
                    (username.strip().lower(),)
                )

                return cursor.fetchone()

    # =====================================================
    # UPDATE NAME
    # =====================================================

    def update_name(
        self,
        username,
        new_name
    ):

        with self.connect() as conn:

            with conn.cursor() as cursor:

                cursor.execute(
                    """
                    UPDATE aura_users
                    SET
                        display_name = %s,
                        updated_at =
                            CURRENT_TIMESTAMP
                    WHERE username = %s

                    RETURNING
                        id,
                        username,
                        display_name,
                        timezone
                    """,
                    (
                        new_name.strip(),
                        username.strip().lower()
                    )
                )

                return cursor.fetchone()

    # =====================================================
    # CONVERSATION
    # =====================================================

    def save_conversation(
        self,
        user_id,
        user_message,
        aura_response
    ):

        with self.connect() as conn:

            with conn.cursor() as cursor:

                cursor.execute(
                    """
                    INSERT INTO aura_conversations
                    (
                        user_id,
                        user_message,
                        aura_response
                    )
                    VALUES
                    (%s, %s, %s)
                    """,
                    (
                        user_id,
                        user_message,
                        aura_response
                    )
                )

    # =====================================================
    # SEARCH
    # =====================================================

    def save_search(
        self,
        user_id,
        search_type,
        search_text
    ):

        with self.connect() as conn:

            with conn.cursor() as cursor:

                cursor.execute(
                    """
                    INSERT INTO aura_searches
                    (
                        user_id,
                        search_type,
                        search_text
                    )
                    VALUES
                    (%s, %s, %s)
                    """,
                    (
                        user_id,
                        search_type,
                        search_text
                    )
                )