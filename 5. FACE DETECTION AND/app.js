/* ==========================================================================
   Aegis Face AI - Main Application Logic
   ========================================================================== */

// Core state
let localDb = []; // Array of { name, descriptors (Array of Float32Arrays), thumbnail (base64) }
let currentStream = null;
let isDetecting = false;
let currentDetections = []; // Stores the latest frame detections for registration
let activeMedia = null; // 'webcam', 'image', 'video', or null
let activeObjectUrl = null;

// Guided Scan State
let scanState = {
  isScanning: false,
  profileName: '',
  currentStep: 'CENTER', // 'CENTER', 'LEFT', 'RIGHT', 'DONE'
  descriptors: { CENTER: null, LEFT: null, RIGHT: null },
  thumbnail: null,
  stableCount: 0,
  requiredStable: 10, // ~10 frames of stable pose
  cooldown: 0
};

// FPS tracking
let frameCount = 0;
let fps = 0;
let lastFpsUpdate = Date.now();

// DOM Elements
const engineStatusDot = document.getElementById('engineStatusDot');
const engineStatusText = document.getElementById('engineStatusText');
const fpsVal = document.getElementById('fpsVal');
const detectCount = document.getElementById('detectCount');
const dbCount = document.getElementById('dbCount');

const startCamBtn = document.getElementById('startCamBtn');
const stopCamBtn = document.getElementById('stopCamBtn');
const videoFeed = document.getElementById('videoFeed');
const imageDisplay = document.getElementById('imageDisplay');
const overlayCanvas = document.getElementById('overlayCanvas');
const scannerLine = document.getElementById('scannerLine');
const viewportPlaceholder = document.getElementById('viewportPlaceholder');

const registerCurrentBtn = document.getElementById('registerCurrentBtn');
const registerQuickForm = document.getElementById('registerQuickForm');
const quickNameInput = document.getElementById('quickNameInput');
const submitQuickRegisterBtn = document.getElementById('submitQuickRegisterBtn');
const cancelQuickRegisterBtn = document.getElementById('cancelQuickRegisterBtn');

const detectorSelect = document.getElementById('detectorSelect');
const confidenceSlider = document.getElementById('confidenceSlider');
const confidenceValue = document.getElementById('confidenceValue');
const toggleBbox = document.getElementById('toggleBbox');
const toggleRecognition = document.getElementById('toggleRecognition');

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

const manualNameInput = document.getElementById('manualNameInput');
const triggerManualUploadBtn = document.getElementById('triggerManualUploadBtn');
const manualFileInput = document.getElementById('manualFileInput');

const databaseList = document.getElementById('databaseList');
const emptyDbPlaceholder = document.getElementById('emptyDbPlaceholder');
const clearDbBtn = document.getElementById('clearDbBtn');

// Scanning HUD DOM Elements
const scanHud = document.getElementById('scanHud');
const hudProfileName = document.getElementById('hudProfileName');
const hudInstruction = document.getElementById('hudInstruction');
const hudStatusSub = document.getElementById('hudStatusSub');
const hudReticleIndicator = document.getElementById('hudReticleIndicator');
const stepCenter = document.getElementById('stepCenter');
const stepLeft = document.getElementById('stepLeft');
const stepRight = document.getElementById('stepRight');
const cancelScanBtn = document.getElementById('cancelScanBtn');

// Initialize application
async function init() {
  setupEventListeners();
  loadDbFromLocalStorage();
  
  try {
    await loadModels();
    startCamBtn.disabled = false;
  } catch (err) {
    console.error("Failed to load face-api models:", err);
    setEngineStatus('error', 'Model Loading Failed');
    alert("Failed to load models. Please ensure the local 'models/' directory is present and contains the weight files.");
  }
}

// Set status indicator state
function setEngineStatus(state, message) {
  engineStatusDot.className = 'status-dot';
  if (state === 'loading') {
    engineStatusDot.classList.add('status-loading');
  } else if (state === 'ready') {
    engineStatusDot.classList.add('status-ready');
  } else {
    engineStatusDot.classList.add('status-error');
  }
  engineStatusText.textContent = message;
}

