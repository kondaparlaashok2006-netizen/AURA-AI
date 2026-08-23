// ============================================================
// AURA AI - FINAL VOICE CONTROLLER
// ============================================================

let auraUsername = localStorage.getItem("aura_username") || "";

let auraSessionId =
    localStorage.getItem("aura_session_id");

if (!auraSessionId) {
    auraSessionId = crypto.randomUUID();

    localStorage.setItem(
        "aura_session_id",
        auraSessionId
    );
}

class AuraVoiceController {

    constructor() {

        // =====================================================
        // STATE
        // =====================================================

        this.recognition = null;

        this.isListening = false;
        this.isProcessing = false;
        this.isSpeaking = false;

        this.continuousMode = false;
        this.wakeMode = false;

        this.shouldListenAgain = false;
        this.waitingForUserChoice = false;
        this.pendingAppChoice = null;

        this.waitingForMessageInput = false;
        this.waitingForEmailInput = false;
        this.emailStep = null;
        this.emailRecipient = null;
        this.emailSubject = null;
        this.emailBody = null;
        this.pendingMessageService = null;
        this.pendingMessageRecipient = null;

        this.waitingForEmailInput = false;

        this.idleTimer = null;
        this.startTimer = null;

        this.IDLE_TIMEOUT = 15000;

        // =====================================================
        // UI
        // =====================================================

        this.micButton =
            document.getElementById("micButton");

        this.continuousButton =
            document.getElementById(
                "continuousButton"
            );

        this.micLabel =
            document.getElementById("micLabel") ||
            document.querySelector(".mic-label");

        this.continuousLabel =
            document.getElementById(
                "continuousLabel"
            ) ||
            document.querySelector(
                ".continuous-label"
            );

        this.statusElement =
            document.getElementById("status");

        this.commandElement =
            document.getElementById("command");

        this.responseElement =
            document.getElementById("response");

        this.core =
            document.getElementById("auraCore");

        // =====================================================
        // INITIALIZE
        // =====================================================

        this.initSoundSystem();
        this.setupRecognition();
        this.setupButtons();
        this.setupTextCommand();
        this.loadVoices();

        this.updateStatus("Ready");
        this.updateMicUI(false);
        this.updateContinuousUI(false);

        console.log(
            "AURA VOICE SYSTEM READY"
        );
    }

    // =========================================================
    // SPEECH RECOGNITION
    // =========================================================
    setupRecognition() {
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        this.updateStatus(
            "Voice recognition unavailable"
        );
        return;
    }

    this.recognition =
        new SpeechRecognition();

    this.recognition.lang = "en-US";
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
    console.log("AURA MIC: recognition started");

    this.isListening = true;
    this.updateMicUI(true);
    this.setCoreState("listening");
    this.updateStatus("Listening...");

