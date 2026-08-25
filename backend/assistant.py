import json
import os
import re
import threading

import pyttsx3

from backend.ai_brain import AIBrain
from backend.actions.action_router import ActionRouter
from backend.reminders import ReminderManager


class AuraAssistant:

    def __init__(self):

        # ==================================================
        # SPEECH
        # ==================================================

        self.engine = None
        self.speech_lock = threading.Lock()
        self.is_speaking = False

        self._initialize_engine()

        # ==================================================
            # AI
        # ==================================================

        self.ai_brain = AIBrain()

        # ==================================================
        # ACTIONS
        # ==================================================

        self.actions = ActionRouter()

        # ==================================================
        # EXISTING REMINDER SYSTEM
        # ==================================================

        self.reminders = ReminderManager()

        # ==================================================
        # MEMORY
        # ==================================================

        self.conversation_history = []
        self.max_memory = 20

        # ==================================================
        # USER PROFILE
        # ==================================================

        self.profile_file = "user_profile.json"

        self.user_name = self.load_user_name()

        self.waiting_for_name = (
            self.user_name is None
        )

        # ==================================================
        # APP STATE
        # ==================================================

        self.pending_app = None

        # ==================================================
        # WHATSAPP STATE
        # ==================================================

        self.pending_message_contact = None

        print(
            "=========================================="
        )
        print(
            "AURA ASSISTANT INITIALIZED"
        )
        print(
            "=========================================="
        )

        if self.user_name:

            print(
                f"AURA USER: {self.user_name}"
            )

        else:

            print(
                "AURA USER: first-time setup"
            )

    # =========================================================
    # USER PROFILE
    # =========================================================

    def load_user_name(self):

        try:

            if not os.path.exists(
                self.profile_file
            ):
                return None

            with open(
                self.profile_file,
                "r",
                encoding="utf-8"
            ) as file:

                data = json.load(file)

            name = str(
                data.get("name", "")
            ).strip()

            if name:
                return name

        except Exception as error:

            print(
                "PROFILE LOAD ERROR:",
                error
            )

        return None

    # =========================================================
    # SAVE USER NAME
    # =========================================================

    def save_user_name(self, name):

        try:

            name = str(
                name
            ).strip()

            if not name:
                return False

            with open(
                self.profile_file,
                "w",
                encoding="utf-8"
            ) as file:

                json.dump(
                    {
                        "name": name
                    },
                    file,
                    indent=4
                )

            self.user_name = name

            self.waiting_for_name = False

            print(
                f"AURA: User name saved -> {name}"
            )

            return True

        except Exception as error:

            print(
                "PROFILE SAVE ERROR:",
                error
            )

            return False

    # =========================================================
    # GET USER NAME
    # =========================================================

    def get_user_name(self):

        return self.user_name

    # =========================================================
    # SET USER NAME
    # =========================================================

    def set_user_name(self, name):

        return self.save_user_name(
            name
        )

    # =========================================================
    # SPEECH ENGINE
    # =========================================================

    def _initialize_engine(self):

        try:

            self.engine = pyttsx3.init()

            self.engine.setProperty(
                "rate",
                165
            )

            self.engine.setProperty(
                "volume",
                1.0
            )

            self._select_voice()

        except Exception as error:

            print(
                "SPEECH ENGINE ERROR:",
                error
            )

            self.engine = None

    # =========================================================
    # VOICE SELECTION
    # =========================================================

    def _select_voice(self):

        if not self.engine:
            return

        try:

            voices = self.engine.getProperty(
                "voices"
            )

            preferred_names = [
                "david",
                "mark",
                "guy",
                "george",
                "ryan"
            ]

            # ---------------------------------------------
            # Preferred voices
            # ---------------------------------------------

            for preferred in preferred_names:

                for voice in voices:

                    name = str(
                        getattr(
                            voice,
                            "name",
                            ""
                        )
                    ).lower()

                    voice_id = str(
                        getattr(
                            voice,
                            "id",
                            ""
                        )
                    ).lower()

                    if (
                        preferred in name
                        or
                        preferred in voice_id
                    ):

                        self.engine.setProperty(
                            "voice",
                            voice.id
                        )

                        print(
                            "AURA VOICE:",
                            getattr(
                                voice,
                                "name",
                                voice.id
                            )
                        )

                        return

        except Exception as error:

            print(
                "VOICE SELECTION ERROR:",
                error
            )

    # =========================================================
    # SPEAK
    # =========================================================

    def speak(self, text):

        if not text:
            return

        print(
            f"AURA: {text}"
        )

        if not self.engine:

            self._initialize_engine()

        if not self.engine:
            return

        try:

            with self.speech_lock:

                self.is_speaking = True

                self.engine.stop()

                clean_text = (
                    self._clean_speech_text(
                        str(text)
                    )
                )

                self.engine.say(
                    clean_text
                )

                self.engine.runAndWait()

                self.is_speaking = False

        except Exception as error:

            print(
                "SPEECH ERROR:",
                error
            )

            self.is_speaking = False

    # =========================================================
    # CLEAN SPEECH TEXT
    # =========================================================

    def _clean_speech_text(
        self,
        text
    ):

        text = re.sub(
            r"https?://\S+",
            "",
            text
        )

        text = re.sub(
            r"[*_`#]+",
            "",
            text
        )

        text = text.replace(
            "•",
            ""
        )

        text = text.replace(
            "→",
            ""
        )

        text = re.sub(
            r"\s+",
            " ",
            text
        )

        return text.strip()

    # =========================================================
    # MEMORY
    # =========================================================

    def remember(
        self,
        user_message,
        response
    ):

        self.conversation_history.append(
            {
                "user": user_message,
                "aura": response
            }
        )

        if (
            len(
                self.conversation_history
            )
            >
            self.max_memory
        ):

            self.conversation_history.pop(
                0
            )

    # =========================================================
    # MEMORY CONTEXT
    # =========================================================

    def get_memory_context(self):

        if not self.conversation_history:

            return ""

        context = (
            "\nRecent AURA conversation:\n"
        )

        for item in self.conversation_history:

            context += (
                f"User: "
                f"{item['user']}\n"
            )

            context += (
                f"AURA: "
                f"{item['aura']}\n"
            )

        return context

    # =========================================================
    # FAST DIRECT COMMAND CHECK
    # =========================================================

    def is_direct_command(self, command):

        normalized = str(
            command or ""
        ).lower().strip()

        direct_prefixes = (
            "open ",
            "launch ",
            "start ",
            "go to ",
            "bring up ",
            "search ",
            "send ",
            "text ",
            "message ",
            "remind me",
            "set reminder",
            "lock ",
            "shutdown ",
            "shut down ",
            "restart ",
            "reboot ",
            "cancel shutdown",
            "cancel restart",
        )

        direct_commands = {
            "lock screen",
            "lock my screen",
            "lock the screen",
            "lock computer",
            "lock my computer",
            "shutdown computer",
            "shutdown my computer",
            "shut down computer",
            "shut down my computer",
            "restart computer",
            "restart my computer",
            "reboot computer",
            "reboot my computer",
            "cancel shutdown",
            "cancel restart",
            "stop shutdown",
        }

        return (
            normalized in direct_commands
            or normalized.startswith(direct_prefixes)
        )


    # =========================================================
    # AI
    # =========================================================

    def ask_ai(
        self,
        command
    ):

        memory = (
            self.get_memory_context()
        )

        if memory:

            prompt = (
                memory
                +
                "\nCurrent request:\n"
                +
                command
            )

        else:

            prompt = command

        return self.ai_brain.ask(
            prompt
        )

    # =========================================================
    # FIRST-TIME NAME
    # =========================================================

    def handle_first_name(
        self,
        command
    ):

        if not self.waiting_for_name:

            return None

        text = (
            command
            .strip()
            .strip(".!?")
        )

        if not text:

            return (
                "What should I call you?"
            )

        # -----------------------------------------------------
        # Explicit formats
        # -----------------------------------------------------

        patterns = [
            r"^my name is\s+(.+)$",
            r"^i am\s+(.+)$",
            r"^i'm\s+(.+)$",
            r"^call me\s+(.+)$"
        ]

        name = None

        for pattern in patterns:

            match = re.match(
                pattern,
                text,
                re.IGNORECASE
            )

            if match:

                name = (
                    match.group(1)
                    .strip()
                    .strip(".!?")
                )

                break

        # -----------------------------------------------------
        # Bare answer
        #
        # AURA asked:
        # "What should I call you?"
        #
        # User:
        # "Ashok"
        # -----------------------------------------------------

        if name is None:

            # Accept a simple name.

            if (
                len(text) <= 40
                and
                len(text.split()) <= 5
                and
                not any(
                    word in text.lower()
                    for word in [
                        "open",
                        "search",
                        "what",
                        "who",
                        "when",
                        "where",
                        "why",
                        "how",
                        "play",
                        "send",
                        "set",
                        "lock"
                    ]
                )
            ):

                name = text

        if not name:

            return (
                "Please tell me your name."
            )

        # -----------------------------------------------------
        # SAVE PERMANENTLY
        # -----------------------------------------------------

        saved = (
            self.save_user_name(
                name
            )
        )

        if not saved:

            return (
                "I couldn't save your name."
            )

        return (
            f"Hello {name}, "
            f"how can I help you today?"
        )

    # =========================================================
    # APP DETECTION
    # =========================================================

    def detect_app(
        self,
        command
    ):

        command = str(
            command or ""
        ).lower().strip()

        match = re.match(
            r"^(open|launch|start|go to|bring up)\s+(.+)$",
            command
        )

        if not match:
            return None

        app_name = match.group(2).strip()

        app_name = re.sub(
            r"\b(the|app|application)$",
            "",
            app_name
        ).strip()

        if app_name:
            return app_name

        return None
    # =========================================================
    # APP CONFIRMATION
    # =========================================================

    def handle_pending_app(
        self,
        command
    ):

        if not self.pending_app:

            return None

        text = (
            command
            .lower()
            .strip()
        )

        app = self.pending_app

        # -----------------------------------------------------
        # DESKTOP APP
        # -----------------------------------------------------

        if (
            text == "desktop"
            or
            text == "app"
            or
            text == "desktop app"
            or
            "desktop app" in text
        ):

            self.pending_app = None

            return (
                self.actions.open_desktop_app(
                    app
                )
            )

        # -----------------------------------------------------
        # WEBSITE
        # -----------------------------------------------------

        if (
            text == "website"
            or
            text == "web"
            or
            text == "browser"
            or
            "website" in text
            or
            "browser" in text
        ):

            self.pending_app = None

            return (
                self.actions.open_app_website(
                    app
                )
            )

        # -----------------------------------------------------
        # CANCEL
        # -----------------------------------------------------

        if (
            text == "cancel"
            or
            "don't open" in text
            or
            "do not open" in text
        ):

            self.pending_app = None

            return (
                "Okay, cancelled."
            )

        # -----------------------------------------------------
        # STILL WAITING
        # -----------------------------------------------------

        return (
            f"Do you want me to open "
            f"{app.title()} as the desktop "
            f"app or open its website?"
        )

    # =========================================================
    # OPEN APP
    # =========================================================

    def handle_open_app(
        self,
        command
    ):

        command = str(
            command or ""
        ).lower().strip()

        app = self.detect_app(
            command
        )

        if not app:
            return None

        web_words = {
            "web",
            "website",
            "browser",
            "online",
            "site"
        }

        command_words = set(
            command.split()
        )

        if (
            bool(
                web_words.intersection(
                    command_words
                )
            )
            or
            "web version" in command
        ):

            self.pending_app = None

            web_app = re.sub(
                r"\b(web|website|browser|online|site)\b",
                "",
                app
            ).strip()

            known_web_apps = {
                "whatsapp",
                "instagram",
                "snapchat",
                "spotify",
                "discord",
                "telegram",
                "facebook"
            }

            if web_app in known_web_apps:

                return (
                    self.actions.open_app_website(
                        web_app
                    )
                )

            return (
                f"I don't have a website "
                f"mapping for {web_app} yet."
            )

        self.pending_app = None

        return (
            self.actions.open_desktop_app(
                app
            )
        )

    # =========================================================
    # WHATSAPP MESSAGE
    # =========================================================

    def handle_whatsapp_message(
        self,
        command
    ):

        text = (
            command
            .strip()
        )

        lower = text.lower()

        # -----------------------------------------------------
        # Waiting for message
        # -----------------------------------------------------

        if self.pending_message_contact:

            contact = (
                self.pending_message_contact
            )

            self.pending_message_contact = None

            if not text:

                self.pending_message_contact = (
                    contact
                )

                return (
                    f"What message should I send "
                    f"to {contact}?"
                )

            return (
                self.actions.send_whatsapp_message(
                    contact,
                    text
                )
            )

        # -----------------------------------------------------
        # Detect message request
        # -----------------------------------------------------

        patterns = [
            "send a message to ",
            "send message to ",
            "message ",
            "text "
        ]

        for prefix in patterns:

            if (
                prefix in lower
                and
                "whatsapp" in lower
            ):

                contact = (
                    lower
                    .split(
                        prefix,
                        1
                    )[1]
                    .strip()
                )

                contact = (
                    contact
                    .replace(
                        " on whatsapp",
                        ""
                    )
                    .strip()
                )

                if contact:

                    self.pending_message_contact = (
                        contact
                    )

                    return (
                        f"What message should I send "
                        f"to {contact}?"
                    )

        return None

    # =========================================================
    # REMINDER
    # =========================================================

    def handle_reminder(
        self,
        command
    ):

        if (
            "remind me" not in command
            and
            "set reminder" not in command
        ):

            return None

        # Use YOUR existing reminder manager.

        try:

            return (
                self.reminders.handle_command(
                    command
                )
            )

        except Exception as error:

            print(
                "REMINDER ERROR:",
                error
            )

            return (
                "I couldn't set that reminder."
            )

    # =========================================================
    # MAIN COMMAND PROCESSOR
    # =========================================================

    def process_command(
        self,
        command
    ):

        if command is None:

            return (
                "I didn't hear a command."
            )

        command = (
            str(command)
            .strip()
        )

        if not command:

            return (
                "I didn't hear a command."
            )

        normalized = (
            command
            .lower()
            .strip()
        )

        print(
            f"YOU: {command}"
        )

        # Direct commands are handled by local actions below.
        # This marker makes it explicit that they must never
        # be sent to Groq/Gemini as an unnecessary fallback.

        # =====================================================
        # FIRST NAME
        # =====================================================

        if self.waiting_for_name:

            response = (
                self.handle_first_name(
                    command
                )
            )

            if response:

                self.remember(
                    command,
                    response
                )

                return response

        # =====================================================
        # WHATSAPP MESSAGE
        # =====================================================

        response = (
            self.handle_whatsapp_message(
                command
            )
        )

        if response:

            self.remember(
                command,
                response
            )

            return response

        # =====================================================
        # PENDING APP
        # =====================================================

        response = (
            self.handle_pending_app(
                command
            )
        )

        if response:

            self.remember(
                command,
                response
            )

            return response

