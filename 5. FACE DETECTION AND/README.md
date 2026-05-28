# Aegis Face AI 🛡️👤

A premium, client-side, real-time AI Face Detection & Recognition Dashboard built with modern Vanilla JS and styled with a sleek, synthwave/cyberpunk dark glassmorphism design. The application utilizes **Face-API.js** (built on **TensorFlow.js**) to perform deep learning face analysis directly inside the user's browser, ensuring total privacy and near-instant inference using WebGL hardware acceleration.

![Demo Mockup](https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/media/intro.gif) *(Example of neural face detection overlays)*

---

## 🌟 Features

- **Real-Time Webcam Inference**: High-framerate face detection directly via the user's camera feed.
- **Multiple Model Engines**: 
  - **SSD MobileNet V1**: Deep learning detector for maximum precision and overlap handling.
  - **Tiny Face Detector**: Lightweight model optimized for low-end CPUs and high framerates.
- **68-Point Facial Landmark Detection**: Plots critical structural points (eyes, eyebrows, nose, mouth, jawline).
- **Embedded Face Recognition (Siamese Network Matching)**:
  - Generates 128-dimensional floating-point embeddings (descriptors) for any detected face.
  - Computes Euclidean distance to compare descriptors against the local database.
- **Interactive Face Registry**:
  - Register new faces on the fly using active webcam/video frames.
  - Crop face images to automatically generate visual profile thumbnails.
  - Pre-register profiles by uploading static images (e.g. standard profile headshots).
  - Persists database signatures locally using the browser's `LocalStorage`.
- **Static Media Analysis**: Drag & drop or select image and video files to run bounding box, landmark, and recognition models on external footage.
- **Adjustable Controls**: Tweak threshold confidence values, toggle boxes/landmarks/matching dynamically, and track performance with the active FPS and detection count gauges.

---

## 🚀 Quick Start

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) and [Python](https://www.python.org/) installed on your machine.

### 2. Download Pre-trained Models
The neural network weights must be downloaded to the local directory. We've included a Python utility script to automate this:
```bash
python download_models.py
```
This downloads the manifest files and binary shards for SSD MobileNet, Tiny Face Detector, Landmark-68, and Face Recognition into the `./models` directory.

### 3. Install & Launch Server
To allow CORS-safe model loading from local file paths, you must serve the files via HTTP. Install the local web server and boot the application:
```bash
# Install dependencies
npm install

# Start the dev server
npm start
```
Once launched, open your web browser and navigate to:
👉 **[http://localhost:8080](http://localhost:8080)**

---

## 🛠️ Project Structure

```
├── models/                     # Downloaded neural network weight files (.json & shards)
├── app.js                      # Core state management, face-api pipeline, & DB logic
├── download_models.py          # Python downloader utility
├── index.html                  # Main application HTML structure
├── package.json                # Project description & start script
├── README.md                   # Project documentation
└── styles.css                  # UI theme: Cyberpunk glassmorphic stylesheet
```

---

## 🧠 Neural Networks & Architecture

1. **Face Detection (SSD MobileNet V1)**:
   - Uses a Single Shot Multibox Detector framework based on MobileNet V1.
   - Provides high localization accuracy and detects faces of varying scales.
2. **Face Landmarks (Landmark 68)**:
   - Identifies 68 landmark points on the face, used for face alignment.
   - Alignment is a crucial preprocessing step for face recognition, rotating and scaling the face to normalize the features.
3. **Face Recognition (ResNet-like Network)**:
   - Extends the ResNet-34 architecture.
   - Map a face image to a 128-dimensional vector space where distance represents similarity.
   - If the Euclidean distance between two descriptors is `< 0.6` (configurable in matching parameters), they are classified as the same person.

---

## 🔒 Security & Privacy
Because Aegis Face AI runs **100% client-side**, your webcam stream, uploaded images, and registered face signatures are never sent to external servers or cloud services. Your data remains fully secure in your own browser environment.
