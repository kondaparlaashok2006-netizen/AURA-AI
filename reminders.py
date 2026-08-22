import re
import threading
import time
from datetime import datetime, timedelta


class ReminderManager:

    def __init__(self):

        self.reminders = []

        self.running = True

        self.lock = threading.Lock()

        self.worker = threading.Thread(
            target=self._reminder_worker,
            daemon=True
        )

        self.worker.start()


    # ==========================================
    # PROCESS REMINDER COMMAND
    # ==========================================

    def handle_command(self, command):

        text = command.lower().strip()


        # --------------------------------------
        # CANCEL
        # --------------------------------------

        if (
            "cancel reminder" in text
            or
            "cancel all reminders" in text
        ):

            return self.cancel_all()


        # --------------------------------------
        # SHOW REMINDERS
        # --------------------------------------

        if (
            "show reminders" in text
            or
            "list reminders" in text
            or
            "what are my reminders" in text
        ):

            return self.list_reminders()


        # --------------------------------------
        # EXTRACT TIME
        # --------------------------------------

        seconds = self._extract_duration(
            text
        )

        if seconds is None:

            return (
                "Tell me the reminder time, "
                "for example, remind me in "
                "15 minutes."
            )


        # --------------------------------------
        # EXTRACT MESSAGE
        # --------------------------------------

        message = self._extract_message(
            command
        )


        if not message:

            message = "Reminder"


        # --------------------------------------
        # CREATE REMINDER
        # --------------------------------------

        reminder = {

            "message":
                message,

            "seconds":
                seconds,

            "created":
                datetime.now(),

            "trigger_at":
                datetime.now()
                + timedelta(
                    seconds=seconds
                )

        }


        with self.lock:

            self.reminders.append(
                reminder
            )


        time_text = (
            self._format_duration(
                seconds
            )
        )


        return (
            f"Okay {time_text}. "
            f"I'll remind you to {message}."
        )


    # ==========================================
    # EXTRACT DURATION
    # ==========================================

    def _extract_duration(self, text):

        patterns = [

            (
                r"(\d+(?:\.\d+)?)\s*"
                r"(seconds?|secs?)",
                1
            ),

            (
                r"(\d+(?:\.\d+)?)\s*"
                r"(minutes?|mins?)",
                60
            ),

            (
                r"(\d+(?:\.\d+)?)\s*"
                r"(hours?|hrs?)",
                3600
            )

        ]


        for pattern, multiplier in patterns:

            match = re.search(
                pattern,
                text,
                re.IGNORECASE
            )


            if match:

                value = float(
                    match.group(1)
                )

                seconds = int(
                    value * multiplier
                )

                return seconds


        return None


    # ==========================================
    # EXTRACT MESSAGE
    # ==========================================

    def _extract_message(
        self,
        command
    ):

        text = command.strip()


        patterns = [

            r"remind me in "
            r"\d+(?:\.\d+)?\s*"
            r"(?:seconds?|secs?|minutes?|mins?|hours?|hrs?)"
            r"(?:\s+to\s+|\s+about\s+)?"
            r"(.+)$",

            r"set reminder for "
            r"\d+(?:\.\d+)?\s*"
            r"(?:seconds?|secs?|minutes?|mins?|hours?|hrs?)"
            r"(?:\s+to\s+|\s+about\s+)?"
            r"(.+)$",

            r"set a reminder for "
            r"\d+(?:\.\d+)?\s*"
            r"(?:seconds?|secs?|minutes?|mins?|hours?|hrs?)"
            r"(?:\s+to\s+|\s+about\s+)?"
            r"(.+)$"

        ]


        for pattern in patterns:

            match = re.search(
                pattern,
                text,
                re.IGNORECASE
            )


            if match:

                message = (
                    match.group(1)
                    .strip()
                    .strip(".!?")
                )

                return message


        return None


    # ==========================================
    # FORMAT DURATION
    # ==========================================

    def _format_duration(
        self,
        seconds
    ):

        if seconds < 60:

            return (
                f"in {seconds} seconds"
            )


        if seconds < 3600:

            minutes = seconds // 60

            if minutes == 1:

                return "in 1 minute"

            return (
                f"in {minutes} minutes"
            )


        hours = seconds // 3600

        remaining_minutes = (
            (seconds % 3600) // 60
        )


        if remaining_minutes:

            return (
                f"in {hours} hour"
                f"{'s' if hours != 1 else ''} "
                f"and {remaining_minutes} minute"
                f"{'s' if remaining_minutes != 1 else ''}"
            )


        return (
            f"in {hours} hour"
            f"{'s' if hours != 1 else ''}"
        )


    # ==========================================
    # WORKER
    # ==========================================

    def _reminder_worker(self):

        while self.running:

            due_reminders = []


            with self.lock:

                now = datetime.now()


                remaining = []


                for reminder in self.reminders:

                    if (
                        now >=
                        reminder["trigger_at"]
                    ):

                        due_reminders.append(
                            reminder
                        )

                    else:

                        remaining.append(
                            reminder
                        )


                self.reminders = remaining


            # ----------------------------------
            # TRIGGER REMINDERS
            # ----------------------------------

            for reminder in due_reminders:

                self._trigger_reminder(
                    reminder
                )


            time.sleep(1)


    # ==========================================
    # TRIGGER
    # ==========================================

    def _trigger_reminder(
        self,
        reminder
    ):

        message = reminder[
            "message"
        ]


        print()
        print("=" * 50)
        print("             AURA REMINDER")
        print("=" * 50)
        print(
            f"Reminder: {message}"
        )
        print("=" * 50)
        print()


        # Windows notification through
        # PowerShell.

        try:

            safe_message = (
                message
                .replace(
                    "'",
                    "''"
                )
            )


            powershell = f"""
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$notify = New-Object System.Windows.Forms.NotifyIcon
$notify.Icon = [System.Drawing.SystemIcons]::Information
$notify.Visible = $true
$notify.BalloonTipTitle = 'AURA Reminder'
$notify.BalloonTipText = '{safe_message}'
$notify.ShowBalloonTip(10000)

Start-Sleep -Seconds 10

$notify.Dispose()
"""


            subprocess_command = [
                "powershell.exe",
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                powershell
            ]


            import subprocess

            subprocess.Popen(
                subprocess_command,
                creationflags=
                    subprocess.CREATE_NO_WINDOW
            )


        except Exception as error:

            print(
                "REMINDER NOTIFICATION ERROR:",
                error
            )


        # ----------------------------------
        # BEEP
        # ----------------------------------

        try:

            import winsound

            for _ in range(3):

                winsound.Beep(
                    900,
                    300
                )

                time.sleep(
                    0.15
                )

        except Exception:

            pass


    # ==========================================
    # LIST REMINDERS
    # ==========================================

    def list_reminders(self):

        with self.lock:

            if not self.reminders:

                return (
                    "You don't have any "
                    "active reminders."
                )


            lines = []

            now = datetime.now()


            for index, reminder in enumerate(
                self.reminders,
                start=1
            ):

                remaining = (
                    reminder["trigger_at"]
                    - now
                ).total_seconds()


                remaining = max(
                    0,
                    int(remaining)
                )


                duration = (
                    self._format_duration(
                        remaining
                    )
                )


                lines.append(
                    f"{index}. "
                    f"{reminder['message']} "
                    f"{duration}"
                )


        return (
            "Your active reminders are: "
            + " ".join(lines)
        )


    # ==========================================
    # CANCEL ALL
    # ==========================================

    def cancel_all(self):

        with self.lock:

            count = len(
                self.reminders
            )

            self.reminders.clear()


        if count == 0:

            return (
                "There are no active "
                "reminders to cancel."
            )


        return (
            f"Cancelled {count} "
            f"active reminder"
            f"{'s' if count != 1 else ''}."
        )


    # ==========================================
    # SHUTDOWN
    # ==========================================

    def shutdown(self):

        self.running = False

        with self.lock:

            self.reminders.clear()