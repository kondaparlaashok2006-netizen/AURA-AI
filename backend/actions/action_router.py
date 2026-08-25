from backend.actions.web_actions import WebActions
from backend.actions.local_windows_actions import LocalWindowsActions


class ActionRouter:
    """
    Compatibility layer for AURA.

    Keeps assistant.py simple while routing
    web commands and Windows commands to
    separate action classes.
    """

    def __init__(self):

        self.web = WebActions()
        self.local = LocalWindowsActions()

    # =========================================================
    # WEB ACTIONS
    # =========================================================

    def open_website(self, command):
        return self.web.open_website(command)

    def google_search(self, query):
        return self.web.google_search(query)

    def open_app_website(self, app):
        return self.web.open_app_website(app)

    def send_whatsapp_message(
        self,
        contact,
        message
    ):
        return self.web.send_whatsapp_message(
            contact,
            message
        )

    # =========================================================
    # LOCAL WINDOWS ACTIONS
    # =========================================================

    def open_application(self, command):
        return self.local.open_application(
            command
        )

    def open_desktop_app(self, app):
        return self.local.open_desktop_app(
            app
        )

    def open_folder(self, command):
        return self.local.open_folder(
            command
        )

    def system_command(self, command):
        return self.local.system_command(
            command
        )