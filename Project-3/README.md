# VisualLink AI - Interactive Image Captioning Dashboard

VisualLink AI is a local, cost-free image captioning application that combines Computer Vision (CNN) and Natural Language Processing (RNN/LSTM/Transformers) to generate descriptive captions for images. It features a modern, glassmorphic dark-mode web interface.

---

## Features

1. **Pre-trained Transformer (BLIP)**:
   * Powered by Salesforce's `blip-image-captioning-base` from Hugging Face `transformers`.
   * Generates highly accurate, production-grade captions locally on CPU.
2. **Custom CNN-RNN Model with Visual Attention**:
   * Encoder: Pre-trained ResNet50 (CNN) to extract spatial features.
   * Attention: Bahdanau (Additive) Spatial Attention.
   * Decoder: LSTM RNN to generate words sequentially.
   * Real-time training: Train the custom model on a synthetic dataset directly from the web interface.
3. **Word-by-Word Attention Mapping**:
   * Interactive hover-and-click UI that displays a color-blended heatmap highlighting exactly which part of the image the LSTM decoder focused on for each word.
4. **Quick Color Sample Shortcuts**:
   * Clickable solid color blocks that generate canvas images and upload them instantly to test the custom model's training accuracy.

---

## Project Structure

```
Project-3/
├── backend/
│   ├── app.py                   # FastAPI server endpoints
│   ├── model_custom.py          # Custom ResNet50 + Attention LSTM
│   ├── model_pretrained.py      # Pretrained BLIP Transformer wrapper
│   ├── train.py                 # PyTorch training script
│   ├── vocabulary.py            # Text tokenizer & word maps
│   └── utils.py                 # Image helper & attention visualizer
├── frontend/
│   ├── index.html               # SPA Dashboard layout
│   ├── style.css                # Glassmorphic dark styling
│   └── app.js                   # UI controller
├── run.py                       # Quick setup and launcher script
└── README.md                    # Project documentation
```

---

## Installation & Running

Ensure you have a Python environment. The dependencies (`torch`, `torchvision`, `transformers`, `fastapi`, `uvicorn`, `matplotlib`, `pillow`) are already installed.

### 1. Start the Server
Launch the application by running:
```bash
python run.py
```
This script will:
* Set up necessary checkpoint folders.
* Initialize a default vocabulary.
* Start the FastAPI web server on **`http://127.0.0.1:8000`**.

### 2. Access the Dashboard
Open your web browser and navigate to:
**[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

## How to Test the Models

### Testing the Pre-trained Transformer Model (BLIP)
1. Drag and drop any image (e.g., a photo of a person, car, or pet) into the upload zone or browse to select a file.
2. The BLIP model will generate an accurate description in the **Pre-trained BLIP Model** card.

### Testing the Custom Model
1. The custom model is initialized with random weights and won't make meaningful predictions initially.
2. In the left sidebar, click **Start Custom Training** (you can adjust the epochs; the default is 30, which takes less than 15 seconds on CPU).
3. The dashboard will show a real-time progress bar and loss value.
4. Once training is completed, click on any of the **Quick Color Samples** (e.g., the Red, Blue, or Green square).
5. The Custom Model will output a caption (e.g., `a red block` or `a blue block`).
6. Scroll down to the **Word-by-Word Attention Mapping** section. Hover/click on each word in the custom caption to see where the attention was focused on the color block!