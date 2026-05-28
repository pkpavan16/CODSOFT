import os
import urllib.request

# Base URL for face-api.js weights
BASE_URL = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/"

# List of files to download
MODEL_FILES = [
    "ssd_mobilenetv1_model-weights_manifest.json",
    "ssd_mobilenetv1_model-shard1",
    "ssd_mobilenetv1_model-shard2",
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-shard1",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_landmark_68_tiny_model-weights_manifest.json",
    "face_landmark_68_tiny_model-shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1",
    "face_recognition_model-shard2"
]

def download_models():
    target_dir = os.path.join(os.path.dirname(__file__), "models")
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)
        print(f"Created directory: {target_dir}")

    print("Starting download of face-api.js model files...")
    
    for filename in MODEL_FILES:
        url = BASE_URL + filename
        dest_path = os.path.join(target_dir, filename)
        
        if os.path.exists(dest_path):
            print(f"File already exists: {filename}. Skipping.")
            continue
            
        print(f"Downloading {filename}...")
        try:
            # Set a User-Agent header so GitHub doesn't block the request
            req = urllib.request.Request(
                url, 
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            )
            with urllib.request.urlopen(req) as response:
                with open(dest_path, "wb") as f:
                    f.write(response.read())
            print(f"Successfully downloaded {filename}")
        except Exception as e:
            print(f"Failed to download {filename}: {e}")

if __name__ == "__main__":
    download_models()