// Load face-api.js weights
async function loadModels() {
  const MODEL_URL = './models';
  setEngineStatus('loading', 'Loading SSD MobileNet...');
  await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
  
  setEngineStatus('loading', 'Loading Tiny Detector...');
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  
  setEngineStatus('loading', 'Loading Face Landmarks...');
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
  
  setEngineStatus('loading', 'Loading Face Rec Engine...');
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  
  setEngineStatus('ready', 'AI Engine Active');
}

// Setup all control and input listeners
function setupEventListeners() {
  // Webcam buttons
  startCamBtn.addEventListener('click', startWebcam);
  stopCamBtn.addEventListener('click', stopWebcam);

  // Settings changes
  confidenceSlider.addEventListener('input', () => {
    confidenceValue.textContent = parseFloat(confidenceSlider.value).toFixed(2);
    // If analyzing static image, re-run detection immediately
    if (activeMedia === 'image') {
      runStaticImageDetection();
    }
  });

  detectorSelect.addEventListener('change', () => {
    if (activeMedia === 'image') {
      runStaticImageDetection();
    }
  });

  [toggleBbox, toggleRecognition].forEach(toggle => {
    toggle.addEventListener('change', () => {
      if (activeMedia === 'image') {
        runStaticImageDetection();
      }
    });
  });

  // Face Registration Form
  registerCurrentBtn.addEventListener('click', () => {
    registerCurrentBtn.classList.add('hidden');
    registerQuickForm.classList.remove('hidden');
    quickNameInput.focus();
  });

  submitQuickRegisterBtn.addEventListener('click', () => {
    const name = quickNameInput.value.trim();
    if (name) {
      quickNameInput.value = '';
      registerQuickForm.classList.add('hidden');
      registerCurrentBtn.classList.remove('hidden');
      
      if (activeMedia === 'webcam') {
        startScanHud(name);
      } else {
        // Fallback for static image analysis - register single frame directly
        registerDetectedFace(name);
      }
    } else {
      alert("Please enter a name.");
    }
  });

  cancelQuickRegisterBtn.addEventListener('click', () => {
    quickNameInput.value = '';
    registerQuickForm.classList.add('hidden');
    registerCurrentBtn.classList.remove('hidden');
  });

  cancelScanBtn.addEventListener('click', stopScanHud);

  quickNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitQuickRegisterBtn.click();
    }
  });

  // Clear database
  clearDbBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear the entire face registry? This cannot be undone.")) {
      localDb = [];
      saveDbToLocalStorage();
    }
  });

  // Upload zones
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleUploadedFile(e.dataTransfer.files[0]);
    }
  });

  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleUploadedFile(fileInput.files[0]);
    }
  });

  // Manual Face Registration via File
  triggerManualUploadBtn.addEventListener('click', () => {
    const name = manualNameInput.value.trim();
    if (!name) {
      alert("Please enter a registration name first.");
      manualNameInput.focus();
      return;
    }
    manualFileInput.click();
  });

  manualFileInput.addEventListener('change', () => {
    if (manualFileInput.files.length > 0) {
      const name = manualNameInput.value.trim();
      registerFromImageFile(manualFileInput.files[0], name);
      manualFileInput.value = ''; // Reset
    }
  });

  // Align canvas on resize
  window.addEventListener('resize', resizeCanvas);
}

// Media state cleanups
function stopAllMedia() {
  stopWebcam();
  cleanActiveObjectUrl();
  videoFeed.src = '';
  imageDisplay.removeAttribute('src');
  videoFeed.style.display = 'none';
  imageDisplay.style.display = 'none';
  scannerLine.style.display = 'none';
  
  const ctx = overlayCanvas.getContext('2d');
  ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  detectCount.textContent = '0';
  registerCurrentBtn.disabled = true;
}

function showPlaceholder() {
  viewportPlaceholder.style.display = 'flex';
}

function cleanActiveObjectUrl() {
  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }
}

