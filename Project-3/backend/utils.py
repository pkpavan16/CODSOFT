import io
import base64
import numpy as np
from PIL import Image
import torch
import torchvision.transforms as transforms
import matplotlib.pyplot as plt

# Image pre-processing for the Custom ResNet model
transform_custom = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

def preprocess_image(image_path_or_bytes, for_custom=True):
    """
    Loads an image and applies preprocessing transforms.
    Supports either a file path or a bytes stream.
    """
    if isinstance(image_path_or_bytes, bytes):
        image = Image.open(io.BytesIO(image_path_or_bytes)).convert("RGB")
    else:
        image = Image.open(image_path_or_bytes).convert("RGB")
        
    if for_custom:
        return transform_custom(image), image
    return image

def generate_attention_overlays(original_image, words, attention_maps):
    """
    Generates blended attention heatmap images for each word.
    Returns a list of base64-encoded JPEG strings.
    """
    overlays_b64 = []
    
    # Target size of the visualization (same as original image)
    width, height = original_image.size
    
    for word, attn_map in zip(words, attention_maps):
        # Reshape attention map from (49,) to (7, 7)
        heatmap = attn_map.reshape(7, 7)
        
        # Create matplotlib figure to overlay the heatmap
        fig, ax = plt.subplots(figsize=(5, 5), dpi=100)
        # Remove borders and axes
        fig.subplots_adjust(left=0, right=1, bottom=0, top=1)
        ax.axis('off')
        
        # Display original image
        ax.imshow(original_image)
        
        # Display attention heatmap overlay
        # We use a threshold to ignore very low activations and clip/normalize the map
        heatmap_resized = np.array(Image.fromarray(heatmap).resize((width, height), Image.Resampling.BILINEAR))
        
        # Apply heat map
        ax.imshow(heatmap_resized, cmap='jet', alpha=0.5, extent=(0, width, height, 0))
        
        # Save to buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='jpeg', bbox_inches='tight', pad_inches=0)
        plt.close(fig)
        
        # Encode to base64
        buf.seek(0)
        img_b64 = base64.b64encode(buf.read()).decode('utf-8')
        overlays_b64.append(f"data:image/jpeg;base64,{img_b64}")
        
    return overlays_b64
