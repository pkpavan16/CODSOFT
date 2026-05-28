import sys
import os
# Add the project root directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import time
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import numpy as np

from backend.vocabulary import Vocabulary
from backend.model_custom import CNNAttentionRNN
from backend.utils import transform_custom

# Path definitions
CHECKPOINT_DIR = os.path.join(os.path.dirname(__file__), "checkpoints")
STATUS_FILE = os.path.join(CHECKPOINT_DIR, "train_status.json")
MODEL_PATH = os.path.join(CHECKPOINT_DIR, "model_custom.pth")
VOCAB_PATH = os.path.join(CHECKPOINT_DIR, "vocab.json")

# Synthetic data definition: color blocks mapped to captions
SYNTHETIC_DATA = [
    {"color": (255, 0, 0), "caption": "a red block"},
    {"color": (0, 255, 0), "caption": "a green block"},
    {"color": (0, 0, 255), "caption": "a blue block"},
    {"color": (255, 255, 0), "caption": "a yellow block"},
    {"color": (255, 255, 255), "caption": "a white block"},
    {"color": (0, 0, 0), "caption": "a black block"},
]

class SyntheticColorDataset(Dataset):
    def __init__(self, vocab, size=120, transform=None):
        self.vocab = vocab
        self.transform = transform
        self.data = []
        
        # Duplicate the synthetic data to simulate a larger dataset
        for _ in range(size // len(SYNTHETIC_DATA)):
            for item in SYNTHETIC_DATA:
                self.data.append(item)
                
    def __len__(self):
        return len(self.data)
        
    def __getitem__(self, idx):
        item = self.data[idx]
        color = item["color"]
        caption = item["caption"]
        
        # Create a solid color PIL image (224x224)
        img_array = np.zeros((224, 224, 3), dtype=np.uint8)
        img_array[:, :] = color
        image = Image.fromarray(img_array)
        
        if self.transform:
            image = self.transform(image)
            
        # Numericalize caption with start and end tokens
        tokens = ["<start>"] + Vocabulary.tokenize(caption) + ["<end>"]
        numericalized_caption = [self.vocab.stoi.get(t, self.vocab.stoi["<unk>"]) for t in tokens]
        
        return image, torch.tensor(numericalized_caption)

def collate_fn(batch):
    """
    Padding batch captions to the same length.
    """
    images = []
    captions = []
    for img, cap in batch:
        images.append(img)
        captions.append(cap)
        
    images = torch.stack(images, 0)
    # Pad sequences
    padded_captions = nn.utils.rnn.pad_sequence(captions, batch_first=True, padding_value=0)
    return images, padded_captions

def update_status(status, current_epoch, total_epochs, loss, val_loss=None):
    os.makedirs(CHECKPOINT_DIR, exist_ok=True)
    status_data = {
        "status": status,
        "current_epoch": current_epoch,
        "total_epochs": total_epochs,
        "loss": float(loss),
        "updated_at": time.time()
    }
    with open(STATUS_FILE, "w") as f:
        json.dump(status_data, f, indent=4)

def get_training_status():
    if os.path.exists(STATUS_FILE):
        try:
            with open(STATUS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {"status": "idle", "current_epoch": 0, "total_epochs": 0, "loss": 0.0}

def train_custom_model(epochs=30, batch_size=8, learning_rate=3e-4):
    try:
        update_status("initializing", 0, epochs, 0.0)
        
        # 1. Setup Vocabulary
        vocab = Vocabulary()
        # Build vocab from synthetic captions
        captions = [item["caption"] for item in SYNTHETIC_DATA]
        vocab.build_vocabulary(captions)
        vocab.save(VOCAB_PATH)
        print(f"Vocabulary saved to {VOCAB_PATH}. Size: {len(vocab)}")
        
        # 2. Setup Dataset & Loader
        dataset = SyntheticColorDataset(vocab, size=120, transform=transform_custom)
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True, collate_fn=collate_fn)
        
        # 3. Setup Model
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = CNNAttentionRNN(
            embed_size=256,
            decoder_dim=256,
            vocab_size=len(vocab),
            attn_dim=128
        ).to(device)
        
        criterion = nn.CrossEntropyLoss(ignore_index=vocab.stoi["<pad>"])
        # Only optimize decoder and encoder projection (ResNet layers are frozen)
        optimizer = optim.Adam(
            filter(lambda p: p.requires_grad, model.parameters()), 
            lr=learning_rate
        )
        
        # 4. Training Loop
        model.train()
        print("Starting training...")
        
        for epoch in range(1, epochs + 1):
            epoch_loss = 0.0
            num_batches = 0
            
            for images, captions in dataloader:
                images = images.to(device)
                captions = captions.to(device)
                
                # Zero the gradients
                optimizer.zero_grad()
                
                # Forward pass: shape (batch_size, seq_len-1, vocab_size)
                # captions[:, :-1] is the input to the decoder
                outputs = model(images, captions)
                
                # We want to match output words (from index 1 onwards, since 0 is start word output)
                # Targets: captions[:, 1:]
                targets = captions[:, 1:]
                
                # Reshape for loss calculation
                loss = criterion(outputs.view(-1, outputs.shape[-1]), targets.reshape(-1))
                
                # Backward pass
                loss.backward()
                
                # Gradient clipping
                torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
                
                # Step optimizer
                optimizer.step()
                
                epoch_loss += loss.item()
                num_batches += 1
                
            avg_loss = epoch_loss / num_batches
            print(f"Epoch [{epoch}/{epochs}] | Loss: {avg_loss:.4f}")
            update_status("training", epoch, epochs, avg_loss)
            
            # Simple sleep to simulate normal training speed if it is too fast on some systems,
            # but CPU training of ResNet50 projection + LSTM on 120 samples takes around 0.5s per epoch.
            time.sleep(0.1)
            
        # 5. Save weights
        torch.save(model.state_dict(), MODEL_PATH)
        print(f"Model saved to {MODEL_PATH}")
        update_status("completed", epochs, epochs, avg_loss)
        
    except Exception as e:
        print(f"Training failed: {e}")
        update_status(f"failed: {str(e)}", 0, epochs, 0.0)

if __name__ == "__main__":
    train_custom_model()
