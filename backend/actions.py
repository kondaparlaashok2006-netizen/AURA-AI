import re
import urllib.parse
import webbrowser

class Actions:
    def __init__(self):
        self.pending_app = {}

    def process(self, user, command):
        c = command.lower().strip()
        uid = int(user["id"])

        if uid in self.pending_app:
            app = self.pending_app.pop(uid)
            if any(x in c for x in ("website","web","browser")):
                urls = {"whatsapp":"https://web.whatsapp.com","instagram":"https://www.instagram.com","snapchat":"https://web.snapchat.com"}
                webbrowser.open(urls[app], new=2, autoraise=True)
                return f"Opening {app.title()} website."
            if any(x in c for x in ("desktop","app","application")):
                return f"I need the AURA desktop companion installed on this computer to open the {app.title()} desktop app."
            self.pending_app[uid] = app
            return "Please say desktop app or website."

        for marker in ("open youtube and search for ","open youtube search for ","search youtube for ","search youtube ","youtube search for ","youtube search "):
            if marker in c:
                q = c.split(marker,1)[1].strip()
                if q:
                    webbrowser.open("https://www.youtube.com/results?search_query="+urllib.parse.quote_plus(q), new=2, autoraise=True)
                    return f"Searching YouTube for {q}."

        for marker in ("search google for ","search google ","google search for ","google search ","search for ","search "):
            if c.startswith(marker):
                q = c[len(marker):].strip()
                if q:
                    webbrowser.open("https://www.google.com/search?q="+urllib.parse.quote_plus(q), new=2, autoraise=True)
                    return f"Searching Google for {q}."

        sites = {
            "youtube":"https://www.youtube.com",
            "google":"https://www.google.com",
            "instagram":"https://www.instagram.com",
            "facebook":"https://www.facebook.com",
            "whatsapp web":"https://web.whatsapp.com",
            "github":"https://github.com",
        }
        for name,url in sites.items():
            if c in (f"open {name}",name,f"{name} open"):
                webbrowser.open(url,new=2,autoraise=True)
                return f"Opening {name.title()}."

        for app in ("whatsapp","instagram","snapchat"):
            if c in (f"open {app}",f"launch {app}",f"start {app}"):
                self.pending_app[uid] = app
                return f"Do you want me to open {app.title()} as the desktop app or website?"

        if c in ("open calculator","open calc"):
            return "Calculator is a device-local action. Install the AURA desktop companion on this computer to enable it."

        if c in ("lock screen","lock my screen","lock the screen"):
            return "Screen locking is a device-local action. Install the AURA desktop companion on this computer to enable it."

        m = re.search(r"(?:remind me|set reminder).*?(\d+)\s*(seconds?|minutes?|hours?)", c)
        if m:
            return "Reminder command received. For a production reminder, connect this user account to the reminder scheduler."

        return None
