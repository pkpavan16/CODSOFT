# Image Captioning AI

This project combines computer vision and natural language processing to generate captions for images. It uses a pretrained ResNet50 convolutional neural network to extract image features, then trains an LSTM decoder to produce a natural-language caption one word at a time.

The implementation is designed for the Flickr8k dataset and is structured so it can be used for a CodSoft-style project submission, demo, or report.

## Project Structure

```text
.
|-- captioning/
|   |-- __init__.py
|   |-- config.py
|   |-- data.py
|   |-- features.py
|   |-- model.py
|   `-- tokenizer_io.py
|-- tests/
|   `-- test_data.py
|-- extract_features.py
|-- predict.py
|-- train.py
|-- PROJECT_REPORT.md
`-- requirements.txt
```

Generated files are saved under `artifacts/` by default:

- `artifacts/features.pkl`
- `artifacts/tokenizer.pkl`
- `artifacts/caption_model.keras`
- `artifacts/training_history.json`

## Dataset Setup

Download Flickr8k and place it in this shape:

```text
data/
|-- Flickr8k_Dataset/
|   |-- 1000268201_693b08cb0e.jpg
|   `-- ...
`-- Flickr8k_text/
    `-- Flickr8k.token.txt
```

`Flickr8k.token.txt` should contain lines like:

```text
1000268201_693b08cb0e.jpg#0	A child in a pink dress is climbing up a set of stairs .
```

## Installation

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

On Google Colab, install the same requirements and upload or mount the `data/` directory.

## How It Works

1. ResNet50 is loaded with ImageNet pretrained weights.
2. The final classification layer is removed, leaving a 2048-value image feature vector.
3. Captions are cleaned, tokenized, and wrapped with `startseq` and `endseq`.
4. The decoder receives two inputs: the image feature vector and a partial caption sequence.
5. An embedding layer and LSTM learn to predict the next word.
6. During inference, the model repeatedly predicts words until it reaches `endseq` or the maximum caption length.

## Training

First extract ResNet50 image features:

```bash
python extract_features.py --images-dir data/Flickr8k_Dataset --output artifacts/features.pkl
```

Then train the LSTM decoder:

```bash
python train.py ^
  --captions-file data/Flickr8k_text/Flickr8k.token.txt ^
  --features-file artifacts/features.pkl ^
  --model-output artifacts/caption_model.keras ^
  --tokenizer-output artifacts/tokenizer.pkl
```

For a quick smoke test, use fewer epochs and images:

```bash
python train.py --epochs 1 --limit 100
```

For better captions, train on the full dataset for more epochs:

```bash
python train.py --epochs 20 --batch-size 64
```

On a CPU-only Windows setup, full training can take a long time. A practical run is:

```bash
python train.py --epochs 10 --batch-size 256 --validation-split 0.1
```

## Prediction

Generate a caption for one image:

```bash
python predict.py --image data/Flickr8k_Dataset/1000268201_693b08cb0e.jpg
```

Use beam search for a slightly broader caption search:

```bash
python predict.py --image test_dog.jpg --beam-size 3
```

If the trained LSTM decoder produces a repetitive caption, `predict.py` automatically falls back to a ResNet50 ImageNet label caption for a cleaner demo output. To see only the LSTM decoder output, use:

```bash
python predict.py --image test_dog.jpg --beam-size 3 --no-classifier-fallback
```

Example output:

```text
Caption: a photo of a pug
```

## Web UI

Run the Flask web app:

```bash
python app.py
```

Then open `http://127.0.0.1:5000` in your browser. The page lets a user upload a JPG, PNG, or WebP image, previews the upload, and generates a caption using the trained ResNet50 feature extractor plus LSTM decoder saved in `artifacts/`.

## Tests

The lightweight tests cover caption parsing, cleaning, token wrapping, and sequence generation:

```bash
pytest
```

TensorFlow-dependent behavior is exercised through the CLI scripts because full model training requires the dataset and pretrained weights.
