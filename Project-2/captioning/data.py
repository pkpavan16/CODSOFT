import re
from collections import defaultdict
from pathlib import Path
from typing import Dict, Iterable, Iterator, List, Tuple

import numpy as np
from tensorflow.keras.utils import Sequence


CaptionMap = Dict[str, List[str]]


def clean_caption(text: str) -> str:
    """Normalize one caption into lowercase alphabetic tokens."""
    text = text.lower()
    text = re.sub(r"[^a-z\s]", " ", text)
    words = [word for word in text.split() if len(word) > 1]
    return " ".join(words)


def add_sequence_tokens(caption: str) -> str:
    return f"startseq {caption} endseq"


def parse_flickr8k_captions(captions_file: str | Path) -> CaptionMap:
    captions: CaptionMap = defaultdict(list)
    path = Path(captions_file)

    with path.open("r", encoding="utf-8") as handle:
        for raw_line in handle:
            line = raw_line.strip()
            if not line:
                continue

            if "\t" in line:
                image_part, caption = line.split("\t", 1)
            else:
                parts = line.split(maxsplit=1)
                if len(parts) != 2:
                    continue
                image_part, caption = parts

            image_id = image_part.split("#", 1)[0]
            cleaned = clean_caption(caption)
            if cleaned:
                captions[image_id].append(add_sequence_tokens(cleaned))

    return dict(captions)


def flatten_captions(captions: CaptionMap) -> List[str]:
    return [caption for image_captions in captions.values() for caption in image_captions]


def max_caption_length(captions: Iterable[str]) -> int:
    return max(len(caption.split()) for caption in captions)


def filter_captions_to_features(captions: CaptionMap, features: dict) -> CaptionMap:
    return {
        image_id: image_captions
        for image_id, image_captions in captions.items()
        if image_id in features
    }


def create_sequences(
    tokenizer,
    max_length: int,
    captions: CaptionMap,
    features: dict,
    vocab_size: int,
) -> Tuple[list, list, list]:
    from tensorflow.keras.preprocessing.sequence import pad_sequences
    from tensorflow.keras.utils import to_categorical

    image_inputs, text_inputs, word_outputs = [], [], []

    for image_id, image_captions in captions.items():
        feature = features.get(image_id)
        if feature is None:
            continue

        for caption in image_captions:
            sequence = tokenizer.texts_to_sequences([caption])[0]
            for index in range(1, len(sequence)):
                in_sequence = sequence[:index]
                out_sequence = sequence[index]
                in_sequence = pad_sequences([in_sequence], maxlen=max_length)[0]
                out_sequence = to_categorical([out_sequence], num_classes=vocab_size)[0]

                image_inputs.append(feature)
                text_inputs.append(in_sequence)
                word_outputs.append(out_sequence)

    return image_inputs, text_inputs, word_outputs


def create_sequence_records(tokenizer, max_length: int, captions: CaptionMap) -> List[Tuple[str, np.ndarray, int]]:
    from tensorflow.keras.preprocessing.sequence import pad_sequences

    records = []
    for image_id, image_captions in captions.items():
        for caption in image_captions:
            sequence = tokenizer.texts_to_sequences([caption])[0]
            for index in range(1, len(sequence)):
                in_sequence = pad_sequences([sequence[:index]], maxlen=max_length)[0]
                out_word = int(sequence[index])
                records.append((image_id, in_sequence, out_word))
    return records


class CaptionSequence(Sequence):
    def __init__(self, records, features: dict, batch_size: int, shuffle: bool = True):
        super().__init__()
        self.records = list(records)
        self.features = features
        self.batch_size = batch_size
        self.shuffle = shuffle
        self.indices = np.arange(len(self.records))
        self.on_epoch_end()

    def __len__(self):
        return int(np.ceil(len(self.records) / self.batch_size))

    def __getitem__(self, batch_index: int):
        start = batch_index * self.batch_size
        stop = start + self.batch_size
        batch_indices = self.indices[start:stop]
        batch_records = [self.records[index] for index in batch_indices]

        image_inputs = np.asarray(
            [self.features[image_id] for image_id, _, _ in batch_records],
            dtype="float32",
        )
        text_inputs = np.asarray(
            [in_sequence for _, in_sequence, _ in batch_records],
            dtype="int32",
        )
        word_outputs = np.asarray(
            [out_word for _, _, out_word in batch_records],
            dtype="int32",
        )
        return {"image_features": image_inputs, "partial_caption": text_inputs}, word_outputs

    def on_epoch_end(self):
        if self.shuffle:
            np.random.shuffle(self.indices)


def iter_image_paths(images_dir: str | Path) -> Iterator[Path]:
    path = Path(images_dir)
    extensions = {".jpg", ".jpeg", ".png"}
    yield from sorted(file for file in path.iterdir() if file.suffix.lower() in extensions)
