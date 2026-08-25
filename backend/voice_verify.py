import os
import numpy as np
import sounddevice as sd

from resemblyzer import VoiceEncoder, preprocess_wav


class VoiceVerifier:

    def __init__(self):

        self.sample_rate = 16000

        self.profile_path = os.path.join(
            os.path.dirname(__file__),
            "voice_profile",
            "ashu_voice.npy"
        )

        if not os.path.exists(self.profile_path):
            raise FileNotFoundError(
                "Ashu voice profile not found."
            )

        self.profile = np.load(
            self.profile_path
        )

        self.encoder = VoiceEncoder()

        # Similarity threshold.
        # We'll tune this after testing.
        self.threshold = 0.75


    def record_voice(self, duration=4):

        print("🎙️ Checking speaker...")

        audio = sd.rec(
            int(duration * self.sample_rate),
            samplerate=self.sample_rate,
            channels=1,
            dtype="float32"
        )

        sd.wait()

        return audio.flatten()


    def verify(self, duration=4):

        audio = self.record_voice(
            duration
        )

        embedding = self.encoder.embed_utterance(
            audio
        )

        similarity = np.dot(
            self.profile,
            embedding
        ) / (
            np.linalg.norm(self.profile)
            *
            np.linalg.norm(embedding)
        )

        print(
            f"Voice similarity: {similarity:.3f}"
        )

        return similarity >= self.threshold


if __name__ == "__main__":

    verifier = VoiceVerifier()

    print("=" * 50)
    print("        AURA SPEAKER VERIFICATION")
    print("=" * 50)

    print()
    print("Say something when ready...")
    input("Press ENTER to start...")

    result = verifier.verify()

    print()

    if result:

        print("✅ VOICE VERIFIED")
        print("This sounds like Ashu.")

    else:

        print("❌ VOICE NOT VERIFIED")
        print("Speaker verification failed.")