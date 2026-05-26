import argparse
import json
import random
from pathlib import Path

from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

from captioning.config import (
    DEFAULT_CAPTIONS_FILE,
    DEFAULT_FEATURES_FILE,
    DEFAULT_HISTORY_FILE,
    DEFAULT_MAX_LENGTH,
    DEFAULT_MODEL_FILE,
    DEFAULT_TOKENIZER_FILE,
    DEFAULT_VOCAB_SIZE,
)
from captioning.data import (
    CaptionSequence,
    create_sequence_records,
    filter_captions_to_features,
    flatten_captions,
    max_caption_length,
    parse_flickr8k_captions,
)
from captioning.features import load_features
from captioning.model import build_caption_model
from captioning.tokenizer_io import build_tokenizer, effective_vocab_size, save_tokenizer


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train a ResNet50 + LSTM image captioning model.")
    parser.add_argument("--captions-file", default=DEFAULT_CAPTIONS_FILE)
    parser.add_argument("--features-file", default=DEFAULT_FEATURES_FILE)
    parser.add_argument("--model-output", default=DEFAULT_MODEL_FILE)
    parser.add_argument("--tokenizer-output", default=DEFAULT_TOKENIZER_FILE)
    parser.add_argument("--history-output", default=DEFAULT_HISTORY_FILE)
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--max-length", type=int, default=None)
    parser.add_argument("--vocab-size", type=int, default=DEFAULT_VOCAB_SIZE)
    parser.add_argument("--limit", type=int, default=None, help="Limit images for fast smoke training.")
    parser.add_argument("--validation-split", type=float, default=0.1)
    parser.add_argument("--patience", type=int, default=3)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--verbose", type=int, default=2, choices=[0, 1, 2])
    return parser.parse_args()


def split_captions(captions: dict, validation_split: float, seed: int) -> tuple[dict, dict]:
    image_ids = list(captions.keys())
    random.Random(seed).shuffle(image_ids)

    validation_count = int(len(image_ids) * validation_split)
    validation_ids = set(image_ids[:validation_count])

    train_captions = {
        image_id: image_captions
        for image_id, image_captions in captions.items()
        if image_id not in validation_ids
    }
    validation_captions = {
        image_id: image_captions
        for image_id, image_captions in captions.items()
        if image_id in validation_ids
    }
    return train_captions, validation_captions


def main() -> None:
    args = parse_args()

    features = load_features(args.features_file)
    captions = parse_flickr8k_captions(args.captions_file)

    if args.limit:
        allowed = set(list(features.keys())[: args.limit])
        features = {image_id: feature for image_id, feature in features.items() if image_id in allowed}

    captions = filter_captions_to_features(captions, features)
    all_captions = flatten_captions(captions)
    if not all_captions:
        raise ValueError("No captions matched the extracted feature file.")

    max_length = args.max_length or max_caption_length(all_captions) or DEFAULT_MAX_LENGTH
    tokenizer = build_tokenizer(all_captions, num_words=args.vocab_size)
    vocab_size = effective_vocab_size(tokenizer, args.vocab_size)

    train_captions, validation_captions = split_captions(captions, args.validation_split, args.seed)
    train_records = create_sequence_records(tokenizer, max_length, train_captions)
    validation_records = create_sequence_records(tokenizer, max_length, validation_captions)

    if not train_records:
        raise ValueError("No training sequences were created.")

    train_sequence = CaptionSequence(train_records, features, args.batch_size, shuffle=True)
    validation_sequence = None
    if validation_records:
        validation_sequence = CaptionSequence(validation_records, features, args.batch_size, shuffle=False)

    feature_size = next(iter(features.values())).shape[0]
    model = build_caption_model(vocab_size=vocab_size, max_length=max_length, feature_size=feature_size)
    model.summary()
    callbacks = [
        ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=1, min_lr=1e-6),
        EarlyStopping(monitor="val_loss", patience=args.patience, restore_best_weights=True),
    ]
    if validation_sequence is not None:
        callbacks.append(ModelCheckpoint(args.model_output, monitor="val_loss", save_best_only=True))

    history = model.fit(
        train_sequence,
        validation_data=validation_sequence,
        epochs=args.epochs,
        verbose=args.verbose,
        callbacks=callbacks if validation_sequence is not None else None,
    )

    model_path = Path(args.model_output)
    model_path.parent.mkdir(parents=True, exist_ok=True)
    model.save(model_path)
    save_tokenizer(tokenizer, args.tokenizer_output)

    history_path = Path(args.history_output)
    history_path.parent.mkdir(parents=True, exist_ok=True)
    metadata = {
        "max_length": max_length,
        "vocab_size": vocab_size,
        "image_count": len(captions),
        "train_sequence_count": len(train_records),
        "validation_sequence_count": len(validation_records),
        "history": history.history,
    }
    history_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print(f"Saved model to {model_path}")
    print(f"Saved tokenizer to {args.tokenizer_output}")
    print(f"Saved training metadata to {history_path}")


if __name__ == "__main__":
    main()