// Align canvas sizing and overlays
function resizeCanvas() {
  const activeElement = activeMedia === 'webcam' || activeMedia === 'video' ? videoFeed : imageDisplay;
  if (!activeElement || activeMedia === null) return;

  overlayCanvas.style.left = activeElement.offsetLeft + 'px';
  overlayCanvas.style.top = activeElement.offsetTop + 'px';
  overlayCanvas.style.width = activeElement.clientWidth + 'px';
  overlayCanvas.style.height = activeElement.clientHeight + 'px';

  overlayCanvas.width = activeElement.clientWidth;
  overlayCanvas.height = activeElement.clientHeight;
}

// WEBCAM FEED CONTROL
async function startWebcam() {
  stopAllMedia();
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 360, frameRate: { ideal: 30 } },
      audio: false
    });
    
    videoFeed.srcObject = stream;
    videoFeed.style.display = 'block';
    viewportPlaceholder.style.display = 'none';
    scannerLine.style.display = 'block';
    
    currentStream = stream;
    activeMedia = 'webcam';
    
    startCamBtn.disabled = true;
    stopCamBtn.disabled = false;
    
    videoFeed.onloadedmetadata = () => {
      videoFeed.play();
      // Ensure element dimensions are settled before overlaying
      setTimeout(() => {
        resizeCanvas();
        startDetectionLoop();
      }, 150);
    };
  } catch (err) {
    console.error("Camera access error:", err);
    alert("Could not load webcam. Please verify browser camera permissions.");
    showPlaceholder();
  }
}

function stopWebcam() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }
  videoFeed.srcObject = null;
  
  if (isDetecting) {
    stopDetectionLoop();
  }

  startCamBtn.disabled = false;
  stopCamBtn.disabled = true;
  
  if (activeMedia === 'webcam') {
    activeMedia = null;
    stopAllMedia();
    showPlaceholder();
  }
}

// REALTIME DETECTION LOOPS
function startDetectionLoop() {
  isDetecting = true;
  frameCount = 0;
  lastFpsUpdate = Date.now();
  runDetection();
}

function stopDetectionLoop() {
  isDetecting = false;
  fpsVal.textContent = '0';
}

async function runDetection() {
  if (!isDetecting || activeMedia !== 'webcam') return;

  if (videoFeed.paused || videoFeed.ended) {
    requestAnimationFrame(runDetection);
    return;
  }

  await detectFrame(videoFeed);

  // Compute actual framerate
  frameCount++;
  const now = Date.now();
  if (now - lastFpsUpdate >= 1000) {
    fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
    fpsVal.textContent = fps;
    frameCount = 0;
    lastFpsUpdate = now;
  }

  requestAnimationFrame(runDetection);
}

// DETECT IN A SPECIFIC ELEMENT FRAME
function getDetectorOptions() {
  const model = detectorSelect.value;
  const confidence = parseFloat(confidenceSlider.value);
  
  if (model === 'ssd') {
    return new faceapi.SsdMobilenetv1Options({ minConfidence: confidence });
  } else {
    return new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: confidence });
  }
}

