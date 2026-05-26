from __future__ import annotations

import json
import math
import os
import tempfile
from functools import lru_cache
from pathlib import Path

from flask import Flask, jsonify, render_template, request
from PIL import Image, UnidentifiedImageError

from captioning.config import (
    DEFAULT_HISTORY_FILE,
    DEFAULT_MAX_LENGTH,
    DEFAULT_MODEL_FILE,
    DEFAULT_TOKENIZER_FILE,
    IMAGE_SIZE,
)


ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_UPLOAD_MB = 8
TRANSFORMER_MODEL_NAME = "Salesforce/blip-image-captioning-base"
LOW_CLASSIFIER_CONFIDENCE = 0.25
ILLUSTRATION_LABELS = {
    "comic book",
    "cartoon",
    "book jacket",
    "jigsaw puzzle",
    "toyshop",
    "web site",
}
USEFUL_CARTOON_SUBJECTS = {
    "platypus",
    "toy terrier",
    "teddy",
    "mask",
    "ping-pong ball",
    "soccer ball",
    "basketball",
    "volleyball",
    "rugby ball",
    "tennis ball",
}
COLOR_NAMES = [
    ("red", (194, 56, 56)),
    ("orange", (219, 122, 45)),
    ("yellow", (221, 190, 60)),
    ("green", (70, 150, 85)),
    ("teal", (20, 160, 145)),
    ("blue", (65, 120, 200)),
    ("purple", (130, 80, 170)),
    ("pink", (210, 95, 150)),
    ("brown", (125, 85, 55)),
    ("gray", (135, 140, 140)),
    ("black", (25, 25, 25)),
    ("white", (235, 235, 235)),
]

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_MB * 1024 * 1024


@lru_cache(maxsize=1)
def transformer_caption_bundle():
    from transformers import BlipForConditionalGeneration, BlipProcessor

    processor = BlipProcessor.from_pretrained(TRANSFORMER_MODEL_NAME)
    model = BlipForConditionalGeneration.from_pretrained(TRANSFORMER_MODEL_NAME)
    return {"processor": processor, "model": model}


@lru_cache(maxsize=1)
def caption_model_bundle():
    from tensorflow.keras.models import load_model

    from captioning.features import build_feature_extractor
    from captioning.tokenizer_io import load_tokenizer
    from predict import load_max_length

    model_path = Path(DEFAULT_MODEL_FILE)
    tokenizer_path = Path(DEFAULT_TOKENIZER_FILE)
    if not model_path.exists() or not tokenizer_path.exists():
        missing = [
            str(path)
            for path in (model_path, tokenizer_path)
            if not path.exists()
        ]
        raise FileNotFoundError(f"Missing trained artifact(s): {', '.join(missing)}")

    return {
        "model": load_model(model_path),
        "tokenizer": load_tokenizer(tokenizer_path),
        "feature_extractor": build_feature_extractor(),
        "max_length": load_max_length(DEFAULT_HISTORY_FILE, DEFAULT_MAX_LENGTH),
    }


@lru_cache(maxsize=1)
def classifier_model():
    from tensorflow.keras.applications.resnet50 import ResNet50

    return ResNet50(weights="imagenet")


