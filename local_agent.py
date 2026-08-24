from flask import Flask, request, jsonify
from flask_cors import CORS

import json
import os
import re
import shutil
import subprocess


app = Flask(__name__)
CORS(app)


# =========================================================
# ALLOWED WINDOWS APPLICATIONS
# =========================================================




# =========================================================
# OPEN APPLICATION
# =========================================================

def normalize_app_command(command):

    command = str(command or "").lower().strip()

    command = re.sub(
        r"^(open|launch|start|go to|bring up)\s+",
        "",
        command
    )

    command = re.sub(
        r"\s+(app|application)$",
        "",
        command
    )

    command = re.sub(
        r"\s+",
        " ",
        command
    ).strip()

    return command


def get_windows_applications():

    powershell = shutil.which("powershell.exe")

    if not powershell:
        print("AURA APP SEARCH: PowerShell not found.")
        return []

    script = r'''
$ErrorActionPreference = "SilentlyContinue"

Get-StartApps |
    Select-Object Name, AppID |
    ConvertTo-Json -Compress
'''

    try:

        result = subprocess.run(
            [
                powershell,
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                script
            ],
            capture_output=True,
            text=True,
            timeout=8
        )

        if result.returncode != 0:
            print(
                "AURA APP SEARCH ERROR:",
                result.stderr.strip()
            )
            return []

        output = result.stdout.strip()

        if not output:
            return []

        data = json.loads(output)

        if isinstance(data, dict):
            data = [data]

        applications = []

        for item in data:

            name = str(
                item.get("Name", "")
            ).strip()

            app_id = str(
                item.get("AppID", "")
            ).strip()

            if name and app_id:

                applications.append({
                    "name": name,
                    "app_id": app_id
                })

        print(
            "AURA APP SEARCH:",
            len(applications),
            "Windows applications found"
        )

        return applications

    except Exception as error:

        print(
            "AURA APP SEARCH ERROR:",
            error
        )

        return []


def open_application(command):

    command = str(
        command or ""
    ).strip()

    lower = command.lower()

    # -----------------------------------------------------
    # NEVER OPEN A DESKTOP APP FOR AN EXPLICIT WEB COMMAND
    # -----------------------------------------------------

    web_words = {
        "web",
        "website",
        "online",
        "browser",
        "site"
    }

    command_words = set(
        lower.split()
    )

    if (
        web_words.intersection(command_words)
        or
        "web version" in lower
    ):
        return None

    requested = normalize_app_command(
        command
    )

    if not requested:
        return None

    # -----------------------------------------------------
    # WINDOWS BUILT-IN APPLICATIONS
    # -----------------------------------------------------

    built_in_apps = {

        "calculator": "calc.exe",
        "calc": "calc.exe",

        "notepad": "notepad.exe",

        "paint": "mspaint.exe",

        "command prompt": "cmd.exe",
        "cmd": "cmd.exe",

        "powershell": "powershell.exe",

        "file explorer": "explorer.exe",
        "explorer": "explorer.exe",
    }

    if requested in built_in_apps:

        executable = built_in_apps[
            requested
        ]

        try:

            subprocess.Popen(
                [executable]
            )

            return (
                f"Opening {requested.title()}."
            )

        except Exception as error:

            print(
                "AURA BUILT-IN APP ERROR:",
                error
            )

            return (
                f"I couldn't open "
                f"{requested.title()}."
            )

    # -----------------------------------------------------
    # SEARCH ALL WINDOWS START-MENU APPLICATIONS
    # -----------------------------------------------------

    applications = get_windows_applications()

    if not applications:
        return None

    # -----------------------------------------------------
    # EXACT MATCH
    # -----------------------------------------------------

    for application in applications:

        app_name = normalize_app_command(
            application["name"]
        )

        if requested == app_name:

            try:

                subprocess.Popen(
                    [
                        "explorer.exe",
                        "shell:AppsFolder\\"
                        + application["app_id"]
                    ]
                )

                return (
                    f"Opening "
                    f"{application['name']}."
                )

            except Exception as error:

                print(
                    "AURA APPLICATION ERROR:",
                    error
                )

                return (
                    f"I found "
                    f"{application['name']}, "
                    f"but I couldn't open it."
                )

    # -----------------------------------------------------
    # PARTIAL MATCH
    # -----------------------------------------------------

    matches = []

    for application in applications:

        app_name = normalize_app_command(
            application["name"]
        )

        if (
            requested in app_name
            or
            app_name in requested
        ):

            matches.append(
                application
            )

    if matches:

        # Prefer the closest/shortest name.
        matches.sort(
            key=lambda item:
                len(
                    normalize_app_command(
                        item["name"]
                    )
                )
        )

        application = matches[0]

        try:

            subprocess.Popen(
                [
                    "explorer.exe",
                    "shell:AppsFolder\\"
                    + application["app_id"]
                ]
            )

            return (
                f"Opening "
                f"{application['name']}."
            )

        except Exception as error:

            print(
                "AURA APPLICATION ERROR:",
                error
            )

            return (
                f"I found "
                f"{application['name']}, "
                f"but I couldn't open it."
            )

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