async function detectFrame(inputElement) {
  if (!faceapi.nets.ssdMobilenetv1.params || !faceapi.nets.tinyFaceDetector.params) return;

  const options = getDetectorOptions();
  const showBbox = toggleBbox.checked;
  const showRec = toggleRecognition.checked;

  // Landmarks are required in the background for face recognition alignment and head pose guidance
  const forceLandmarks = showRec || scanState.isScanning;
  const forceRec = showRec || scanState.isScanning;

  let task = faceapi.detectAllFaces(inputElement, options);

  if (forceLandmarks) {
    task = task.withFaceLandmarks(detectorSelect.value === 'tiny');
  }

  if (forceRec) {
    if (!forceLandmarks) {
      task = task.withFaceLandmarks(detectorSelect.value === 'tiny');
    }
    task = task.withFaceDescriptors();
  }

  try {
    const results = await task;
    
    const ctx = overlayCanvas.getContext('2d');
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    
    detectCount.textContent = results.length;
    currentDetections = results;

    if (results.length > 0) {
      registerCurrentBtn.disabled = false;
    } else {
      registerCurrentBtn.disabled = true;
    }

    // --- Guided Pose Scanning HUD Logic ---
    if (scanState.isScanning && activeMedia === 'webcam') {
      if (results.length === 0) {
        scanState.stableCount = 0;
        hudInstruction.textContent = "Align Face in Reticle";
        hudStatusSub.textContent = "No face detected in scan zone.";
        hudReticleIndicator.className = 'hud-reticle-indicator';
      } else {
        // Select largest face
        let target = results[0];
        if (results.length > 1) {
          target = results.reduce((max, curr) => {
            const maxArea = max.detection.box.width * max.detection.box.height;
            const currArea = curr.detection.box.width * curr.detection.box.height;
            return currArea > maxArea ? curr : max;
          }, results[0]);
        }
        
        if (target.landmarks && target.descriptor) {
          const pose = estimateHeadPose(target.landmarks);
          const currentStep = scanState.currentStep;
          
          let matchesPose = false;
          if (currentStep === 'CENTER') {
            matchesPose = (pose.yaw === 'CENTER' && pose.pitch === 'CENTER');
            hudInstruction.textContent = "Look Directly Center 🎯";
          } else if (currentStep === 'LEFT') {
            matchesPose = (pose.yaw === 'LEFT');
            hudInstruction.textContent = "Turn head slightly Left ⬅️";
          } else if (currentStep === 'RIGHT') {
            matchesPose = (pose.yaw === 'RIGHT');
            hudInstruction.textContent = "Turn head slightly Right ➡️";
          }
          
          if (scanState.cooldown > 0) {
            scanState.cooldown--;
            hudInstruction.textContent = "Prepare... Get Ready";
            hudStatusSub.textContent = `Get ready for the next pose.`;
          } else if (matchesPose) {
            scanState.stableCount++;
            hudReticleIndicator.className = 'hud-reticle-indicator scanning';
            const progress = Math.round((scanState.stableCount / scanState.requiredStable) * 100);
            hudStatusSub.textContent = `Keep still... scanning ${progress}%`;
            
            if (scanState.stableCount >= scanState.requiredStable) {
              captureScanStep(target);
            }
          } else {
            scanState.stableCount = 0;
            hudReticleIndicator.className = 'hud-reticle-indicator';
            hudStatusSub.textContent = `Pose detected: ${pose.yaw}/${pose.pitch} (Turn slightly)`;
          }
        } else {
          scanState.stableCount = 0;
          hudInstruction.textContent = "Processing Features...";
          hudStatusSub.textContent = "Extracting pose descriptors.";
          hudReticleIndicator.className = 'hud-reticle-indicator';
        }
      }
    }

    const displaySize = {
      width: inputElement.clientWidth,
      height: inputElement.clientHeight
    };

    if (overlayCanvas.width !== displaySize.width || overlayCanvas.height !== displaySize.height) {
      resizeCanvas();
    }

    const resizedResults = faceapi.resizeResults(results, displaySize);

    // Instantiate FaceMatcher if database contains descriptors
    let faceMatcher = null;
    if (showRec && localDb.length > 0) {
      const labeledDescriptors = localDb.map(item => {
        return new faceapi.LabeledFaceDescriptors(item.name, item.descriptors);
      });
      // 0.6 is the default matching threshold distance
      faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
    }

    resizedResults.forEach(result => {
      const bounds = result.detection.box;
      let label = 'Face';
      let scoreText = Math.round(result.detection.score * 100) + '%';
      let isMatched = false;
      let isUnknown = false;

      if (showRec && result.descriptor) {
        if (faceMatcher) {
          const match = faceMatcher.findBestMatch(result.descriptor);
          if (match.label !== 'unknown') {
            label = match.label;
            scoreText = Math.round((1 - match.distance) * 100) + '% match';
            isMatched = true;
          } else {
            label = 'Unknown';
            scoreText = '';
            isUnknown = true;
          }
        } else {
          label = 'Unregistered';
        }
      }

      // Draw custom cyberpunk glowing box
      if (showBbox) {
        let boxColor = '#00f2fe'; // Neon cyan default
        if (isMatched) boxColor = '#10b981'; // Neon green matched
        if (isUnknown) boxColor = '#ef4444'; // Neon red unknown

        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 3;
        ctx.shadowColor = boxColor;
        ctx.shadowBlur = 8;

        drawRoundedRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, 8);

        // Reset blur for texts
        ctx.shadowBlur = 0;
        ctx.fillStyle = boxColor;
        ctx.font = 'bold 12px Inter, sans-serif';
        const tagText = `${label} ${scoreText}`.trim();
        const textWidth = ctx.measureText(tagText).width;

        // Label background tag
        ctx.fillRect(bounds.x, bounds.y - 25, textWidth + 16, 20);
        ctx.fillStyle = '#040814';
        ctx.fillText(tagText, bounds.x + 8, bounds.y - 11);
      }

      // Landmarks drawing removed to keep UI clear. Background calculations remain active for face recognition alignment and pose guidance.
    });
  } catch (err) {
    console.error("Frame inference execution error:", err);
  }
}

