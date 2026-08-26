// ============================================================
// AURA AI - FINAL VOICE CONTROLLER
// ============================================================

let auraUsername = localStorage.getItem("aura_username") || "";
const AURA_USER_COLORS = {
    default: "#55c7ff",
    ashuk: "#8b5cf6",
    ashok: "#22d3ee"
};



let auraSessionId =
    localStorage.getItem("aura_session_id");

if (!auraSessionId) {
    auraSessionId = crypto.randomUUID();

    localStorage.setItem(
        "aura_session_id",
        auraSessionId
    );
}
function applyUserAuraColor(username) {
    const root = document.documentElement;

    const key =
        "aura_interface_color_" +
        (
            username &&
            String(username).trim()
        )
            ? String(username).trim().toLowerCase()
            : "guest";

    const themes = {
        blue: {
            color: "#28d7ff",
            glow: "#28d7ff99",
            soft: "#28d7ff33",
            hue: "0deg"
        },
        red: {
            color: "#ff3b4f",
            glow: "#ff3b4f99",
            soft: "#ff3b4f33",
            hue: "-170deg"
        },
        green: {
            color: "#00f06a",
            glow: "#00f06a99",
            soft: "#00f06a33",
            hue: "-65deg"
        },
        pink: {
           color: "#ff4fd8",
           glow: "#ff4fd899",
           soft: "#ff4fd833",
           hue: "0deg"
        }
    };

    const saved =
        localStorage.getItem(key);

    const theme =
        themes[saved] || themes.blue;

    root.style.setProperty(
        "--aura-user-color",
        theme.color
    );

    root.style.setProperty(
        "--aura-user-glow",
        theme.glow
    );

    root.style.setProperty(
        "--aura-user-soft",
        theme.soft
    );

    root.style.setProperty(
        "--aura-hue",
        theme.hue
    );
}
// ============================================================
// AURA COLOR — FINAL WORKING VERSION
// Accepts both color names AND HEX values
// ============================================================

window.auraSetColor = function (color) {

    const themes = {

        blue: {
            color: "#28d7ff",
            glow: "#28d7ff99",
            soft: "#28d7ff33",
            hue: "0deg"
        },

        red: {
            color: "#ff4055",
            glow: "#ff405599",
            soft: "#ff405533",
            hue: "-165deg"
        },

        green: {
            color: "#19ed78",
            glow: "#19ed7899",
            soft: "#19ed7833",
            hue: "-65deg"
        },

        pink: {
            color: "#ff4fd8",
            glow: "#ff4fd899",
            soft: "#ff4fd833",
            hue: "0deg"
        }
    };

    // If HEX was supplied, convert it to the theme name
    const hexToTheme = {
        "#28d7ff": "blue",
        "#ef4444": "red",
        "#ff4055": "red",
        "#22c55e": "green",
        "#19ed78": "green",
        "#ec4899": "pink",
        "#ff4fd8": "pink"
    };

    color = String(color || "").toLowerCase().trim();

    const themeName =
        themes[color]
            ? color
            : hexToTheme[color];

    const theme =
        themes[themeName];

    if (!theme) {
        console.warn("AURA: unsupported color:", color);
        return false;
    }

    const root =
        document.documentElement;

    // Apply CSS variables
    root.style.setProperty(
        "--aura-user-color",
        theme.color
    );

    root.style.setProperty(
        "--aura-user-glow",
        theme.glow
    );

    root.style.setProperty(
        "--aura-user-soft",
        theme.soft
    );

    root.style.setProperty(
        "--aura-hue",
        theme.hue
    );

    // Save selected color
    const user =
        auraUsername ||
        "guest";

    localStorage.setItem(
        "aura_interface_color_" +
        user.trim().toLowerCase(),
        themeName
    );

    localStorage.setItem(
        "aura_current_color",
        themeName
    );

    // Force repaint
    root.dataset.auraColor =
        themeName;

    // Update existing particles immediately
    document
        .querySelectorAll(".aura-particle")
        .forEach(particle => {

            particle.style.setProperty(
                "--aura-particle-color",
                theme.color
            );

            particle.style.filter =
                `brightness(1.4)
                 drop-shadow(
                    0 0 12px ${theme.color}
                 )`;
        });

    console.log(
        "AURA COLOR CHANGED:",
        themeName,
        theme.color
    );

    return true;
};
/* =========================================================
   AURA LOCAL MEMORY
   ========================================================= */

function auraRemember(text) {

    const memories =
        JSON.parse(
            localStorage.getItem(
                "aura_memories"
            ) || "[]"
        );

    memories.push({
        text: String(text).trim(),
        time: Date.now()
    });

    localStorage.setItem(
        "aura_memories",
        JSON.stringify(memories)
    );
}


function auraRecall() {

    const memories =
        JSON.parse(
            localStorage.getItem(
                "aura_memories"
            ) || "[]"
        );

    if (!memories.length) {

        return (
            "I don't have any saved memories yet."
        );
    }

    return memories
        .slice(-10)
        .map(memory => memory.text)
        .join(". ");
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

        applyUserAuraColor(auraUsername);
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

            console.error(
                "Speech recognition is not supported."
            );

            this.updateStatus(
                "Speech recognition unavailable"
            );

            return;
        }

        this.recognition =
            new SpeechRecognition();

        this.recognition.lang =
            "en-US";

        this.recognition.continuous =
            false;

        this.recognition.interimResults =
            false;

        this.recognition.maxAlternatives =
            1;

        // =====================================================
        // RESULT
        // =====================================================

        this.recognition.onresult =
            async (event) => {

                const result =
                    event.results[
                        event.results.length - 1
                    ];

                if (
                    !result ||
                    !result[0]
                ) {
                    return;
                }

                const text =
                    result[0]
                        .transcript
                        .trim();

                if (!text) {
                    return;
                }

                console.log(
                    "AURA HEARD:",
                    text
                );

                // =================================================
                // WAKE MODE
                // =================================================

                if (this.wakeMode) {

                    const lower =
                        text
                            .toLowerCase()
                            .trim();

                    const wakeWords = [
                        "aura",
                        "hey aura",
                        "hello aura"
                    ];

                    const isWakeWord =
                        wakeWords.some(
                            word =>
                                lower === word ||
                                lower.includes(word)
                        );

                    // ---------------------------------------------
                    // Ignore normal conversation
                    // ---------------------------------------------

                    if (!isWakeWord) {

                        console.log(
                            "AURA WAKE: ignored:",
                            text
                        );

                        this.restartWakeListening();

                        return;
                    }

                    // ---------------------------------------------
                    // WAKE AURA
                    // ---------------------------------------------

                    this.wakeMode =
                        false;

                    this.shouldListenAgain =
                        true;

                    this.clearIdleTimer();

                    this.showCommand(
                        text
                    );

                    this.stopListening();

                    await this.speak(
                        "Yes, Ashok?"
                    );

                    if (
                        this.continuousMode
                    ) {

                        this.scheduleListening();

                    } else {

                        this.updateStatus(
                            "Ready"
                        );
                    }

                    return;
                }

                // =================================================
                // NORMAL COMMAND
                // =================================================

                this.showCommand(
                    text
                );

                this.stopListening();

                this.clearIdleTimer();

                await this.processCommand(
                    text
                );
            };

        // =====================================================
// RECOGNITION END
// =====================================================

this.recognition.onend =
    () => {

        console.log(
            "AURA MIC: recognition ended"
        );

        this.isListening =
            false;

        this.updateMicUI(false);

        // ---------------------------------------------
        // Wake mode
        // ---------------------------------------------

        if (
            this.wakeMode &&
            this.continuousMode &&
            !this.isProcessing &&
            !this.isSpeaking
        ) {

            this.restartWakeListening();

            return;
        }

        // ---------------------------------------------
        // Continuous command mode
        // ---------------------------------------------

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

        // ---------------------------------------------
        // Normal microphone
        // ---------------------------------------------

        this.updateStatus(
            "Ready"
        );
    };


// =====================================================
// SPEECH RECOGNITION ERROR
// =====================================================

this.recognition.onerror = (event) => {

    console.error(
        "AURA MIC ERROR:",
        event.error
    );

    this.isListening = false;

    this.updateMicUI(false);

    // ---------------------------------------------
    // Microphone permission denied
    // ---------------------------------------------

    if (event.error === "not-allowed") {

        this.shouldListenAgain = false;

        this.updateStatus(
            "Microphone permission denied"
        );

        return;
    }

    // ---------------------------------------------
    // Microphone unavailable
    // ---------------------------------------------

    if (event.error === "audio-capture") {

        this.shouldListenAgain = false;

        this.updateStatus(
            "Microphone unavailable"
        );

        return;
    }

    // ---------------------------------------------
    // Speech service unavailable
    // ---------------------------------------------

    if (event.error === "service-not-allowed") {

        this.shouldListenAgain = false;

        this.updateStatus(
            "Microphone service unavailable"
        );

        return;
    }

    // ---------------------------------------------
    // No speech
    // ---------------------------------------------

    if (event.error === "no-speech") {

        console.log(
            "AURA MIC: no speech detected"
        );

        return;
    }

    // ---------------------------------------------
    // Aborted
    //
    // IMPORTANT:
    // Do NOT disable continuous mode here.
    // onend() will decide whether to restart.
    // ---------------------------------------------

    if (event.error === "aborted") {

        console.log(
            "AURA MIC: recognition aborted"
        );

        return;
    }

    // ---------------------------------------------
    // Other errors
    // ---------------------------------------------

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

        // =====================================================
        // NORMAL MICROPHONE
        // =====================================================

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

                        this.shouldListenAgain =
                            false;

                        this.wakeMode =
                            false;

                        this.stopListening();

                        this.updateStatus(
                            "Ready"
                        );

                        return;
                    }

                    this.startNormalMode();
                }
            );
        }

        // =====================================================
        // CONTINUOUS
        // =====================================================

        if (
            this.continuousButton
        ) {

            this.continuousButton.addEventListener(
                "click",
                () => {

                    if (
                        this.continuousMode
                    ) {

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

        if (this.isListening) {
            return;
        }

        if (this.isProcessing) {
            return;
        }

        if (this.isSpeaking) {
            return;
        }

        if (this.startTimer) {

            clearTimeout(
                this.startTimer
            );

            this.startTimer =
                null;
        }

        this.startTimer =
            setTimeout(
                () => {

                    try {

                        this.isListening =
                            true;

                        this.updateMicUI(
                            true
                        );

                        this.setCoreState(
                            "listening"
                        );

                        this.updateStatus(
                            "Listening..."
                        );

                        this.recognition.start();

                        if (
                            this.continuousMode &&
                            !this.wakeMode
                        ) {

                            this.resetIdleTimer();
                        }

                    } catch (error) {

                        console.error(
                            "MIC START ERROR:",
                            error
                        );

                        this.isListening =
                            false;

                        this.updateMicUI(
                            false
                        );

                    }

                },
                200
            );
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
   handleColorCommand(command) {

    const text =
        String(command || "")
            .toLowerCase()
            .trim();

    /*
     * Supports:
     *
     * change color to red
     * change colour to red
     * color to red
     * colour to red
     * change interface color to pink
     * change interface colour to green
     */

    const match = text.match(
        /(?:change\s+)?(?:the\s+)?(?:interface\s+)?colou?r\s+(?:to\s+)?([a-z]+)/
    );

    if (!match) {
        return null;
    }


    const colors = {

        blue: "#28d7ff",

        red: "#ef4444",

        green: "#22c55e",

        pink: "#ec4899"

    };


    const requestedColor =
        match[1];


    const color =
        colors[requestedColor];


    /* =========================
       UNSUPPORTED COLOR
    ========================== */

    if (!color) {

        return (
            "I don't have that color. " +
            "I currently support blue, red, green, and pink."
        );
    }


    /* =========================
       APPLY COLOR
    ========================== */

    if (
        typeof window.auraSetColor ===
        "function"
    ) {

        window.auraSetColor(color);

    }


    /* =========================
       FORCE CSS VARIABLES
       ========================== */

    const root =
        document.documentElement;


    root.style.setProperty(
        "--aura-user-color",
        color
    );


    root.style.setProperty(
        "--aura-user-glow",
        color + "99"
    );


    root.style.setProperty(
        "--aura-user-soft",
        color + "33"
    );


    /* =========================
       SAVE COLOR
    ========================== */

    localStorage.setItem(
        "aura_current_color",
        requestedColor
    );


    console.log(
        "AURA COLOR CHANGED:",
        requestedColor
    );


    return (
        `I've changed the interface color to ${requestedColor}.`
    );
}
    
    async processCommand(
        command
    ) {
/* =========================================================
   VOICE ZOOM COMMANDS
   ========================================================= */

if (
    /\b(zoom\s*in|zoomin)\b/i.test(command)
) {

    if (
        typeof window.auraZoomIn ===
        "function"
    ) {

        window.auraZoomIn();

    }

    this.showResponse(
        "Zooming in."
    );

    return;
}


if (
    /\b(zoom\s*out|zoomout)\b/i.test(command)
) {

    if (
        typeof window.auraZoomOut ===
        "function"
    ) {

        window.auraZoomOut();

    }

    this.showResponse(
        "Zooming out."
    );

    return;
}
/* =========================================================
   MEMORY COMMANDS
   ========================================================= */

const rememberMatch =
    command.match(
        /^(?:remember|remember that|remember me that)\s+(.+)/i
    );


if (rememberMatch) {

    auraRemember(
        rememberMatch[1]
    );

    this.showResponse(
        "I'll remember that."
    );

    return;
}


if (
    /^(?:what do you remember|what do you remember about|recall my memories)/i
        .test(command)
) {

    this.showResponse(
        auraRecall()
    );

    return;
}
        command = String(command || "").trim();

        const colorCommand =
            this.handleColorCommand(command);

        if (colorCommand) {

            this.showResponse(
                colorCommand
            );

            await this.speak(
                colorCommand
            );

            return;
        }

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

                this.shouldListenAgain =
                    false;

                this.updateMicUI(
                    false
                );

                this.updateStatus(
                    "Ready"
                );
            }
        }
    }

    // =====================================================
    // OPEN WEB ACTION IN USER'S BROWSER
    // =====================================================

    getWebActionUrl(command) {

        const text = command.toLowerCase().trim();

        // -----------------------------
        // YOUTUBE
        // -----------------------------

        if (
            text === "youtube" ||
            text === "open youtube" ||
            text === "launch youtube" ||
            text === "start youtube"
        ) {
            return "https://www.youtube.com";
        }

        // YouTube search
        let match = text.match(
            /^search\s+(?:on\s+)?youtube\s+(?:for\s+)?(.+)$/
        );

        if (match) {

            const query = match[1].trim();

            if (query) {
                return (
                    "https://www.youtube.com/results?search_query=" +
                    encodeURIComponent(query)
                );
            }
        }

        // -----------------------------
        // GOOGLE
        // -----------------------------

        if (
            text === "google" ||
            text === "open google" ||
            text === "launch google" ||
            text === "start google"
        ) {
            return "https://www.google.com";
        }

        // Google search
        match = text.match(
            /^search\s+(?:google\s+)?(?:for\s+)?(.+)$/
        );

        if (
            match &&
            !text.startsWith("search youtube")
        ) {

            const query = match[1].trim();

            if (query) {
                return (
                    "https://www.google.com/search?q=" +
                    encodeURIComponent(query)
                );
            }
        }

        // -----------------------------
        // INSTAGRAM
        // -----------------------------

        if (
            text === "instagram" ||
            text === "open instagram" ||
            text === "launch instagram" ||
            text === "start instagram"
        ) {
            return "https://www.instagram.com";
        }

        // -----------------------------
        // FACEBOOK
        // -----------------------------

        if (
            text === "facebook" ||
            text === "open facebook" ||
            text === "launch facebook" ||
            text === "start facebook"
        ) {
            return "https://www.facebook.com";
        }

        // -----------------------------
        // SNAPCHAT
        // -----------------------------

        if (
            text === "snapchat" ||
            text === "open snapchat" ||
            text === "launch snapchat" ||
            text === "start snapchat"
        ) {
            return "https://www.snapchat.com";
        }

        // -----------------------------
        // SPOTIFY
        // -----------------------------

        if (
            text === "spotify" ||
            text === "open spotify" ||
            text === "launch spotify" ||
            text === "start spotify"
        ) {
            return "https://open.spotify.com";
        }

        // -----------------------------
        // WHATSAPP WEB
        // -----------------------------

        if (
            text === "whatsapp web" ||
            text === "open whatsapp web" ||
            text === "launch whatsapp web"
        ) {
            return "https://web.whatsapp.com";
        }

        return null;
    }

    // =========================================================
    // SEND COMMAND
    // =========================================================

    async sendCommand(command) {
        command = String(command || "").trim();

if (
    command.toLowerCase() === "lock screen" ||
    command.toLowerCase() === "lock my screen" ||
    command.toLowerCase() === "lock the screen" ||
    command.toLowerCase() === "lock computer" ||
    command.toLowerCase() === "lock my computer"
) {
    try {
        await fetch("http://127.0.0.1:5050/command", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                command: command
            })
        });

        return "Locking your screen.";
    } catch (error) {
        console.error("LOCK COMMAND ERROR:", error);
        return "I couldn't lock the screen.";
    }
}

        command = command.trim();

        if (!command) {
            return;
        }

        console.log("AURA COMMAND:", command);
/* =========================================================
   LOCAL TIME COMMAND
   ========================================================= */

const timeResponse =
    handleLocalTimeCommand(command);

if (timeResponse) {

    console.log(
        "AURA LOCAL TIME RESPONSE:",
        timeResponse
    );

    this.showResponse(
        timeResponse
    );

    await this.speak(
        timeResponse
    );

    return timeResponse;
}

        // =====================================================
        // LOCAL WINDOWS AGENT
        // =====================================================

        const normalizedCommand = command
            .toLowerCase()
            .trim();

        const localCommand =
            normalizedCommand.startsWith("open ") ||
            normalizedCommand.startsWith("launch ") ||
            normalizedCommand.startsWith("start ") ||
            normalizedCommand.startsWith("go to ") ||
            normalizedCommand.startsWith("bring up ") ||
            normalizedCommand.includes("shutdown computer") ||
            normalizedCommand.includes("shutdown my computer") ||
            normalizedCommand.includes("restart computer") ||
            normalizedCommand.includes("restart my computer") ||
            normalizedCommand.includes("cancel shutdown") ||
            normalizedCommand.includes("cancel restart")
            normalizedCommand === "lock screen" ||
            normalizedCommand === "lock my screen" ||
            normalizedCommand === "lock the screen" ||
            normalizedCommand === "lock computer" ||
            normalizedCommand === "lock my computer";

        if (localCommand) {

            try {

                const localResponse = await fetch(
                    "http://127.0.0.1:5050/command",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            session_id: auraSessionId,
                            username: auraUsername,
                            command: command
                        })
                    }
                );

                const localData =
                    await localResponse.json();

                console.log(
                    "LOCAL AGENT:",
                    JSON.stringify(localData, null, 2)
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
                    "Local Agent unavailable:",
                    error
                );

            }
        }
        /* =========================================================
   AURA — LOCAL TIME COMMAND
   ========================================================= */

function handleLocalTimeCommand(command) {

    const text = String(command || "")
        .toLowerCase()
        .trim();

    const isTimeCommand =
    /\bwhat(?:'s| is)?\s+(?:the\s+)?time\b/.test(text) ||
    /\bcurrent\s+time\b/.test(text) ||
    /\btell\s+me\s+the\s+time\b/.test(text) ||
    /\btime\s+now\b/.test(text);
    if (!isTimeCommand) {
        return null;
    }


    const now = new Date();


    const time = now.toLocaleTimeString(
        "en-IN",
        {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        }
    );


    console.log(
        "AURA LOCAL TIME:",
        time
    );


    return `The current time is ${time}.`;
}

        // =====================================================
        // WEB ACTION
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
        // CLOUD AURA
        // =====================================================

        const AURA_API =
            window.AURA_API_URL ||
            "https://aura-ai-backend-cl7h.onrender.com";

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
                        session_id: auraSessionId,
                        username: auraUsername,
                        command: command
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
            auraUsername = data.username;
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

        return data.response;
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

                utterance.onend =
                    () => {

                        this.isSpeaking =
                            false;

                        this.setCoreState(
                            "idle"
                        );

                        resolve();
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
        setTimeout(() => {

    const block =
        this.commandElement.closest(
            ".message-block"
        );

    if (block) {
        block.classList.add(
            "completed"
        );
    }

}, 5000);
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
       setTimeout(() => {

    const block =
        this.responseElement.closest(
            ".message-block"
        );

    if (block) {
        block.classList.add(
            "completed"
        );
    }

}, 5000);
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

            const auraColor =
    getComputedStyle(document.documentElement)
        .getPropertyValue("--aura-user-color")
        .trim() || "#28d7ff";

particle.element.style.filter =
    `brightness(${brightness})
        drop-shadow(
            0 0 ${glow}px
            ${auraColor}
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

    const canvas = document.getElementById("auraGlobe");

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;


    /* =========================================================
       AURA HOLOGRAPHIC EARTH
       Natural / detailed / Africa centered
       ========================================================= */

    const mobile =
        window.innerWidth <= 720;

    const SIZE =
        mobile ? 294 : 552;

    canvas.width = SIZE;
    canvas.height = SIZE;

    const W = SIZE;
    const H = SIZE;

    const cx = W / 2;
    const cy = H / 2;

    const R =
        mobile ? 132 : 248;


    /*
       Start with Africa / Europe facing the user.
       Keep rotation extremely slow so the reference
       orientation remains recognizable.
    */

    let rotation = 0.02;


    /* =========================================================
       LAND DATA
       ========================================================= */

    const continents = [

        /* NORTH AMERICA */
        [
            [-168,72],[-150,70],[-135,72],[-120,65],
            [-112,58],[-103,55],[-96,50],[-88,48],
            [-82,45],[-78,40],[-74,43],[-68,47],
            [-62,52],[-67,58],[-80,61],[-92,68],
            [-110,72],[-135,74],[-168,72]
        ],

        /* SOUTH AMERICA */
        [
            [-81,12],[-72,10],[-63,7],[-54,3],
            [-48,-3],[-44,-12],[-46,-22],
            [-52,-32],[-57,-42],[-63,-52],
            [-69,-55],[-73,-47],[-74,-36],
            [-77,-25],[-79,-12],[-81,12]
        ],

        /* EUROPE */
        [
            [-11,35],[-5,43],[3,43],[10,46],
            [18,48],[25,54],[35,58],[32,65],
            [20,68],[8,63],[-2,57],[-10,50],
            [-11,35]
        ],

        /* AFRICA */
        [
            [-17,35],[-8,37],[2,36],[10,35],
            [20,32],[28,28],[34,20],[38,10],
            [42,0],[38,-10],[34,-20],
            [28,-29],[22,-34],[14,-35],
            [7,-31],[1,-25],[-4,-18],
            [-8,-8],[-13,5],[-17,20],[-17,35]
        ],

        /* ASIA */
        [
            [28,70],[45,72],[60,75],[78,74],
            [95,70],[112,66],[128,60],[145,54],
            [160,48],[170,40],[158,34],
            [145,31],[132,27],[118,22],
            [104,20],[91,23],[78,28],
            [65,35],[52,42],[42,50],
            [34,60],[28,70]
        ],

        /* INDIA */
        [
            [68,25],[76,30],[82,28],[88,22],
            [87,14],[82,8],[76,10],[72,18],
            [68,25]
        ],

        /* AUSTRALIA */
        [
            [112,-11],[125,-12],[138,-14],
            [151,-19],[155,-28],[150,-35],
            [140,-40],[128,-39],[117,-34],
            [112,-25],[112,-11]
        ]
    ];


    /* =========================================================
       PROJECT LAT/LON TO SPHERE
       ========================================================= */

    function project(lon, lat) {

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


        const rx =
            x * Math.cos(rotation) +
            z * Math.sin(rotation);

        const rz =
            -x * Math.sin(rotation) +
            z * Math.cos(rotation);


        return {
            x: cx + rx * R,
            y: cy - y * R,
            z: rz
        };
    }


    /* =========================================================
       BACKGROUND GLOW INSIDE EARTH
       ========================================================= */

    function drawEarthGlow() {

        const glow =
            ctx.createRadialGradient(
                cx - R * 0.25,
                cy - R * 0.30,
                R * 0.05,
                cx,
                cy,
                R * 1.15
            );

        glow.addColorStop(
            0,
            "rgba(220,255,40,0.24)"
        );

        glow.addColorStop(
            0.45,
            "rgba(150,220,35,0.18)"
        );

        glow.addColorStop(
            0.78,
            "rgba(80,180,40,0.08)"
        );

        glow.addColorStop(
            1,
            "rgba(0,0,0,0)"
        );


        ctx.beginPath();

        ctx.arc(
            cx,
            cy,
            R * 1.08,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = glow;

        ctx.fill();
    }


    /* =========================================================
       LATITUDE / LONGITUDE GRID
       ========================================================= */

    function drawGrid() {

        ctx.save();

        ctx.beginPath();

        ctx.arc(
            cx,
            cy,
            R,
            0,
            Math.PI * 2
        );

        ctx.clip();


        /*
           Latitude
        */

        for (
            let lat = -75;
            lat <= 75;
            lat += 15
        ) {

            ctx.beginPath();

            let started = false;

            for (
                let lon = -180;
                lon <= 180;
                lon += 2
            ) {

                const p =
                    project(
                        lon,
                        lat
                    );

                if (p.z > 0) {

                    if (!started) {

                        ctx.moveTo(
                            p.x,
                            p.y
                        );

                        started = true;

                    } else {

                        ctx.lineTo(
                            p.x,
                            p.y
                        );
                    }
                }
            }

            ctx.strokeStyle =
                "rgba(180,235,70,0.24)";

            ctx.lineWidth =
                mobile ? 0.45 : 0.7;

            ctx.stroke();
        }


        /*
           Longitude
        */

        for (
            let lon = -180;
            lon < 180;
            lon += 15
        ) {

            ctx.beginPath();

            let started = false;

            for (
                let lat = -90;
                lat <= 90;
                lat += 2
            ) {

                const p =
                    project(
                        lon,
                        lat
                    );

                if (p.z > 0) {

                    if (!started) {

                        ctx.moveTo(
                            p.x,
                            p.y
                        );

                        started = true;

                    } else {

                        ctx.lineTo(
                            p.x,
                            p.y
                        );
                    }
                }
            }

            ctx.strokeStyle =
                "rgba(160,225,65,0.22)";

            ctx.lineWidth =
                mobile ? 0.45 : 0.7;

            ctx.stroke();
        }


        ctx.restore();
    }


    /* =========================================================
       NATURAL LAND MASSES
       ========================================================= */

    function drawContinents() {

        ctx.save();

        ctx.beginPath();

        ctx.arc(
            cx,
            cy,
            R - 1,
            0,
            Math.PI * 2
        );

        ctx.clip();


        for (
            const continent of continents
        ) {

            const points = [];

            for (
                const point of continent
            ) {

                points.push(
                    project(
                        point[0],
                        point[1]
                    )
                );
            }


            /* LAND FILL */

            ctx.beginPath();

            let started = false;

            for (
                const p of points
            ) {

                if (p.z > 0) {

                    if (!started) {

                        ctx.moveTo(
                            p.x,
                            p.y
                        );

                        started = true;

                    } else {

                        ctx.lineTo(
                            p.x,
                            p.y
                        );
                    }
                }
            }

            ctx.closePath();

            ctx.fillStyle =
                "rgba(210,245,45,0.10)";

            ctx.fill();


            /* COASTLINE */

            ctx.beginPath();

            started = false;

            for (
                const p of points
            ) {

                if (p.z > 0) {

                    if (!started) {

                        ctx.moveTo(
                            p.x,
                            p.y
                        );

                        started = true;

                    } else {

                        ctx.lineTo(
                            p.x,
                            p.y
                        );
                    }
                }
            }

            ctx.closePath();

            ctx.strokeStyle =
                "rgba(225,255,45,0.92)";

            ctx.lineWidth =
                mobile ? 1 : 1.5;

            ctx.shadowBlur = 10;

            ctx.shadowColor =
                "rgba(220,255,40,0.9)";

            ctx.stroke();
        }


        ctx.restore();
    }


    /* =========================================================
       HOLOGRAPHIC TERRAIN / CITY DOTS
       ========================================================= */

    const dots = [];

    for (
        let i = 0;
        i < 650;
        i++
    ) {

        dots.push({
            lon:
                -180 +
                Math.random() * 360,

            lat:
                -65 +
                Math.random() * 130,

            size:
                Math.random() *
                1.25 +
                0.25
        });
    }


    function drawDots() {

        ctx.save();

        for (
            const dot of dots
        ) {

            const p =
                project(
                    dot.lon,
                    dot.lat
                );

            if (
                p.z >
                0.15
            ) {

                const alpha =
                    0.12 +
                    p.z * 0.65;

                ctx.beginPath();

                ctx.arc(
                    p.x,
                    p.y,
                    dot.size,
                    0,
                    Math.PI * 2
                );

                ctx.fillStyle =
                    `rgba(
                        235,
                        255,
                        75,
                        ${alpha}
                    )`;

                ctx.fill();
            }
        }

        ctx.restore();
    }


    /* =========================================================
       OUTER HOLOGRAM RINGS
       ========================================================= */

    function drawRings() {

        ctx.save();

        ctx.translate(
            cx,
            cy
        );


        for (
            let i = 0;
            i < 3;
            i++
        ) {

            const ring =
                R +
                10 +
                i * 9;

            ctx.beginPath();

            ctx.ellipse(
                0,
                0,
                ring,
                ring * 0.98,
                0,
                0,
                Math.PI * 2
            );

            ctx.strokeStyle =
                `rgba(
                    220,
                    255,
                    50,
                    ${0.32 - i * 0.08}
                )`;

            ctx.lineWidth =
                i === 0 ? 1.4 : 0.7;

            ctx.setLineDash(
                i === 1
                    ? [2, 5]
                    : []
            );

            ctx.shadowBlur = 8;

            ctx.shadowColor =
                "rgba(220,255,40,0.65)";

            ctx.stroke();
        }


        ctx.restore();
    }
    /* =========================================================
   AURA — INVISIBLE GLOBE ZOOM
   Mouse wheel + trackpad + mobile pinch
   ========================================================= */

(function initAuraGlobeZoom() {

    const globe =
        document.getElementById("auraGlobe");

    const core =
        document.getElementById("auraCore");

    if (!globe || !core) {
        return;
    }


    let currentZoom = 1;
    let targetZoom = 1;

    function animateZoom() {

        currentZoom +=
            (targetZoom - currentZoom) * 0.12;

        core.style.transform =
            `scale(${currentZoom})`;

        requestAnimationFrame(
            animateZoom
        );
    }


    animateZoom();

})();
/* =========================================================
   AURA — VOICE GLOBE ZOOM
   ========================================================= */

window.auraZoomIn = function () {

    const core =
        document.getElementById("auraCore");

    if (!core) return;

    const current =
        parseFloat(
            core.dataset.voiceZoom || "1"
        );

    const next =
        Math.min(
            1.28,
            current + 0.10
        );

    core.dataset.voiceZoom =
        String(next);

    core.style.transform =
        `scale(${next})`;

};


window.auraZoomOut = function () {

    const core =
        document.getElementById("auraCore");

    if (!core) return;

    const current =
        parseFloat(
            core.dataset.voiceZoom || "1"
        );

    const next =
        Math.max(
            0.82,
            current - 0.10
        );

    core.dataset.voiceZoom =
        String(next);

    core.style.transform =
        `scale(${next})`;

};

    /* =========================================================
       EARTH EDGE
       ========================================================= */

    function drawEdge() {

        ctx.beginPath();

        ctx.arc(
            cx,
            cy,
            R,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle =
            "rgba(220,255,60,0.95)";

        ctx.lineWidth =
            mobile ? 1.5 : 2;

        ctx.shadowBlur = 18;

        ctx.shadowColor =
            "rgba(210,255,45,0.95)";

        ctx.stroke();
    }


    /* =========================================================
       ANIMATION
       ========================================================= */

    function animate() {

        ctx.clearRect(
            0,
            0,
            W,
            H
        );


        drawEarthGlow();

        drawRings();

        drawGrid();

        drawContinents();

        drawDots();

        drawEdge();


        /*
           Very slow movement.
           Africa remains recognizable instead of
           rapidly rotating away from the reference.
        */

        rotation +=
            mobile
                ? 0.0008
                : 0.0012;


        if (
            rotation >
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
/* =========================================================
   AURA — PER USER INTERFACE COLOR
   ========================================================= */

/* =========================================================
   AURA — 3 USER COLORS ONLY
   BLUE / RED / GREEN
   PER-USER SAVED THEME
   ========================================================= */


/* =========================================================
   AURA — SMOOTH GLOBE ZOOM
   NO VISIBLE ZOOM BUTTONS
   ========================================================= */

(function initAuraZoom() {

    const globe =
        document.getElementById("auraGlobe");

    const core =
        document.getElementById("auraCore");

    if (!globe || !core) {
        return;
    }


    let zoom = 1;

    const MIN_ZOOM = 0.82;
    const MAX_ZOOM = 1.28;

    let targetZoom = 1;
    window.auraZoomIn = function () {

    targetZoom =
        Math.min(
            MAX_ZOOM,
            targetZoom + 0.10
        );

};


window.auraZoomOut = function () {

    targetZoom =
        Math.max(
            MIN_ZOOM,
            targetZoom - 0.10
        );

};

    /* -----------------------------------------
       SMOOTH ANIMATION
    ----------------------------------------- */

    function animateZoom() {

        zoom +=
            (targetZoom - zoom) * 0.12;


        core.style.transform =
            `scale(${zoom})`;


        requestAnimationFrame(
            animateZoom
        );
    }


    animateZoom();


    /* -----------------------------------------
       DESKTOP MOUSE WHEEL
    ----------------------------------------- */

    core.addEventListener(
        "wheel",
        event => {

            event.preventDefault();


            const direction =
                event.deltaY > 0
                    ? -1
                    : 1;


            targetZoom +=
                direction * 0.06;


            targetZoom =
                Math.max(
                    MIN_ZOOM,
                    Math.min(
                        MAX_ZOOM,
                        targetZoom
                    )
                );

        },
        {
            passive: false
        }
    );


    /* -----------------------------------------
       MOBILE PINCH
    ----------------------------------------- */

    let pinchStart = null;


    core.addEventListener(
        "touchstart",
        event => {

            if (
                event.touches.length !== 2
            ) {
                return;
            }


            const dx =
                event.touches[0].clientX -
                event.touches[1].clientX;


            const dy =
                event.touches[0].clientY -
                event.touches[1].clientY;


            pinchStart =
                Math.hypot(dx, dy);
        },
        {
            passive: true
        }
    );


    core.addEventListener(
        "touchmove",
        event => {

            if (
                event.touches.length !== 2 ||
                pinchStart === null
            ) {
                return;
            }


            event.preventDefault();


            const dx =
                event.touches[0].clientX -
                event.touches[1].clientX;


            const dy =
                event.touches[0].clientY -
                event.touches[1].clientY;


            const currentDistance =
                Math.hypot(dx, dy);


            const difference =
                currentDistance -
                pinchStart;


            targetZoom +=
                difference * 0.0015;


            targetZoom =
                Math.max(
                    MIN_ZOOM,
                    Math.min(
                        MAX_ZOOM,
                        targetZoom
                    )
                );


            pinchStart =
                currentDistance;

        },
        {
            passive: false
        }
    );


    core.addEventListener(
        "touchend",
        () => {

            pinchStart = null;

        },
        {
            passive: true
        }
    );

})();
