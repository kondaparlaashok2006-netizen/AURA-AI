class AuraVoiceController {

    constructor() {

        this.recognition = null;

        this.isListening = false;
        this.isProcessing = false;
        this.isSpeaking = false;

        this.continuousMode = false;

        this.shouldListenAgain = false;

        this.idleTimer = null;

        this.IDLE_TIMEOUT = 15000;

        this.setupRecognition();
    }


    // =====================================================
    // SPEECH RECOGNITION SETUP
    // =====================================================

    setupRecognition() {

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {

            this.updateStatus(
                "Speech recognition is not supported"
            );

            return;
        }

        this.recognition =
            new SpeechRecognition();

        this.recognition.lang = "en-US";

        this.recognition.continuous = false;

        this.recognition.interimResults = false;

        this.recognition.maxAlternatives = 1;


        // =================================================
        // RESULT
        // =================================================

        this.recognition.onresult =
            async (event) => {

                if (
                    this.isProcessing ||
                    this.isSpeaking
                ) {
                    return;
                }

                const lastResult =
                    event.results[
                        event.results.length - 1
                    ];

                if (
                    !lastResult ||
                    !lastResult[0]
                ) {
                    return;
                }

                const command =
                    lastResult[0]
                        .transcript
                        .trim();

                if (!command) {
                    return;
                }

                console.log(
                    "YOU:",
                    command
                );


                // Microphone must stop
                // before processing.

                this.shouldListenAgain =
                    this.continuousMode;

                this.stopListening();

                this.clearIdleTimer();

                await this.processCommand(
                    command
                );
            };


        // =================================================
        // END
        // =================================================

        this.recognition.onend =
            () => {

                console.log(
                    "AURA MIC: recognition ended"
                );

                this.isListening = false;


                /*
                 * NEVER restart while AURA
                 * is processing or speaking.
                 */

                if (
                    this.shouldListenAgain &&
                    !this.isProcessing &&
                    !this.isSpeaking
                ) {

                    this.scheduleListening();
                }
            };


        // =================================================
        // ERROR
        // =================================================

        this.recognition.onerror =
            (event) => {

                console.log(
                    "AURA MIC ERROR:",
                    event.error
                );

                this.isListening = false;


                if (
                    event.error ===
                    "not-allowed"
                ) {

                    this.updateStatus(
                        "Microphone permission denied"
                    );

                    this.shouldListenAgain =
                        false;

                    return;
                }


                if (
                    event.error ===
                    "service-not-allowed"
                ) {

                    this.updateStatus(
                        "Microphone service unavailable"
                    );

                    this.shouldListenAgain =
                        false;

                    return;
                }


                /*
                 * Ignore normal recognition errors
                 * instead of creating rapid restart loops.
                 */

                if (
                    this.shouldListenAgain &&
                    !this.isProcessing &&
                    !this.isSpeaking
                ) {

                    this.scheduleListening();
                }
            };
    }


    // =====================================================
    // NORMAL MIC
    // =====================================================

    startNormalMode() {

        this.continuousMode = false;

        this.shouldListenAgain = false;

        this.clearIdleTimer();

        this.startListening();
    }


    // =====================================================
    // CONTINUOUS MODE ON
    // =====================================================

    startContinuousMode() {

        if (this.continuousMode) {
            return;
        }

        this.continuousMode = true;

        this.shouldListenAgain = true;

        this.clearIdleTimer();

        this.updateStatus(
            "Continuous mode ON"
        );

        this.startListening();
    }


    // =====================================================
    // CONTINUOUS MODE OFF
    // =====================================================

    stopContinuousMode() {

        this.continuousMode = false;

        this.shouldListenAgain = false;

        this.clearIdleTimer();

        this.stopListening();

        this.updateStatus(
            "Continuous mode OFF"
        );
    }


    // =====================================================
    // START LISTENING
    // =====================================================

    startListening() {

        if (!this.recognition) {
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


        try {

            this.isListening = true;

            this.updateStatus(
                "Listening..."
            );

            console.log(
                "AURA MIC: ON"
            );

            this.recognition.start();

            this.resetIdleTimer();

        } catch (error) {

            /*
             * Browser can throw InvalidStateError
             * if start() happens too quickly.
             */

            console.log(
                "AURA MIC START:",
                error
            );

            this.isListening = false;
        }
    }


    // =====================================================
    // SCHEDULE LISTENING
    // =====================================================

    scheduleListening() {

        if (
            !this.continuousMode ||
            this.isProcessing ||
            this.isSpeaking ||
            this.isListening
        ) {
            return;
        }


        setTimeout(() => {

            if (
                this.continuousMode &&
                !this.isProcessing &&
                !this.isSpeaking &&
                !this.isListening
            ) {

                this.startListening();
            }

        }, 200);
    }


    // =====================================================
    // STOP LISTENING
    // =====================================================

    stopListening() {

        if (!this.recognition) {
            return;
        }


        if (!this.isListening) {
            return;
        }


        try {

            console.log(
                "AURA MIC: OFF"
            );

            this.recognition.stop();

        } catch (error) {

            console.log(
                "AURA MIC STOP:",
                error
            );
        }

        this.isListening = false;
    }


    // =====================================================
    // PROCESS COMMAND
    // =====================================================

    async processCommand(command) {

        this.isProcessing = true;

        this.updateStatus(
            "Processing..."
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


            console.log(
                "AURA:",
                response
            );


            /*
             * AURA speaks here.
             *
             * Microphone remains OFF.
             */

            await this.speak(
                response
            );


        } catch (error) {

            console.error(
                "AURA PROCESS ERROR:",
                error
            );


            await this.speak(
                "Sorry, I couldn't process that."
            );


        } finally {

            this.isProcessing = false;


            /*
             * VERY IMPORTANT
             *
             * AURA has completely finished speaking.
             * Now microphone can start again.
             */

            if (this.continuousMode) {

                this.shouldListenAgain = true;

                this.updateStatus(
                    "Ready — listening again"
                );

                this.scheduleListening();

            } else {

                this.shouldListenAgain = false;

                this.updateStatus(
                    "Ready"
                );
            }
        }
    }


    // =====================================================
    // SEND COMMAND TO FLASK
    // =====================================================

    async sendCommand(command) {

        const response =
            await fetch(
                "http://127.0.0.1:5050/command",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        command: command
                    })
                }
            );


        if (!response.ok) {

            throw new Error(
                "Server returned HTTP " +
                response.status
            );
        }


        const data =
            await response.json();


        return data.response;
    }


    // =====================================================
    // TEXT TO SPEECH
    // =====================================================

    speak(text) {

        return new Promise(
            (resolve) => {

                this.isSpeaking = true;


                /*
                 * Absolutely make sure microphone
                 * is OFF before AURA speaks.
                 */

                this.shouldListenAgain =
                    this.continuousMode;

                this.stopListening();


                this.updateStatus(
                    "AURA speaking..."
                );


                if (
                    !window.speechSynthesis
                ) {

                    this.isSpeaking = false;

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


                /*
                 * Smooth voice settings.
                 */

                utterance.rate = 0.92;

                utterance.pitch = 0.85;

                utterance.volume = 1.0;


                // -----------------------------------------
                // Select an available male voice
                // -----------------------------------------

                const voices =
                    window.speechSynthesis
                        .getVoices();


                const preferredNames = [

                    "Microsoft David",

                    "Microsoft Guy",

                    "Microsoft Ryan",

                    "Google US English",

                    "Alex",

                    "Daniel",

                    "Mark"

                ];


                let selectedVoice = null;


                for (
                    const preferred
                    of preferredNames
                ) {

                    selectedVoice =
                        voices.find(
                            voice =>
                                voice.name
                                    .toLowerCase()
                                    .includes(
                                        preferred
                                            .toLowerCase()
                                    )
                        );


                    if (selectedVoice) {
                        break;
                    }
                }


                if (selectedVoice) {

                    utterance.voice =
                        selectedVoice;
                }


                // -----------------------------------------
                // SPEECH END
                // -----------------------------------------

                utterance.onend =
                    () => {

                        console.log(
                            "AURA SPEECH FINISHED"
                        );

                        this.isSpeaking = false;

                        resolve();
                    };


                // -----------------------------------------
                // SPEECH ERROR
                // -----------------------------------------

                utterance.onerror =
                    (error) => {

                        console.log(
                            "AURA SPEECH ERROR:",
                            error
                        );

                        this.isSpeaking = false;

                        resolve();
                    };


                window.speechSynthesis
                    .speak(
                        utterance
                    );
            }
        );
    }


    // =====================================================
    // 15 SECOND IDLE TIMER
    // =====================================================

    resetIdleTimer() {

        this.clearIdleTimer();


        if (!this.continuousMode) {
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


    // =====================================================
    // ENTER IDLE
    // =====================================================

    enterIdle() {

        if (!this.continuousMode) {
            return;
        }


        this.shouldListenAgain = false;

        this.stopListening();


        this.updateStatus(
            'Idle — say "AURA"'
        );


        console.log(
            'AURA: IDLE — waiting for "AURA"'
        );
    }


    // =====================================================
    // CLEAR IDLE TIMER
    // =====================================================

    clearIdleTimer() {

        if (this.idleTimer !== null) {

            clearTimeout(
                this.idleTimer
            );

            this.idleTimer = null;
        }
    }


    // =====================================================
    // STATUS
    // =====================================================

    updateStatus(status) {

        const statusElement =
            document.getElementById(
                "aura-status"
            );


        if (statusElement) {

            statusElement.textContent =
                status;
        }


        console.log(
            "AURA STATUS:",
            status
        );
    }
}