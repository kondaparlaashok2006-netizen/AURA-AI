import os
import re
import subprocess
import webbrowser


class LocalWindowsActions:

    # =========================================================
    # DESKTOP APPLICATION
    # =========================================================

    def open_desktop_app(self, app):

        app = app.lower().strip()

        print(
            "AURA DESKTOP APP:",
            app
        )


        # -----------------------------------------------------
        # WHATSAPP
        # -----------------------------------------------------

        if app == "whatsapp":

            possible_paths = [

                os.path.expandvars(
                    r"%LOCALAPPDATA%\WhatsApp\WhatsApp.exe"
                ),

                os.path.expandvars(
                    r"%LOCALAPPDATA%\Programs\WhatsApp\WhatsApp.exe"
                ),

            ]

            for path in possible_paths:

                if os.path.exists(path):

                    try:

                        subprocess.Popen(
                            [path]
                        )

                        return (
                            "Opening WhatsApp desktop app."
                        )

                    except Exception as error:

                        print(
                            "WHATSAPP ERROR:",
                            error
                        )


            # Windows URI fallback

            try:

                os.startfile(
                    "whatsapp:"
                )

                return (
                    "Opening WhatsApp desktop app."
                )

            except Exception:

                return (
                    "I couldn't find the WhatsApp "
                    "desktop app on this computer."
                )


        # -----------------------------------------------------
        # SPOTIFY
        # -----------------------------------------------------

        if app == "spotify":

            try:

                os.startfile(
                    "spotify:"
                )

                return (
                    "Opening Spotify desktop app."
                )

            except Exception:

                return (
                    "I couldn't open Spotify desktop app."
                )


        # -----------------------------------------------------
        # DISCORD
        # -----------------------------------------------------

        if app == "discord":

            try:

                os.startfile(
                    "discord:"
                )

                return (
                    "Opening Discord desktop app."
                )

            except Exception:

                return (
                    "I couldn't open Discord desktop app."
                )


        # -----------------------------------------------------
        # TELEGRAM
        # -----------------------------------------------------

        if app == "telegram":

            try:

                os.startfile(
                    "tg:"
                )

                return (
                    "Opening Telegram desktop app."
                )

            except Exception:

                return (
                    "I couldn't open Telegram desktop app."
                )


        # -----------------------------------------------------
        # INSTAGRAM
        # -----------------------------------------------------

        if app == "instagram":

            return (
                "Instagram does not have a standard "
                "Windows desktop app on this computer. "
                "I can open Instagram in the browser."
            )


        # -----------------------------------------------------
        # SNAPCHAT
        # -----------------------------------------------------

        if app == "snapchat":

            return (
                "I couldn't find a Snapchat desktop "
                "application. I can open Snapchat in "
                "the browser."
            )


        # -----------------------------------------------------
        # FACEBOOK
        # -----------------------------------------------------

        if app == "facebook":

            return (
                "I couldn't find a Facebook desktop "
                "application. I can open Facebook in "
                "the browser."
            )


        return (
            f"I don't know how to open the "
            f"{app} desktop app."
        )


    # =========================================================
    # APPLICATION ALIASES
    # =========================================================

    def open_application(self, command):

        command = command.lower().strip()


        applications = {

            "notepad": "notepad.exe",

            "calculator":
                "calc.exe",

            "calc":
                "calc.exe",

            "paint":
                "mspaint.exe",

            "cmd":
                "cmd.exe",

            "command prompt":
                "cmd.exe",

            "powershell":
                "powershell.exe",

            "file explorer":
                "explorer.exe",

            "explorer":
                "explorer.exe",

            "task manager":
                "taskmgr.exe",

        }


        for name, executable in applications.items():

            patterns = [

                f"open {name}",

                f"launch {name}",

                f"start {name}",

            ]

            if command in patterns:

                try:

                    subprocess.Popen(
                        executable,
                        shell=True
                    )

                    return (
                        f"Opening {name.title()}."
                    )

                except Exception as error:

                    print(
                        "APPLICATION ERROR:",
                        error
                    )

                    return (
                        f"I couldn't open {name}."
                    )


        return None


    # =========================================================
    # OPEN FOLDER
    # =========================================================

    def open_folder(self, command):

        command = command.lower().strip()


        folders = {

            "downloads":
                os.path.expanduser(
                    "~/Downloads"
                ),

            "documents":
                os.path.expanduser(
                    "~/Documents"
                ),

            "desktop":
                os.path.expanduser(
                    "~/Desktop"
                ),

            "pictures":
                os.path.expanduser(
                    "~/Pictures"
                ),

            "music":
                os.path.expanduser(
                    "~/Music"
                ),

            "videos":
                os.path.expanduser(
                    "~/Videos"
                ),

        }


        for name, path in folders.items():

            if command in [
                f"open {name}",
                f"open {name} folder",
                f"launch {name}",
            ]:

                try:

                    os.startfile(path)

                    return (
                        f"Opening {name}."
                    )

                except Exception as error:

                    print(
                        "FOLDER ERROR:",
                        error
                    )

                    return (
                        f"I couldn't open "
                        f"{name}."
                    )


        return None


    # =========================================================
    # SYSTEM COMMANDS
    # =========================================================

    def system_command(self, command):

        command = command.lower().strip()


        # -----------------------------------------------------
        # LOCK
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
                    creationflags=
                    subprocess.CREATE_NO_WINDOW
                )

                return (
                    "Locking your screen."
                )

            except Exception as error:

                print(
                    "LOCK ERROR:",
                    error
                )

                return (
                    "I couldn't lock the screen."
                )


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
                    creationflags=
                    subprocess.CREATE_NO_WINDOW
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

                return (
                    "I couldn't shut down "
                    "the computer."
                )


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
                    creationflags=
                    subprocess.CREATE_NO_WINDOW
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

                return (
                    "I couldn't restart "
                    "the computer."
                )


        # -----------------------------------------------------
        # CANCEL SHUTDOWN
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
                    creationflags=
                    subprocess.CREATE_NO_WINDOW
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
