from faster_whisper import WhisperModel

model = WhisperModel(
    "base",
    device="cpu",
    compute_type="int8"
)


def transcribe(audio_path):
    segments, info = model.transcribe(
        audio_path,
        word_timestamps=True,
        beam_size=5
    )

    content_metadata = []
    content = []

    # Process segments
    for segment in segments:
        print(
            f"--- Segment [{segment.start:.2f}s -> "
            f"{segment.end:.2f}s]: {segment.text.strip()} ---"
        )

        if segment.words:
            for word in segment.words:
                content_metadata.append({
                    "word": word.word,
                    "start": word.start,
                    "end": word.end,
                    "confidence": word.probability,
                })

                content.append(word.word)

    # Build response AFTER content has been populated
    final_response = {
        "language": info.language,
        "language_probability": info.language_probability,
        "content": "".join(content),
        "content_metadata": content_metadata
    }

    return final_response