def validate_image(upload) -> str:
    suffix = Path(upload.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise ValueError("Please upload a JPG, PNG, or WebP image.")

    try:
        image = Image.open(upload.stream)
        image.verify()
    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError("The uploaded file is not a valid image.") from exc
    finally:
        upload.stream.seek(0)

    return suffix


def classifier_predictions(image_path: str | Path) -> list[dict]:
    import numpy as np
    from tensorflow.keras.applications.resnet50 import decode_predictions, preprocess_input
    from tensorflow.keras.preprocessing.image import img_to_array, load_img

    image = load_img(image_path, target_size=IMAGE_SIZE)
    image_array = img_to_array(image)
    image_array = np.expand_dims(image_array, axis=0)
    image_array = preprocess_input(image_array)

    prediction = classifier_model().predict(image_array, verbose=0)
    decoded = decode_predictions(prediction, top=5)[0]
    return [
        {"label": label.replace("_", " "), "confidence": float(confidence)}
        for _, label, confidence in decoded
    ]


def classifier_caption(image_path: str | Path) -> tuple[str, str, float, list[dict]]:
    from predict import SCENE_LABEL_CAPTIONS, article_for

    predictions = classifier_predictions(image_path)
    label = predictions[0]["label"]
    confidence = predictions[0]["confidence"]
    caption = SCENE_LABEL_CAPTIONS.get(label, f"a photo of {article_for(label)} {label}")
    return caption, label, confidence, predictions


def confidence_percent(confidence: float) -> int:
    return int(math.floor(confidence * 100))


def nearest_color_name(rgb: tuple[int, int, int]) -> str:
    def distance(color: tuple[int, int, int]) -> int:
        return sum((left - right) ** 2 for left, right in zip(rgb, color))

    return min(COLOR_NAMES, key=lambda item: distance(item[1]))[0]


def dominant_color_name(image_path: str | Path) -> str:
    image = Image.open(image_path).convert("RGB")
    image.thumbnail((96, 96))
    pixels = list(image.getdata())
    colorful_pixels = [
        pixel
        for pixel in pixels
        if max(pixel) - min(pixel) > 30 and not all(channel < 35 for channel in pixel)
    ]
    sample = colorful_pixels or pixels
    red = sum(pixel[0] for pixel in sample) // len(sample)
    green = sum(pixel[1] for pixel in sample) // len(sample)
    blue = sum(pixel[2] for pixel in sample) // len(sample)
    return nearest_color_name((red, green, blue))


def useful_subject(predictions: list[dict]) -> str:
    for prediction in predictions:
        label = prediction["label"]
        if label in USEFUL_CARTOON_SUBJECTS and prediction["confidence"] >= 0.03:
            return label
    return ""


def illustration_caption(image_path: str | Path, label: str, confidence: float, predictions: list[dict]) -> str:
    is_illustration = label in ILLUSTRATION_LABELS
    if is_illustration:
        subject = useful_subject(predictions)
        background_color = dominant_color_name(image_path)
        if subject:
            return f"a cartoon {subject} character on a {background_color} background"
        return f"a cartoon character on a {background_color} background"
    if confidence < LOW_CLASSIFIER_CONFIDENCE:
        return "a stylized uploaded image outside the Flickr8k photo training style"
    return ""


def generate_transformer_caption(image_path: str | Path) -> str:
    import torch

    bundle = transformer_caption_bundle()
    image = Image.open(image_path).convert("RGB")
    inputs = bundle["processor"](image, return_tensors="pt")

    with torch.no_grad():
        output_ids = bundle["model"].generate(
            **inputs,
            max_new_tokens=28,
            num_beams=5,
            repetition_penalty=1.2,
        )

    caption = bundle["processor"].decode(output_ids[0], skip_special_tokens=True)
    return caption.strip()


def generate_lstm_caption(image_path: str | Path, beam_size: int) -> tuple[str, int]:
    from captioning.features import extract_image_feature
    from predict import generate_caption, generate_caption_beam_search

    bundle = caption_model_bundle()
    image_feature = extract_image_feature(image_path, bundle["feature_extractor"])

    if beam_size > 1:
        caption = generate_caption_beam_search(
            bundle["model"],
            bundle["tokenizer"],
            image_feature,
            bundle["max_length"],
            beam_size,
        )
    else:
        caption = generate_caption(
            bundle["model"],
            bundle["tokenizer"],
            image_feature,
            bundle["max_length"],
        )
    return caption, bundle["max_length"]


def describe_image(image_path: str | Path, beam_size: int = 3) -> dict:
    from predict import conflicts_with_confident_scene_label, is_low_quality_caption

    caption = generate_transformer_caption(image_path)
    lstm_caption = ""
    max_length = load_history_max_length()

    fallback_caption, label, confidence, predictions = classifier_caption(image_path)
    ood_caption = illustration_caption(image_path, label, confidence, predictions)
    used_ood_guard = bool(ood_caption)

    used_classifier_fallback = is_low_quality_caption(caption) or conflicts_with_confident_scene_label(
        caption,
        label,
        confidence,
    )
    final_caption = fallback_caption if used_classifier_fallback else caption

    return {
        "caption": final_caption,
        "decoder_caption": lstm_caption,
        "transformer_caption": caption,
        "classifier_label": label,
        "classifier_confidence": confidence_percent(confidence),
        "classifier_predictions": predictions,
        "used_classifier_fallback": used_classifier_fallback,
        "used_ood_guard": used_ood_guard,
        "caption_source": "classifier" if used_classifier_fallback else "transformer",
        "max_length": max_length,
    }


def load_history_max_length() -> int:
    if not Path(DEFAULT_HISTORY_FILE).exists():
        return DEFAULT_MAX_LENGTH
    metadata = json.loads(Path(DEFAULT_HISTORY_FILE).read_text(encoding="utf-8"))
    return int(metadata.get("max_length", DEFAULT_MAX_LENGTH))


def training_summary() -> dict:
    summary = {
        "model_ready": Path(DEFAULT_MODEL_FILE).exists(),
        "tokenizer_ready": Path(DEFAULT_TOKENIZER_FILE).exists(),
        "history_ready": Path(DEFAULT_HISTORY_FILE).exists(),
        "dataset": "Flickr8k",
        "vision_encoder": "BLIP transformer for web captions, ResNet50 for trained project model",
        "language_decoder": "Transformer caption decoder with trained LSTM fallback artifacts",
    }

    if Path(DEFAULT_HISTORY_FILE).exists():
        metadata = json.loads(Path(DEFAULT_HISTORY_FILE).read_text(encoding="utf-8"))
        summary.update(
            {
                "max_length": metadata.get("max_length"),
                "vocab_size": metadata.get("vocab_size"),
                "epochs": metadata.get("epochs"),
                "training_images": metadata.get("training_images"),
            }
        )
    return summary


@app.get("/")
def index():
    return render_template("index.html", summary=training_summary())


@app.get("/api/status")
def status():
    return jsonify(training_summary())


@app.post("/api/caption")
def caption():
    upload = request.files.get("image")
    if upload is None or upload.filename == "":
        return jsonify({"error": "Choose an image before generating a caption."}), 400

    try:
        suffix = validate_image(upload)
        beam_size = int(request.form.get("beam_size", 3))
        beam_size = min(max(beam_size, 1), 5)

        temp_handle, temp_name = tempfile.mkstemp(suffix=suffix)
        os.close(temp_handle)
        temp_path = Path(temp_name)
        upload.save(temp_path)

        try:
            result = describe_image(temp_path, beam_size=beam_size)
        finally:
            temp_path.unlink(missing_ok=True)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except FileNotFoundError as exc:
        return jsonify({"error": str(exc)}), 500
    except OSError as exc:
        return jsonify(
            {
                "error": (
                    "The transformer caption model is not downloaded yet. "
                    "Run the app with internet once so it can fetch "
                    f"{TRANSFORMER_MODEL_NAME}."
                ),
                "details": str(exc),
            }
        ), 500

    return jsonify(result)


@app.errorhandler(413)
def upload_too_large(_error):
    return jsonify({"error": f"Images must be smaller than {MAX_UPLOAD_MB} MB."}), 413


if __name__ == "__main__":
    app.run(debug=False)
