import os
import re
import subprocess
import webbrowser
import urllib.parse


class WebActions:

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
    # SOCIAL CALLING
    # =========================================================

    def call_whatsapp(self, contact):

        contact = str(
            contact or ""
        ).strip()

        phone = re.sub(
            r"[^0-9]",
            "",
            contact
        )

        if not phone:
            return (
                "I need the contact's phone number "
                "to start a WhatsApp call."
            )

        url = (
            "https://wa.me/"
            + phone
        )

        if self._open_url(url):
            return (
                f"Opening WhatsApp for {contact}."
            )

        return (
            "I couldn't open WhatsApp."
        )


    def call_instagram(self, contact=None):

        if contact:

            username = str(
                contact
            ).strip().lstrip("@")

            url = (
                "https://www.instagram.com/"
                + urllib.parse.quote(
                    username
                )
                + "/"
            )

        else:

            url = (
                "https://www.instagram.com/"
            )

        if self._open_url(url):

            if contact:
                return (
                    f"Opening Instagram for {contact}."
                )

            return "Opening Instagram."

        return "I couldn't open Instagram."


    def call_snapchat(self, contact=None):

        if contact:

            username = str(
                contact
            ).strip().lstrip("@")

            url = (
                "https://www.snapchat.com/add/"
                + urllib.parse.quote(
                    username
                )
            )

        else:

            url = (
                "https://www.snapchat.com/"
            )

        if self._open_url(url):

            if contact:
                return (
                    f"Opening Snapchat for {contact}."
                )

            return "Opening Snapchat."

        return "I couldn't open Snapchat."
    # =========================================================
    # APP WEBSITE
    # =========================================================

    def open_app_website(self, app):

        app = str(
            app or ""
        ).lower().strip()

        app = re.sub(
            r"\\s+",
            " ",
            app
        ).strip()

        if not app:
            return "I need a website name."

        websites = {
            "whatsapp": "https://web.whatsapp.com",
            "instagram": "https://www.instagram.com",
            "snapchat": "https://www.snapchat.com",
            "spotify": "https://open.spotify.com",
            "discord": "https://discord.com/app",
            "telegram": "https://web.telegram.org",
            "facebook": "https://www.facebook.com",
            "youtube": "https://www.youtube.com",
            "google": "https://www.google.com",
            "github": "https://github.com",
            "reddit": "https://www.reddit.com",
            "linkedin": "https://www.linkedin.com",
            "amazon": "https://www.amazon.com",
            "netflix": "https://www.netflix.com",
        }

        url = websites.get(app)

        if not url:

            slug = re.sub(
                r"[^a-z0-9]+",
                "",
                app
            )

            if not slug:
                return (
                    f"I couldn't determine the website "
                    f"for {app}."
                )

            url = (
                "https://www."
                + slug
                + ".com"
            )

        if self._open_url(url):

            return (
                f"Opening {app.title()} website."
            )

        return (
            f"I couldn't open "
            f"{app.title()} website."
        )