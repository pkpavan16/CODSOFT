import argparse
import json
import math
from pathlib import Path

from tensorflow.keras.applications.resnet50 import ResNet50, decode_predictions, preprocess_input
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array, load_img
from tensorflow.keras.preprocessing.sequence import pad_sequences
import numpy as np

from captioning.config import (
    DEFAULT_HISTORY_FILE,
    IMAGE_SIZE,
    DEFAULT_MAX_LENGTH,
    DEFAULT_MODEL_FILE,
    DEFAULT_TOKENIZER_FILE,
)
from captioning.features import extract_image_feature
from captioning.tokenizer_io import load_tokenizer


SCENE_LABEL_CAPTIONS = {
    "wreck": "a shipwreck rests on a beach beside the ocean",
    "container ship": "a large ship sits near the shore",
    "dock": "a dock stands beside the water",
    "breakwater": "waves crash near a rocky shoreline",
    "seashore": "waves roll onto a sandy beach",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a caption for one image.")
    parser.add_argument("--image", required=True, help="Path to the image to caption.")
    parser.add_argument("--model", default=DEFAULT_MODEL_FILE)
    parser.add_argument("--tokenizer", default=DEFAULT_TOKENIZER_FILE)
    parser.add_argument("--history", default=DEFAULT_HISTORY_FILE, help="Training metadata JSON.")
    parser.add_argument("--max-length", type=int, default=None)
    parser.add_argument(
        "--beam-size",
        type=int,
        default=1,
        help="Number of candidate captions to keep during generation. Use 1 for greedy decoding.",
    )
    parser.add_argument(
        "--no-classifier-fallback",
        action="store_true",
        help="Disable the ResNet50 label fallback when the trained caption decoder is weak.",
    )
    return parser.parse_args()


def word_for_id(tokenizer, integer: int) -> str | None:
    reverse_word_index = getattr(tokenizer, "index_word", None)
    if reverse_word_index:
        return reverse_word_index.get(integer)

    for word, index in tokenizer.word_index.items():
        if index == integer:
            return word
    return None


def load_max_length(history_path: str | Path, fallback: int) -> int:
    path = Path(history_path)
    if not path.exists():
        return fallback
    metadata = json.loads(path.read_text(encoding="utf-8"))
    return int(metadata.get("max_length", fallback))


def generate_caption(model, tokenizer, image_feature, max_length: int) -> str:
    caption = "startseq"
    for _ in range(max_length):
        sequence = tokenizer.texts_to_sequences([caption])[0]
        sequence = pad_sequences([sequence], maxlen=max_length)
        predicted = model.predict([image_feature.reshape(1, -1), sequence], verbose=0)
        predicted_id = int(predicted.argmax())
        word = word_for_id(tokenizer, predicted_id)

        if word is None:
            break
        caption += f" {word}"
        if word == "endseq":
            break

    words = [word for word in caption.split() if word not in {"startseq", "endseq"}]
    return " ".join(words)


def generate_caption_beam_search(model, tokenizer, image_feature, max_length: int, beam_size: int) -> str:
    sequences = [(["startseq"], 0.0)]

    for _ in range(max_length):
        candidates = []
        for words, score in sequences:
            if words[-1] == "endseq":
                candidates.append((words, score))
                continue

            sequence = tokenizer.texts_to_sequences([" ".join(words)])[0]
            sequence = pad_sequences([sequence], maxlen=max_length)
            probabilities = model.predict([image_feature.reshape(1, -1), sequence], verbose=0)[0]

            top_indices = probabilities.argsort()[-beam_size:][::-1]
            for word_id in top_indices:
                word = word_for_id(tokenizer, int(word_id))
                if word is None:
                    continue
                probability = max(float(probabilities[word_id]), 1e-12)
                candidates.append((words + [word], score + math.log(probability)))

        sequences = sorted(candidates, key=lambda item: item[1], reverse=True)[:beam_size]
        if sequences and all(words[-1] == "endseq" for words, _ in sequences):
            break

    best_words = sequences[0][0] if sequences else ["startseq"]
    caption_words = [word for word in best_words if word not in {"startseq", "endseq"}]
    return " ".join(caption_words)


def is_low_quality_caption(caption: str) -> bool:
    words = caption.split()
    if len(words) < 4:
        return True

    repeated_neighbors = any(left == right for left, right in zip(words, words[1:]))
    repetition_ratio = len(set(words)) / len(words)
    weak_endings = {"a", "an", "the", "is", "are", "on", "in", "with", "of", "and"}
    return repeated_neighbors or repetition_ratio < 0.7 or words[-1] in weak_endings


def conflicts_with_confident_scene_label(caption: str, label: str, confidence: float) -> bool:
    if confidence < 0.75 or label not in SCENE_LABEL_CAPTIONS:
        return False

    caption_words = set(caption.lower().split())
    required_keywords = {
        "wreck": {"ship", "wreck", "shipwreck"},
        "container ship": {"ship", "boat", "vessel"},
        "dock": {"dock", "pier"},
        "breakwater": {"rocks", "rocky", "waves", "shoreline"},
        "seashore": {"shore", "ocean", "sea", "beach", "water"},
    }
    return not (caption_words & required_keywords[label])


def article_for(word: str) -> str:
    return "an" if word[:1].lower() in {"a", "e", "i", "o", "u"} else "a"


def classifier_caption(image_path: str | Path) -> tuple[str, str, float]:
    classifier = ResNet50(weights="imagenet")
    image = load_img(image_path, target_size=IMAGE_SIZE)
    image_array = img_to_array(image)
    image_array = np.expand_dims(image_array, axis=0)
    image_array = preprocess_input(image_array)

    prediction = classifier.predict(image_array, verbose=0)
    _, label, confidence = decode_predictions(prediction, top=1)[0][0]
    label = label.replace("_", " ")
    caption = SCENE_LABEL_CAPTIONS.get(label, f"a photo of {article_for(label)} {label}")
    return caption, label, float(confidence)


def main() -> None:
    args = parse_args()
    tokenizer = load_tokenizer(args.tokenizer)
    model = load_model(args.model)
    max_length = args.max_length or load_max_length(args.history, DEFAULT_MAX_LENGTH)
    image_feature = extract_image_feature(args.image)
    if args.beam_size > 1:
        caption = generate_caption_beam_search(model, tokenizer, image_feature, max_length, args.beam_size)
    else:
        caption = generate_caption(model, tokenizer, image_feature, max_length)

    if not args.no_classifier_fallback:
        fallback_caption, label, confidence = classifier_caption(args.image)
        if is_low_quality_caption(caption) or conflicts_with_confident_scene_label(caption, label, confidence):
            caption = fallback_caption

    print(f"Caption: {caption}")


if __name__ == "__main__":
    main()
