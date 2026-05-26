import torch
from transformers import BlipProcessor, BlipForConditionalGeneration

class PretrainedCaptioner:
    def __init__(self, model_name="Salesforce/blip-image-captioning-base"):
        self.model_name = model_name
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Loading pretrained captioning model: {model_name} on {self.device}...")
        
        # Load processor and model
        self.processor = BlipProcessor.from_pretrained(model_name)
        self.model = BlipForConditionalGeneration.from_pretrained(model_name).to(self.device)
        self.model.eval()
        print("Pretrained model loaded successfully.")

    def generate_caption(self, image):
        """
        Generates a caption for the given PIL image.
        """
        try:
            # Preprocess the image
            inputs = self.processor(images=image, return_tensors="pt").to(self.device)
            
            # Generate captions
            with torch.no_grad():
                out = self.model.generate(**inputs, max_new_tokens=50)
                
            # Decode the generated tokens
            caption = self.processor.decode(out[0], skip_special_tokens=True)
            return caption.strip()
        except Exception as e:
            print(f"Error generating pretrained caption: {e}")
            return "Failed to generate caption with pretrained model."
