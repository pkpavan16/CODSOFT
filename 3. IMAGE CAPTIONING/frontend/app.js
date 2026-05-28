// API Configuration
const API_BASE = ""; // Relative URL since static files are hosted on the same server

// DOM Elements
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const imagePreview = document.getElementById('image-preview');
const dropzoneContent = document.querySelector('.dropzone-content');

const pretrainedCaption = document.getElementById('pretrained-caption');
const customCaption = document.getElementById('custom-caption');

const btnTrain = document.getElementById('btn-train');
const trainingStatus = document.getElementById('training-status');
const trainingProgress = document.getElementById('training-progress');
const epochLabel = document.getElementById('epoch-label');
const lossLabel = document.getElementById('loss-label');
const epochsInput = document.getElementById('epochs-input');

const attentionSection = document.getElementById('attention-section');
const interactiveWords = document.getElementById('interactive-words');
const attentionMapImg = document.getElementById('attention-map-img');
const viewerWordLabel = document.getElementById('viewer-word-label');

const historyGrid = document.getElementById('history-grid');
const colorBlocks = document.querySelectorAll('.color-block');
const toastContainer = document.getElementById('toast-container');

// State Variables
let currentFile = null;
let customAttentionData = null; // Holds [{word: string, overlay: b64}, ...]
let trainingInterval = null;
let historyItems = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkTrainingStatus();
    // Poll training status every 3 seconds to keep UI synced
    setInterval(checkTrainingStatus, 3000);
});

