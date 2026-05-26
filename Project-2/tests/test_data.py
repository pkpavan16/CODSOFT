from pathlib import Path

import numpy as np
import pytest

from captioning.data import (
    add_sequence_tokens,
    clean_caption,
    create_sequences,
    flatten_captions,
    max_caption_length,
    parse_flickr8k_captions,
)


def test_clean_caption_normalizes_text():
    assert clean_caption("A Dog, RUNS near 2 kids!") == "dog runs near kids"


def test_add_sequence_tokens():
    assert add_sequence_tokens("dog runs") == "startseq dog runs endseq"


def test_parse_flickr8k_captions(tmp_path: Path):
    captions_file = tmp_path / "Flickr8k.token.txt"
    captions_file.write_text(
        "image1.jpg#0\tA dog runs.\n"
        "image1.jpg#1\tA dog plays!\n"
        "image2.jpg#0\tTwo kids sit outside.\n",
        encoding="utf-8",
    )

    captions = parse_flickr8k_captions(captions_file)

    assert captions["image1.jpg"] == [
        "startseq dog runs endseq",
        "startseq dog plays endseq",
    ]
    assert captions["image2.jpg"] == ["startseq two kids sit outside endseq"]


def test_tokenizer_and_sequence_creation():
    pytest.importorskip("tensorflow")
    from captioning.tokenizer_io import build_tokenizer, effective_vocab_size

    captions = {"image1.jpg": ["startseq dog runs endseq"]}
    tokenizer = build_tokenizer(flatten_captions(captions), num_words=50)
    vocab_size = effective_vocab_size(tokenizer, 50)
    features = {"image1.jpg": np.ones(2048)}

    image_inputs, text_inputs, word_outputs = create_sequences(
        tokenizer=tokenizer,
        max_length=max_caption_length(flatten_captions(captions)),
        captions=captions,
        features=features,
        vocab_size=vocab_size,
    )

    assert len(image_inputs) == 3
    assert len(text_inputs) == 3
    assert len(word_outputs) == 3
    assert image_inputs[0].shape == (2048,)