    if (
        this.continuousMode &&
        !this.wakeMode
    ) {
        this.resetIdleTimer();
    }
};

    this.recognition.onresult = async (event) => {
        const result =
            event.results[event.results.length - 1];

        if (!result || !result[0]) {
            return;
        }

        const text =
            result[0].transcript.trim();

        if (!text) {
            return;
        }

        console.log("AURA HEARD:", text);

        this.showCommand(text);

        this.stopListening();
        this.clearIdleTimer();

        await this.processCommand(text);
    };

    this.recognition.onend = () => {
        console.log(
            "AURA MIC: recognition ended"
        );

        this.isListening = false;
        this.updateMicUI(false);

        if (
            this.wakeMode &&
            this.continuousMode &&
            !this.isProcessing &&
            !this.isSpeaking
        ) {
            this.restartWakeListening();
            return;
        }

        if (
            this.shouldListenAgain &&
            this.continuousMode &&
            !this.isProcessing &&
            !this.isSpeaking &&
            !this.wakeMode
        ) {
            this.scheduleListening();
            return;
        }

        this.updateStatus("Ready");
    };

    this.recognition.onerror = (event) => {
        console.error(
            "AURA MIC ERROR:",
            event.error
        );

        this.isListening = false;
        this.updateMicUI(false);

        if (event.error === "not-allowed") {
            this.shouldListenAgain = false;
            this.updateStatus(
                "Microphone permission denied"
            );
            return;
        }

        if (event.error === "audio-capture") {
            this.shouldListenAgain = false;
            this.updateStatus(
                "Microphone unavailable"
            );
            return;
        }

        if (
            event.error === "service-not-allowed"
        ) {
            this.shouldListenAgain = false;
            this.updateStatus(
                "Microphone service unavailable"
            );
            return;
        }

        if (event.error === "no-speech") {
            console.log(
                "AURA MIC: no speech detected"
            );
            return;
        }

        if (event.error === "aborted") {
            console.log(
                "AURA MIC: recognition aborted"
            );
            return;
        }

        console.error(
            "AURA MIC UNKNOWN ERROR:",
            event.error
        );
    };
}
    

    // =========================================================
    // BUTTONS
    // =========================================================

    setupButtons() {
    if (this.micButton) {
        this.micButton.addEventListener(
            "click",
            () => {
                if (
                    this.isProcessing ||
                    this.isSpeaking
                ) {
                    return;
                }

                if (this.isListening) {
                    this.shouldListenAgain = false;
                    this.wakeMode = false;

                    this.stopListening();
                    this.updateStatus("Ready");

                    return;
                }

                this.startNormalMode();
            }
        );
    }

    if (this.continuousButton) {
        this.continuousButton.addEventListener(
            "click",
            () => {
                if (this.continuousMode) {
                    this.stopContinuousMode();
                } else {
                    this.startContinuousMode();
                }
            }
        );
    }
}



    // =========================================================
    // NORMAL MODE
    // =========================================================

    startNormalMode() {

        this.continuousMode =
            false;

        this.wakeMode =
            false;

        this.shouldListenAgain =
            false;

        this.clearIdleTimer();

        this.updateContinuousUI(
            false
        );

        this.startListening();
    }

    // =========================================================
    // CONTINUOUS MODE
    // =========================================================

    startContinuousMode() {

        console.log(
            "AURA: CONTINUOUS MODE ON"
        );

        this.continuousMode =
            true;

        this.wakeMode =
            false;

        this.shouldListenAgain =
            true;

        this.clearIdleTimer();

        this.updateContinuousUI(
            true
        );

        this.updateStatus(
            "Continuous — Listening"
        );

        this.startListening();
    }

    // =========================================================
    // STOP CONTINUOUS
    // =========================================================

    stopContinuousMode() {

        console.log(
            "AURA: CONTINUOUS MODE OFF"
        );

        this.continuousMode =
            false;

        this.wakeMode =
            false;

        this.shouldListenAgain =
            false;

        this.clearIdleTimer();

        this.stopListening();

        this.updateContinuousUI(
            false
        );

        this.updateStatus(
            "Ready"
        );
    }

    // =========================================================
    // START LISTENING
    // =========================================================

    startListening() {
    if (!this.recognition) {
        this.updateStatus(
            "Voice recognition unavailable"
        );
        return;
    }

    if (
        this.isListening ||
        this.isProcessing ||
        this.isSpeaking
    ) {
        return;
    }

    if (this.startTimer) {
        clearTimeout(this.startTimer);
        this.startTimer = null;
    }

    this.startTimer = setTimeout(() => {
        this.startTimer = null;

        if (
            this.isListening ||
            this.isProcessing ||
            this.isSpeaking
        ) {
            return;
        }

        try {
            console.log(
                "AURA MIC: starting recognition..."
            );

            this.recognition.start();

        } catch (error) {
            console.error(
                "MIC START ERROR:",
                error
            );

            this.isListening = false;
            this.updateMicUI(false);
            this.updateStatus("Ready");
        }
    }, 200);
}

    // =========================================================
    // WAKE LISTENING
    // =========================================================

    startWakeListening() {

        if (!this.recognition) {
            return;
        }

        if (
            !this.continuousMode ||
            !this.wakeMode ||
            this.isProcessing ||
            this.isSpeaking ||
            this.isListening
        ) {
            return;
        }

        try {

            this.isListening =
                true;

            this.updateMicUI(
                true
            );

            this.updateStatus(
                'Idle — say "AURA"'
            );

            this.setCoreState(
                "idle"
            );

            this.recognition.start();

        } catch (error) {

            console.log(
                "WAKE LISTEN START:",
                error
            );

            this.isListening =
                false;

            this.updateMicUI(
                false
            );
        }
    }

    // =========================================================
    // RESTART WAKE LISTENER
    // =========================================================

    restartWakeListening() {

        if (
            !this.continuousMode ||
            !this.wakeMode ||
            this.isProcessing ||
            this.isSpeaking
        ) {
            return;
        }

        setTimeout(
            () => {

                if (
                    this.continuousMode &&
                    this.wakeMode &&
                    !this.isProcessing &&
                    !this.isSpeaking &&
                    !this.isListening
                ) {

                    this.startWakeListening();
                }

            },
            300
        );
    }

    // =========================================================
    // STOP LISTENING
    // =========================================================

    stopListening() {

        if (!this.recognition) {
            return;
        }

        if (!this.isListening) {
            return;
        }

        try {

            this.recognition.stop();

        } catch (error) {

            console.log(
                "MIC STOP:",
                error
            );
        }

        this.isListening =
            false;

        this.updateMicUI(
            false
        );
    }

    // =========================================================
    // PROCESS COMMAND
    // =========================================================

    async processCommand(
        command
    ) {

        this.isProcessing =
            true;

        this.responseElement
            ?.closest(".message-block")
            ?.classList.add("processing-feedback");

        this.updateStatus(
            "Processing..."
        );

        this.setCoreState(
            "processing"
        );

        try {

            const response =
                await this.sendCommand(
                    command
                );

            if (!response) {

                throw new Error(
                    "Empty response from AURA"
                );
            }

            this.showResponse(
                response
            );

            await this.speak(
                response
            );

        } catch (error) {

            console.error(
                "COMMAND ERROR:",
                error
            );

            const errorMessage =
                "Sorry, I couldn't process that command.";

            this.showResponse(
                errorMessage
            );

            const auraMessage =
                this.responseElement?.closest(".message-block");

            if (auraMessage) {
                auraMessage.classList.remove("error-state");

                void auraMessage.offsetWidth;

                auraMessage.classList.add("error-state");

                setTimeout(() => {
                    auraMessage.classList.remove("error-state");
                }, 600);
            }

            await this.speak(
                errorMessage
            );

        } finally {

            this.responseElement
                ?.closest(".message-block")
                ?.classList.remove("processing-feedback");

            this.isProcessing =
                false;

            this.setCoreState(
                "idle"
            );

            // =================================================
            // CONTINUOUS MODE
            // =================================================

            if (
                this.continuousMode
            ) {

                this.shouldListenAgain =
                    true;

                this.updateStatus(
                    "Ready — listening again"
                );

                this.scheduleListening();

            } else {

    if (
        this.waitingForUserChoice ||
        this.waitingForMessageInput ||
        this.waitingForEmailInput
    ) {
        this.shouldListenAgain = true;

        this.updateStatus(
            "Ready — listening for your answer"
        );

        setTimeout(() => {
            if (
                !this.isListening &&
                !this.isProcessing &&
                !this.isSpeaking
            ) {
                this.startListening();
            }
        }, 250);

    } else {

      this.shouldListenAgain = false;

      this.updateMicUI(false);

      this.updateStatus(
          "Ready"
        );
    }
}
        }
    }

    // =====================================================
    // OPEN WEB ACTION IN USER'S BROWSER
    // =====================================================

    getAppChoice(command) {
        
    const text = command
        .toLowerCase()
        .replace(/[.,!?]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const match = text.match(
        /^(?:please\s+)?(?:open|launch|start|go to)\s+(whatsapp|instagram|snapchat|spotify|discord|telegram|chrome|gmail)(?:\s+app)?$/
    );

    if (!match) {
        return null;
    }

    return match[1];
}
openDesktopApp(app) {
    const desktopApps = {
        whatsapp:
            "whatsapp://",
        instagram:
            "instagram://",
        snapchat:
            "snapchat://",
        spotify:
            "spotify:",
        discord:
            "discord://",
        telegram:
            "tg://"
    };

    const protocol =
        desktopApps[app];

    if (!protocol) {
        return `I couldn't find a desktop app for ${app}.`;
    }

    window.location.href =
        protocol;

    return `Opening ${app} desktop app.`;
}
    getWebActionUrl(command) {
    const text = command.toLowerCase().trim();

    const clean = text
        .replace(/[.,!?]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const openMatch = clean.match(
        /^(?:please\s+)?(?:open|launch|start|go to|visit)\s+(.+?)(?:\s+(?:website|site|web))?$/
    );

    if (!openMatch) {
        return null;
    }

    let target = openMatch[1]
        .replace(/\bapp\b/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const knownSites = {
        youtube: "https://www.youtube.com",
        google: "https://www.google.com",
        instagram: "https://www.instagram.com",
        facebook: "https://www.facebook.com",
        snapchat: "https://www.snapchat.com",
        spotify: "https://open.spotify.com",
        whatsapp: "https://web.whatsapp.com",
        github: "https://github.com",
        gmail: "https://mail.google.com",
        "google drive": "https://drive.google.com",
        "google docs": "https://docs.google.com",
        "google maps": "https://maps.google.com",
        linkedin: "https://www.linkedin.com",
        reddit: "https://www.reddit.com",
        discord: "https://discord.com",
        telegram: "https://web.telegram.org",
        netflix: "https://www.netflix.com",
        amazon: "https://www.amazon.com",
        flipkart: "https://www.flipkart.com"
    };

    if (knownSites[target]) {
        return knownSites[target];
    }

    if (
        target.startsWith("http://") ||
        target.startsWith("https://")
    ) {
        return target;
    }

    if (
        target.includes(".com") ||
        target.includes(".in") ||
        target.includes(".org") ||
        target.includes(".net")
    ) {
        return "https://" + target;
    }

    return (
        "https://www.google.com/search?q=" +
        encodeURIComponent(target)
    );
}    
   getMessageAction(command) {
    const text = command
        .toLowerCase()
        .replace(/[.,!?]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const match = text.match(
        /^(?:open\s+)?(whatsapp|instagram|snapchat)\s+(?:and\s+)?(?:send\s+(?:a\s+)?message\s+to|message|text)\s+(.+?)\s+(?:saying|that says|with the message)\s+(.+)$/
    );

    if (!match) {
        return null;
    }

    return {
        service: match[1],
        recipient: match[2].trim(),
        message: match[3].trim()
    };
}
parseMessageCommand(command) {
    const text = command
        .toLowerCase()
        .replace(/[!?]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const match = text.match(
        /(?:open\s+)?whatsapp\s+(?:and\s+)?(?:send\s+(?:a\s+)?message|message|text)\s+to\s+(.+?)\s+(?:saying|that says|with the message)\s+(.+)/
    );

    if (!match) {
        return null;
    }

    return {
        service: "whatsapp",
        recipient: match[1].trim(),
        message: match[2].trim()
    };
}   
    parseEmailCommand(command) {
    const text = command
        .replace(/\s+/g, " ")
        .trim();

    const match = text.match(
        /^(?:open\s+)?(?:email|gmail)(?:\s+and)?\s+(?:write|compose|send)\s+(?:an?\s+)?email(?:\s+to\s+(.+?))?(?:\s+saying\s+(.+))?$/i
    );

    if (!match) {
        return null;
    }

    return {
        recipient: match[1]
            ? match[1].trim()
            : null,

        body: match[2]
            ? match[2].trim()
            : null
    };
}

    // =========================================================
    // SEND COMMAND
    // =========================================================

    async sendCommand(command) {
    command = command.trim();

    if (!command) {
        return;
    }

    console.log("AURA COMMAND:", command);
    
    const emailOpenCommand =
    /^(?:open|launch|start|go to)\s+(?:email|gmail)$/i.test(
        command.trim()
    );

if (emailOpenCommand) {
    window.open(
        "https://mail.google.com",
        "_blank"
    );

    return "Opening Gmail.";
}
    const emailMatch = command.match(
    /^(?:open\s+)?(?:send|write|compose)\s+(?:an?\s+)?(?:email|gmail)\s+to\s+([^\s]+)(?:\s+(?:saying|with the message|that says)\s+(.+))?$/i
);

if (this.waitingForEmailInput) {
    if (this.emailStep === "subject") {
        this.emailSubject = command.trim();
        this.emailStep = "body";
        return "What should I write in the email?";
    }

    if (this.emailStep === "body") {
        this.emailBody = command.trim();

        this.waitingForEmailInput = false;

        const recipient = this.emailRecipient;
        const subject = this.emailSubject;
        const body = this.emailBody;

        this.emailStep = null;
        this.emailRecipient = null;
        this.emailSubject = null;
        this.emailBody = null;

        const gmailUrl =
            "https://mail.google.com/mail/?view=cm&fs=1" +
            "&to=" + encodeURIComponent(recipient) +
            "&su=" + encodeURIComponent(subject) +
            "&body=" + encodeURIComponent(body);

        window.open(gmailUrl, "_blank");

        return "I've prepared the email for you.";
    }
}

if (emailMatch) {
    this.emailRecipient = emailMatch[1];

    if (emailMatch[2]) {
        this.emailBody = emailMatch[2];
        this.emailStep = "subject";
        this.waitingForEmailInput = true;

        return "What should be the subject?";
    }

    this.emailStep = "body";
    this.waitingForEmailInput = true;

    return "What should I write in the email?";
}
    const socialMessageMatch = command.match(
    /^(?:open\s+)?(instagram|snapchat)\s+(?:and\s+)?(?:send\s+(?:a\s+)?message|message|text)\s+to\s+(.+?)\s+(?:saying|that says|with the message)\s+(.+)$/i
);

if (socialMessageMatch) {
    const service =
        socialMessageMatch[1].toLowerCase();

    const recipient =
        socialMessageMatch[2].trim();

    const message =
        socialMessageMatch[3].trim();

    const urls = {
        instagram:
            "https://www.instagram.com/direct/inbox/",
        snapchat:
            "https://www.snapchat.com/web"
    };

    console.log(
        "AURA SOCIAL MESSAGE:",
        service,
        recipient,
        message
    );

    const url = urls[service];

    if (url) {
        window.open(
            url,
            "_blank"
        );

        return `Opening ${service} to message ${recipient}.`;
    }

    return `I couldn't open ${service}.`;
}
   const whatsappCallMatch = command
    .toLowerCase()
    .replace(/[.,!?]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .match(
        /^(?:call|phone call|start a call|start calling)\s+(\d{10,15})\s*(?:on\s+whatsapp)?$/
    );

if (whatsappCallMatch) {
    const phone =
        whatsappCallMatch[1].replace(/\D/g, "");

    console.log(
        "AURA WHATSAPP CALL:",
        phone
    );

    window.location.href =
        "whatsapp://call?phone=" +
        phone;

    return "Opening WhatsApp call.";
}

const whatsappVideoCallMatch = command
    .toLowerCase()
    .replace(/[.,!?]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .match(
        /^(?:video call|start a video call)\s+(\d{10,15})\s*(?:on\s+whatsapp)?$/
    );

if (whatsappVideoCallMatch) {
    const phone =
        whatsappVideoCallMatch[1].replace(/\D/g, "");

    console.log(
        "AURA WHATSAPP VIDEO CALL:",
        phone
    );

    window.location.href =
        "whatsapp://video?phone=" +
        phone;

    return "Opening WhatsApp video call.";
}

const whatsappMatch = command.match(
    /^(?:open\s+)?whatsapp\s+(?:and\s+)?send\s+(?:a\s+)?message\s+to\s+(\+?\d{10,15})\s+(?:saying|that says|with the message)\s+(.+)$/i
);

if (whatsappMatch) {
    const phone =
        whatsappMatch[1].replace(/\D/g, "");

    const message =
        whatsappMatch[2].trim();

    const whatsappUrl =
        "https://wa.me/" +
        phone +
        "?text=" +
        encodeURIComponent(message);

    console.log(
        "AURA WHATSAPP:",
        phone,
        message
    );

    window.open(
        whatsappUrl,
        "_blank"
    );

    return "Opening WhatsApp with your message ready.";
}

if (
    this.waitingForMessageInput &&
    this.pendingMessageService === "whatsapp"
) {
    const phone =
        command.replace(/\D/g, "");

    if (phone.length >= 10) {
        this.waitingForMessageInput =
            false;

        const recipient =
            this.pendingMessageRecipient;

        const message =
            this.pendingMessageText;

        this.pendingMessageService =
            null;

        this.pendingMessageRecipient =
            null;

        this.pendingMessageText =
            null;

        const url =
            "https://wa.me/" +
            phone +
            "?text=" +
            encodeURIComponent(message);

        window.open(
            url,
            "_blank"
        );

        return `Opening WhatsApp for ${recipient} with your message ready.`;
    }

    return "Please tell me the phone number.";
}

    if (
        this.waitingForMessageInput &&
        this.pendingMessageService === "whatsapp"
    ) {
        const phone =
            command.replace(/\D/g, "");

        if (phone.length >= 10) {
            this.waitingForMessageInput =
                false;

            const recipient =
                this.pendingMessageRecipient;

            const message =
                this.pendingMessageText;

            this.pendingMessageService =
                null;

            this.pendingMessageRecipient =
                null;

            this.pendingMessageText =
                null;

            const url =
                "https://wa.me/" +
                phone +
                "?text=" +
                encodeURIComponent(message);

            window.open(
                url,
                "_blank"
            );

            return `Opening WhatsApp for ${recipient} with your message ready.`;
        }

        return "Please tell me the phone number.";
    }

    const messageCommand =
        this.parseMessageCommand(command);

    if (messageCommand) {
        const recipient =
            messageCommand.recipient;

        const message =
            messageCommand.message;

        const phone =
            recipient.replace(/\D/g, "");

        if (phone.length >= 10) {
            const url =
                "https://wa.me/" +
                phone +
                "?text=" +
                encodeURIComponent(message);

            window.open(
                url,
                "_blank"
            );

            return "Opening WhatsApp with your message ready.";
        }

        this.pendingMessageService =
            "whatsapp";

        this.pendingMessageRecipient =
            recipient;

        this.pendingMessageText =
            message;

        this.waitingForMessageInput =
            true;

        return `What is ${recipient}'s phone number?`;
    }

    const text = command
        .toLowerCase()
        .replace(/[.,!?]/g, "")
        .replace(/\s+/g, " ")
        .trim();
        if (
    text === "open email" ||
    text === "open gmail" ||
    text === "launch gmail" ||
    text === "start gmail"
) {
    window.open(
        "https://mail.google.com",
        "_blank"
    );

    return "Opening Gmail.";
}

    // =====================================================
    // APP / WEB CHOICE
    // =====================================================

    if (
        this.waitingForUserChoice &&
        this.pendingAppChoice
    ) {
        const app =
            this.pendingAppChoice;

        if (
            text === "desktop" ||
            text.includes("desktop app")
        ) {
            this.waitingForUserChoice = false;
            this.pendingAppChoice = null;

            return this.openDesktopApp(app);
        }

        if (
            text === "web" ||
            text === "website" ||
            text.includes("web version")
        ) {
            this.waitingForUserChoice = false;
            this.pendingAppChoice = null;

            const urls = {
                whatsapp:
                    "https://web.whatsapp.com",
                instagram:
                    "https://www.instagram.com",
                snapchat:
                    "https://www.snapchat.com",
                spotify:
                    "https://open.spotify.com",
                discord:
                    "https://discord.com",
                telegram:
                    "https://web.telegram.org",
                gmail:
                    "https://mail.google.com"
            };

            const url = urls[app];

            if (url) {
                window.open(url, "_blank");
                return `Opening ${app} Web.`;
            }

            return `I couldn't find the web version of ${app}.`;
        }

        return "Please say desktop or web.";
    }

    // =====================================================
    // WHATSAPP MESSAGE
    // =====================================================

    const whatsappMessage =
        text.match(
            /(?:open\s+)?whatsapp\s+(?:and\s+)?send\s+(?:a\s+)?message\s+to\s+(\+?\d{10,15})\s+(?:saying|that says|with the message)\s+(.+)/
        );

    if (whatsappMessage) {
        const phone =
            whatsappMessage[1].replace(/\D/g, "");

        const message =
            whatsappMessage[2].trim();

        const url =
            "https://wa.me/" +
            phone +
            "?text=" +
            encodeURIComponent(message);

        window.open(url, "_blank");

        return "Opening WhatsApp with your message ready.";
    }

    // =====================================================
    // WHATSAPP MESSAGE - "MESSAGE ... TO ..."
    // =====================================================

    const whatsappMessage2 =
        text.match(
            /(?:open\s+)?whatsapp\s+(?:and\s+)?(?:message|text)\s+(\+?\d{10,15})\s+(?:saying|that says|with the message)\s+(.+)/
        );

    if (whatsappMessage2) {
        const phone =
            whatsappMessage2[1].replace(/\D/g, "");

        const message =
            whatsappMessage2[2].trim();

        const url =
            "https://wa.me/" +
            phone +
            "?text=" +
            encodeURIComponent(message);

        window.open(url, "_blank");

        return "Opening WhatsApp with your message ready.";
    }

    // =====================================================
    // DIRECT WEB ACTION
    // =====================================================

    const webActionUrl =
        this.getWebActionUrl(command);
    
    if (webActionUrl) {
        window.open(
            webActionUrl,
            "_blank"
        );

        return "Opening it.";
    }
    

    // =====================================================
    // LOCAL WINDOWS AGENT
    // =====================================================

    try {
        const controller =
            new AbortController();

        const timeout =
            setTimeout(
                () => controller.abort(),
                1500
            );

        const localResponse =
            await fetch(
                "http://127.0.0.1:5050/command",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        session_id:
                            auraSessionId,

                        username:
                            auraUsername,

                        command:
                            command
                    }),

                    signal:
                        controller.signal
                }
            );

        clearTimeout(timeout);

        const localData =
            await localResponse.json();

        console.log(
            "LOCAL AGENT:",
            localData
        );

        if (localData.username) {
            auraUsername =
                localData.username;

            localStorage.setItem(
                "aura_username",
                auraUsername
            );
        }

        if (
            localResponse.ok &&
            localData.response
        ) {
            return String(
                localData.response
            );
        }

    } catch (error) {
        console.log(
            "Local Agent timeout/unavailable:",
            error
        );
    }

    // =====================================================
    // CLOUD AURA
    // =====================================================

    const AURA_API =
        window.AURA_API_URL ||
        "https://aura-ai-backend-cl7h.onrender.com";

    try {
        const response =
            await fetch(
                `${AURA_API}/command`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        session_id:
                            auraSessionId,

                        username:
                            auraUsername,

                        command:
                            command
                    })
                }
            );

        const data =
            await response.json();

        console.log(
            "CLOUD AURA:",
            data
        );

        if (data.username) {
            auraUsername =
                data.username;

            localStorage.setItem(
                "aura_username",
                auraUsername
            );
        }

        if (!response.ok) {
            throw new Error(
                data.error ||
                data.response ||
                `Server error ${response.status}`
            );
        }

        return String(
            data.response ||
            "I couldn't process that."
        );

    } catch (error) {
        console.error(
            "CLOUD AURA ERROR:",
            error
        );

        return "Sorry, I couldn't connect to AURA.";
    }
}

    // =========================================================
    // TEXT TO SPEECH
    // =========================================================

    speak(
        text
    ) {

        return new Promise(
            (resolve) => {

                this.isSpeaking =
                    true;

                // VERY IMPORTANT:
                // Microphone must be OFF
                // while AURA speaks.

                this.shouldListenAgain =
                    this.continuousMode;

                this.stopListening();

                this.updateStatus(
                    "AURA speaking..."
                );

                this.setCoreState(
                    "speaking"
                );

                if (
                    !window.speechSynthesis
                ) {

                    this.isSpeaking =
                        false;

                    resolve();

                    return;
                }

                window.speechSynthesis.cancel();

                const utterance =
                    new SpeechSynthesisUtterance(
                        text
                    );

                utterance.lang =
                    "en-US";

                // Smooth voice

                utterance.rate =
                    0.92;

                utterance.pitch =
                    0.88;

                utterance.volume =
                    1.0;

                const voices =
                    window.speechSynthesis
                        .getVoices();

                const preferred =
                    voices.find(
                        voice => {

                            const name =
                                voice.name
                                    .toLowerCase();

                            return (
                                name.includes(
                                    "david"
                                ) ||
                                name.includes(
                                    "guy"
                                ) ||
                                name.includes(
                                    "mark"
                                ) ||
                                name.includes(
                                    "ryan"
                                )
                            );
                        }
                    );

                if (preferred) {

                    utterance.voice =
                        preferred;
                }

                utterance.onend = () => {
    this.isSpeaking = false;

    this.setCoreState("idle");

    resolve();

    if (
        this.waitingForUserChoice ||
        this.waitingForMessageInput ||
        this.waitingForEmailInput
    ) {
        setTimeout(() => {
            if (
                !this.isSpeaking &&
                !this.isProcessing &&
                !this.isListening
            ) {
                this.startListening();
            }
        }, 200);
    }
};

                utterance.onerror =
                    () => {

                        this.isSpeaking =
                            false;

                        resolve();
                    };

                window.speechSynthesis.speak(
                    utterance
                );
            }
        );
    }

    // =========================================================
    // IDLE TIMER
    // =========================================================

    resetIdleTimer() {

        this.clearIdleTimer();

        if (
            !this.continuousMode
        ) {
            return;
        }

        if (
            this.wakeMode
        ) {
            return;
        }

        this.idleTimer =
            setTimeout(
                () => {

                    this.enterIdle();

                },
                this.IDLE_TIMEOUT
            );
    }

    // =========================================================
    // ENTER IDLE
    // =========================================================

    enterIdle() {

        if (
            !this.continuousMode
        ) {
            return;
        }

        if (
            this.isProcessing ||
            this.isSpeaking
        ) {
            return;
        }

        console.log(
            "AURA: 15 SECOND IDLE"
        );

        this.wakeMode =
            true;

        this.shouldListenAgain =
            true;

        this.clearIdleTimer();

        this.stopListening();

        this.updateStatus(
            'Idle — say "AURA"'
        );

        this.setCoreState(
            "idle"
        );

        // Start dedicated wake listener

        this.restartWakeListening();
    }

    // =========================================================
    // NEXT COMMAND LISTEN
    // =========================================================

    scheduleListening() {

        if (
            !this.continuousMode ||
            !this.shouldListenAgain ||
            this.wakeMode ||
            this.isProcessing ||
            this.isSpeaking ||
            this.isListening
        ) {
            return;
        }

        setTimeout(
            () => {

                if (
                    this.continuousMode &&
                    this.shouldListenAgain &&
                    !this.wakeMode &&
                    !this.isProcessing &&
                    !this.isSpeaking &&
                    !this.isListening
                ) {

                    this.startListening();
                }

            },
            300
        );
    }

    // =========================================================
    // CLEAR IDLE TIMER
    // =========================================================

    clearIdleTimer() {

        if (
            this.idleTimer
        ) {

            clearTimeout(
                this.idleTimer
            );

            this.idleTimer =
                null;
        }
    }

    // =========================================================
    // STATUS
    // =========================================================

    updateStatus(
        status
    ) {

        if (
            this.statusElement
        ) {

            this.statusElement.textContent =
                status;

            this.statusElement.classList.remove(
                "ready",
                "listening",
                "processing",
                "speaking",
                "idle"
            );

            const lower =
                status.toLowerCase();

            if (
                lower.includes(
                    "listening"
                )
            ) {

                this.statusElement.classList.add(
                    "listening"
                );

            } else if (
                lower.includes(
                    "processing"
                )
            ) {

                this.statusElement.classList.add(
                    "processing"
                );

            } else if (
                lower.includes(
                    "speaking"
                )
            ) {

                this.statusElement.classList.add(
                    "speaking"
                );

            } else if (
                lower.includes(
                    "idle"
                )
            ) {

                this.statusElement.classList.add(
                    "idle"
                );

            } else {

                this.statusElement.classList.add(
                    "ready"
                );
            }
        }

        console.log(
            "AURA STATUS:",
            status
        );
    }

    // =========================================================
    // MICROPHONE UI
    // =========================================================

    updateMicUI(
        active
    ) {

        if (
            this.micButton
        ) {

            this.micButton.setAttribute(
                "aria-pressed",
                active
                    ? "true"
                    : "false"
            );

            this.micButton.classList.toggle(
                "active",
                active
            );
        }

        if (
            this.micLabel
        ) {

            this.micLabel.textContent =
                active
                    ? "Mic ON"
                    : "Mic OFF";
        }
    }

    // =========================================================
    // CONTINUOUS UI
    // =========================================================

    updateContinuousUI(
        active
    ) {

        if (
            this.continuousButton
        ) {

            this.continuousButton.setAttribute(
                "aria-pressed",
                active
                    ? "true"
                    : "false"
            );

            this.continuousButton.classList.toggle(
                "active",
                active
            );
        }

        if (
            this.continuousLabel
        ) {

            this.continuousLabel.textContent =
                active
                    ? "Continuous ON"
                    : "Continuous OFF";
        }
    }

    // =========================================================
    // COMMAND
    // =========================================================

    showCommand(
        text
    ) {

        if (
            !this.commandElement
        ) {
            return;
        }

        this.commandElement.textContent =
            text;

        const commandBlock =
            this.commandElement?.closest(".message-block");

        if (commandBlock) {

            commandBlock.classList.remove(
                "command-received"
            );

            void commandBlock.offsetWidth;

            commandBlock.classList.add(
                "command-received"
            );
        }

        this.commandElement.classList.remove(
            "updated"
        );

        const messageBlock =
            this.commandElement.closest(
                ".message-block"
            );

        if (messageBlock) {

            messageBlock.classList.remove(
                "active"
            );

            void messageBlock.offsetWidth;

            messageBlock.classList.add(
                "active"
            );

            setTimeout(() => {

                messageBlock.classList.remove(
                    "active"
                );

            }, 1200);
        }

        void this.commandElement.offsetWidth;

        this.commandElement.classList.add(
            "updated"
        );
    }

    // =========================================================
    // RESPONSE
    // =========================================================

    showResponse(
        text
    ) {

        if (
            !this.responseElement
        ) {
            return;
        }

        this.responseElement.textContent =
            text;

        this.responseElement.classList.remove(
            "response-reveal"
        );

        void this.responseElement.offsetWidth;

        this.responseElement.classList.add(
            "response-reveal"
        );

        this.responseElement.classList.remove(
            "updated"
        );

        const messageBlock =
            this.responseElement.closest(
                ".message-block"
            );

        if (messageBlock) {

            messageBlock.classList.remove(
                "active"
            );

            void messageBlock.offsetWidth;

            messageBlock.classList.add(
                "active"
            );

            setTimeout(() => {

                messageBlock.classList.remove(
                    "active"
                );

            }, 1200);
        }

        void this.responseElement.offsetWidth;

        this.responseElement.classList.add(
            "updated"
        );
    }

    // =========================================================
    // STEP 26 — AURA SOUND LAYER
    // =========================================================

    initSoundSystem() {

        this.audioContext = null;
    }

    ensureAudioContext() {

        if (!this.audioContext) {

            this.audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();
        }

        if (
            this.audioContext.state ===
            "suspended"
        ) {

            this.audioContext.resume();
        }
    }

    playAuraTone(
        frequency = 440,
        duration = 0.08,
        volume = 0.025,
        type = "sine"
    ) {

        this.ensureAudioContext();

        const ctx =
            this.audioContext;

        const oscillator =
            ctx.createOscillator();

        const gain =
            ctx.createGain();

        oscillator.type = type;

        oscillator.frequency.setValueAtTime(
            frequency,
            ctx.currentTime
        );

        gain.gain.setValueAtTime(
            0.0001,
            ctx.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            volume,
            ctx.currentTime + 0.015
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            ctx.currentTime + duration
        );

        oscillator.connect(gain);

        gain.connect(
            ctx.destination
        );

        oscillator.start();

        oscillator.stop(
            ctx.currentTime + duration + 0.02
        );
    }

    // =========================================================
    // CORE
    // =========================================================

    setCoreState(
        state
    ) {

        if (!this.core) {
            return;
        }

        const previousState =
            this.currentCoreState;

        this.currentCoreState =
            state;

        if (state === "listening") {

            this.playAuraTone(
                520,
                0.07,
                0.018
            );
        }

        if (state === "processing") {

            this.playAuraTone(
                330,
                0.10,
                0.015
            );
        }

        if (state === "speaking") {

            this.playAuraTone(
                660,
                0.09,
                0.018
            );
        }

        if (
            previousState === "speaking" &&
            state === "idle"
        ) {

            this.playAuraTone(
                780,
                0.12,
                0.018
            );
        }

        this.core.classList.remove(
            "listening",
            "processing",
            "speaking",
            "idle"
        );

        if (
            state &&
            state !== "ready"
        ) {

            this.core.classList.add(
                state
            );
        }

        if (
            state === "processing" &&
            previousState !== "processing"
        ) {

            this.createAuraParticles();
        }

        if (
            state === "speaking" &&
            previousState === "processing"
        ) {

            if (
                this.auraParticleSystem
            ) {
                this.auraParticleSystem.running =
                    true;
            }
        }

        if (
            (
                previousState === "processing" ||
                previousState === "speaking"
            ) &&
            state !== "processing" &&
            state !== "speaking"
        ) {

            this.removeAuraParticles();
        }
    }

    // =========================================================
    // AURA 3D SPEAKING SPHERE
    // =========================================================

    createAuraParticles() {

        const core =
            document.getElementById("auraCore");

        if (!core) {
            return;
        }

        this.removeAuraParticles(true);

        const container =
            document.createElement("div");

        container.className =
            "aura-particles";

        const particleCount = 64;

        const radius = 92;

        const particles = [];

        for (
            let i = 0;
            i < particleCount;
            i++
        ) {

            const particle =
                document.createElement("span");

            particle.className =
                "aura-particle";

            const phi =
                Math.acos(
                    1 -
                    (2 * (i + 0.5)) /
                    particleCount
                );

            const theta =
                Math.PI *
                (1 + Math.sqrt(5)) *
                i;

            const x =
                radius *
                Math.sin(phi) *
                Math.cos(theta);

            const y =
                radius *
                Math.cos(phi);

            const z =
                radius *
                Math.sin(phi) *
                Math.sin(theta);

            particles.push({
                element: particle,
                x,
                y,
                z,
                baseX: x,
                baseY: y,
                baseZ: z
            });

            particle.style.setProperty(
                "--size",
                "6px"
            );

            particle.style.setProperty(
                "--opacity",
                "1"
            );

            container.appendChild(
                particle
            );

            particle.style.transform =
                "translate3d(0, 0, 0) scale(0.15)";

            particle.style.opacity = "0";
        }

        core.appendChild(container);

        requestAnimationFrame(() => {

            for (
                const particle
                of particles
            ) {

                const element =
                    particle.element;

                element.style.transition =
                    "transform 0.65s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.45s ease";

                element.style.transform =
                    `translate3d(
                        ${particle.baseX}px,
                        ${particle.baseY}px,
                        ${particle.baseZ}px
                    ) scale(1)`;

                element.style.opacity =
                    "1";
            }

        });

        this.auraParticleSystem = {
            container,
            particles,
            radius,
            angle: 0,
            running: true,
            lastTime: performance.now()
        };

        this.animateAuraSphere();
    }

    animateAuraSphere() {

        const system =
            this.auraParticleSystem;

        if (
            !system ||
            !system.container
        ) {
            return;
        }

        if (
            !system.running
        ) {
            return;
        }

        const now =
            performance.now();

        const delta =
            Math.min(
                now - system.lastTime,
                40
            );

        system.lastTime =
            now;

        system.angle +=
            delta * 0.00055;

        const angle =
            system.angle;

        const sin =
            Math.sin(angle);

        const cos =
            Math.cos(angle);

        for (
            const particle
            of system.particles
        ) {

            const x =
                particle.baseX;

            const y =
                particle.baseY;

            const z =
                particle.baseZ;

            const rotatedX =
                x * cos -
                z * sin;

            const rotatedZ =
                x * sin +
                z * cos;

            const depth =
                (
                    rotatedZ +
                    system.radius
                ) /
                (
                    system.radius * 2
                );

            const scale =
                0.48 +
                depth * 0.95;
            const size =
                3.5+
                depth * 6;    

            const opacity =
                0.28 +
                depth * 0.72;

            particle.element.style.transform =
                `translate3d(
                    ${rotatedX}px,
                    ${y}px,
                    ${rotatedZ}px
                ) scale(${scale})`;

            particle.element.style.opacity =
                opacity;

            const glow =
                6  +
                depth * 16;

            const brightness =
                0.45 +
                depth * 1.15;

            particle.element.style.filter =
                `brightness(${brightness})
                    drop-shadow(
                     0 0 ${glow}px
                       rgba(85, 199, 255, 0.75)
     )`;
        }

        system.animationFrame =
            requestAnimationFrame(
                () => this.animateAuraSphere()
            );
    }

    removeAuraParticles(
        immediate = false
    ) {

        const system =
            this.auraParticleSystem;

        if (!system) {
            return;
        }

        system.running =
            false;

        if (system.animationFrame) {

            cancelAnimationFrame(
                system.animationFrame
            );
        }

        const particles =
            system.container;

        if (!particles) {
            return;
        }

        if (immediate) {

            particles.remove();

            this.auraParticleSystem =
                null;

            return;
        }

        particles.classList.add(
            "returning"
        );

        setTimeout(() => {

            if (
                particles &&
                particles.parentNode
            ) {

                particles.remove();

            }

            this.auraParticleSystem =
                null;

        }, 700);
    }

    // =========================================================
    // TEXT COMMAND UI
    // =========================================================

    setupTextCommand() {

        this.textCommandToggle =
            document.getElementById("textCommandToggle");

        this.textCommandPanel =
            document.getElementById("textCommandPanel");

        this.textCommandInput =
            document.getElementById("textCommandInput");

        this.sendTextCommandButton =
            document.getElementById("sendTextCommand");

        this.closeTextCommandButton =
            document.getElementById("closeTextCommand");

        if (
            !this.textCommandToggle ||
            !this.textCommandPanel ||
            !this.textCommandInput
        ) {
            return;
        }

        const showPanel = () => {

            this.textCommandPanel.classList.add(
                "visible"
            );

            this.textCommandPanel.setAttribute(
                "aria-hidden",
                "false"
            );

            this.textCommandToggle.setAttribute(
                "aria-expanded",
                "true"
            );

            setTimeout(() => {

                this.textCommandInput.focus();

            }, 100);
        };

        const hidePanel = () => {

            this.textCommandPanel.classList.remove(
                "visible"
            );

            this.textCommandPanel.setAttribute(
                "aria-hidden",
                "true"
            );

            this.textCommandToggle.setAttribute(
                "aria-expanded",
                "false"
            );
        };

        const sendTextCommand = async () => {

            const command =
                this.textCommandInput.value.trim();

            if (
                !command ||
                this.isProcessing ||
                this.isSpeaking
            ) {
                return;
            }

            this.textCommandInput.value = "";

            this.showCommand(
                command
            );

            hidePanel();

            await this.processCommand(
                command
            );
        };

        this.textCommandToggle.addEventListener(
            "click",
            () => {

                if (
                    this.textCommandPanel.classList.contains(
                        "visible"
                    )
                ) {

                    hidePanel();

                } else {

                    showPanel();

                }

            }
        );

        if (
            this.sendTextCommandButton
        ) {

            this.sendTextCommandButton.addEventListener(
                "click",
                sendTextCommand
            );

        }

        if (
            this.closeTextCommandButton
        ) {

            this.closeTextCommandButton.addEventListener(
                "click",
                hidePanel
            );

        }

        this.textCommandInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    sendTextCommand();

                }

                if (
                    event.key === "Escape"
                ) {

                    event.preventDefault();

                    hidePanel();

                }

            }
        );
    }

    // =========================================================
    // VOICES
    // =========================================================

    loadVoices() {

        if (
            window.speechSynthesis
        ) {

            window.speechSynthesis
                .getVoices();
        }
    }

    setupVoiceSettings() {

        this.voiceSelect =
            document.getElementById(
                "voiceSelect"
            );

        this.testVoiceButton =
            document.getElementById(
                "testVoiceButton"
            );

        if (
            !this.voiceSelect
        ) {
            return;
        }

        const load =
            () => {

                const voices =
                    window.speechSynthesis
                        .getVoices();

                this.voiceSelect.innerHTML =
                    "";

                const englishVoices =
                    voices.filter(
                        voice =>
                            voice.lang
                                .toLowerCase()
                                .startsWith(
                                    "en"
                                )
                    );

                englishVoices.forEach(
                    voice => {

                        const option =
                            document.createElement(
                                "option"
                            );

                        option.value =
                            voice.name;

                        option.textContent =
                            `${voice.name} — ${voice.lang}`;

                        this.voiceSelect
                            .appendChild(
                                option
                            );
                    }
                );

                const preferred =
                    englishVoices.find(
                        voice => {

                            const name =
                                voice.name
                                    .toLowerCase();

                            return (
                                name.includes(
                                    "david"
                                ) ||
                                name.includes(
                                    "guy"
                                ) ||
                                name.includes(
                                    "mark"
                                ) ||
                                name.includes(
                                    "ryan"
                                )
                            );
                        }
                    );

                if (preferred) {

                    this.voiceSelect.value =
                        preferred.name;
                }
            };

        load();

        window.speechSynthesis
            .addEventListener(
                "voiceschanged",
                load
            );

        if (
            this.testVoiceButton
        ) {

            this.testVoiceButton
                .addEventListener(
                    "click",
                    () => {

                        this.testVoice(
                            this.voiceSelect.value
                        );
                    }
                );
        }
    }

    // =========================================================
    // TEST VOICE
    // =========================================================

    testVoice(
        voiceName
    ) {

        const voices =
            window.speechSynthesis
                .getVoices();

        const voice =
            voices.find(
                item =>
                    item.name ===
                    voiceName
            );

        const utterance =
            new SpeechSynthesisUtterance(
                "Hello Ashok. I am AURA. Voice system is ready."
            );

        utterance.rate =
            0.92;

        utterance.pitch =
            0.88;

        utterance.volume =
            1.0;

        if (voice) {

            utterance.voice =
                voice;
        }

        window.speechSynthesis.cancel();

        window.speechSynthesis.speak(
            utterance
        );
    }
}


