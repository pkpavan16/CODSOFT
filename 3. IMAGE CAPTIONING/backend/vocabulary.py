import json
import os
import re

class Vocabulary:
    def __init__(self, freq_threshold=1):
        self.itos = {0: "<pad>", 1: "<start>", 2: "<end>", 3: "<unk>"}
        self.stoi = {"<pad>": 0, "<start>": 1, "<end>": 2, "<unk>": 3}
        self.freq_threshold = freq_threshold

    def __len__(self):
        return len(self.itos)

    @staticmethod
    def tokenize(text):
        # Convert to lowercase and split by word characters, keeping it self-contained
        text = text.lower().strip()
        tokens = re.findall(r'\b\w+\b', text)
        return tokens

    def build_vocabulary(self, sentence_list):
        frequencies = {}
        idx = len(self.itos)

        for sentence in sentence_list:
            for word in self.tokenize(sentence):
                frequencies[word] = frequencies.get(word, 0) + 1

        for word, count in frequencies.items():
            if count >= self.freq_threshold:
                if word not in self.stoi:
                    self.stoi[word] = idx
                    self.itos[idx] = word
                    idx += 1

    def numericalize(self, text):
        tokenized_text = self.tokenize(text)
        return [
            self.stoi.get(token, self.stoi["<unk>"])
            for token in tokenized_text
        ]

    def decode(self, indices):
        words = []
        for idx in indices:
            # Handle list/tensor type conversions
            idx_val = int(idx)
            if idx_val == self.stoi["<end>"]:
                break
            if idx_val not in [self.stoi["<pad>"], self.stoi["<start>"]]:
                words.append(self.itos.get(idx_val, "<unk>"))
        return " ".join(words)

    def save(self, filepath):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        data = {
            "itos": {str(k): v for k, v in self.itos.items()},
            "stoi": self.stoi,
            "freq_threshold": self.freq_threshold
        }
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)

    @classmethod
    def load(cls, filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        vocab = cls(freq_threshold=data.get("freq_threshold", 1))
        # Ensure keys are converted back to integers for itos
        vocab.itos = {int(k): v for k, v in data["itos"].items()}
        vocab.stoi = data["stoi"]
        return vocab
