# Image Captioning AI - Project Report

## Objective

The objective of this project is to build an image captioning system that combines computer vision and natural language processing. The model takes an image as input and generates a short textual caption describing the visual content.

## Technologies Used

- Python
- TensorFlow / Keras
- ResNet50 pretrained CNN
- LSTM recurrent neural network
- Flickr8k image-caption dataset
- NumPy, Pillow, tqdm, pytest

## Methodology

The project uses an encoder-decoder architecture. The encoder is a pretrained ResNet50 model, which extracts a 2048-dimensional feature vector from each image. The decoder is an LSTM-based neural network that uses the image feature vector and the words already generated to predict the next word in the caption.

The captions are first cleaned by converting text to lowercase, removing punctuation and numbers, and filtering very short tokens. Each caption is wrapped with `startseq` and `endseq` tokens so the model learns when to begin and stop generation.

## Model Architecture

The model has two input branches:

1. Image branch: accepts the 2048-dimensional ResNet50 feature vector, applies dropout, and projects it through a dense layer.
2. Text branch: accepts a padded partial caption sequence, passes it through an embedding layer, dropout, and an LSTM.

The outputs from both branches are added together, passed through a dense decoder layer, and finally through a softmax layer that predicts the next word from the vocabulary.

## Workflow

1. Place Flickr8k images and captions under the `data/` directory.
2. Run `extract_features.py` to generate ResNet50 feature vectors.
3. Run `train.py` to train the LSTM caption decoder.
4. Run `predict.py` with an image path to generate a caption.
5. Run `pytest` to verify the data-processing helpers.

## Result

The system successfully performs the complete image captioning pipeline: image feature extraction, caption preprocessing, decoder training, and caption generation. Caption quality depends strongly on the amount of training data and number of training epochs. A model trained briefly is useful for verifying the pipeline, while a model trained on the full Flickr8k dataset for more epochs produces better captions.

## Future Improvements

- Train for more epochs with validation monitoring.
- Add BLEU score evaluation on the test split.
- Use beam search during prediction for stronger captions.
- Try a transformer-based decoder for improved language generation.
- Fine-tune the image encoder after the decoder is stable.
