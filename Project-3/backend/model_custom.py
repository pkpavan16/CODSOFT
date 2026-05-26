import torch
import torch.nn as nn
import torchvision.models as models
from torchvision.models import MobileNet_V2_Weights

class EncoderCNN(nn.Module):
    def __init__(self, embed_size):
        super(EncoderCNN, self).__init__()
        # Use pretrained MobileNetV2 for faster CPU performance
        try:
            mobilenet = models.mobilenet_v2(weights=MobileNet_V2_Weights.DEFAULT)
            print("Successfully loaded MobileNetV2 with pretrained weights.")
        except Exception as e:
            print(f"Warning: Failed to load pretrained MobileNetV2 weights ({e}). Initializing with random weights.")
            mobilenet = models.mobilenet_v2(weights=None)
            
        self.features = mobilenet.features
        
        # Freeze MobileNet parameters to speed up CPU training
        for param in self.features.parameters():
            param.requires_grad = False
            
        # Projection layer to match the decoder's embedding size
        # MobileNetV2 features output shape: (batch, 1280, 7, 7) -> 1280 channels
        self.project = nn.Linear(1280, embed_size)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.3)

    def forward(self, images):
        # Shape: (batch_size, 1280, 7, 7)
        features = self.features(images)
        
        # Reshape to (batch_size, 49, 1280) -> 49 spatial locations (7x7)
        features = features.permute(0, 2, 3, 1)
        features = features.view(features.size(0), -1, features.size(-1))
        
        # Project features to embed_size: (batch_size, 49, embed_size)
        features = self.project(features)
        features = self.relu(features)
        features = self.dropout(features)
        return features


class BahdanauAttention(nn.Module):
    def __init__(self, encoder_dim, decoder_dim, attn_dim):
        super(BahdanauAttention, self).__init__()
        self.W_features = nn.Linear(encoder_dim, attn_dim)
        self.W_hidden = nn.Linear(decoder_dim, attn_dim)
        self.V_attn = nn.Linear(attn_dim, 1)
        self.softmax = nn.Softmax(dim=1)
        self.relu = nn.ReLU()

    def forward(self, features, hidden_state):
        # features shape: (batch_size, 49, encoder_dim)
        # hidden_state shape: (batch_size, decoder_dim)
        
        # Project features: (batch_size, 49, attn_dim)
        features_proj = self.W_features(features)
        
        # Project hidden state: (batch_size, 1, attn_dim)
        hidden_proj = self.W_hidden(hidden_state).unsqueeze(1)
        
        # Combined score: (batch_size, 49, 1)
        scores = self.V_attn(self.relu(features_proj + hidden_proj))
        
        # Calculate attention weights: (batch_size, 49)
        attention_weights = self.softmax(scores.squeeze(2))
        
        # Context vector: (batch_size, encoder_dim)
        # element-wise multiply weights with features and sum over the 49 locations
        context_vector = (features * attention_weights.unsqueeze(2)).sum(dim=1)
        
        return context_vector, attention_weights