// Rounded box helper
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.stroke();
}

// STATIC IMAGE ANALYSIS
async function runStaticImageDetection() {
  if (activeMedia !== 'image') return;
  
  // Wait for image loaded
  if (!imageDisplay.complete || imageDisplay.naturalWidth === 0) {
    imageDisplay.onload = () => {
      resizeCanvas();
      detectFrame(imageDisplay);
    };
  } else {
    resizeCanvas();
    await detectFrame(imageDisplay);
  }
}

// VIDEO FILE ANALYSIS LOOP
async function runVideoFileDetection() {
  if (activeMedia !== 'video' || videoFeed.paused || videoFeed.ended) return;

  await detectFrame(videoFeed);

  frameCount++;
  const now = Date.now();
  if (now - lastFpsUpdate >= 1000) {
    fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
    fpsVal.textContent = fps;
    frameCount = 0;
    lastFpsUpdate = now;
  }

  requestAnimationFrame(runVideoFileDetection);
}

// UPLOAD MEDIA HANDLER
function handleUploadedFile(file) {
  stopAllMedia();
  
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');
  
  if (!isVideo && !isImage) {
    alert("Unsupported file format! Please upload an image or video file.");
    showPlaceholder();
    return;
  }
  
  cleanActiveObjectUrl();
  activeObjectUrl = URL.createObjectURL(file);
  viewportPlaceholder.style.display = 'none';

  if (isImage) {
    activeMedia = 'image';
    imageDisplay.src = activeObjectUrl;
    imageDisplay.style.display = 'block';
    
    // Process image
    runStaticImageDetection();
  } else {
    // Video
    activeMedia = 'video';
    videoFeed.src = activeObjectUrl;
    videoFeed.style.display = 'block';
    scannerLine.style.display = 'block';
    
    videoFeed.onloadedmetadata = () => {
      videoFeed.play();
      setTimeout(() => {
        resizeCanvas();
        startVideoFileDetection();
      }, 150);
    };
  }
}

function startVideoFileDetection() {
  frameCount = 0;
  lastFpsUpdate = Date.now();
  runVideoFileDetection();
}

// FACE REGISTRATION FUNCTIONS
async function registerDetectedFace(name) {
  if (currentDetections.length === 0) {
    alert("No active detections to register.");
    return;
  }

  // Select largest detected face on screen
  let target = currentDetections[0];
  if (currentDetections.length > 1) {
    target = currentDetections.reduce((max, curr) => {
      const maxArea = max.detection.box.width * max.detection.box.height;
      const currArea = curr.detection.box.width * curr.detection.box.height;
      return currArea > maxArea ? curr : max;
    }, currentDetections[0]);
  }

  if (!target.descriptor) {
    alert("To register faces, please toggle 'Face Recognition' switch to generate descriptors.");
    return;
  }

  const source = activeMedia === 'webcam' || activeMedia === 'video' ? videoFeed : imageDisplay;
  const box = target.detection.box;

  // Render cropped face onto mini canvas
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = 100;
  cropCanvas.height = 100;
  const cropCtx = cropCanvas.getContext('2d');

  // Map box pixels back to video/image natural content size
  // Target.detection.box is formatted in natural media coordinates
  const scaleX = source.naturalWidth ? (source.naturalWidth / source.clientWidth) : (source.videoWidth / source.clientWidth);
  const scaleY = source.naturalHeight ? (source.naturalHeight / source.clientHeight) : (source.videoHeight / source.clientHeight);

  // If using webcam / video directly, source videoWidth/videoHeight are absolute coordinates
  // Ssd / Tiny detector returns coordinates scaled to the element's actual dimensions.
  // Wait, let's verify if the bounding boxes are relative to element size or natural size.
  // Actually, face-api's detection box in results is relative to the element passed to it!
  // If we pass videoFeed, results are relative to the clientWidth/clientHeight (the display layout size) of the element!
  // Wait, no. If we pass the element, face-api automatically detects it at input dimensions but returns the boxes relative to the input element natural width/height, OR display width/height?
  // Let's verify: faceapi.detectAllFaces returns boxes based on the actual image size (naturalWidth/videoWidth).
  // But since we did `faceapi.resizeResults(results, displaySize)`, the box in `resizedResults` is scaled to the display size, while `results` (which is stored in `currentDetections`) has the box in natural coordinates!
  // Ah! `currentDetections = results` holds the original coordinates (natural coordinates).
  // Let's verify: yes, `results` from `await task` returns box in natural coordinates.
  // So `target.detection.box` is in natural media coordinates (videoWidth, videoHeight, or naturalWidth, naturalHeight).
  // This is perfect! To draw it onto cropCanvas from the source element, we use the natural coordinates because drawImage on video or img element references its natural coordinate space!
  // Yes! The browser draws from the source element using its native coordinates (videoWidth/videoHeight for video, naturalWidth/naturalHeight for image).
  // Thus, using the un-resized `target.detection.box` directly in drawImage is mathematically correct!
  
  const srcX = Math.max(0, box.x);
  const srcY = Math.max(0, box.y);
  const srcW = Math.min(box.width, (source.videoWidth || source.naturalWidth) - srcX);
  const srcH = Math.min(box.height, (source.videoHeight || source.naturalHeight) - srcY);

  try {
    cropCtx.drawImage(
      source,
      srcX, srcY, srcW, srcH,
      0, 0, 100, 100
    );
    const thumbnail = cropCanvas.toDataURL('image/jpeg', 0.85);

    // Save
    localDb.push({
      name: name,
      descriptors: [target.descriptor],
      thumbnail: thumbnail
    });

    saveDbToLocalStorage();
    alert(`Registered "${name}" successfully.`);
  } catch (err) {
    console.error("Error cropping face thumbnail:", err);
    // Use fallback avatar icon
    localDb.push({
      name: name,
      descriptors: [target.descriptor],
      thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%2300f2fe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
    });
    saveDbToLocalStorage();
  }
}

// REGISTER MANUALLY VIA SELECTING IMAGE FILE
async function registerFromImageFile(file, name) {
  if (!name.trim()) {
    alert("Please enter a registration name first.");
    return;
  }

  setEngineStatus('loading', 'Analyzing reference image...');

  const tempImg = new Image();
  tempImg.src = URL.createObjectURL(file);
  tempImg.onload = async () => {
    try {
      const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
      const result = await faceapi.detectSingleFace(tempImg, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!result) {
        alert(`No face detected in reference photo for "${name}". Please choose another image.`);
        setEngineStatus('ready', 'AI Engine Active');
        URL.revokeObjectURL(tempImg.src);
        return;
      }

      // Crop
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = 100;
      cropCanvas.height = 100;
      const cropCtx = cropCanvas.getContext('2d');
      const box = result.detection.box;

      const srcX = Math.max(0, box.x);
      const srcY = Math.max(0, box.y);
      const srcW = Math.min(box.width, tempImg.naturalWidth - srcX);
      const srcH = Math.min(box.height, tempImg.naturalHeight - srcY);

      cropCtx.drawImage(
        tempImg,
        srcX, srcY, srcW, srcH,
        0, 0, 100, 100
      );
      const thumbnail = cropCanvas.toDataURL('image/jpeg', 0.85);

      localDb.push({
        name: name,
        descriptors: [result.descriptor],
        thumbnail: thumbnail
      });

      saveDbToLocalStorage();
      setEngineStatus('ready', 'AI Engine Active');
      alert(`Registered "${name}" successfully.`);

      manualNameInput.value = '';
      URL.revokeObjectURL(tempImg.src);
    } catch (err) {
      console.error("Error analyzing uploaded file reference:", err);
      alert("Error analyzing reference image.");
      setEngineStatus('ready', 'AI Engine Active');
      URL.revokeObjectURL(tempImg.src);
    }
  };
}

