const form = document.querySelector("#caption-form");
const imageInput = document.querySelector("#image-input");
const previewWrap = document.querySelector("#preview-wrap");
const previewImage = document.querySelector("#preview-image");
const captionOutput = document.querySelector("#caption-output");
const captionDetail = document.querySelector("#caption-detail");
const submitButton = form.querySelector("button");

function setBusy(isBusy) {
  submitButton.disabled = isBusy;
  submitButton.textContent = isBusy ? "Generating..." : "Generate caption";
}

imageInput.addEventListener("change", () => {
  const [file] = imageInput.files;
  if (!file) {
    previewWrap.hidden = true;
    previewImage.removeAttribute("src");
    return;
  }

  previewImage.src = URL.createObjectURL(file);
  previewWrap.hidden = false;
  captionOutput.textContent = "Ready to caption.";
  captionDetail.textContent = file.name;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!imageInput.files.length) {
    captionOutput.textContent = "Choose an image first.";
    captionDetail.textContent = "The captioning model needs one uploaded image to analyze.";
    return;
  }

  const formData = new FormData(form);
  setBusy(true);
  captionOutput.textContent = "Reading image...";
  captionDetail.textContent = "Extracting visual features and decoding words.";

  try {
    const response = await fetch("/api/caption", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Caption generation failed.");
    }

    captionOutput.textContent = result.caption;
    if (result.caption_source === "transformer") {
      captionDetail.textContent = "Caption generated with the transformer image-captioning model.";
    } else if (result.used_classifier_fallback) {
      captionDetail.textContent = `Refined with classifier label "${result.classifier_label}" at ${result.classifier_confidence}% confidence.`;
    } else {
      captionDetail.textContent = `Decoder caption accepted. Classifier saw "${result.classifier_label}" at ${result.classifier_confidence}% confidence.`;
    }
  } catch (error) {
    captionOutput.textContent = "Could not generate caption.";
    captionDetail.textContent = error.message;
  } finally {
    setBusy(false);
  }
});
