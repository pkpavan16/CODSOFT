import os
import threading
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from PIL import Image
import torch
import io

from backend.vocabulary import Vocabulary
from backend.model_custom import CNNAttentionRNN
from backend.model_pretrained import PretrainedCaptioner
from backend.utils import preprocess_image, generate_attention_overlays
from backend.train import train_custom_model, get_training_status, MODEL_PATH, VOCAB_PATH

app = FastAPI(title="Image Captioning AI Server")

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global models cache
models_cache = {
    "pretrained": None,
    "custom": None,
    "vocab": None
}

def load_pretrained_model():
    if models_cache["pretrained"] is None:
        try:
            models_cache["pretrained"] = PretrainedCaptioner()
        except Exception as e:
            print(f"Error loading BLIP model: {e}")
            raise HTTPException(status_code=500, detail="Failed to load pretrained BLIP model.")
    return models_cache["pretrained"]

def load_custom_model(force_reload=False):
    if not os.path.exists(MODEL_PATH) or not os.path.exists(VOCAB_PATH):
        return None, None
        
    if models_cache["custom"] is None or force_reload:
        try:
            print("Loading custom model and vocabulary...")
            vocab = Vocabulary.load(VOCAB_PATH)
            models_cache["vocab"] = vocab
            
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            model = CNNAttentionRNN(
                embed_size=256,
                decoder_dim=256,
                vocab_size=len(vocab),
                attn_dim=128
            ).to(device)
            
            model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
            model.eval()
            models_cache["custom"] = model
            print("Custom model loaded successfully.")
        except Exception as e:
            print(f"Error loading custom model: {e}")
            return None, None
            
    return models_cache["custom"], models_cache["vocab"]

@app.post("/api/caption")
async def generate_caption_endpoint(
    file: UploadFile = File(...), 
    run_custom: bool = True, 
    run_pretrained: bool = True
):
    # Read uploaded image bytes
    contents = await file.read()
    
    response_data = {
        "custom_caption": None,
        "custom_attention": None,
        "pretrained_caption": None,
        "error": None
    }
    
    # 1. Run Pretrained Model (BLIP)
    if run_pretrained:
        try:
            # Lazy load model
            blip = load_pretrained_model()
            image_pil = Image.open(io.BytesIO(contents)).convert("RGB")
            response_data["pretrained_caption"] = blip.generate_caption(image_pil)
        except Exception as e:
            print(f"Pretrained captioning failed: {e}")
            response_data["pretrained_caption"] = "Failed to run pretrained model."

    # 2. Run Custom Model
    if run_custom:
        custom_model, vocab = load_custom_model()
        if custom_model is not None and vocab is not None:
            try:
                # Preprocess image
                tensor_img, original_img = preprocess_image(contents, for_custom=True)
                
                # Generate caption and attention map
                words, attention_maps = custom_model.generate_caption(tensor_img, vocab)
                response_data["custom_caption"] = " ".join(words)
                
                # Generate base64 overlays
                overlays = generate_attention_overlays(original_img, words, attention_maps)
                
                # Package words and their corresponding overlay base64 maps
                response_data["custom_attention"] = [
                    {"word": w, "overlay": o} for w, o in zip(words, overlays)
                ]
            except Exception as e:
                print(f"Custom captioning failed: {e}")
                response_data["custom_caption"] = f"Failed to run custom model: {str(e)}"
        else:
            response_data["custom_caption"] = "Custom model not trained yet. Use the sidebar to train it!"
            
    return response_data

@app.get("/api/train-status")
def train_status_endpoint():
    status = get_training_status()
    # Check if custom model is available
    status["model_available"] = os.path.exists(MODEL_PATH)
    return status

@app.post("/api/train")
def start_training_endpoint(background_tasks: BackgroundTasks, epochs: int = 30):
    status = get_training_status()
    if status["status"] == "training":
        return {"message": "Training is already in progress."}
        
    # Trigger background training
    background_tasks.add_task(train_custom_model_wrapper, epochs)
    return {"message": "Training started in background."}

def train_custom_model_wrapper(epochs):
    train_custom_model(epochs=epochs)
    # Reload model weights after training is finished
    load_custom_model(force_reload=True)

# Mount frontend files
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
os.makedirs(frontend_path, exist_ok=True)

# Main entry point to serve UI
@app.get("/")
def get_index():
    index_file = os.path.join(frontend_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Frontend index.html not found. Please compile frontend."}

app.mount("/", StaticFiles(directory=frontend_path), name="frontend")