# =====================================================
        # =====================================================
        # OPEN APP
        # =====================================================

        if (
            normalized.startswith("open ")
            or
            normalized.startswith("launch ")
            or
            normalized.startswith("start ")
            or
            normalized.startswith("go to ")
            or
            normalized.startswith("bring up ")
        ):

            response = self.handle_open_app(normalized)

            if response:

                self.remember(
                    command,
                    response
                )

                return response

        # EXISTING WEBSITE / SEARCH ACTIONS
        # =====================================================

        try:

            response = (
                self.actions.open_website(
                    normalized
                )
            )

            if response:

                self.remember(
                    command,
                    response
                )

                return response

        except Exception as error:

            print(
                "WEBSITE ACTION ERROR:",
                error
            )

        # =====================================================
        # SYSTEM COMMAND
        # =====================================================

        try:

            response = (
                self.actions.system_command(
                    normalized
                )
            )

            if response:

                self.remember(
                    command,
                    response
                )

                return response

        except Exception as error:

            print(
                "SYSTEM ACTION ERROR:",
                error
            )

        # =====================================================
        # APPLICATION
        # =====================================================

        try:

            response = (
                self.actions.open_application(
                    normalized
                )
            )

            if response:

                self.remember(
                    command,
                    response
                )

                return response

        except Exception as error:

            print(
                "APPLICATION ACTION ERROR:",
                error
            )

        # =====================================================
        # FOLDER
        # =====================================================

        try:

            response = (
                self.actions.open_folder(
                    normalized
                )
            )

            if response:

                self.remember(
                    command,
                    response
                )

                return response

        except Exception as error:

            print(
                "FOLDER ACTION ERROR:",
                error
            )

        # =====================================================
        # REMINDER
        # =====================================================

        response = (
            self.handle_reminder(
                normalized
            )
        )

        if response:

            self.remember(
                command,
                response
            )

            return response

        # =====================================================
        # SEARCH
        # =====================================================

        if normalized.startswith(
            "search "
        ):

            query = (
                normalized[
                    7:
                ].strip()
            )

            if query:

                try:

                    response = (
                        self.actions.google_search(
                            query
                        )
                    )

                    if response:

                        self.remember(
                            command,
                            response
                        )

                        return response

                except Exception as error:

                    print(
                        "SEARCH ERROR:",
                        error
                    )

        # =====================================================
        # SHUTDOWN / STANDBY
        # =====================================================

        if (
            "shutdown aura"
            in normalized
            or
            "go to sleep"
            in normalized
        ):

            response = (
                "AURA entering standby mode."
            )

            self.remember(
                command,
                response
            )

            return response
        # =====================================================
        # AURA IDENTITY / DEFINITION
        # =====================================================

        normalized_command = (
            command.lower()
            .strip()
            .replace("?", "")
        )

        # What does AURA stand for?
        if any(phrase in normalized_command for phrase in [
            "what does aura stand for",
            "what does aura stands for",
            "what is aura short for",
            "aura full form",
            "aura full name",
            "full form of aura",
            "expand aura",
        ]):

            return (
                "AURA stands for Advanced Unified "
                "Responsive Assistant."
            )

        # What does AURA mean?
        if any(phrase in normalized_command for phrase in [
            "what is aura",
            "what is the meaning of aura",
            "what does aura mean",
            "define aura",
            "definition of aura",
            "tell me about aura",
        ]):

            return (
                "AURA means Advanced Unified Responsive "
                "Assistant. I am a personal AI assistant "
                "designed to understand your voice, respond "
                "to your commands, control your computer, "
                "and help you with everyday tasks."
            )

        # Who created / made / invented AURA?
        if any(phrase in normalized_command for phrase in [
            "who created you",
            "who created aura",
            "who made you",
            "who made aura",
            "who built you",
            "who built aura",
            "who developed you",
            "who developed aura",
            "who invented you",
            "who invented aura",
            "who is your creator",
            "who is aura creator",
        ]):

            return (
                "I was created and developed by Ashok "
                "as the AURA AI project."
            )

        # Who are you?
        if any(phrase in normalized_command for phrase in [
            "who are you",
            "what are you",
            "tell me about yourself",
        ]):

            return (
                "I am AURA, your Advanced Unified Responsive "
                "Assistant, created and developed by Ashok."
            )

        # =====================================================
        # AI FALLBACK
        # =====================================================

        # Every known/direct command should already have returned
        # above. Only genuine conversational/unknown requests
        # reach AIBrain, preventing unnecessary API usage.

        try:

            response = (
                self.ask_ai(
                    command
                )
            )

        except Exception as error:

            print(
                "AI ERROR:",
                error
            )

            response = (
                "I'm having trouble "
                "processing that right now."
            )

        self.remember(
            command,
            response
        )

        return response

    # =========================================================
    # SHUTDOWN
    # =========================================================

    def shutdown(self):

        print(
            "AURA SHUTDOWN"
        )

        try:

            if self.reminders:

                self.reminders.shutdown()

        except Exception as error:

            print(
                "REMINDER SHUTDOWN ERROR:",
                error
            )

        try:

            if self.engine:

                self.engine.stop()

        except Exception as error:

            print(
                "VOICE SHUTDOWN ERROR:",
                error
            )

        self.is_speaking = False
