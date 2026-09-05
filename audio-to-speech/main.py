from faster_whisper import WhisperModel
import numpy as np

model = WhisperModel(
    "base",
    device="cpu",
    compute_type="int8"
)

def transcribe_pcm(audio_bytes):
    audio = np.frombuffer(
        audio_bytes,
        dtype=np.int16
    )

    # Convert int16 → float32
    audio = audio.astype(np.float32) / 32768.0

    segments, info = model.transcribe(
        audio,
        word_timestamps=True,
        beam_size=5
    )

    content_metadata = []
    content = []
    segment_metadata = []

    for segment in segments:

        segment_text = segment.text.strip()

        segment_metadata.append({
            "start": segment.start,
            "end": segment.end,
            "text": segment_text,
        })

        if segment.words:
            for word in segment.words:

                content_metadata.append({
                    "word": word.word,
                    "start": word.start,
                    "end": word.end,
                    "confidence": word.probability,
                })

                content.append(word.word.strip())

    return {
        "language": info.language,
        "language_probability": info.language_probability,
        "content": " ".join(content),
        "content_metadata": content_metadata,
        "segments": segment_metadata,
        "duration": info.duration,
    }