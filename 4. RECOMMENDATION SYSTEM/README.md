# PulseRec | Interactive Recommendation Engine Dashboard

Welcome to **PulseRec**, a premium, visually stunning, and highly interactive web application designed to demonstrate and visualize modern recommendation systems. Built using HTML, CSS (Vanilla with glassmorphism), and Vanilla JavaScript, this project allows you to explore the inner mathematical workings of the two main filtering paradigms: **Content-Based Filtering** and **Collaborative Filtering**.

---

## 🌟 Key Features

1. **Dual Recommendation Engines**:
   - **Content-Based Filtering**: Suggests items by matching item genres to your historical tastes using genre vectors and Cosine Similarity.
   - **Collaborative Filtering**: Predicts ratings for unrated items by identifying similar users (neighbors) and calculating a similarity-weighted average of their ratings.
2. **Dynamic Math Visualizer**:
   - **Live Computation Traces**: See step-by-step logs of intermediate values (dot products, vector norms, similarities, and sums) updated in real-time.
   - **Interactive Breakdown**: Click any unrated item to see its exact mathematical formula filled in and executed.
3. **Tri-Category Catalog**:
   - Switch seamlessly between **Movies**, **Books**, and **Products** libraries.
4. **Interactive Sandbox**:
   - Rate any item from 1 to 5 stars, delete ratings, or click "Reset All Ratings".
   - **Add Custom Items**: Insert new items with custom titles, creators, descriptions, and genres. The app automatically assigns a unique identifier and a beautiful custom CSS gradient cover!
5. **Simulation Profiles**:
   - Simulate other users (e.g. Alex the Action Fan, Sarah the Drama Fan, Emma the Fitness Lover) to inspect recommendations and correlations from their perspectives.

---

## 📂 File Architecture

```
4. RECOMMENDATION SYSTEM/
│
├── index.html               # Frontend dashboard structure
├── styles.css               # Modern dark theme styles & animations
├── data.js                  # Pre-curated movies, books, products, and mock profiles
├── recommendation.js        # Recommendation logic (CB & CF algorithms in JS)
├── app.js                   # Application state, event bindings, and UI updates
├── server.py                # Lightweight python launcher
└── README.md                # Project documentation (this file)
```

---

## 🚀 How to Run

There are two easy methods to run PulseRec. Both run entirely locally and require **no dependencies** to be installed!

### Method 1: Python Web Server (Recommended)
Open a terminal in the project directory and run:
```bash
python server.py
```
This starts Python's built-in `http.server` on port `8000` and automatically opens the dashboard in your default browser.

### Method 2: Zero-Server Launch
Locate `index.html` in your file explorer and **double-click** it. The application runs entirely client-side and will work flawlessly directly from your local filesystem.

---

## 🧮 Mathematical Foundations

### 1. Content-Based Filtering (CB)

Each item in a library has a set of genres $G$. We represent the item as a binary vector $\vec{I}$ where:
$$I_g = \begin{cases} 1 & \text{if item has genre } g \\ 0 & \text{otherwise} \end{cases}$$

The active user's **Preference Profile Vector** $\vec{U}$ is computed by scaling item vectors by rating weights and summing them:
$$\vec{U} = \sum_{i \in \text{Rated}} (\text{Rating}_i - 2.5) \cdot \vec{I}_i$$

*Here, subtracting 2.5 mean-centers the 1–5 star ratings so that ratings of 4 and 5 represent positive affinity ($+1.5$ and $+2.5$), 3 represents mild positive affinity ($+0.5$), and 1 and 2 represent negative affinity ($-1.5$ and $-0.5$).*

We then calculate the match score using **Cosine Similarity**:
$$\text{Similarity}(\vec{U}, \vec{I}) = \frac{\vec{U} \cdot \vec{I}}{\|\vec{U}\| \|\vec{I}\|} = \frac{\sum_{g} U_g \cdot I_g}{\sqrt{\sum_g U_g^2} \sqrt{\sum_g I_g^2}}$$

---

### 2. User-Based Collaborative Filtering (CF)

Collaborative filtering estimates ratings based on the opinions of similar users.

#### Step A: Mean-Centering Ratings
To account for user bias (e.g. some users give 4 stars to average movies, while others give 2 stars), we calculate each user's average rating $\bar{R}_u$ and subtract it from their ratings:
$$\text{Centered Rating } S_{u, i} = R_{u, i} - \bar{R}_u$$
If an item is unrated by user $u$, $S_{u, i} = 0$.

#### Step B: Calculating User Similarities
We compute **Centered Cosine Similarity** (equivalent to Pearson Correlation Coefficient) between the active user $u$ and neighbor user $v$:
$$w_{u, v} = \frac{\sum_{i} S_{u, i} \cdot S_{v, i}}{\sqrt{\sum_i S_{u, i}^2} \sqrt{\sum_i S_{v, i}^2}}$$

#### Step C: Predicting Ratings (Weighted Deviation)
To predict user $u$'s rating for an unrated item $p$, we take user $u$'s average rating and add the weighted deviation of neighbors:
$$P_{u, p} = \bar{R}_u + \frac{\sum_{v \in \text{Neighbors}} w_{u, v} \cdot (R_{v, p} - \bar{R}_v)}{\sum_{v \in \text{Neighbors}} |w_{u, v}|}$$

This projects a predicted score between 1.0 and 5.0. Items with the highest predictions are recommended!
