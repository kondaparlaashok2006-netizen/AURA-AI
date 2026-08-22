import os

from flask import Flask, request, jsonify
from flask_cors import CORS

from assistant import AuraAssistant


# ==========================================
# AURA FLASK SERVER
# ==========================================

app = Flask(__name__)

CORS(app)

aura = AuraAssistant()


# ==========================================
# HOME / STATUS
# ==========================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "assistant": "AURA",
        "status": "online",
        "version": "2.0"
    })


@app.route("/health", methods=["GET"])
def health():

    return jsonify({
        "status": "ok",
        "assistant": "AURA"
    })


# ==========================================
# PROCESS COMMAND
# ==========================================

@app.route("/command", methods=["POST"])
def command():

    try:

        data = request.get_json(silent=True) or {}

        user_command = str(
            data.get("command", "")
        ).strip()


        if not user_command:

            return jsonify({
                "success": False,
                "response": "I didn't hear a command."
            }), 400


        print(
            f"YOU: {user_command}"
        )

        response = aura.process_command(
            user_command
        )

        if response is None:

            response = (
                "I couldn't find an action "
                "for that command."
            )

        print(
            f"AURA: {response}"
        )

        return jsonify({
            "success": True,
            "response": str(response)
        }), 200


    except Exception as error:

        import traceback

        print(
            "================================"
        )

        print(
            "AURA SERVER ERROR:",
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


# ==========================================
# USER NAME
# ==========================================

@app.route("/user", methods=["GET"])
def user():

    return jsonify({

        "name":
            aura.get_user_name()

    })


# ==========================================
# SHUTDOWN
# ==========================================

@app.route("/shutdown", methods=["POST"])
def shutdown():

    aura.shutdown()

    return jsonify({

        "status":
            "AURA entering standby mode."

    })


# ==========================================
# RUN SERVER
# ==========================================

if __name__ == "__main__":

    print()
    print("=" * 55)
    print("              AURA AI ASSISTANT")
    print("              SYSTEM ONLINE")
    print("=" * 55)
    print()
    print("Server:")
    print("http://127.0.0.1:5050")
    print()
    print("AURA is ready.")
    print("=" * 55)
    print()


    app.run(

        host="0.0.0.0",

        port=int(
            os.environ.get(
                "PORT",
                5050
            )
        ),

        debug=False,

        threaded=True

    )