// PERSISTENCE & DATABASE UPDATES
function saveDbToLocalStorage() {
  const serialized = localDb.map(item => ({
    name: item.name,
    descriptors: item.descriptors.map(desc => Array.from(desc)),
    thumbnail: item.thumbnail
  }));
  localStorage.setItem('aegis_face_db', JSON.stringify(serialized));
  updateDbUI();
}

function loadDbFromLocalStorage() {
  const data = localStorage.getItem('aegis_face_db');
  if (data) {
    try {
      const parsed = JSON.parse(data);
      localDb = parsed.map(item => {
        // Migration support for single-descriptor formats
        let descriptorsList = [];
        if (item.descriptors) {
          descriptorsList = item.descriptors.map(desc => new Float32Array(desc));
        } else if (item.descriptor) {
          descriptorsList = [new Float32Array(item.descriptor)];
        }
        return {
          name: item.name,
          descriptors: descriptorsList,
          thumbnail: item.thumbnail
        };
      });
    } catch (e) {
      console.error("Failed to parse local face database:", e);
      localDb = [];
    }
  }
  updateDbUI();
}

function updateDbUI() {
  dbCount.textContent = localDb.length;
  
  if (localDb.length === 0) {
    emptyDbPlaceholder.style.display = 'flex';
    databaseList.innerHTML = '';
    return;
  }

  emptyDbPlaceholder.style.display = 'none';
  databaseList.innerHTML = '';

  localDb.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'db-item';
    li.innerHTML = `
      <img src="${item.thumbnail}" alt="${item.name}" class="db-thumb">
      <div class="db-details">
        <span class="db-name">${escapeHtml(item.name)}</span>
        <span class="db-meta">${item.descriptors.length > 1 ? 'Multi-Angle Profile' : 'Single-Angle Profile'}</span>
      </div>
      <button class="db-delete" title="Delete Profile" data-index="${index}">
        <i data-lucide="trash-2"></i>
      </button>
    `;
    databaseList.appendChild(li);
  });

  // Re-create icons in dynamically added DOM
  lucide.createIcons();

  // Attach delete events
  document.querySelectorAll('.db-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.getAttribute('data-index'));
      const name = localDb[index].name;
      if (confirm(`Remove "${name}" from the database?`)) {
        localDb.splice(index, 1);
        saveDbToLocalStorage();
      }
    });
  });
  
  // If we are currently showing a static image, re-run detection to update tags instantly
  if (activeMedia === 'image') {
    runStaticImageDetection();
  }
}

// XSS Sanitizer
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// --- HEAD POSE ESTIMATION & GUIDED SCAN HELPERS ---

function estimateHeadPose(landmarks) {
  const positions = landmarks.positions;
  
  // Nose tip (30) and face edges: far left (0) and far right (16)
  const noseTip = positions[30];
  const jawLeft = positions[0];
  const jawRight = positions[16];
  
  const distLeft = noseTip.x - jawLeft.x;
  const distRight = jawRight.x - noseTip.x;
  
  if (distRight === 0) return { yaw: 'CENTER', pitch: 'CENTER', ratios: '0/0' };
  const yawRatio = distLeft / distRight;
  
  // Nose bridge top (27) and chin (8)
  const noseBridgeTop = positions[27];
  const chin = positions[8];
  
  const distTop = noseTip.y - noseBridgeTop.y;
  const distBottom = chin.y - noseTip.y;
  
  if (distBottom === 0) return { yaw: 'CENTER', pitch: 'CENTER', ratios: '0/0' };
  const pitchRatio = distTop / distBottom;
  
  let yaw = 'CENTER';
  if (yawRatio > 1.85) {
    yaw = 'RIGHT';
  } else if (yawRatio < 0.54) {
    yaw = 'LEFT';
  }
  
  let pitch = 'CENTER';
  if (pitchRatio < 0.52) {
    pitch = 'UP';
  } else if (pitchRatio > 1.45) {
    pitch = 'DOWN';
  }
  
  return {
    yaw,
    pitch,
    ratios: `Yaw: ${yawRatio.toFixed(2)}, Pitch: ${pitchRatio.toFixed(2)}`
  };
}

