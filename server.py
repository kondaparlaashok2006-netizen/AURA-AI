from flask import Flask, request, jsonify
from flask_cors import CORS

from assistant import AuraAssistant


app = Flask(__name__)

CORS(app)

aura = AuraAssistant()


@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "assistant": "AURA",
        "status": "online",
        "version": "2.0",
        "user": aura.user_name
    })


@app.route("/health", methods=["GET"])
def health():

    return jsonify({
        "status": "ok",
        "assistant": "AURA",
        "voice_available": aura.engine is not None,
        "ai_provider": aura.ai_brain.get_provider()
    })


@app.route("/status", methods=["GET"])
def status():

    return jsonify({
        "assistant": "AURA",
        "online": True,
        "user": aura.user_name,
        "provider": aura.ai_brain.get_provider(),
        "speaking": aura.is_speaking,
        "voice_available": aura.engine is not None,
        "pending_app": aura.pending_app
    })


@app.route("/command", methods=["POST"])
def command():

    try:

        data = request.get_json(
            silent=True
        ) or {}

        if not isinstance(data, dict):

            return jsonify({
                "success": False,
                "error": "Invalid request payload."
            }), 400

        user_command = data.get(
            "command",
            ""
        )

        if not isinstance(
            user_command,
            str
        ):

            return jsonify({
                "success": False,
                "error": "Command must be text."
            }), 400

        user_command = user_command.strip()

        if not user_command:

            return jsonify({
                "success": False,
                "error": "Command is empty."
            }), 400

        print()
        print("YOU:", user_command)

        response = aura.process_command(
            user_command
        )

        print("AURA:", response)

        return jsonify({
            "success": True,
            "command": user_command,
            "response": response,
            "provider": aura.ai_brain.get_provider(),
            "user": aura.user_name
        })

    except Exception as error:

        print(
            "COMMAND ERROR:",
            error
        )

        return jsonify({
            "success": False,
            "error": str(error)
        }), 500


@app.route("/speak", methods=["POST"])
def speak():

    try:

        data = request.get_json(
            silent=True
        ) or {}

        text = data.get(
            "text",
            ""
        )

        if not isinstance(text, str):

            return jsonify({
                "success": False,
                "error": "Text must be a string."
            }), 400

        text = text.strip()

        if not text:

            return jsonify({
                "success": False,
                "error": "Nothing to speak."
            }), 400

        import threading

        thread = threading.Thread(
            target=aura.speak,
            args=(text,),
            daemon=True
        )

        thread.start()

        return jsonify({
            "success": True,
            "speaking": True
        })

    except Exception as error:

        print(
            "SPEAK ERROR:",
            error
        )

        return jsonify({
            "success": False,
            "error": str(error)
        }), 500


@app.route("/memory/clear", methods=["POST"])
def clear_memory():

    try:

        aura.conversation_history.clear()

        aura.ai_brain.clear_memory()

        return jsonify({
            "success": True,
            "message": "AURA memory cleared."
        })

    except Exception as error:

        print(
            "MEMORY ERROR:",
            error
        )

        return jsonify({
            "success": False,
            "error": str(error)
        }), 500


@app.route("/shutdown", methods=["POST"])
def shutdown():

    try:

        aura.shutdown()

        return jsonify({
            "success": True,
            "message": "AURA shutting down."
        })

    except Exception as error:

        return jsonify({
            "success": False,
            "error": str(error)
        }), 500


if __name__ == "__main__":

    print()
    print("=" * 60)
    print("                 AURA AI")
    print("              SYSTEM ONLINE")
    print("=" * 60)
    print()
    print("Backend:")
    print("http://127.0.0.1:5050")
    print()
    print("AURA is ready.")
    print("=" * 60)
    print()

    try:

        app.run(
            host="127.0.0.1",
            port=5050,
            debug=False,
            threaded=True
        )

    except KeyboardInterrupt:

        print()
        print("AURA server stopped.")

        try:
            aura.shutdown()
        except Exception:
            pass