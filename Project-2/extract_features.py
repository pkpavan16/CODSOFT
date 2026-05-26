import argparse

from captioning.config import DEFAULT_FEATURES_FILE, DEFAULT_IMAGES_DIR
from captioning.features import extract_features, save_features


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Extract ResNet50 features for image captioning.")
    parser.add_argument("--images-dir", default=DEFAULT_IMAGES_DIR, help="Directory containing Flickr8k images.")
    parser.add_argument("--output", default=DEFAULT_FEATURES_FILE, help="Where to save the feature pickle.")
    parser.add_argument("--limit", type=int, default=None, help="Optional number of images for a quick smoke run.")
    parser.add_argument("--batch-size", type=int, default=32, help="Images to encode per ResNet50 batch.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    features = extract_features(args.images_dir, limit=args.limit, batch_size=args.batch_size)
    save_features(features, args.output)
    print(f"Saved {len(features)} image feature vectors to {args.output}")


if __name__ == "__main__":
    main()
