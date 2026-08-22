import os
import subprocess
import tempfile

import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

from resemblyzer import VoiceEncoder, preprocess_wav


app = Flask(__name__)

CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "http://localhost:5500",
                "http://127.0.0.1:5500"
            ]
        }
    }
)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

PROFILE_PATH = os.path.join(
    BASE_DIR,
    "voice_profile",
    "ashu_voice.npy"
)


class VoiceVerification:

    def __init__(self):

        if not os.path.exists(PROFILE_PATH):
            raise FileNotFoundError(
                "Ashu voice profile not found."
            )

        self.profile = np.load(
            PROFILE_PATH
        )

        self.encoder = VoiceEncoder()

        # Your previous score was 0.861.
        self.threshold = 0.75


    def verify_wav(self, wav_file):

        wav = preprocess_wav(
            wav_file
        )

        embedding = (
            self.encoder.embed_utterance(
                wav
            )
        )

        similarity = float(
            np.dot(
                self.profile,
                embedding
            )
            /
            (
                np.linalg.norm(
                    self.profile
                )
                *
                np.linalg.norm(
                    embedding
                )
            )
        )

        verified = (
            similarity >= self.threshold
        )

        return verified, similarity


verifier = VoiceVerification()


@app.route("/health", methods=["GET"])
def health():

    return jsonify({
        "status":
            "AURA voice verification online"
    })


@app.route("/verify_voice", methods=["POST"])
def verify_voice():

    webm_path = None
    wav_path = None

    try:

        audio_file = request.files.get(
            "audio"
        )

        if not audio_file:

            return jsonify({
                "verified": False,
                "error":
                    "No audio received."
            }), 400


        # -------------------------
        # Temporary files
        # -------------------------

        webm_file = tempfile.NamedTemporaryFile(
            suffix=".webm",
            delete=False
        )

        wav_file = tempfile.NamedTemporaryFile(
            suffix=".wav",
            delete=False
        )

        webm_path = webm_file.name
        wav_path = wav_file.name

        webm_file.close()
        wav_file.close()


        # Save browser recording
        audio_file.save(
            webm_path
        )

        print("Audio received.")
        print("Converting WebM → WAV...")


        # -------------------------
        # FFmpeg conversion
        # -------------------------

        command = [
            "ffmpeg",

            "-y",

            "-i",
            webm_path,

            "-ac",
            "1",

            "-ar",
            "16000",

            "-sample_fmt",
            "s16",

            wav_path
        ]


        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )


        if result.returncode != 0:

            print(
                "FFmpeg ERROR:"
            )

            print(
                result.stderr
            )

            return jsonify({
                "verified": False,
                "error":
                    "Audio conversion failed."
            }), 500


        print(
            "WebM → WAV conversion successful."
        )


        # -------------------------
        # Verify voice
        # -------------------------

        verified, similarity = (
            verifier.verify_wav(
                wav_path
            )
        )


        print(
            f"Voice similarity: "
            f"{similarity:.3f}"
        )


        if verified:

            print(
                "✅ ASHU VERIFIED"
            )

        else:

            print(
                "❌ UNKNOWN SPEAKER"
            )


        return jsonify({
            "verified": verified,
            "similarity":
                round(similarity, 3)
        })


    except Exception as error:

        print(
            "VOICE VERIFICATION ERROR:",
            repr(error)
        )

        return jsonify({
            "verified": False,
            "error":
                str(error)
        }), 500


    finally:

        # Clean temporary files
        for path in [
            webm_path,
            wav_path
        ]:

            if path and os.path.exists(path):

                try:
                    os.remove(path)

                except Exception:
                    pass


if __name__ == "__main__":

    print("=" * 50)
    print(
        "       AURA VOICE VERIFICATION SERVER"
    )
    print("=" * 50)
    print()
    print(
        "FFmpeg audio conversion: ENABLED"
    )
    print(
        "Voice threshold: 0.75"
    )
    print()
    print(
        "Server:"
        " http://127.0.0.1:5001"
    )
    print()

    app.run(
        host="127.0.0.1",
        port=5001,
        debug=False
    )