class DecoderRNN(nn.Module):
    def __init__(self, embed_size, decoder_dim, vocab_size, attn_dim, encoder_dim=256):
        super(DecoderRNN, self).__init__()
        self.vocab_size = vocab_size
        self.encoder_dim = encoder_dim
        self.decoder_dim = decoder_dim
        
        # Word embedding layer
        self.embedding = nn.Embedding(vocab_size, embed_size)
        
        # Attention layer
        self.attention = BahdanauAttention(encoder_dim, decoder_dim, attn_dim)
        
        # LSTM Cell
        # Input to LSTM Cell is word_embedding + context_vector
        self.lstm_cell = nn.LSTMCell(embed_size + encoder_dim, decoder_dim)
        
        # Output classifier
        self.fc = nn.Linear(decoder_dim, vocab_size)
        
        # Linear layers to initialize hidden and cell states from encoder features
        self.init_h = nn.Linear(encoder_dim, decoder_dim)
        self.init_c = nn.Linear(encoder_dim, decoder_dim)
        
        self.dropout = nn.Dropout(0.3)

    def init_hidden_states(self, encoder_features):
        # Average features across the 49 spatial spots: (batch_size, encoder_dim)
        mean_features = encoder_features.mean(dim=1)
        h = self.init_h(mean_features)
        c = self.init_c(mean_features)
        return h, c

    def forward(self, encoder_features, captions):
        # captions shape: (batch_size, max_seq_len)
        # encoder_features shape: (batch_size, 49, encoder_dim)
        batch_size = encoder_features.size(0)
        max_len = captions.size(1) - 1 # We don't predict after <end>
        
        # Initialize hidden and cell states
        h, c = self.init_hidden_states(encoder_features)
        
        # Embedding for all words in the captions: (batch_size, max_len + 1, embed_size)
        embeddings = self.embedding(captions)
        
        # Output tensor to hold predictions
        outputs = torch.zeros(batch_size, max_len, self.vocab_size).to(encoder_features.device)
        
        for t in range(max_len):
            # Step attention
            context, _ = self.attention(encoder_features, h)
            
            # Current word input: (batch_size, embed_size)
            word_input = embeddings[:, t, :]
            
            # Concatenate embedding and context: (batch_size, embed_size + encoder_dim)
            lstm_input = torch.cat((word_input, context), dim=1)
            
            # Forward pass through LSTM Cell
            h, c = self.lstm_cell(lstm_input, (h, c))
            
            # Predict vocabulary probabilities: (batch_size, vocab_size)
            preds = self.fc(self.dropout(h))
            outputs[:, t, :] = preds
            
        return outputs


class CNNAttentionRNN(nn.Module):
    def __init__(self, embed_size, decoder_dim, vocab_size, attn_dim):
        super(CNNAttentionRNN, self).__init__()
        self.encoder = EncoderCNN(embed_size)
        self.decoder = DecoderRNN(
            embed_size=embed_size,
            decoder_dim=decoder_dim,
            vocab_size=vocab_size,
            attn_dim=attn_dim,
            encoder_dim=embed_size
        )

    def forward(self, images, captions):
        features = self.encoder(images)
        outputs = self.decoder(features, captions)
        return outputs

    def generate_caption(self, image, vocab, max_len=20):
        self.eval()
        device = next(self.parameters()).device
        
        # Add batch dimension to image: (1, 3, 224, 224)
        if len(image.shape) == 3:
            image = image.unsqueeze(0)
        image = image.to(device)
        
        with torch.no_grad():
            features = self.encoder(image) # Shape: (1, 49, embed_size)
            h, c = self.decoder.init_hidden_states(features)
            
            # Starting word is "<start>"
            word_idx = vocab.stoi["<start>"]
            word_tensor = torch.tensor([word_idx]).to(device)
            
            generated_sentence = []
            attention_maps = []
            
            for _ in range(max_len):
                context, attn_weights = self.decoder.attention(features, h) # attn_weights: (1, 49)
                attention_maps.append(attn_weights.squeeze(0).cpu().numpy())
                
                # Embedding: (1, embed_size)
                word_embed = self.decoder.embedding(word_tensor)
                
                # Concatenate embedding and context
                lstm_input = torch.cat((word_embed, context), dim=1)
                
                # LSTM step
                h, c = self.decoder.lstm_cell(lstm_input, (h, c))
                
                # Predict word
                output = self.decoder.fc(h) # (1, vocab_size)
                predicted_idx = output.argmax(dim=1).item()
                
                # Break if "<end>" is predicted
                if predicted_idx == vocab.stoi["<end>"]:
                    break
                    
                generated_sentence.append(vocab.itos.get(predicted_idx, "<unk>"))
                
                # Set input for next step
                word_tensor = torch.tensor([predicted_idx]).to(device)
                
            return generated_sentence, attention_maps
