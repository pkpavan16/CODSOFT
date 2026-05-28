// Recommendation algorithms: Content-Based Filtering and Collaborative Filtering.
// Includes tracking of intermediate calculations for step-by-step mathematical visualizations.

/**
 * Calculates the dot product of two vectors.
 */
function dotProduct(vecA, vecB) {
  let product = 0;
  for (const key in vecA) {
    if (vecB[key]) {
      product += vecA[key] * vecB[key];
    }
  }
  return product;
}

/**
 * Calculates the magnitude (norm) of a vector.
 */
function magnitude(vec) {
  let sumOfSquares = 0;
  for (const key in vec) {
    sumOfSquares += vec[key] * vec[key];
  }
  return Math.sqrt(sumOfSquares);
}

/**
 * Calculates Cosine Similarity between two vectors.
 */
function cosineSimilarity(vecA, vecB) {
  const dot = dotProduct(vecA, vecB);
  const magA = magnitude(vecA);
  const magB = magnitude(vecB);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

/**
 * Content-Based Filtering
 * Recommends items based on the similarity between item genres and user preference history.
 * 
 * @param {Array} items - Full list of items.
 * @param {Object} activeUserRatings - Object mapping itemId -> rating.
 * @param {string} category - Active category ('movies', 'books', 'products').
 * @returns {Object} { recommendations: Array, trace: Object }
 */
function getContentBasedRecommendations(items, activeUserRatings, category) {
  const categoryItems = items.filter(item => item.category === category);
  
  // 1. Identify all unique genres/tags in this category
  const allGenres = new Set();
  categoryItems.forEach(item => {
    item.genres.forEach(genre => allGenres.add(genre));
  });
  const genresList = Array.from(allGenres);

  // 2. Build item genre vectors (binary: 1 if item has genre, 0 otherwise)
  const itemVectors = {};
  categoryItems.forEach(item => {
    const vec = {};
    genresList.forEach(genre => {
      vec[genre] = item.genres.includes(genre) ? 1 : 0;
    });
    itemVectors[item.id] = vec;
  });

  // 3. Compute active user's rating statistics
  const userCategoryRatings = [];
  const ratedItems = [];
  
  categoryItems.forEach(item => {
    const r = activeUserRatings[item.id];
    if (r !== undefined) {
      userCategoryRatings.push(r);
      ratedItems.push({ item, rating: r });
    }
  });

  // 4. Calculate active user profile vector as the weighted sum of rated items' vectors.
  // Weight = rating - 2.5 (so 4, 5 are positive, 1, 2 are negative, 3 is slightly positive)
  const userProfileVector = {};
  genresList.forEach(genre => {
    userProfileVector[genre] = 0;
  });

  let totalWeight = 0;
  ratedItems.forEach(({ item, rating }) => {
    const weight = rating - 2.5; // Scale: 1 -> -1.5, 2 -> -0.5, 3 -> +0.5, 4 -> +1.5, 5 -> +2.5
    const itemVec = itemVectors[item.id];
    genresList.forEach(genre => {
      userProfileVector[genre] += itemVec[genre] * weight;
    });
    totalWeight += Math.abs(weight);
  });

  // Normalize user profile vector (if there are ratings)
  if (totalWeight > 0) {
    genresList.forEach(genre => {
      userProfileVector[genre] = parseFloat((userProfileVector[genre] / totalWeight).toFixed(3));
    });
  }

  // 5. Calculate similarity of each item to the user profile
  const recommendations = [];
  const similarityScores = {};

  categoryItems.forEach(item => {
    const isRated = activeUserRatings[item.id] !== undefined;
    const itemVec = itemVectors[item.id];
    const similarity = cosineSimilarity(userProfileVector, itemVec);
    similarityScores[item.id] = parseFloat(similarity.toFixed(3));

    recommendations.push({
      ...item,
      score: parseFloat(similarity.toFixed(3)),
      isRated: isRated,
      userRating: activeUserRatings[item.id] || null
    });
  });

  // Sort recommendations: unrated first, descending by score
  recommendations.sort((a, b) => {
    if (a.isRated !== b.isRated) {
      return a.isRated ? 1 : -1; // Unrated first
    }
    return b.score - a.score; // Descending similarity score
  });

  // Build computation trace for visualization
  const trace = {
    genresList,
    ratedItems: ratedItems.map(ri => ({
      title: ri.item.title,
      rating: ri.rating,
      weight: ri.rating - 2.5,
      vector: itemVectors[ri.item.id]
    })),
    userProfileVector,
    itemVectors: categoryItems.map(item => ({
      id: item.id,
      title: item.title,
      genres: item.genres,
      vector: itemVectors[item.id],
      similarity: similarityScores[item.id],
      isRated: activeUserRatings[item.id] !== undefined
    }))
  };

  return { recommendations, trace };
}

/**
 * User-Based Collaborative Filtering
 * Recommends items based on rating similarity with other (mock) users.
 * 
 * @param {Array} items - Full list of items.
 * @param {Array} mockUsers - Array of user profile objects.
 * @param {Object} activeUser - Active user object (with ratings object).
 * @param {string} category - Active category ('movies', 'books', 'products').
 * @returns {Object} { recommendations: Array, trace: Object }
 */
function getCollaborativeRecommendations(items, mockUsers, activeUser, category) {
  const categoryItems = items.filter(item => item.category === category);
  const activeRatings = activeUser.ratings;

  // 1. Calculate average rating for each user (active and mock) in this category
  // If a user has no ratings in this category, we default average to 3.0
  const getAverageRating = (ratings) => {
    const catRatings = [];
    categoryItems.forEach(item => {
      if (ratings[item.id] !== undefined) {
        catRatings.push(ratings[item.id]);
      }
    });
    if (catRatings.length === 0) return 3.0;
    const sum = catRatings.reduce((a, b) => a + b, 0);
    return sum / catRatings.length;
  };

  const activeAvg = getAverageRating(activeRatings);
  const userAvgs = {};
  mockUsers.forEach(user => {
    userAvgs[user.id] = getAverageRating(user.ratings);
  });

  // 2. Create centered rating vectors for the category items.
  // Unrated items are filled with 0 (since they represent the mean).
  const getCenteredVector = (ratings, avg) => {
    const vec = {};
    categoryItems.forEach(item => {
      if (ratings[item.id] !== undefined) {
        vec[item.id] = ratings[item.id] - avg;
      } else {
        vec[item.id] = 0;
      }
    });
    return vec;
  };

  const activeCenteredVec = getCenteredVector(activeRatings, activeAvg);
  const userCenteredVecs = {};
  mockUsers.forEach(user => {
    userCenteredVecs[user.id] = getCenteredVector(user.ratings, userAvgs[user.id]);
  });

  // 3. Compute similarity (Centered Cosine Similarity, i.e. Pearson Correlation)
  // between active user and all mock users
  const userSimilarities = [];
  mockUsers.forEach(user => {
    const sim = cosineSimilarity(activeCenteredVec, userCenteredVecs[user.id]);
    userSimilarities.push({
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
      similarity: parseFloat(sim.toFixed(3)),
      averageRating: parseFloat(userAvgs[user.id].toFixed(2))
    });
  });

  // 4. Predict ratings for unrated items
  const recommendations = [];
  const predictionsTrace = {};

  categoryItems.forEach(item => {
    const isRated = activeRatings[item.id] !== undefined;
    
    // Find all users who rated this item
    const ratingUsers = mockUsers.filter(user => user.ratings[item.id] !== undefined);
    
    let numerator = 0;
    let denominator = 0;
    const contributors = [];

    ratingUsers.forEach(user => {
      const simInfo = userSimilarities.find(s => s.userId === user.id);
      const similarity = simInfo.similarity;
      
      // We only consider users with positive similarity (or all non-zero, let's use all non-zero for simple demo)
      if (similarity !== 0) {
        const rating = user.ratings[item.id];
        const avg = userAvgs[user.id];
        const centeredRating = rating - avg;
        
        numerator += similarity * centeredRating;
        denominator += Math.abs(similarity);

        contributors.push({
          userName: user.name,
          avatar: user.avatar,
          similarity: similarity,
          rating: rating,
          average: parseFloat(avg.toFixed(2)),
          centeredRating: parseFloat(centeredRating.toFixed(2)),
          weightedContribution: parseFloat((similarity * centeredRating).toFixed(3))
        });
      }
    });

    let predictedRating = activeAvg;
    if (denominator > 0) {
      predictedRating = activeAvg + (numerator / denominator);
    }
    
    // Clamp predicted rating between 1.0 and 5.0
    predictedRating = Math.max(1, Math.min(5, predictedRating));
    predictedRating = parseFloat(predictedRating.toFixed(2));

    predictionsTrace[item.id] = {
      itemTitle: item.title,
      activeUserAvg: parseFloat(activeAvg.toFixed(2)),
      numerator: parseFloat(numerator.toFixed(3)),
      denominator: parseFloat(denominator.toFixed(3)),
      contributors,
      prediction: predictedRating
    };

    recommendations.push({
      ...item,
      score: predictedRating, // predicted rating acts as score
      isRated: isRated,
      userRating: activeRatings[item.id] || null
    });
  });

  // Sort: unrated first, descending predicted rating
  recommendations.sort((a, b) => {
    if (a.isRated !== b.isRated) {
      return a.isRated ? 1 : -1;
    }
    return b.score - a.score;
  });

  // Build computation trace for visualization
  const trace = {
    activeUserAvg: parseFloat(activeAvg.toFixed(2)),
    activeCenteredVec,
    userSimilarities: userSimilarities.sort((a, b) => b.similarity - a.similarity),
    predictionsTrace
  };

  return { recommendations, trace };
}