def system_command(command):

    command = str(
        command or ""
    ).lower().strip()

    # -----------------------------------------------------
    # LOCK SCREEN
    # -----------------------------------------------------

    if command in [
        "lock screen",
        "lock my screen",
        "lock the screen",
        "lock computer",
        "lock my computer",
    ]:

        try:

            subprocess.Popen(
                [
                    "rundll32.exe",
                    "user32.dll,LockWorkStation"
                ],
                creationflags=subprocess.CREATE_NO_WINDOW
            )

            return "Locking your screen."

        except Exception as error:

            print(
                "LOCK ERROR:",
                error
            )

            return "I couldn't lock the screen."

    # -----------------------------------------------------
    # SHUTDOWN
    # -----------------------------------------------------

    if command in [
        "shutdown computer",
        "shutdown my computer",
        "shut down computer",
        "shut down my computer",
        "turn off computer",
        "turn off my computer",
    ]:

        try:

            subprocess.Popen(
                [
                    "shutdown",
                    "/s",
                    "/t",
                    "5"
                ],
                creationflags=subprocess.CREATE_NO_WINDOW
            )

            return (
                "The computer will shut down "
                "in five seconds."
            )

        except Exception as error:

            print(
                "SHUTDOWN ERROR:",
                error
            )

            return "I couldn't shut down the computer."

    # -----------------------------------------------------
    # RESTART
    # -----------------------------------------------------

    if command in [
        "restart computer",
        "restart my computer",
        "reboot computer",
        "reboot my computer",
    ]:

        try:

            subprocess.Popen(
                [
                    "shutdown",
                    "/r",
                    "/t",
                    "5"
                ],
                creationflags=subprocess.CREATE_NO_WINDOW
            )

            return (
                "The computer will restart "
                "in five seconds."
            )

        except Exception as error:

            print(
                "RESTART ERROR:",
                error
            )

            return "I couldn't restart the computer."

    # -----------------------------------------------------
    # CANCEL SHUTDOWN / RESTART
    # -----------------------------------------------------

    if command in [
        "cancel shutdown",
        "cancel restart",
        "stop shutdown",
    ]:

        try:

            subprocess.Popen(
                [
                    "shutdown",
                    "/a"
                ],
                creationflags=subprocess.CREATE_NO_WINDOW
            )

            return (
                "The pending shutdown "
                "or restart was cancelled."
            )

        except Exception as error:

            print(
                "CANCEL ERROR:",
                error
            )

            return (
                "There is no pending "
                "shutdown to cancel."
            )

    return None
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
    # SYSTEM COMMAND
    # -----------------------------------------------------

    response = system_command(
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