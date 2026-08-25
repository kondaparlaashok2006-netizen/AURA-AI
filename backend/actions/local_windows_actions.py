import os
import subprocess
import webbrowser


class LocalWindowsActions:

    # =========================================================
    # DESKTOP APPLICATION
    # =========================================================

    def open_desktop_app(self, app):

        app = str(
            app or ""
        ).lower().strip()

        print(
            "AURA DESKTOP APP:",
            app
        )

        if not app:
            return None

        # -----------------------------------------------------
        # FAST LOCAL WINDOWS APPLICATIONS
        # -----------------------------------------------------

        built_in_apps = {
            "calculator": "calc.exe",
            "calc": "calc.exe",
            "notepad": "notepad.exe",
            "paint": "mspaint.exe",
            "cmd": "cmd.exe",
            "command prompt": "cmd.exe",
            "powershell": "powershell.exe",
            "file explorer": "explorer.exe",
            "explorer": "explorer.exe",
            "task manager": "taskmgr.exe",
        }

        if app in built_in_apps:

            try:

                subprocess.Popen(
                    [built_in_apps[app]]
                )

                return (
                    f"Opening {app.title()}."
                )

            except Exception as error:

                print(
                    "BUILT-IN APPLICATION ERROR:",
                    error
                )

                return (
                    f"I couldn't open {app}."
                )

        # -----------------------------------------------------
        # WHATSAPP FAST PATH
        # -----------------------------------------------------
        if app == "instagram":

            try:
                os.startfile(
                    r"shell:AppsFolder\Facebook.InstagramBeta_8xx8rvfyw5nnt!App"
                )

                return "Opening Instagram desktop app."

            except Exception as error:

                print(
                    "INSTAGRAM APP ERROR:",
                     error
                )

                return "I couldn't open Instagram desktop app."

        if app == "snapchat":

            try:
                os.startfile(
                       r"shell:AppsFolder\SnapInc.Snapchat_k1zn018256b8e!App"
                )

                return "Opening Snapchat desktop app."

            except Exception as error:

                print(
                    "SNAPCHAT APP ERROR:",
                     error
                )

        return "I couldn't open Snapchat desktop app."


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

            # Windows URI fallback.
            try:

                os.startfile(
                    "whatsapp:"
                )

                return (
                    "Opening WhatsApp desktop app."
                )

            except Exception:

                pass

        # -----------------------------------------------------
        # GENERIC ALL-APPLICATION FALLBACK
        # -----------------------------------------------------
        #
        # The local_agent.py now performs Windows Start Apps
        # discovery. This compatibility fallback lets this
        # class launch any application that Windows can resolve
        # through the shell.
        # -----------------------------------------------------

        try:

            result = subprocess.run(
                [
                    "powershell.exe",
                    "-NoProfile",
                    "-NonInteractive",
                    "-ExecutionPolicy",
                    "Bypass",
                    "-Command",
                    (
                        "$a = Get-StartApps | "
                        "Where-Object { $_.Name -like "
                        f"'*{app}*' }} | "
                        "Select-Object -First 1; "
                        "if ($a) {{ "
                        "Start-Process "
                        "'shell:AppsFolder\\$($a.AppID)'; "
                        "Write-Output $a.Name }}"
                    )
                ],
                capture_output=True,
                text=True,
                timeout=5
            )

            found_name = (
                result.stdout.strip()
            )

            if (
                result.returncode == 0
                and
                found_name
            ):

                return (
                    f"Opening {found_name}."
                )

        except Exception as error:

            print(
                "GENERIC APPLICATION ERROR:",
                error
            )

        return (
            f"I couldn't find the "
            f"{app} desktop app on this computer."
        )


    # =========================================================
    # APPLICATION ALIASES
    # =========================================================

    def open_application(self, command):

        command = str(
            command or ""
        ).lower().strip()

        prefixes = [
            "open ",
            "launch ",
            "start ",
            "go to ",
            "bring up "
        ]

        for prefix in prefixes:

             if command.startswith(prefix):

                 app = command[
                     len(prefix):
                 ].strip()

                 if not app:
                     return None

                 return self.open_desktop_app(
                     app
                )

        return None
    # =========================================================
    # OPEN FOLDER
    # =========================================================

    def open_folder(self, command):

        command = str(
            command or ""
        ).lower().strip()

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
                f"start {name}",
                f"go to {name}",
                f"open the {name}",
            ]:

                try:

                    os.startfile(
                        path
                    )

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

        command = str(
            command or ""
        ).lower().strip()

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