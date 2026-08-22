import os
import threading

from flask import Flask, request, jsonify
from flask_cors import CORS

from assistant import AuraAssistant


# ==========================================
# AURA FLASK SERVER
# ==========================================

app = Flask(__name__)

CORS(app)

aura_sessions = {}
aura_sessions_lock = threading.Lock()


def get_aura_session(session_id):
    if not session_id:
        return None

    with aura_sessions_lock:

        if session_id not in aura_sessions:
            aura_sessions[session_id] = AuraAssistant()

        return aura_sessions[session_id]


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
    data = request.get_json() or {}

    session_id = str(data.get("session_id", "")).strip()
    username = str(data.get("username", "")).strip().lower()
    user_command = str(data.get("command", "")).strip()

    if not session_id:
        return jsonify({
            "success": False,
            "response": "AURA session is missing."
        }), 400

    if not user_command:
        return jsonify({
            "success": False,
            "response": "I didn't hear a command."
        }), 400

    aura = get_aura_session(session_id)

    if aura is None:
        return jsonify({
            "success": False,
            "response": "Unable to create AURA session."
        }), 500

    if username:

        if not aura.set_current_user(username):
            return jsonify({
                "success": False,
                "response": "I couldn't find that AURA user."
            }), 404

    response = aura.process_command(user_command)

    return jsonify({
        "success": True,
        "username": aura.username,
        "response": response
    })


# ==========================================
# USER NAME
# ==========================================

@app.route("/user", methods=["GET"])
def user():
    session_id = request.args.get("session_id", "").strip()
    aura = get_aura_session(session_id)

    if aura is None:
        return jsonify({
            "success": False,
            "response": "AURA session is missing."
        }), 400

    return jsonify({
        "name": aura.get_user_name()
    })


# ==========================================
# SHUTDOWN
# ==========================================

@app.route("/shutdown", methods=["POST"])
def shutdown():
    data = request.get_json() or {}
    session_id = str(data.get("session_id", "")).strip()
    aura = get_aura_session(session_id)

    if aura is None:
        return jsonify({
            "success": False,
            "response": "AURA session is missing."
        }), 400

    aura.shutdown()

    return jsonify({
        "status":
            "AURA entering standby mode."
    })


# ==========================================
# LOCAL AGENT COMMAND
# ==========================================

@app.route("/api/local-command", methods=["POST"])
def local_command():
    data = request.get_json() or {}

    session_id = str(data.get("session_id", "")).strip()
    username = str(data.get("username", "")).strip().lower()
    command = str(data.get("command", "")).strip()

    if not session_id or not username or not command:
        return jsonify({
            "success": False,
            "response": "Missing session, username, or command."
        }), 400

    aura = get_aura_session(session_id)

    if not aura:
        return jsonify({
            "success": False,
            "response": "AURA session unavailable."
        }), 500

    if not aura.set_current_user(username):
        return jsonify({
            "success": False,
            "response": "AURA user not found."
        }), 404

    # Only let the existing AURA action system handle the command.
    response = aura.process_command(command)

    return jsonify({
        "success": True,
        "username": aura.username,
        "response": response
    })


# ==========================================
# RUN SERVER
# ==========================================

if __name__ == "__main__":
    import os

    port = int(os.environ.get("PORT", 5050))

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )