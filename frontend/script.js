// ============================================================
// AURA AI - FINAL VOICE CONTROLLER
// ============================================================

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

        this.setupRecognition();
        this.setupButtons();
        this.loadVoices();
        this.setupVoiceSettings();

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
                }
            };

        // =====================================================
        // ERROR
        // =====================================================

        this.recognition.onerror =
            (event) => {

                console.error(
                    "AURA MIC ERROR:",
                    event.error
                );

                this.isListening =
                    false;

                this.updateMicUI(false);

                if (
                    event.error ===
                    "not-allowed"
                ) {

                    this.shouldListenAgain =
                        false;

                    this.updateStatus(
                        "Microphone permission denied"
                    );

                    return;
                }

                if (
                    event.error ===
                    "service-not-allowed"
                ) {

                    this.shouldListenAgain =
                        false;

                    this.updateStatus(
                        "Microphone service unavailable"
                    );

                    return;
                }

                // Restart wake listener

                if (
                    this.wakeMode &&
                    this.continuousMode
                ) {

                    this.restartWakeListening();

                    return;
                }

                if (
                    this.continuousMode &&
                    this.shouldListenAgain &&
                    !this.isProcessing &&
                    !this.isSpeaking
                ) {

                    this.scheduleListening();
                }
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

    async processCommand(
        command
    ) {

        this.isProcessing =
            true;

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

            await this.speak(
                errorMessage
            );

        } finally {

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

    // =========================================================
    // SEND COMMAND
    // =========================================================

    async sendCommand(
        command
    ) {

        const AURA_API =
            window.AURA_API_URL ||
            "https://aura-ai-ywzs.onrender.com";

        console.log(
            "AURA → SERVER:",
            command
        );

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
                        command:
                            command
                    })
                }
            );

        let data;

        try {

            data =
                await response.json();

        } catch (error) {

            throw new Error(
                `Server returned HTTP ${response.status}`
            );
        }

        console.log(
            "SERVER → AURA:",
            data
        );

        if (!response.ok) {

            throw new Error(
                data.error ||
                data.response ||
                `Server error ${response.status}`
            );
        }

        if (
            data.success === false
        ) {

            throw new Error(
                data.error ||
                data.response ||
                "AURA command failed"
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

        this.core.classList.remove(
            "listening",
            "processing",
            "speaking",
            "idle"
        );

        if (state) {

            this.core.classList.add(
                state
            );
        }
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