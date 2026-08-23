const auraVoice =
    new AuraVoiceController();


// =====================================================
// NORMAL MICROPHONE
// =====================================================

const normalMic =
    document.getElementById(
        "normal-mic"
    );

if (normalMic) {

    normalMic.addEventListener(
        "click",
        () => {

            auraVoice.startNormalMode();

        }
    );
}


// =====================================================
// CONTINUOUS MODE
// =====================================================

const continuousMic =
    document.getElementById(
        "continuous-mic"
    );

if (continuousMic) {

    continuousMic.addEventListener(
        "click",
        () => {

            if (
                auraVoice.continuousMode
            ) {

                auraVoice.stopContinuousMode();

            } else {

                auraVoice.startContinuousMode();
            }

        }
    );
}