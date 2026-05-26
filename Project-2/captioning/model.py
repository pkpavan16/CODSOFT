from tensorflow.keras.layers import LSTM, Dense, Dropout, Embedding, Input, add
from tensorflow.keras.models import Model


def build_caption_model(vocab_size: int, max_length: int, feature_size: int = 2048) -> Model:
    image_input = Input(shape=(feature_size,), name="image_features")
    image_branch = Dropout(0.5)(image_input)
    image_branch = Dense(256, activation="relu")(image_branch)

    text_input = Input(shape=(max_length,), name="partial_caption")
    text_branch = Embedding(vocab_size, 256, mask_zero=True)(text_input)
    text_branch = Dropout(0.5)(text_branch)
    text_branch = LSTM(256)(text_branch)

    decoder = add([image_branch, text_branch])
    decoder = Dense(256, activation="relu")(decoder)
    output = Dense(vocab_size, activation="softmax")(decoder)

    model = Model(inputs=[image_input, text_input], outputs=output)
    model.compile(loss="sparse_categorical_crossentropy", optimizer="adam", metrics=["accuracy"])
    return model
