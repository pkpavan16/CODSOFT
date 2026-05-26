import pickle
from pathlib import Path
from typing import Dict

import numpy as np
from tensorflow.keras.applications.resnet50 import ResNet50, preprocess_input
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import img_to_array, load_img
from tqdm import tqdm

from captioning.config import IMAGE_SIZE
from captioning.data import iter_image_paths


FeatureMap = Dict[str, np.ndarray]


def build_feature_extractor() -> Model:
    base_model = ResNet50(weights="imagenet")
    return Model(inputs=base_model.inputs, outputs=base_model.layers[-2].output)


def extract_image_feature(image_path: str | Path, model: Model | None = None) -> np.ndarray:
    extractor = model or build_feature_extractor()
    image_array = load_image_array(image_path)
    image_array = np.expand_dims(image_array, axis=0)
    image_array = preprocess_input(image_array)
    return extractor.predict(image_array, verbose=0)[0]


def load_image_array(image_path: str | Path) -> np.ndarray:
    image = load_img(image_path, target_size=IMAGE_SIZE)
    return img_to_array(image)


def extract_feature_batch(paths: list[Path], model: Model) -> np.ndarray:
    image_arrays = [load_image_array(path) for path in paths]
    image_array = np.asarray(image_arrays)
    image_array = preprocess_input(image_array)
    return model.predict(image_array, verbose=0)


def extract_features(
    images_dir: str | Path,
    model: Model | None = None,
    limit: int | None = None,
    batch_size: int = 32,
) -> FeatureMap:
    extractor = model or build_feature_extractor()
    paths = list(iter_image_paths(images_dir))
    if limit:
        paths = paths[:limit]

    features: FeatureMap = {}
    for start in tqdm(range(0, len(paths), batch_size), desc="Extracting ResNet50 features"):
        batch_paths = paths[start : start + batch_size]
        batch_features = extract_feature_batch(batch_paths, extractor)
        for image_path, feature in zip(batch_paths, batch_features):
            features[image_path.name] = feature
    return features


def save_features(features: FeatureMap, output_path: str | Path) -> None:
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("wb") as handle:
        pickle.dump(features, handle)


def load_features(features_path: str | Path) -> FeatureMap:
    with Path(features_path).open("rb") as handle:
        return pickle.load(handle)
