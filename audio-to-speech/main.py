from faster_whisper import WhisperModel


# 1. Initialize the model (options: "tiny", "base", "small", "medium", "large-v3")
# Use device="cuda" if you have a compatible NVIDIA GPU configured with CUDA
model = WhisperModel("base", device="cpu", compute_type="int8")


def transcribe(audio_path):
    segments, info = model.transcribe(audio_path, word_timestamps=True, beam_size=5)

    content = []

    final_response = {
        "language": info.language,
        "language_probability": info.language_probability,
        "content": content
    }

    # 3. Iterate over structural segments, then drill down to individual words
    for segment in segments:
        print(f"--- Segment [{segment.start:.2f}s -> {segment.end:.2f}s]: {segment.text.strip()} ---")
        
        # Check if words exist in the segment (safeguard)
        if segment.words:
            for word in segment.words:
                content.append({
                    "word": word.word,
                    "start": word.start,
                    "end": word.end,
                    "confidence": word.probability,
                })

    return final_response