function startScanHud(name) {
  scanState.isScanning = true;
  scanState.profileName = name;
  scanState.currentStep = 'CENTER';
  scanState.descriptors = { CENTER: null, LEFT: null, RIGHT: null };
  scanState.thumbnail = null;
  scanState.stableCount = 0;
  scanState.cooldown = 15; // small warmup delay (15 frames)
  
  hudProfileName.textContent = name;
  hudReticleIndicator.className = 'hud-reticle-indicator';
  
  updateHudStepClasses();
  scanHud.classList.remove('hidden');
}

function stopScanHud() {
  scanState.isScanning = false;
  scanHud.classList.add('hidden');
}

function updateHudStepClasses() {
  [stepCenter, stepLeft, stepRight].forEach(el => {
    el.className = 'hud-step';
  });
  
  const stepMap = {
    'CENTER': stepCenter,
    'LEFT': stepLeft,
    'RIGHT': stepRight
  };
  
  if (stepMap[scanState.currentStep]) {
    stepMap[scanState.currentStep].classList.add('active');
  }
  
  if (scanState.descriptors.CENTER) stepCenter.classList.add('completed');
  if (scanState.descriptors.LEFT) stepLeft.classList.add('completed');
  if (scanState.descriptors.RIGHT) stepRight.classList.add('completed');
}

function captureScanStep(result) {
  const currentStep = scanState.currentStep;
  scanState.descriptors[currentStep] = result.descriptor;
  
  // Show visual success flash on indicator
  hudReticleIndicator.className = 'hud-reticle-indicator success';
  scanState.stableCount = 0;
  scanState.cooldown = 20; // 20 frames cooldown to allow user to adjust
  
  if (currentStep === 'CENTER') {
    // Crop face from webcam for database thumbnail
    const box = result.detection.box;
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = 100;
    cropCanvas.height = 100;
    const cropCtx = cropCanvas.getContext('2d');
    
    const srcX = Math.max(0, box.x);
    const srcY = Math.max(0, box.y);
    const srcW = Math.min(box.width, videoFeed.videoWidth - srcX);
    const srcH = Math.min(box.height, videoFeed.videoHeight - srcY);
    
    try {
      cropCtx.drawImage(videoFeed, srcX, srcY, srcW, srcH, 0, 0, 100, 100);
      scanState.thumbnail = cropCanvas.toDataURL('image/jpeg', 0.85);
    } catch (e) {
      console.error("Error cropping scanner thumbnail:", e);
      scanState.thumbnail = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%2300f2fe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
    }
    
    // Advance to Left
    scanState.currentStep = 'LEFT';
  } else if (currentStep === 'LEFT') {
    // Advance to Right
    scanState.currentStep = 'RIGHT';
  } else if (currentStep === 'RIGHT') {
    // Finished registration!
    scanState.currentStep = 'DONE';
    
    // Push completed registry profile
    localDb.push({
      name: scanState.profileName,
      descriptors: [
        scanState.descriptors.CENTER,
        scanState.descriptors.LEFT,
        scanState.descriptors.RIGHT
      ],
      thumbnail: scanState.thumbnail || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%2300f2fe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
    });
    
    saveDbToLocalStorage();
    alert(`Successfully registered face profile: "${scanState.profileName}" for 3 different directions!`);
    stopScanHud();
  }
  
  updateHudStepClasses();
}

// Execute on DOM load
document.addEventListener('DOMContentLoaded', init);
