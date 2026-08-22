import os
import numpy as np
import sounddevice as sd
from scipy.io.wavfile import write
from resemblyzer import VoiceEncoder, preprocess_wav

SAMPLE_RATE = 16000
DURATION = 5
SAMPLES = 3

PROFILE_DIR = "voice_profile"
os.makedirs(PROFILE_DIR, exist_ok=True)

encoder = VoiceEncoder()

print("=" * 50)
print("        AURA VOICE TRAINING")
print("=" * 50)
print()
print("We will record 3 short samples of your voice.")
print("Speak naturally and clearly.")
print()

embeddings = []

phrases = [
    "Hello AURA, this is my voice.",
    "Hey AURA, wake up and listen to me.",
    "AURA is my personal AI assistant."
]

for i, phrase in enumerate(phrases, start=1):

    print()
    print(f"Sample {i}/{SAMPLES}")
    print(f"Say: {phrase}")
    input("Press ENTER when ready...")

    print("🎙️ Recording...")

    audio = sd.rec(
        int(DURATION * SAMPLE_RATE),
        samplerate=SAMPLE_RATE,
        channels=1,
        dtype="float32"
    )

    sd.wait()

    audio = audio.flatten()

    filename = os.path.join(
        PROFILE_DIR,
        f"sample_{i}.wav"
    )

    write(
        filename,
        SAMPLE_RATE,
        (audio * 32767).astype(np.int16)
    )

    print("✓ Recording saved.")

    wav = preprocess_wav(filename)

    embedding = encoder.embed_utterance(wav)

    embeddings.append(embedding)

    print("✓ Voice features extracted.")


voice_profile = np.mean(
    embeddings,
    axis=0
)

profile_path = os.path.join(
    PROFILE_DIR,
    "ashu_voice.npy"
)

np.save(
    profile_path,
    voice_profile
)

print()
print("=" * 50)
print("       VOICE TRAINING COMPLETE")
print("=" * 50)
print()
print(f"Voice profile saved to:")
print(profile_path)
print()
print("AURA can now use this profile")
print("for speaker verification.")