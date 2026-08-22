import os
import re
import threading

import pyttsx3

from ai_brain import AIBrain
from actions.action_router import ActionRouter
from database import (
    get_user,
    create_user,
    update_user_name,
    update_last_seen,
    save_conversation,
    save_search,
    get_conversation_history
)
from reminders import ReminderManager


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

        self.username = None
        self.user_name = None

        self.waiting_for_name = True
        self.waiting_for_username = False

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

    # =========================================================
    # GET USER NAME
    # =========================================================

    def get_user_name(self):

        return self.user_name

    def set_current_user(self, username):
        username = username.strip().lower()

        if not username:
            return False

        user = get_user(username)

        if not user:
            return False

        self.username = user[1]
        self.user_name = user[2]

        update_last_seen(self.username)

        # Restore this user's previous conversation
        self.conversation_history = get_conversation_history(
            self.username,
            self.max_memory
        )

        self.waiting_for_name = False
        self.waiting_for_username = False

        print(
            f"AURA USER LOADED: {self.username} "
            f"({self.user_name})"
        )

        return True

    def register_user(self, username, display_name):
        username = username.strip().lower()
        display_name = display_name.strip()

        if not username or not display_name:
            return False

        existing = get_user(username)

        if existing:
            return False

        user = create_user(
            username,
            display_name
        )

        if not user:
            return False

        self.username = user[1]
        self.user_name = user[2]

        return True

    def change_current_user_name(self, new_name):
        if not self.username:
            return False

        new_name = new_name.strip()

        if not new_name:
            return False

        user = update_user_name(
            self.username,
            new_name
        )

        if not user:
            return False

        self.user_name = user[2]

        return True

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

    def remember(self, user_message, response):

        self.conversation_history.append(
            {
                "user": user_message,
                "aura": response
            }
        )

        if len(self.conversation_history) > self.max_memory:
            self.conversation_history.pop(0)

        # Save permanently for the current user
        if self.username:
            try:
                save_conversation(
                    self.username,
                    user_message,
                    response
                )
            except Exception as error:
                print(
                    "DATABASE CONVERSATION SAVE ERROR:",
                    error
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

    def handle_first_name(self, command):

        if not self.waiting_for_name:
            return None

        text = (
            command
            .strip()
            .strip(".!?")
        )

        if not text:
            return "What should I call you?"

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

        if name is None:
            if (
                len(text) <= 40
                and len(text.split()) <= 5
                and not any(
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
            return "Please tell me your name."

        self.user_name = name
        self.waiting_for_name = False
        self.waiting_for_username = True

        return (
            f"Nice to meet you, {name}. "
            f"What username would you like?"
        )

    def handle_first_username(self, command):

        if not self.waiting_for_username:
            return None

        username = (
            command
            .strip()
            .lower()
            .strip(".!?")
        )

        if not username:
            return "Please tell me your username."

        # Basic username validation
        if not re.match(
            r"^[a-z0-9_@.-]{3,50}$",
            username
        ):
            return (
                "Please choose a username using "
                "letters, numbers, dots, underscores, "
                "or hyphens."
            )

        existing = get_user(username)

        if existing:
            return (
                "That username is already in use. "
                "Please choose another one."
            )

        created = create_user(
            username,
            self.user_name
        )

        if not created:
            return (
                "I couldn't create your AURA user."
            )

        self.username = created[1]
        self.user_name = created[2]
        self.waiting_for_username = False

        update_last_seen(self.username)

        return (
            f"Perfect, {self.user_name}. "
            f"Your AURA username is {self.username}. "
            f"How can I help you today?"
        )

    # =========================================================
    # APP DETECTION
    # =========================================================

    def detect_app(
        self,
        command
    ):

        apps = [
            "whatsapp",
            "instagram",
            "snapchat",
            "spotify",
            "discord",
            "telegram",
            "facebook"
        ]

        for app in apps:

            if app in command:

                return app

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

        app = self.detect_app(
            command
        )

        if not app:

            return None

        # Explicit website

        if (
            "website" in command
            or
            "browser" in command
            or
            "web version" in command
        ):

            return (
                self.actions.open_app_website(
                    app
                )
            )

        # Explicit desktop

        if (
            "desktop" in command
            or
            "desktop app" in command
        ):

            return (
                self.actions.open_desktop_app(
                    app
                )
            )

        # Ask user

        self.pending_app = app

        return (
            f"Do you want me to open "
            f"{app.title()} as the desktop "
            f"app or open its website?"
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

        if self.waiting_for_username:

            response = self.handle_first_username(
                command
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

        if self.pending_app:

            clarification_words = [
                "desktop",
                "desktop app",
                "app",
                "application",
                "website",
                "web",
                "browser"
            ]

            if normalized not in clarification_words:
                self.pending_app = None

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
        # OPEN COMMON APP
        # =====================================================

        common_apps = [
            "whatsapp",
            "instagram",
            "snapchat",
            "spotify",
            "discord",
            "telegram",
            "facebook"
        ]

        for app in common_apps:

            if normalized in [
                app,
                f"open {app}",
                f"launch {app}",
                f"start {app}"
            ]:

                self.pending_app = app

                response = (
                    f"Do you want me to open "
                    f"{app.title()} as the desktop "
                    f"app or open its website?"
                )

                self.remember(
                    command,
                    response
                )

                return response

        # =====================================================
        # OPEN APP
        # =====================================================

        if (
            normalized.startswith(
                "open "
            )
            or
            normalized.startswith(
                "launch "
            )
            or
            normalized.startswith(
                "start "
            )
        ):

            response = (
                self.handle_open_app(
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

                    if self.username:
                        save_search(
                            self.username,
                            "google",
                            query
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
        # AI FALLBACK
        # =====================================================

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