import pickle
from pathlib import Path
from typing import Iterable

from tensorflow.keras.preprocessing.text import Tokenizer


def build_tokenizer(captions: Iterable[str], num_words: int | None = None) -> Tokenizer:
    tokenizer = Tokenizer(num_words=num_words, oov_token="<unk>")
    tokenizer.fit_on_texts(list(captions))
    return tokenizer


def effective_vocab_size(tokenizer: Tokenizer, requested_vocab_size: int | None = None) -> int:
    actual_size = len(tokenizer.word_index) + 1
    if requested_vocab_size is None:
        return actual_size
    return min(actual_size, requested_vocab_size)


def save_tokenizer(tokenizer: Tokenizer, output_path: str | Path) -> None:
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("wb") as handle:
        pickle.dump(tokenizer, handle)


def load_tokenizer(tokenizer_path: str | Path) -> Tokenizer:
    with Path(tokenizer_path).open("rb") as handle:
        return pickle.load(handle)
