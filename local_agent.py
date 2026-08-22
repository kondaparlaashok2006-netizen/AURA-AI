from flask import Flask, request, jsonify
from flask_cors import CORS

import subprocess
import os


app = Flask(__name__)
CORS(app)


# =========================================================
# ALLOWED WINDOWS APPLICATIONS
# =========================================================

APPLICATIONS = {

    "notepad": "notepad.exe",

    "calculator": "calc.exe",

    "paint": "mspaint.exe",

    "command prompt": "cmd.exe",

    "powershell": "powershell.exe",

}


# =========================================================
# OPEN APPLICATION
# =========================================================

def open_application(command):

    command = command.lower().strip()

    # -----------------------------------------------------
    # VS CODE
    # -----------------------------------------------------

    if "vs code" in command or "vscode" in command:

        paths = [

            os.path.expandvars(
                r"%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe"
            ),

            os.path.expandvars(
                r"%ProgramFiles%\Microsoft VS Code\Code.exe"
            ),

        ]

        for path in paths:

            if os.path.exists(path):

                subprocess.Popen([path])

                return "Opening VS Code."

        return "VS Code was not found on this computer."


    # -----------------------------------------------------
    # FILE EXPLORER
    # -----------------------------------------------------

    if (
        "file explorer" in command
        or command == "explorer"
        or "open explorer" in command
    ):

        subprocess.Popen(["explorer.exe"])

        return "Opening File Explorer."


    # -----------------------------------------------------
    # NORMAL APPLICATIONS
    # -----------------------------------------------------

    for name, executable in APPLICATIONS.items():

        if name in command:

            try:

                subprocess.Popen(executable)

                return f"Opening {name.title()}."

            except Exception as error:

                print("APPLICATION ERROR:", error)

                return f"I couldn't open {name}."


    return None


# =========================================================
# OPEN COMMON FOLDERS
# =========================================================

def open_folder(command):

    command = command.lower().strip()

    folders = {

        "desktop": os.path.join(
            os.path.expanduser("~"),
            "Desktop"
        ),

        "downloads": os.path.join(
            os.path.expanduser("~"),
            "Downloads"
        ),

        "documents": os.path.join(
            os.path.expanduser("~"),
            "Documents"
        ),

        "pictures": os.path.join(
            os.path.expanduser("~"),
            "Pictures"
        ),

    }


    for name, path in folders.items():

        if name in command:

            if os.path.exists(path):

                os.startfile(path)

                return f"Opening {name.title()}."

            return f"{name.title()} folder was not found."


    return None


# =========================================================
# COMMAND
# =========================================================

@app.route("/command", methods=["POST"])
def command():

    data = request.get_json(silent=True) or {}

    user_command = data.get(
        "command",
        ""
    ).strip()


    if not user_command:

        return jsonify({
            "response": "No command received."
        })


    print(
        "LOCAL AURA COMMAND:",
        user_command
    )


    # -----------------------------------------------------
    # APPLICATION
    # -----------------------------------------------------

    response = open_application(
        user_command
    )

    if response:

        return jsonify({
            "response": response
        })


    # -----------------------------------------------------
    # FOLDER
    # -----------------------------------------------------

    response = open_folder(
        user_command
    )

    if response:

        return jsonify({
            "response": response
        })


    return jsonify({
        "response": None
    })


# =========================================================
# HEALTH CHECK
# =========================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "agent": "AURA Local Agent",
        "status": "online",
        "version": "1.0"
    })


# =========================================================
# START
# =========================================================

if __name__ == "__main__":

    print("=" * 55)
    print("             AURA LOCAL AGENT")
    print("             WINDOWS CONTROL")
    print("=" * 55)
    print()
    print("Local Agent: http://127.0.0.1:5050")
    print()
    print("Waiting for AURA commands...")
    print()

    app.run(
        host="127.0.0.1",
        port=5050,
        debug=False
    )