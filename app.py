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


# ==========================================
# AURA SESSION
# ==========================================

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


# ==========================================
# HEALTH
# ==========================================

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

    data = request.get_json(silent=True) or {}

    session_id = str(
        data.get("session_id", "")
    ).strip()

    username = str(
        data.get("username", "")
    ).strip().lower()

    user_command = str(
        data.get("command", "")
    ).strip()

    # ------------------------------------------
    # SESSION CHECK
    # ------------------------------------------

    if not session_id:

        return jsonify({
            "success": False,
            "response": "AURA session is missing."
        }), 400

    # ------------------------------------------
    # COMMAND CHECK
    # ------------------------------------------

    if not user_command:

        return jsonify({
            "success": False,
            "response": "I didn't hear a command."
        }), 400

    # ------------------------------------------
    # GET AURA SESSION
    # ------------------------------------------

    aura = get_aura_session(session_id)

    if aura is None:

        return jsonify({
            "success": False,
            "response": "Unable to create AURA session."
        }), 500

    # ------------------------------------------
    # FIRST-TIME USER HANDLING
    # ------------------------------------------
    #
    # A new AuraAssistant starts with:
    #
    # waiting_for_name = True
    #
    # or
    #
    # waiting_for_username = True
    #
    # During this setup we MUST NOT call
    # set_current_user(), because the user
    # does not exist in the database yet.
    #
    # AuraAssistant.process_command() will
    # handle the first-time setup itself.
    # ------------------------------------------

    setup_in_progress = (
        aura.waiting_for_name
        or aura.waiting_for_username
    )

    if username and not setup_in_progress:

        if not aura.set_current_user(username):

            return jsonify({
                "success": False,
                "response": "I couldn't find that AURA user."
            }), 404

    # ------------------------------------------
    # PROCESS COMMAND
    # ------------------------------------------

    response = aura.process_command(
        user_command
    )

    # ------------------------------------------
    # RESPONSE
    # ------------------------------------------

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

    session_id = request.args.get(
        "session_id",
        ""
    ).strip()

    if not session_id:

        return jsonify({
            "success": False,
            "response": "AURA session is missing."
        }), 400

    aura = get_aura_session(session_id)

    if aura is None:

        return jsonify({
            "success": False,
            "response": "AURA session is unavailable."
        }), 500

    return jsonify({
        "success": True,
        "name": aura.get_user_name(),
        "username": aura.username
    })


# ==========================================
# SHUTDOWN
# ==========================================

@app.route("/shutdown", methods=["POST"])
def shutdown():

    data = request.get_json(silent=True) or {}

    session_id = str(
        data.get("session_id", "")
    ).strip()

    if not session_id:

        return jsonify({
            "success": False,
            "response": "AURA session is missing."
        }), 400

    aura = get_aura_session(session_id)

    if aura is None:

        return jsonify({
            "success": False,
            "response": "AURA session is unavailable."
        }), 500

    aura.shutdown()

    return jsonify({
        "success": True,
        "status": "AURA entering standby mode."
    })


# ==========================================
# LOCAL AGENT COMMAND
# ==========================================

@app.route("/api/local-command", methods=["POST"])
def local_command():

    data = request.get_json(silent=True) or {}

    session_id = str(
        data.get("session_id", "")
    ).strip()

    username = str(
        data.get("username", "")
    ).strip().lower()

    command_text = str(
        data.get("command", "")
    ).strip()

    if not session_id or not command_text:

        return jsonify({
            "success": False,
            "response": "Missing session or command."
        }), 400

    aura = get_aura_session(session_id)

    if aura is None:

        return jsonify({
            "success": False,
            "response": "AURA session unavailable."
        }), 500

    # ------------------------------------------
    # Do not force user lookup during
    # first-time setup.
    # ------------------------------------------

    setup_in_progress = (
        aura.waiting_for_name
        or aura.waiting_for_username
    )

    if username and not setup_in_progress:

        if not aura.set_current_user(username):

            return jsonify({
                "success": False,
                "response": "AURA user not found."
            }), 404

    response = aura.process_command(
        command_text
    )

    return jsonify({
        "success": True,
        "username": aura.username,
        "response": response
    })


# ==========================================
# RUN SERVER
# ==========================================

if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            5050
        )
    )

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )