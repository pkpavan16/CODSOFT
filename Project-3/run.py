import os
import json
import uvicorn
from backend.vocabulary import Vocabulary

def main():
    print("=========================================")
    print("   VisualLink AI - Image Captioner       ")
    print("=========================================")
    
    # 1. Create directories
    base_dir = os.path.dirname(os.path.abspath(__file__))
    checkpoints_dir = os.path.join(base_dir, "backend", "checkpoints")
    os.makedirs(checkpoints_dir, exist_ok=True)
    
    # 2. Pre-initialize vocabulary if it doesn't exist
    # This prevents the Custom model from erroring out during compilation at startup
    vocab_path = os.path.join(checkpoints_dir, "vocab.json")
    if not os.path.exists(vocab_path):
        print("Pre-initializing default vocabulary...")
        vocab = Vocabulary()
        default_captions = [
            "a red block",
            "a green block",
            "a blue block",
            "a yellow block",
            "a white block",
            "a black block"
        ]
        vocab.build_vocabulary(default_captions)
        vocab.save(vocab_path)
        print(f"Default vocabulary initialized with {len(vocab)} tokens.")
        
    # 3. Pre-initialize training status file if it doesn't exist
    status_path = os.path.join(checkpoints_dir, "train_status.json")
    if not os.path.exists(status_path):
        with open(status_path, "w") as f:
            json.dump({
                "status": "idle",
                "current_epoch": 0,
                "total_epochs": 0,
                "loss": 0.0
            }, f, indent=4)
            
    # 4. Start Uvicorn Server
    print("\nStarting local server on http://127.0.0.1:8000 ...")
    uvicorn.run("backend.app:app", host="127.0.0.1", port=8000, reload=True)

if __name__ == "__main__":
    main()