// Toast Notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-exclamation-triangle';
    
    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i><span>${message}</span>`;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Drag and drop events
['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
    }, false);
});

dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
        handleImageFile(files[0]);
    }
});

dropzone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleImageFile(e.target.files[0]);
    }
});

// Quick Color Block Samples
colorBlocks.forEach(block => {
    block.addEventListener('click', (e) => {
        e.stopPropagation(); // Avoid triggering dropzone click
        
        // Remove active class from all blocks
        colorBlocks.forEach(b => b.classList.remove('active'));
        block.classList.add('active');
        
        const colorName = block.getAttribute('data-color');
        const colorMap = {
            red: 'rgb(255, 0, 0)',
            green: 'rgb(0, 255, 0)',
            blue: 'rgb(0, 0, 255)',
            yellow: 'rgb(255, 255, 0)',
            white: 'rgb(255, 255, 255)',
            black: 'rgb(0, 0, 0)'
        };
        
        generateAndUploadColorBlock(colorMap[colorName], colorName);
    });
});

// Generate solid color block in canvas and upload as file
function generateAndUploadColorBlock(colorRgb, colorName) {
    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;
    const ctx = canvas.getContext('2d');
    
    // Draw background
    ctx.fillStyle = colorRgb;
    ctx.fillRect(0, 0, 224, 224);
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
        const file = new File([blob], `${colorName}_block.png`, { type: 'image/png' });
        
        // Show local preview
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.classList.remove('hidden');
            dropzoneContent.classList.add('hidden');
        };
        reader.readAsDataURL(file);
        
        uploadAndCaption(file);
    }, 'image/png');
}

function handleImageFile(file) {
    // Validate file is image
    if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file.', 'error');
        return;
    }
    
    // Remove sample block highlights
    colorBlocks.forEach(b => b.classList.remove('active'));
    
    currentFile = file;
    
    // Show Preview
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreview.classList.remove('hidden');
        dropzoneContent.classList.add('hidden');
    };
    reader.readAsDataURL(file);
    
    // Upload and generate captions
    uploadAndCaption(file);
}

// Upload and call captions endpoint
async function uploadAndCaption(file) {
    pretrainedCaption.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating transformer caption...';
    customCaption.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running Custom Attention model...';
    
    attentionSection.classList.add('hidden');
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
        const response = await fetch(`${API_BASE}/api/caption`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }
        
        const data = await response.json();
        
        // Display Pre-trained model output
        pretrainedCaption.textContent = data.pretrained_caption || "Failed to generate caption.";
        
        // Display Custom model output
        customCaption.textContent = data.custom_caption || "Failed to generate caption.";
        
        // Handle custom attention highlights
        if (data.custom_attention && data.custom_attention.length > 0) {
            customAttentionData = data.custom_attention;
            renderAttentionWorkspace(data.custom_attention);
            attentionSection.classList.remove('hidden');
        }
        
        // Add to history
        addToHistory(file, data.custom_caption, data.pretrained_caption);
        showToast('Captions generated successfully!', 'success');
        
    } catch (error) {
        console.error(error);
        pretrainedCaption.textContent = "Error occurred.";
        customCaption.textContent = "Error occurred.";
        showToast('Failed to connect to the backend server.', 'error');
    }
}

// Render word by word attention highlights
function renderAttentionWorkspace(attentionData) {
    interactiveWords.innerHTML = '';
    
    attentionData.forEach((item, index) => {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'attn-word';
        wordSpan.textContent = item.word;
        
        // Event triggers
        const activateWord = () => {
            // Deactivate others
            document.querySelectorAll('.attn-word').forEach(w => w.classList.remove('active'));
            // Activate this
            wordSpan.classList.add('active');
            // Update overlay image
            attentionMapImg.src = item.overlay;
            viewerWordLabel.textContent = `Focusing on: "${item.word}"`;
        };
        
        wordSpan.addEventListener('mouseenter', activateWord);
        wordSpan.addEventListener('click', activateWord);
        
        interactiveWords.appendChild(wordSpan);
    });
    
    // Auto trigger first word
    if (interactiveWords.children.length > 0) {
        interactiveWords.children[0].click();
    }
}

// Training Functions
async function checkTrainingStatus() {
    try {
        const response = await fetch(`${API_BASE}/api/train-status`);
        const data = await response.json();
        
        // Update training status label
        trainingStatus.textContent = data.status.charAt(0).toUpperCase() + data.status.slice(1);
        trainingStatus.className = `status-value status-${data.status.split(':')[0]}`; // handle "failed: ..." classes
        
        if (data.status === 'training') {
            btnTrain.disabled = true;
            btnTrain.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Training...';
            
            // Calculate progress percent
            const progress = (data.current_epoch / data.total_epochs) * 100;
            trainingProgress.style.width = `${progress}%`;
            
            epochLabel.textContent = `Epoch: ${data.current_epoch}/${data.total_epochs}`;
            lossLabel.textContent = `Loss: ${data.loss.toFixed(4)}`;
        } else {
            btnTrain.disabled = false;
            btnTrain.innerHTML = '<i class="fa-solid fa-play"></i> Start Custom Training';
            
            if (data.status === 'completed') {
                trainingProgress.style.width = '100%';
                epochLabel.textContent = `Epoch: ${data.total_epochs}/${data.total_epochs}`;
                lossLabel.textContent = `Loss: ${data.loss.toFixed(4)}`;
            } else {
                trainingProgress.style.width = '0%';
                epochLabel.textContent = 'Epoch: --/--';
                lossLabel.textContent = 'Loss: --';
            }
        }
    } catch (error) {
        console.error('Failed to fetch training status:', error);
    }
}

// Trigger custom model training
btnTrain.addEventListener('click', async () => {
    const epochs = epochsInput.value;
    btnTrain.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE}/api/train?epochs=${epochs}`, {
            method: 'POST'
        });
        const data = await response.json();
        showToast(data.message, 'info');
        checkTrainingStatus();
    } catch (error) {
        console.error('Failed to start training:', error);
        showToast('Failed to start model training.', 'error');
        btnTrain.disabled = false;
    }
});

// Run History Helper
function addToHistory(file, customCap, pretrainedCap) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const historyItem = {
            src: e.target.result,
            custom: customCap,
            pretrained: pretrainedCap
        };
        
        // Add to front of array
        historyItems.unshift(historyItem);
        if (historyItems.length > 5) {
            historyItems.pop(); // Limit to 5 items
        }
        
        renderHistory();
    };
    reader.readAsDataURL(file);
}

function renderHistory() {
    // Clear placeholder
    historyGrid.innerHTML = '';
    
    if (historyItems.length === 0) {
        historyGrid.innerHTML = '<div class="history-placeholder">No captions generated yet. Start by uploading an image!</div>';
        return;
    }
    
    historyItems.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'history-item';
        
        itemDiv.innerHTML = `
            <img src="${item.src}" class="history-thumb" alt="History Image">
            <div class="history-captions">
                <div class="history-cap-row">
                    <strong class="text-purple">Pretrained:</strong> ${item.pretrained || 'N/A'}
                </div>
                <div class="history-cap-row">
                    <strong class="text-blue">Custom:</strong> ${item.custom || 'N/A'}
                </div>
            </div>
        `;
        
        historyGrid.appendChild(itemDiv);
    });
}
