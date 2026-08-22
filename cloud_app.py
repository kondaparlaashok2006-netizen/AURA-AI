import os

from flask import Flask, jsonify, request
from flask_cors import CORS

from ai_brain import AIBrain
from actions.web_actions import WebActions


# ============================================================
# AURA CLOUD BACKEND
# ============================================================

app = Flask(__name__)

CORS(app)


# ============================================================
# SERVICES
# ============================================================

ai = AIBrain()
web = WebActions()


# ============================================================
# HOME
# ============================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "assistant": "AURA",
        "status": "online",
        "mode": "cloud",
        "version": "1.0"
    })


# ============================================================
# HEALTH
# ============================================================

@app.route("/health", methods=["GET"])
def health():

    return jsonify({
        "status": "ok",
        "assistant": "AURA",
        "mode": "cloud"
    })


# ============================================================
# COMMAND
# ============================================================

@app.route("/command", methods=["POST"])
def command():

    try:

        data = (
            request.get_json(
                silent=True
            )
            or {}
        )

        user_command = str(
            data.get(
                "command",
                ""
            )
        ).strip()

        if not user_command:

            return jsonify({
                "success": False,
                "response":
                    "I didn't hear a command."
            }), 400

        print(
            f"YOU: {user_command}"
        )

        normalized = (
            user_command
            .lower()
            .strip()
        )

        # ====================================================
        # WEB ACTIONS
        # ====================================================

        try:

            response = (
                web.open_website(
                    normalized
                )
            )

            if response:

                print(
                    f"AURA: {response}"
                )

                return jsonify({
                    "success": True,
                    "response":
                        str(response)
                })

        except Exception as error:

            print(
                "WEB ACTION ERROR:",
                repr(error)
            )

        # ====================================================
        # GOOGLE SEARCH
        # ====================================================

        if normalized.startswith(
            "search "
        ):

            query = (
                normalized[
                    7:
                ].strip()
            )

            if query:

                try:

                    response = (
                        web.google_search(
                            query
                        )
                    )

                    if response:

                        return jsonify({
                            "success": True,
                            "response":
                                str(response)
                        })

                except Exception as error:

                    print(
                        "SEARCH ERROR:",
                        repr(error)
                    )

        # ====================================================
        # AI
        # ====================================================

        try:

            response = ai.ask(
                user_command
            )

            if response:

                print(
                    f"AURA: {response}"
                )

                return jsonify({
                    "success": True,
                    "response":
                        str(response)
                })

        except Exception as error:

            print(
                "AI ERROR:",
                repr(error)
            )

        # ====================================================
        # FALLBACK
        # ====================================================

        return jsonify({
            "success": True,
            "response":
                "I couldn't find an action for that command."
        })

    except Exception as error:

        import traceback

        print(
            "================================"
        )

        print(
            "AURA CLOUD ERROR:",
            repr(error)
        )

        traceback.print_exc()

        print(
            "================================"
        )

        return jsonify({
            "success": False,
            "error": str(error),
            "response":
                "AURA encountered an internal error."
        }), 500


# ============================================================
# SERVER
# ============================================================

if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            5050
        )
    )

    print()
    print("=" * 55)
    print("          AURA CLOUD BACKEND")
    print("          SYSTEM ONLINE")
    print("=" * 55)
    print()
    print(
        f"Port: {port}"
    )
    print()
    print("AURA cloud backend is ready.")
    print("=" * 55)
    print()

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False,
        threaded=True
    )