// ============================================================
// START AURA
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        window.auraVoice =
            new AuraVoiceController();

        console.log(
            "AURA INITIALIZED"
        );
    }
);


/* =========================================================
   AURA CURSOR ENERGY
   ========================================================= */

(function initAuraCursor() {

    const glow =
        document.createElement("div");

    glow.className =
        "aura-cursor-glow";

    document.body.appendChild(glow);

    let timeout;

    document.addEventListener(
        "mousemove",
        (event) => {

            glow.style.left =
                `${event.clientX}px`;

            glow.style.top =
                `${event.clientY}px`;

            glow.classList.add(
                "visible"
            );

            clearTimeout(timeout);

            timeout = setTimeout(() => {

                glow.classList.remove(
                    "visible"
                );

            }, 350);
        }
    );

})();
/* =========================================================
   AURA — REAL 3D HOLOGRAM GLOBE
   ========================================================= */

/* =========================================================
    AURA — FINAL 3D HOLOGRAPHIC EARTH
    READY / IDLE ONLY

    Processing  -> particle sphere
    Speaking    -> particle sphere
    Ready/Idle  -> rotating holographic Earth
    ========================================================= */

function startAuraHolographicEarth() {

    const canvas =
        document.getElementById("auraGlobe");

    if (!canvas) {
        return;
    }

    const ctx =
        canvas.getContext("2d");

    if (!ctx) {
        return;
    }

    const SIZE = 520;

    canvas.width = SIZE;
    canvas.height = SIZE;

    const W = SIZE;
    const H = SIZE;

    const cx = W / 2;
    const cy = H / 2;

    const R = 175;

    let rotation = 0;


    /* =====================================================
       EARTH LAND STRUCTURE
       Longitude / Latitude
       ===================================================== */

    const continents = [

        /* North America */
        [
            [-168, 72],
            [-145, 70],
            [-130, 67],
            [-120, 60],
            [-112, 58],
            [-105, 50],
            [-96, 50],
            [-90, 48],
            [-83, 46],
            [-78, 40],
            [-74, 43],
            [-67, 47],
            [-60, 52],
            [-63, 58],
            [-76, 60],
            [-90, 68],
            [-110, 72],
            [-135, 74],
            [-168, 72]
        ],

        /* Central America */
        [
            [-90, 20],
            [-86, 17],
            [-84, 12],
            [-80, 10],
            [-77, 8],
            [-79, 5],
            [-84, 8],
            [-88, 14],
            [-90, 20]
        ],

        /* South America */
        [
            [-81, 12],
            [-74, 9],
            [-66, 7],
            [-58, 5],
            [-51, 2],
            [-47, -5],
            [-44, -15],
            [-47, -24],
            [-52, -32],
            [-57, -42],
            [-62, -52],
            [-68, -55],
            [-72, -48],
            [-73, -38],
            [-76, -28],
            [-79, -18],
            [-81, -5],
            [-81, 12]
        ],

        /* Europe */
        [
            [-10, 36],
            [-5, 43],
            [5, 43],
            [12, 47],
            [20, 48],
            [28, 54],
            [35, 58],
            [30, 65],
            [20, 68],
            [8, 63],
            [-2, 58],
            [-10, 52],
            [-10, 36]
        ],

        /* Africa */
        [
            [-17, 35],
            [-5, 37],
            [8, 35],
            [20, 32],
            [32, 25],
            [38, 12],
            [42, 0],
            [35, -12],
            [30, -23],
            [23, -34],
            [14, -35],
            [5, -30],
            [-2, -20],
            [-8, -5],
            [-14, 10],
            [-17, 35]
        ],

        /* Asia */
        [
            [30, 70],
            [48, 72],
            [65, 75],
            [85, 72],
            [105, 68],
            [125, 62],
            [145, 55],
            [160, 50],
            [170, 42],
            [150, 35],
            [135, 30],
            [120, 25],
            [105, 20],
            [90, 22],
            [75, 28],
            [62, 35],
            [50, 42],
            [40, 50],
            [30, 60],
            [30, 70]
        ],

        /* India / Southeast Asia */
        [
            [68, 25],
            [77, 30],
            [85, 27],
            [90, 20],
            [87, 10],
            [80, 7],
            [75, 15],
            [68, 25]
        ],

        /* Australia */
        [
            [112, -11],
            [125, -12],
            [140, -15],
            [153, -20],
            [155, -29],
            [145, -38],
            [132, -40],
            [118, -35],
            [112, -25],
            [112, -11]
        ]

    ];


    /* =====================================================
       PROJECT LAT/LON → 3D SPHERE
       ===================================================== */

    function project(
        lon,
        lat
    ) {

        const lonRad =
            lon * Math.PI / 180;

        const latRad =
            lat * Math.PI / 180;

        const x =
            Math.cos(latRad) *
            Math.sin(lonRad);

        const y =
            Math.sin(latRad);

        const z =
            Math.cos(latRad) *
            Math.cos(lonRad);


        /* Rotate Earth around Y axis */

        const rx =
            x * Math.cos(rotation) +
            z * Math.sin(rotation);

        const rz =
            -x * Math.sin(rotation) +
            z * Math.cos(rotation);


        return {

            x:
                cx + rx * R,

            y:
                cy - y * R,

            z:
                rz

        };

    }


    /* =====================================================
       DRAW GRID
       ===================================================== */

    function drawGrid() {

        ctx.save();

        ctx.lineWidth = 0.65;

        ctx.shadowBlur = 7;

        ctx.shadowColor =
            "rgba(45,210,255,0.65)";


        /* Latitude */

        for (
            let lat = -75;
            lat <= 75;
            lat += 15
        ) {

            let first = true;

            ctx.beginPath();

            for (
                let lon = -180;
                lon <= 180;
                lon += 3
            ) {

                const p =
                    project(
                        lon,
                        lat
                    );

                if (p.z > 0) {

                    if (first) {

                        ctx.moveTo(
                            p.x,
                            p.y
                        );

                        first = false;

                    } else {

                        ctx.lineTo(
                            p.x,
                            p.y
                        );

                    }

                } else {

                    first = true;

                }

            }

            ctx.strokeStyle =
                "rgba(55,210,255,0.42)";

            ctx.stroke();

        }


        /* Longitude */

        for (
            let lon = -180;
            lon < 180;
            lon += 15
        ) {

            let first = true;

            ctx.beginPath();

            for (
                let lat = -90;
                lat <= 90;
                lat += 3
            ) {

                const p =
                    project(
                        lon,
                        lat
                    );

                if (p.z > 0) {

                    if (first) {

                        ctx.moveTo(
                            p.x,
                            p.y
                        );

                        first = false;

                    } else {

                        ctx.lineTo(
                            p.x,
                            p.y
                        );

                    }

                } else {

                    first = true;

                }

            }

            ctx.strokeStyle =
                "rgba(40,190,255,0.36)";

            ctx.stroke();

        }

        ctx.restore();

    }


    /* =====================================================
       DRAW CONTINENTS
       ===================================================== */

    function drawContinents() {

        ctx.save();

        ctx.lineWidth = 1.7;

        ctx.shadowBlur = 14;

        ctx.shadowColor =
            "rgba(65,225,255,0.95)";


        for (
            const continent
            of continents
        ) {

            for (
                let i = 0;
                i < continent.length - 1;
                i++
            ) {

                const a =
                    project(
                        continent[i][0],
                        continent[i][1]
                    );

                const b =
                    project(
                        continent[i + 1][0],
                        continent[i + 1][1]
                    );


                if (
                    a.z > 0 &&
                    b.z > 0
                ) {

                    ctx.beginPath();

                    ctx.moveTo(
                        a.x,
                        a.y
                    );

                    ctx.lineTo(
                        b.x,
                        b.y
                    );

                    ctx.strokeStyle =
                        "rgba(105,235,255,0.95)";

                    ctx.stroke();

                }

            }

        }

        ctx.restore();

    }


    /* =====================================================
       EARTH CITY LIGHTS
       ===================================================== */

    const lights = [];

    for (
        let i = 0;
        i < 260;
        i++
    ) {

        lights.push({

            lon:
                -180 +
                Math.random() * 360,

            lat:
                -55 +
                Math.random() * 110

        });

    }


    function drawLights() {

        ctx.save();

        for (
            const light
            of lights
        ) {

            const p =
                project(
                    light.lon,
                    light.lat
                );

            if (p.z > 0.08) {

                const alpha =
                    0.18 +
                    p.z * 0.7;

                const size =
                    0.45 +
                    p.z * 1.15;

                ctx.beginPath();

                ctx.arc(
                    p.x,
                    p.y,
                    size,
                    0,
                    Math.PI * 2
                );

                ctx.fillStyle =
                    `rgba(
                        130,
                        240,
                        255,
                        ${alpha}
                    )`;

                ctx.shadowBlur = 8;

                ctx.shadowColor =
                    "rgba(65,220,255,0.95)";

                ctx.fill();

            }

        }

        ctx.restore();

    }


    /* =====================================================
       ATMOSPHERE
       ===================================================== */

    function drawAtmosphere() {

        const gradient =
            ctx.createRadialGradient(
                cx - 42,
                cy - 45,
                15,
                cx,
                cy,
                R + 18
            );

        gradient.addColorStop(
            0,
            "rgba(40,190,255,0.08)"
        );

        gradient.addColorStop(
            0.7,
            "rgba(20,130,255,0.10)"
        );

        gradient.addColorStop(
            1,
            "rgba(0,80,255,0)"
        );

        ctx.beginPath();

        ctx.arc(
            cx,
            cy,
            R + 10,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            gradient;

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            cx,
            cy,
            R,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle =
            "rgba(100,235,255,0.92)";

        ctx.lineWidth = 2;

        ctx.shadowBlur = 20;

        ctx.shadowColor =
            "rgba(45,210,255,0.95)";

        ctx.stroke();

    }


    /* =====================================================
       ANIMATION
       ===================================================== */

    function animate() {

        ctx.clearRect(
            0,
            0,
            W,
            H
        );

        drawAtmosphere();

        drawGrid();

        drawContinents();

        drawLights();


        /* Full 360° continuous rotation */
        rotation += 0.0045;

        if (
            rotation >=
            Math.PI * 2
        ) {

            rotation -=
                Math.PI * 2;

        }


        requestAnimationFrame(
            animate
        );

    }


    animate();

}


/* Start holographic globe */
document.addEventListener(
    "DOMContentLoaded",
    () => {

        startAuraHolographicEarth();

    }
);
