import os
import re
import subprocess
import webbrowser
import urllib.parse


class AuraActions:

    # =========================================================
    # URL HELPER
    # =========================================================

    def _open_url(self, url):

        try:

            result = webbrowser.open(
                url,
                new=2,
                autoraise=True
            )

            print(
                f"AURA BROWSER: {url}"
            )

            print(
                f"AURA BROWSER RESULT: {result}"
            )

            return True

        except Exception as error:

            print(
                "BROWSER ERROR:",
                error
            )

            return False


    # =========================================================
    # WEBSITE / SEARCH
    # =========================================================

    def open_website(self, command):

        command = command.lower().strip()

        # -----------------------------------------------------
        # OPEN YOUTUBE + SEARCH
        # -----------------------------------------------------

        if "open youtube" in command:

            search_match = re.search(
                r"search\s+(?:for\s+)?(.+)",
                command
            )

            if search_match:

                query = (
                    search_match
                    .group(1)
                    .strip()
                )

                if query:

                    url = (
                        "https://www.youtube.com/results"
                        "?search_query="
                        + urllib.parse.quote_plus(
                            query
                        )
                    )

                    if self._open_url(url):

                        return (
                            f"Opening YouTube and "
                            f"searching for {query}."
                        )

                    return (
                        "I couldn't open YouTube."
                    )


        # -----------------------------------------------------
        # YOUTUBE SEARCH
        # -----------------------------------------------------

        youtube_patterns = [

            r"search\s+youtube\s+for\s+(.+)",

            r"search\s+youtube\s+(.+)",

            r"youtube\s+search\s+for\s+(.+)",

            r"youtube\s+search\s+(.+)",

            r"search\s+on\s+youtube\s+for\s+(.+)",

            r"search\s+on\s+youtube\s+(.+)",

        ]

        for pattern in youtube_patterns:

            match = re.search(
                pattern,
                command
            )

            if match:

                query = (
                    match.group(1)
                    .strip()
                )

                if query:

                    url = (
                        "https://www.youtube.com/results"
                        "?search_query="
                        + urllib.parse.quote_plus(
                            query
                        )
                    )

                    if self._open_url(url):

                        return (
                            f"Searching YouTube "
                            f"for {query}."
                        )

                    return (
                        "I couldn't open YouTube search."
                    )


        # -----------------------------------------------------
        # OPEN YOUTUBE
        # -----------------------------------------------------

        if command in [
            "youtube",
            "youtube open",
            "open youtube",
            "launch youtube",
            "start youtube"
        ]:

            if self._open_url(
                "https://www.youtube.com"
            ):

                return "Opening YouTube."

            return "I couldn't open YouTube."


        # -----------------------------------------------------
        # GOOGLE SEARCH
        # -----------------------------------------------------

        google_patterns = [

            r"search\s+google\s+for\s+(.+)",

            r"search\s+google\s+(.+)",

            r"google\s+search\s+for\s+(.+)",

            r"google\s+search\s+(.+)",

        ]

        for pattern in google_patterns:

            match = re.search(
                pattern,
                command
            )

            if match:

                query = (
                    match.group(1)
                    .strip()
                )

                if query:

                    url = (
                        "https://www.google.com/search?q="
                        + urllib.parse.quote_plus(
                            query
                        )
                    )

                    if self._open_url(url):

                        return (
                            f"Searching Google "
                            f"for {query}."
                        )

                    return (
                        "I couldn't open Google search."
                    )


        # -----------------------------------------------------
        # NORMAL GOOGLE SEARCH
        # -----------------------------------------------------

        if command.startswith("search "):

            query = command[
                len("search "):
            ].strip()

            if query:

                url = (
                    "https://www.google.com/search?q="
                    + urllib.parse.quote_plus(
                        query
                    )
                )

                if self._open_url(url):

                    return (
                        f"Searching Google "
                        f"for {query}."
                    )

                return (
                    "I couldn't perform the search."
                )


        # -----------------------------------------------------
        # OPEN GOOGLE
        # -----------------------------------------------------

        if command in [
            "google",
            "google open",
            "open google",
            "launch google",
            "start google"
        ]:

            if self._open_url(
                "https://www.google.com"
            ):

                return "Opening Google."

            return "I couldn't open Google."


        # -----------------------------------------------------
        # INSTAGRAM WEBSITE
        # -----------------------------------------------------

        if command in [
            "instagram",
            "open instagram",
            "launch instagram",
            "start instagram"
        ]:

            if self._open_url(
                "https://www.instagram.com"
            ):

                return "Opening Instagram."

            return "I couldn't open Instagram."


        # -----------------------------------------------------
        # SNAPCHAT WEBSITE
        # -----------------------------------------------------

        if command in [
            "snapchat",
            "open snapchat",
            "launch snapchat",
            "start snapchat"
        ]:

            if self._open_url(
                "https://www.snapchat.com"
            ):

                return "Opening Snapchat."

            return "I couldn't open Snapchat."


        # -----------------------------------------------------
        # FACEBOOK WEBSITE
        # -----------------------------------------------------

        if command in [
            "facebook",
            "open facebook",
            "launch facebook",
            "start facebook"
        ]:

            if self._open_url(
                "https://www.facebook.com"
            ):

                return "Opening Facebook."

            return "I couldn't open Facebook."


        # -----------------------------------------------------
        # SPOTIFY WEBSITE
        # -----------------------------------------------------

        if command in [
            "spotify",
            "open spotify",
            "launch spotify",
            "start spotify"
        ]:

            if self._open_url(
                "https://open.spotify.com"
            ):

                return "Opening Spotify."

            return "I couldn't open Spotify."


        # -----------------------------------------------------
        # WHATSAPP WEB
        # -----------------------------------------------------

        if command in [
            "whatsapp web",
            "open whatsapp web",
            "launch whatsapp web"
        ]:

            if self._open_url(
                "https://web.whatsapp.com"
            ):

                return "Opening WhatsApp Web."

            return (
                "I couldn't open WhatsApp Web."
            )


        return None


    # =========================================================
    # GOOGLE SEARCH DIRECT METHOD
    # =========================================================

    def google_search(self, query):

        query = query.strip()

        if not query:

            return (
                "What would you like me "
                "to search for?"
            )

        url = (
            "https://www.google.com/search?q="
            + urllib.parse.quote_plus(
                query
            )
        )

        if self._open_url(url):

            return (
                f"Searching Google for {query}."
            )

        return (
            "I couldn't perform the search."
        )


    # =========================================================
    # WHATSAPP MESSAGE
    # =========================================================

    def send_whatsapp_message(
        self,
        contact,
        message
    ):

        try:

            phone = re.sub(
                r"[^0-9]",
                "",
                contact
            )

            if not phone:

                return (
                    "I need the contact's phone number "
                    "to prepare a WhatsApp message."
                )

            encoded_message = (
                urllib.parse.quote(message)
            )

            url = (
                "https://wa.me/"
                + phone
                + "?text="
                + encoded_message
            )

            if not self._open_url(url):

                return (
                    "I couldn't prepare the WhatsApp message."
                )

            return (
                f"WhatsApp opened with the message "
                f"ready for {contact}."
            )

        except Exception as error:

            print(
                "WHATSAPP MESSAGE ERROR:",
                error
            )

            return (
                "I couldn't prepare the WhatsApp message."
            )


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
    # APP WEBSITE
    # =========================================================

    def open_app_website(self, app):

        websites = {

            "whatsapp":
                "https://web.whatsapp.com",

            "instagram":
                "https://www.instagram.com",

            "snapchat":
                "https://www.snapchat.com",

            "spotify":
                "https://open.spotify.com",

            "discord":
                "https://discord.com/app",

            "telegram":
                "https://web.telegram.org",

            "facebook":
                "https://www.facebook.com",

        }

        url = websites.get(
            app.lower().strip()
        )

        if not url:

            return (
                f"I don't have a website "
                f"for {app}."
            )

        if self._open_url(url):

            return (
                f"Opening {app.title()} website."
            )

        return (
            f"I couldn't open "
            f"{app.title()} website."
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