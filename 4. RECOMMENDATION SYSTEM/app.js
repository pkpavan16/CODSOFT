// Recommendation Dashboard Controller

// ================= STATE MANAGEMENT =================
const state = {
  activeTab: 'dashboard',
  activeCategory: 'movies',
  currentAlgorithm: 'collaborative', // 'collaborative' or 'content-based'
  selectedProfileId: 'active_user',
  
  // Custom user ratings, cloned from INITIAL_ACTIVE_USER
  customUserRatings: { ...INITIAL_ACTIVE_USER.ratings },
  
  // List of all items (in-memory database so users can add custom items)
  libraryItems: [...ITEMS],
  
  // Currently selected item for step-by-step math trace in visualizer
  selectedPredictionItemId: null,
  
  // Search and filter states
  searchQuery: '',
  selectedGenreFilter: 'All'
};

// ================= DOM ELEMENT REFERENCES =================
const elements = {
  // Navigation & Page Headings
  pageTitle: document.getElementById('page-title'),
  pageSubtitle: document.getElementById('page-subtitle'),
  navButtons: document.querySelectorAll('.nav-btn'),
  tabPanels: document.querySelectorAll('.tab-panel'),
  sidebarUserName: document.getElementById('sidebar-user-name'),
  sidebarUserAvatar: document.getElementById('sidebar-user-avatar'),
  
  // Selectors & Switches
  categoryChips: document.querySelectorAll('.cat-chip'),
  profileSelect: document.getElementById('select-profile'),
  toggleAlgorithm: document.getElementById('toggle-algorithm'),
  labelEngineCb: document.getElementById('label-engine-cb'),
  labelEngineCf: document.getElementById('label-engine-cf'),
  badgeEngineType: document.getElementById('badge-engine-type'),
  
  // Stats
  statRatedCount: document.getElementById('stat-rated-count'),
  statFavoriteGenre: document.getElementById('stat-favorite-genre'),
  
  // Content Containers
  containerRecommendations: document.getElementById('container-recommendations'),
  containerUserRatings: document.getElementById('container-user-ratings'),
  btnResetRatings: document.getElementById('btn-reset-ratings'),
  
  // Library Tab
  inputLibrarySearch: document.getElementById('input-library-search'),
  containerGenreFilters: document.getElementById('container-genre-filters'),
  containerLibraryGrid: document.getElementById('container-library-grid'),
  
  // Modal Elements
  btnAddItemModal: document.getElementById('btn-add-item-modal'),
  modalAddItem: document.getElementById('modal-add-item'),
  btnCloseAddModal: document.getElementById('btn-close-add-modal'),
  btnCancelAddModal: document.getElementById('btn-cancel-add-modal'),
  formAddItem: document.getElementById('form-add-item'),
  selectItemCategory: document.getElementById('select-item-category'),
  labelItemCreator: document.getElementById('label-item-creator'),
  inputItemCreator: document.getElementById('input-item-creator'),
  labelItemExtra: document.getElementById('label-item-extra'),
  inputItemExtra: document.getElementById('input-item-extra'),
  
  // Math Visualizer Tab
  visualizerAlgorithmTitle: document.getElementById('visualizer-algorithm-title'),
  visualizerAlgorithmDescription: document.getElementById('visualizer-algorithm-description'),
  containerFormulaBox: document.getElementById('container-formula-box'),
  visualizerLeftColumnTitle: document.getElementById('visualizer-left-column-title'),
  visualizerLeftColumnDesc: document.getElementById('visualizer-left-column-desc'),
  containerSimilaritiesList: document.getElementById('container-similarities-list'),
  containerPredictionItemSelector: document.getElementById('container-prediction-item-selector'),
  containerMathCalculationDetails: document.getElementById('container-math-calculation-details')
};

// ================= HELPERS =================

/**
 * Gets the current active user rating dictionary.
 * If simulating a mock user, returns their static ratings.
 * If simulating the active user, returns customUserRatings.
 */
function getActiveRatings() {
  if (state.selectedProfileId === 'active_user') {
    return state.customUserRatings;
  }
  const user = MOCK_USERS.find(u => u.id === state.selectedProfileId);
  return user ? user.ratings : {};
}

/**
 * Gets active user object representing the current simulation state.
 */
function getActiveUserObject() {
  if (state.selectedProfileId === 'active_user') {
    return {
      id: 'active_user',
      name: 'You (Active User)',
      avatar: '✨',
      ratings: state.customUserRatings
    };
  }
  return MOCK_USERS.find(u => u.id === state.selectedProfileId);
}

/**
 * Compiles a database of "other users" (mock users) for collaborative filtering.
 * If simulating a mock user, we remove them from the mock list and insert the active custom user.
 */
function getCollaborativeMockUsers() {
  const customUserObj = {
    id: 'active_user',
    name: 'You (Active User)',
    avatar: '✨',
    ratings: state.customUserRatings
  };

  if (state.selectedProfileId === 'active_user') {
    return MOCK_USERS; // active user is You, so remaining users are standard mocks
  }

  // Active user is one of the mocks (e.g. Alex).
  // We want to return the remaining mocks + Custom User as the databases
  const remainingMocks = MOCK_USERS.filter(u => u.id !== state.selectedProfileId);
  return [...remainingMocks, customUserObj];
}

/**
 * Calculates current ratings statistics for stats widgets.
 */
function updateStats() {
  const ratings = getActiveRatings();
  const ratedCategoryItems = state.libraryItems.filter(
    item => item.category === state.activeCategory && ratings[item.id] !== undefined
  );
  
  // Total count
  elements.statRatedCount.textContent = ratedCategoryItems.length;

  // Favorite Genre
  const genreCounts = {};
  ratedCategoryItems.forEach(item => {
    // Only count positively rated items (rating >= 3)
    if (ratings[item.id] >= 3) {
      item.genres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + ratings[item.id];
      });
    }
  });

  let topGenre = 'None';
  let maxScore = 0;
  for (const genre in genreCounts) {
    if (genreCounts[genre] > maxScore) {
      maxScore = genreCounts[genre];
      topGenre = genre;
    }
  }
  elements.statFavoriteGenre.textContent = topGenre;
}

// ================= RENDER FUNCTIONS =================

/**
 * Renders the rating stars element for cards.
 */
function renderStars(itemId, currentRating, onChange) {
  const ratingContainer = document.createElement('div');
  ratingContainer.className = 'rating-container';

  const label = document.createElement('span');
  label.className = 'rating-label';
  label.textContent = onChange ? 'Your Rating' : 'Community Rating';
  ratingContainer.appendChild(label);

  const starsWrapper = document.createElement('div');
  starsWrapper.className = 'rating-stars';

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.className = 'star' + (i <= Math.round(currentRating) ? ' active' : '');
    star.innerHTML = '★';
    
    if (onChange) {
      star.addEventListener('click', (e) => {
        e.stopPropagation();
        onChange(i);
      });
      // Simple hover animation support
      star.addEventListener('mouseenter', () => {
        const siblings = starsWrapper.children;
        for (let j = 0; j < 5; j++) {
          siblings[j].classList.toggle('active', j < i);
        }
      });
    }
    starsWrapper.appendChild(star);
  }

  // Restore active stars on mouseleave if interactive
  if (onChange) {
    starsWrapper.addEventListener('mouseleave', () => {
      const siblings = starsWrapper.children;
      for (let j = 0; j < 5; j++) {
        siblings[j].classList.toggle('active', j < Math.round(currentRating));
      }
    });
  }

  ratingContainer.appendChild(starsWrapper);
  return ratingContainer;
}

/**
 * Renders Recommendation Cards in the Dashboard Tab.
 */
function renderRecommendations() {
  elements.containerRecommendations.innerHTML = '';
  
  const ratings = getActiveRatings();
  let recommendations = [];
  let trace = {};

  if (state.currentAlgorithm === 'content-based') {
    const result = getContentBasedRecommendations(state.libraryItems, ratings, state.activeCategory);
    recommendations = result.recommendations;
    trace = result.trace;
  } else {
    const activeUser = getActiveUserObject();
    const mockUsers = getCollaborativeMockUsers();
    const result = getCollaborativeRecommendations(state.libraryItems, mockUsers, activeUser, state.activeCategory);
    recommendations = result.recommendations;
    trace = result.trace;
  }

  // Display top 6 unrated items
  const topRecs = recommendations.filter(item => !item.isRated).slice(0, 6);

  if (topRecs.length === 0) {
    elements.containerRecommendations.innerHTML = `
      <div class="no-ratings-placeholder" style="grid-column: 1 / -1;">
        <ion-icon name="alert-circle-outline"></ion-icon>
        <p>No recommendations available. Rate some items to feed the algorithms!</p>
      </div>
    `;
    return;
  }

  topRecs.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';

    // Set custom cover gradient
    const cover = document.createElement('div');
    cover.className = 'item-cover';
    cover.style.background = item.imageGradient || 'linear-gradient(135deg, #1e293b, #0f172a)';

    const overlay = document.createElement('div');
    cover.appendChild(overlay);
    overlay.className = 'item-cover-overlay';

    // Set Category Icon
    const catIcon = document.createElement('div');
    catIcon.className = 'item-category-icon';
    let iconName = 'film';
    if (item.category === 'books') iconName = 'book';
    if (item.category === 'products') iconName = 'pricetag';
    catIcon.innerHTML = `<ion-icon name="${iconName}"></ion-icon>`;
    cover.appendChild(catIcon);

    // Score Badge
    const scoreBadge = document.createElement('div');
    scoreBadge.className = 'item-score-badge';
    if (state.currentAlgorithm === 'content-based') {
      scoreBadge.classList.add('match');
      scoreBadge.innerHTML = `<ion-icon name="sparkles"></ion-icon> ${Math.round(item.score * 100)}% Match`;
    } else {
      scoreBadge.innerHTML = `<ion-icon name="star"></ion-icon> ${item.score} Est`;
    }
    cover.appendChild(scoreBadge);

    // Title overlay
    const titleOverlay = document.createElement('div');
    titleOverlay.className = 'item-title-overlay';
    titleOverlay.textContent = item.title;
    cover.appendChild(titleOverlay);
    
    card.appendChild(cover);

    // Item Details
    const details = document.createElement('div');
    details.className = 'item-details';

    const creator = document.createElement('div');
    creator.className = 'item-creator';
    creator.textContent = item.category === 'movies' ? `Dir: ${item.year}` : 
                          item.category === 'books' ? `By: ${item.author}` : `Brand: ${item.brand}`;
    details.appendChild(creator);

    const desc = document.createElement('p');
    desc.className = 'item-description';
    desc.textContent = item.description;
    details.appendChild(desc);

    const tags = document.createElement('div');
    tags.className = 'item-tags';
    item.genres.slice(0, 3).forEach(genre => {
      const tag = document.createElement('span');
      tag.className = 'item-tag';
      tag.textContent = genre;
      tags.appendChild(tag);
    });
    details.appendChild(tags);

    const footer = document.createElement('div');
    footer.className = 'item-footer';
    
    // Add interactive rating element
    const ratingElement = renderStars(item.id, 0, (newRating) => {
      handleRateItem(item.id, newRating);
    });
    footer.appendChild(ratingElement);

    const avgContainer = document.createElement('div');
    avgContainer.className = 'rating-container';
    avgContainer.style.alignItems = 'flex-end';
    avgContainer.innerHTML = `
      <span class="rating-label">Avg Rating</span>
      <span class="rating-avg-text">★ ${item.ratingAverage} (${item.ratingCount})</span>
    `;
    footer.appendChild(avgContainer);

    details.appendChild(footer);
    card.appendChild(details);
    elements.containerRecommendations.appendChild(card);
  });
}

/**
 * Renders the Ratings Breakdown sidebar in the Dashboard Tab.
 */
function renderUserRatingsBreakdown() {
  elements.containerUserRatings.innerHTML = '';
  const ratings = getActiveRatings();
  
  // Filter items in current category rated by active user
  const ratedItems = state.libraryItems.filter(
    item => item.category === state.activeCategory && ratings[item.id] !== undefined
  );

  if (ratedItems.length === 0) {
    elements.containerUserRatings.innerHTML = `
      <div class="no-ratings-placeholder">
        <ion-icon name="star-outline"></ion-icon>
        <p>You haven't rated any ${state.activeCategory} yet.</p>
      </div>
    `;
    return;
  }

  // Sort: highest rating first
  ratedItems.sort((a, b) => ratings[b.id] - ratings[a.id]);

  ratedItems.forEach(item => {
    const row = document.createElement('div');
    row.className = 'rating-row-item';

    const titleBox = document.createElement('div');
    titleBox.className = 'rating-row-title-box';
    
    const title = document.createElement('span');
    title.className = 'rating-row-title';
    title.textContent = item.title;
    titleBox.appendChild(title);

    const stars = document.createElement('div');
    stars.className = 'rating-row-stars';
    const rating = ratings[item.id];
    for (let i = 0; i < rating; i++) {
      stars.innerHTML += '★';
    }
    titleBox.appendChild(stars);
    row.appendChild(titleBox);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete-rating';
    deleteBtn.innerHTML = '<ion-icon name="trash-outline"></ion-icon>';
    deleteBtn.addEventListener('click', () => {
      handleRemoveRating(item.id);
    });
    row.appendChild(deleteBtn);

    elements.containerUserRatings.appendChild(row);
  });
}

/**
 * Renders the Genre Filter Chips in the Library Explorer Tab.
 */
function renderGenreFilters() {
  elements.containerGenreFilters.innerHTML = '';
  
  const categoryItems = state.libraryItems.filter(item => item.category === state.activeCategory);
  
  // Collect all genres
  const genres = new Set();
  categoryItems.forEach(item => {
    item.genres.forEach(genre => genres.add(genre));
  });

  const genresList = ['All', ...Array.from(genres).sort()];
  
  genresList.forEach(genre => {
    const chip = document.createElement('button');
    chip.className = 'genre-chip' + (state.selectedGenreFilter === genre ? ' active' : '');
    chip.textContent = genre;
    chip.addEventListener('click', () => {
      state.selectedGenreFilter = genre;
      renderGenreFilters();
      renderLibraryGrid();
    });
    elements.containerGenreFilters.appendChild(chip);
  });
}

/**
 * Renders the Library Explorer Grid.
 */
function renderLibraryGrid() {
  elements.containerLibraryGrid.innerHTML = '';

  const ratings = getActiveRatings();
  
  // Filter by category
  let items = state.libraryItems.filter(item => item.category === state.activeCategory);

  // Filter by search query
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    items = items.filter(item => {
      const matchTitle = item.title.toLowerCase().includes(query);
      const matchDesc = item.description.toLowerCase().includes(query);
      let matchCreator = false;
      if (item.category === 'movies' && item.year) matchCreator = item.year.toString().includes(query);
      if (item.category === 'books' && item.author) matchCreator = item.author.toLowerCase().includes(query);
      if (item.category === 'products' && item.brand) matchCreator = item.brand.toLowerCase().includes(query);
      
      return matchTitle || matchDesc || matchCreator || item.genres.some(g => g.toLowerCase().includes(query));
    });
  }

  // Filter by genre chip
  if (state.selectedGenreFilter !== 'All') {
    items = items.filter(item => item.genres.includes(state.selectedGenreFilter));
  }

  if (items.length === 0) {
    elements.containerLibraryGrid.innerHTML = `
      <div class="no-ratings-placeholder" style="grid-column: 1 / -1; min-height: 250px;">
        <ion-icon name="search-outline"></ion-icon>
        <p>No matches found in library.</p>
      </div>
    `;
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';

    // Cover
    const cover = document.createElement('div');
    cover.className = 'item-cover';
    cover.style.background = item.imageGradient || 'linear-gradient(135deg, #1e293b, #0f172a)';

    const overlay = document.createElement('div');
    cover.appendChild(overlay);
    overlay.className = 'item-cover-overlay';

    // Category Icon
    const catIcon = document.createElement('div');
    catIcon.className = 'item-category-icon';
    let iconName = 'film';
    if (item.category === 'books') iconName = 'book';
    if (item.category === 'products') iconName = 'pricetag';
    catIcon.innerHTML = `<ion-icon name="${iconName}"></ion-icon>`;
    cover.appendChild(catIcon);

    // Title
    const titleOverlay = document.createElement('div');
    titleOverlay.className = 'item-title-overlay';
    titleOverlay.textContent = item.title;
    cover.appendChild(titleOverlay);
    
    card.appendChild(cover);

    // Details
    const details = document.createElement('div');
    details.className = 'item-details';

    const creator = document.createElement('div');
    creator.className = 'item-creator';
    creator.textContent = item.category === 'movies' ? `Dir: ${item.year}` : 
                          item.category === 'books' ? `By: ${item.author}` : `Brand: ${item.brand}`;
    details.appendChild(creator);

    const desc = document.createElement('p');
    desc.className = 'item-description';
    desc.textContent = item.description;
    details.appendChild(desc);

    const tags = document.createElement('div');
    tags.className = 'item-tags';
    item.genres.slice(0, 3).forEach(genre => {
      const tag = document.createElement('span');
      tag.className = 'item-tag';
      tag.textContent = genre;
      tags.appendChild(tag);
    });
    details.appendChild(tags);

    const footer = document.createElement('div');
    footer.className = 'item-footer';
    
    // Interactive Rating Stars
    const currentRating = ratings[item.id] || 0;
    const ratingElement = renderStars(item.id, currentRating, (newRating) => {
      handleRateItem(item.id, newRating);
    });
    footer.appendChild(ratingElement);

    const avgContainer = document.createElement('div');
    avgContainer.className = 'rating-container';
    avgContainer.style.alignItems = 'flex-end';
    avgContainer.innerHTML = `
      <span class="rating-label">Avg Rating</span>
      <span class="rating-avg-text">★ ${item.ratingAverage} (${item.ratingCount})</span>
    `;
    footer.appendChild(avgContainer);

    details.appendChild(footer);
    card.appendChild(details);
    elements.containerLibraryGrid.appendChild(card);
  });
}

/**
 * Renders the Mathematical Visualizer Tab.
 */
function renderVisualizer() {
  const ratings = getActiveRatings();
  
  if (state.currentAlgorithm === 'content-based') {
    // CONTENT-BASED FILTERING VISUALIZATION
    elements.visualizerAlgorithmTitle.textContent = "Content-Based Filtering (CB)";
    elements.visualizerAlgorithmDescription.textContent = "Genre affinity modeling. Learns a vector profile of your tastes and calculates Cosine Similarity to item genres.";
    
    elements.containerFormulaBox.innerHTML = `
      <span>Formula:</span><br>
      Cosine Similarity = cos(θ) = (U • I) / (||U|| * ||I||)<br>
      User Vector (U) = ∑ [ (Rating - 2.5) * Item_Vector ]
    `;

    elements.visualizerLeftColumnTitle.textContent = "Your Preference Vector (U)";
    elements.visualizerLeftColumnDesc.textContent = "Weighted combination of genres from rated items.";

    const { recommendations, trace } = getContentBasedRecommendations(state.libraryItems, ratings, state.activeCategory);
    
    // 1. Render Left Column (User Profile Vector)
    elements.containerSimilaritiesList.innerHTML = '';
    const vectorKeys = Object.keys(trace.userProfileVector);
    const maxVal = Math.max(...vectorKeys.map(k => Math.abs(trace.userProfileVector[k])), 0.1);
    
    if (vectorKeys.length === 0 || maxVal === 0.1) {
      elements.containerSimilaritiesList.innerHTML = `
        <div class="no-ratings-placeholder">
          <ion-icon name="analytics-outline"></ion-icon>
          <p>Rate items in the Library to generate a profile vector.</p>
        </div>
      `;
    } else {
      vectorKeys.forEach(genre => {
        const val = trace.userProfileVector[genre];
        const pct = Math.round((Math.max(0, val) / maxVal) * 100);
        const row = document.createElement('div');
        row.className = 'sim-user-row';
        row.innerHTML = `
          <div class="sim-user-header">
            <span>${genre}</span>
            <span class="sim-user-score">${val}</span>
          </div>
          <div class="sim-bar-bg">
            <div class="sim-bar-fill" style="width: ${pct}%;"></div>
          </div>
        `;
        elements.containerSimilaritiesList.appendChild(row);
      });
    }

    // 2. Render Right Column: Unrated Items Selectors
    elements.visualizerRightColumnTitle.textContent = "Cosine Similarity & Recommendations Math";
    elements.containerPredictionItemSelector.innerHTML = '';
    
    const unratedItems = recommendations.filter(item => !item.isRated);

    if (unratedItems.length === 0) {
      elements.containerPredictionItemSelector.innerHTML = '<span class="text-secondary text-sm">No unrated items to calculate.</span>';
      elements.containerMathCalculationDetails.innerHTML = '<p class="text-secondary">All library items are rated.</p>';
      return;
    }

    // Set default item if not set or if rated
    const defaultItem = unratedItems[0];
    if (!state.selectedPredictionItemId || !unratedItems.find(i => i.id === state.selectedPredictionItemId)) {
      state.selectedPredictionItemId = defaultItem.id;
    }

    unratedItems.forEach(item => {
      const chip = document.createElement('button');
      chip.className = 'pred-chip' + (state.selectedPredictionItemId === item.id ? ' active' : '');
      chip.textContent = item.title;
      chip.addEventListener('click', () => {
        state.selectedPredictionItemId = item.id;
        renderVisualizer();
      });
      elements.containerPredictionItemSelector.appendChild(chip);
    });

    // Render step-by-step vector multiplication details
    const selectedItem = state.libraryItems.find(i => i.id === state.selectedPredictionItemId);
    const itemTrace = trace.itemVectors.find(i => i.id === state.selectedPredictionItemId);

    if (!selectedItem || !itemTrace) {
      elements.containerMathCalculationDetails.innerHTML = '<p class="text-secondary">Select an item to show step-by-step math tracing.</p>';
      return;
    }

    // Calculate details for chosen item
    const uVec = trace.userProfileVector;
    const iVec = itemTrace.vector;
    
    // Genre matching breakdown
    let dotProdDetails = '';
    let dotProductVal = 0;
    
    let userMagSq = 0;
    let itemMagSq = 0;
    
    let tableRows = '';
    
    trace.genresList.forEach(genre => {
      const uVal = uVec[genre] || 0;
      const iVal = iVec[genre] || 0;
      const term = uVal * iVal;
      
      dotProductVal += term;
      userMagSq += uVal * uVal;
      itemMagSq += iVal * iVal;

      tableRows += `
        <tr>
          <td><strong>${genre}</strong></td>
          <td>${uVal}</td>
          <td>${iVal}</td>
          <td>${uVal} × ${iVal} = <strong>${term}</strong></td>
        </tr>
      `;
    });

    const userMag = Math.sqrt(userMagSq);
    const itemMag = Math.sqrt(itemMagSq);
    const calculatedSimilarity = (userMag === 0 || itemMag === 0) ? 0 : dotProductVal / (userMag * itemMag);

    elements.containerMathCalculationDetails.innerHTML = `
      <div class="math-title">
        <ion-icon name="compass-outline"></ion-icon>
        <span>Vector Alignment Details for "${selectedItem.title}"</span>
      </div>

      <div class="math-trace-block">
        <div class="math-trace-subtitle">1. Vector Multiplications Table</div>
        <table class="math-table">
          <thead>
            <tr>
              <th>Genre</th>
              <th>User Preference Vector (U)</th>
              <th>Item Vector (I)</th>
              <th>Product (U_g × I_g)</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>

      <div class="math-trace-block">
        <div class="math-trace-subtitle">2. Calculation Values</div>
        <p>• Dot Product (U • I) = <strong>${dotProductVal.toFixed(3)}</strong></p>
        <p>• User Profile Norm ||U|| = √(${userMagSq.toFixed(3)}) = <strong>${userMag.toFixed(3)}</strong></p>
        <p>• Item Genre Norm ||I|| = √(${itemMagSq.toFixed(3)}) = <strong>${itemMag.toFixed(3)}</strong></p>
      </div>

      <div class="math-trace-block">
        <div class="math-trace-subtitle">3. Cosine Alignment formula</div>
        <div class="math-equation">
          Similarity = cos(θ) = ${dotProductVal.toFixed(3)} / (${userMag.toFixed(3)} × ${itemMag.toFixed(3)})<br>
          Similarity = <strong>${calculatedSimilarity.toFixed(3)}</strong>
        </div>
        <div class="math-result-highlight">
          🎯 Cosine Similarity Rating: ${Math.round(calculatedSimilarity * 100)}% Match
        </div>
      </div>
    `;

  } else {
    // COLLABORATIVE FILTERING VISUALIZATION
    elements.visualizerAlgorithmTitle.textContent = "Collaborative Filtering (CF)";
    elements.visualizerAlgorithmDescription.textContent = "User-based prediction. Compares your rating history with other user profiles and predicts your rating for unrated items.";
    
    elements.containerFormulaBox.innerHTML = `
      <span>Formula:</span><br>
      Prediction P(u,i) = R_avg(u) + [ ∑ Sim(u,v) * (R(v,i) - R_avg(v)) ] / [ ∑ |Sim(u,v)| ]
    `;

    elements.visualizerLeftColumnTitle.textContent = "User Correlations";
    elements.visualizerLeftColumnDesc.textContent = "How similar your taste patterns are to other profiles (PCC).";

    const activeUser = getActiveUserObject();
    const mockUsers = getCollaborativeMockUsers();
    const { recommendations, trace } = getCollaborativeRecommendations(state.libraryItems, mockUsers, activeUser, state.activeCategory);

    // 1. Render Left Column (Similarities list)
    elements.containerSimilaritiesList.innerHTML = '';
    
    trace.userSimilarities.forEach(simInfo => {
      const isNeg = simInfo.similarity < 0;
      const absSimilarity = Math.abs(simInfo.similarity);
      const pct = Math.round(absSimilarity * 100);
      
      const row = document.createElement('div');
      row.className = 'sim-user-row';
      row.innerHTML = `
        <div class="sim-user-header">
          <span>${simInfo.avatar} ${simInfo.name} (Avg: ${simInfo.averageRating})</span>
          <span class="sim-user-score ${isNeg ? 'text-danger' : ''}">${simInfo.similarity}</span>
        </div>
        <div class="sim-bar-bg">
          <div class="sim-bar-fill ${isNeg ? 'negative' : ''}" style="width: ${pct}%;"></div>
        </div>
      `;
      elements.containerSimilaritiesList.appendChild(row);
    });

    // 2. Render Right Column: Predicted Items Selectors
    elements.visualizerRightColumnTitle.textContent = "Step-By-Step Prediction Formula";
    elements.containerPredictionItemSelector.innerHTML = '';
    
    const unratedItems = recommendations.filter(item => !item.isRated);

    if (unratedItems.length === 0) {
      elements.containerPredictionItemSelector.innerHTML = '<span class="text-secondary text-sm">No unrated items to calculate.</span>';
      elements.containerMathCalculationDetails.innerHTML = '<p class="text-secondary">All library items are rated.</p>';
      return;
    }

    const defaultItem = unratedItems[0];
    if (!state.selectedPredictionItemId || !unratedItems.find(i => i.id === state.selectedPredictionItemId)) {
      state.selectedPredictionItemId = defaultItem.id;
    }

    unratedItems.forEach(item => {
      const chip = document.createElement('button');
      chip.className = 'pred-chip' + (state.selectedPredictionItemId === item.id ? ' active' : '');
      chip.textContent = item.title;
      chip.addEventListener('click', () => {
        state.selectedPredictionItemId = item.id;
        renderVisualizer();
      });
      elements.containerPredictionItemSelector.appendChild(chip);
    });

    // 3. Render prediction math trace
    const selectedItem = state.libraryItems.find(i => i.id === state.selectedPredictionItemId);
    const itemTrace = trace.predictionsTrace[state.selectedPredictionItemId];

    if (!selectedItem || !itemTrace) {
      elements.containerMathCalculationDetails.innerHTML = '<p class="text-secondary">Select an item to show prediction calculation.</p>';
      return;
    }

    let contributorRows = '';
    
    if (itemTrace.contributors.length === 0) {
      contributorRows = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted);">
            No other simulated users have rated this item. Weighted adjustment defaults to 0.00.
          </td>
        </tr>
      `;
    } else {
      itemTrace.contributors.forEach(c => {
        contributorRows += `
          <tr>
            <td><strong>${c.avatar} ${c.userName}</strong></td>
            <td>${c.similarity}</td>
            <td>${c.rating} - ${c.average} = <strong>${c.centeredRating}</strong></td>
            <td>${c.similarity} × ${c.centeredRating} = <strong>${c.weightedContribution}</strong></td>
          </tr>
        `;
      });
    }

    const finalPrediction = itemTrace.prediction;

    elements.containerMathCalculationDetails.innerHTML = `
      <div class="math-title">
        <ion-icon name="people-outline"></ion-icon>
        <span>Collaborative Rating Estimation for "${selectedItem.title}"</span>
      </div>

      <div class="math-trace-block">
        <div class="math-trace-subtitle">1. Neighbor Rating Inputs</div>
        <table class="math-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Correlation (Sim)</th>
              <th>Centered Rating (R - R_avg)</th>
              <th>Weighted Contribution</th>
            </tr>
          </thead>
          <tbody>
            ${contributorRows}
          </tbody>
        </table>
      </div>

      <div class="math-trace-block">
        <div class="math-trace-subtitle">2. Summing Contributions</div>
        <p>• Your (Active User) average rating in this library category (R_avg_active) = <strong>${itemTrace.activeUserAvg}</strong></p>
        <p>• Sum of weighted contributions (Numerator) = <strong>${itemTrace.numerator}</strong></p>
        <p>• Sum of absolute similarities (Denominator) = <strong>${itemTrace.denominator}</strong></p>
      </div>

      <div class="math-trace-block">
        <div class="math-trace-subtitle">3. Final Formula Assembly</div>
        <div class="math-equation">
          Estimated Rating = R_avg_active + (Numerator / Denominator)<br>
          Estimated Rating = ${itemTrace.activeUserAvg} + (${itemTrace.numerator} / ${itemTrace.denominator})<br>
          Estimated Rating = <strong>${finalPrediction}</strong>
        </div>
        <div class="math-result-highlight">
          🎯 Predicted Score: ★ ${finalPrediction} out of 5
        </div>
      </div>
    `;
  }
}

/**
 * Master render function that refreshes everything on screen.
 */
function render() {
  updateStats();
  renderRecommendations();
  renderUserRatingsBreakdown();
  renderGenreFilters();
  renderLibraryGrid();
  renderVisualizer();
}

// ================= USER EVENT HANDLERS =================

/**
 * Handle user giving a star rating.
 */
function handleRateItem(itemId, rating) {
  const ratings = getActiveRatings();
  ratings[itemId] = rating;

  // Find the item to update statistics for averages
  const item = state.libraryItems.find(i => i.id === itemId);
  if (item) {
    // Simulate updating community stats: push count up, adjust average
    item.ratingCount += 1;
    item.ratingAverage = parseFloat(((item.ratingAverage * (item.ratingCount - 1) + rating) / item.ratingCount).toFixed(1));
  }

  // Trigger UI re-render
  render();
}

/**
 * Handle user deleting a rating.
 */
function handleRemoveRating(itemId) {
  const ratings = getActiveRatings();
  delete ratings[itemId];
  
  // Trigger UI re-render
  render();
}

/**
 * Handle user profile selection change.
 */
function handleProfileChange(e) {
  state.selectedProfileId = e.target.value;
  
  // Update sidebar profile card
  const activeUser = getActiveUserObject();
  elements.sidebarUserName.textContent = activeUser.name;
  elements.sidebarUserAvatar.textContent = activeUser.avatar;

  // If we switch to a profile, reset predictions items
  state.selectedPredictionItemId = null;
  
  // Re-render
  render();
}

/**
 * Handle switching recommendation methods.
 */
function handleAlgorithmToggle(e) {
  state.currentAlgorithm = e.target.checked ? 'collaborative' : 'content-based';

  if (state.currentAlgorithm === 'content-based') {
    elements.labelEngineCb.classList.add('active');
    elements.labelEngineCf.classList.remove('active');
    elements.badgeEngineType.textContent = "Content-Based Filtering";
    elements.badgeEngineType.className = "badge cb-glow";
  } else {
    elements.labelEngineCb.classList.remove('active');
    elements.labelEngineCf.classList.add('active');
    elements.badgeEngineType.textContent = "Collaborative Filtering";
    elements.badgeEngineType.className = "badge glow";
  }

  render();
}

/**
 * Reset all user ratings to default.
 */
function handleResetRatings() {
  if (state.selectedProfileId === 'active_user') {
    state.customUserRatings = { ...INITIAL_ACTIVE_USER.ratings };
  } else {
    // Reset mock user to original clone
    const originalMock = MOCK_USERS.find(u => u.id === state.selectedProfileId);
    // Find matching profile in clean import data
    const cloneSource = state.selectedProfileId === 'user_action' ? MOCK_USERS[0] : 
                        state.selectedProfileId === 'user_drama' ? MOCK_USERS[1] : 
                        state.selectedProfileId === 'user_intellectual' ? MOCK_USERS[2] : 
                        state.selectedProfileId === 'user_lifestyle' ? MOCK_USERS[3] : MOCK_USERS[4];
    
    // Reset ratings to original preset
    if (originalMock && cloneSource) {
      originalMock.ratings = { ...cloneSource.ratings };
    }
  }
  render();
}

/**
 * Handle new item submission.
 */
function handleAddItemSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('input-item-title').value;
  const creator = document.getElementById('input-item-creator').value;
  const extraVal = document.getElementById('input-item-extra').value;
  const category = elements.selectItemCategory.value;
  const description = document.getElementById('input-item-description').value;
  const genresStr = document.getElementById('input-item-genres').value;

  const genres = genresStr.split(',').map(g => g.trim()).filter(g => g !== '');
  
  // Auto-generate ID and beautiful gradient
  const newId = category.charAt(0) + (state.libraryItems.length + 1);
  const hue1 = Math.floor(Math.random() * 360);
  const hue2 = (hue1 + 45) % 360;
  const gradient = `linear-gradient(135deg, hsl(${hue1}, 70%, 15%) 0%, hsl(${hue2}, 60%, 8%) 100%)`;

  const newItem = {
    id: newId,
    category,
    title,
    description,
    genres,
    imageGradient: gradient,
    ratingCount: 1,
    ratingAverage: 4.0
  };

  // Add specific creators / extra details based on category
  if (category === 'movies') {
    newItem.year = parseInt(extraVal) || new Date().getFullYear();
  } else if (category === 'books') {
    newItem.author = creator;
    newItem.pages = parseInt(extraVal) || 300;
  } else if (category === 'products') {
    newItem.brand = creator;
    newItem.price = extraVal || "$99";
  }

  // Insert to local database
  state.libraryItems.push(newItem);
  
  // Close modal and reset form
  elements.modalAddItem.classList.remove('active');
  elements.formAddItem.reset();

  // If the added item category is active, refresh genre filters
  state.selectedGenreFilter = 'All';
  render();
}

// ================= INITIALIZATION & ROUTING =================

/**
 * Binds DOM event listeners.
 */
function bindEvents() {
  // Sidebar tab routing
  elements.navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      
      // Update sidebar nav state
      elements.navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update panels view
      elements.tabPanels.forEach(panel => panel.classList.remove('active'));
      document.getElementById(`panel-${tab}`).classList.add('active');

      state.activeTab = tab;
      
      // Page title adjustments
      if (tab === 'dashboard') {
        elements.pageTitle.textContent = "Personalized Dashboard";
        elements.pageSubtitle.textContent = "Real-time suggestions based on your preferences";
      } else if (tab === 'library') {
        elements.pageTitle.textContent = "Library Explorer";
        elements.pageSubtitle.textContent = "Browse, search, and rate all system items";
      } else if (tab === 'visualizer') {
        elements.pageTitle.textContent = "Mathematical Visualizer";
        elements.pageSubtitle.textContent = "Step-by-step vector and correlation computations";
      } else if (tab === 'help') {
        elements.pageTitle.textContent = "How Algorithms Work";
        elements.pageSubtitle.textContent = "Deep dive into Collaborative vs Content-Based filtering math";
      }
      
      render();
    });
  });

  // Category Selector chips
  elements.categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      elements.categoryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.activeCategory = chip.dataset.category;
      
      // Reset filter states
      state.selectedGenreFilter = 'All';
      elements.inputLibrarySearch.value = '';
      state.searchQuery = '';
      state.selectedPredictionItemId = null;

      render();
    });
  });

  // Controls
  elements.profileSelect.addEventListener('change', handleProfileChange);
  elements.toggleAlgorithm.addEventListener('change', handleAlgorithmToggle);
  elements.btnResetRatings.addEventListener('click', handleResetRatings);

  // Search input in library
  elements.inputLibrarySearch.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderLibraryGrid();
  });

  // Add Item Modal toggles
  elements.btnAddItemModal.addEventListener('click', () => {
    // Dynamic form adjustments based on active category
    const category = state.activeCategory;
    elements.selectItemCategory.value = category;
    adjustAddItemForm(category);
    elements.modalAddItem.classList.add('active');
  });

  elements.btnCloseAddModal.addEventListener('click', () => elements.modalAddItem.classList.remove('active'));
  elements.btnCancelAddModal.addEventListener('click', () => elements.modalAddItem.classList.remove('active'));
  
  elements.selectItemCategory.addEventListener('change', (e) => {
    adjustAddItemForm(e.target.value);
  });

  elements.formAddItem.addEventListener('submit', handleAddItemSubmit);
}

/**
 * Adjusts inputs inside the Add New Item Form based on category selection.
 */
function adjustAddItemForm(category) {
  if (category === 'movies') {
    elements.labelItemCreator.style.display = 'none';
    elements.inputItemCreator.style.display = 'none';
    elements.inputItemCreator.removeAttribute('required');
    
    elements.labelItemExtra.textContent = "Release Year";
    elements.inputItemExtra.placeholder = "e.g. 2010";
  } else if (category === 'books') {
    elements.labelItemCreator.style.display = 'block';
    elements.inputItemCreator.style.display = 'block';
    elements.inputItemCreator.setAttribute('required', 'true');
    elements.labelItemCreator.textContent = "Author Name";
    elements.inputItemCreator.placeholder = "e.g. George Orwell";
    
    elements.labelItemExtra.textContent = "Pages Count";
    elements.inputItemExtra.placeholder = "e.g. 328";
  } else if (category === 'products') {
    elements.labelItemCreator.style.display = 'block';
    elements.inputItemCreator.style.display = 'block';
    elements.inputItemCreator.setAttribute('required', 'true');
    elements.labelItemCreator.textContent = "Brand";
    elements.inputItemCreator.placeholder = "e.g. Sony";
    
    elements.labelItemExtra.textContent = "Price / Model";
    elements.inputItemExtra.placeholder = "e.g. $199";
  }
}

// ================= APP BOOTSTRAP =================
window.addEventListener('DOMContentLoaded', () => {
  // Sync toggle state with state
  elements.toggleAlgorithm.checked = (state.currentAlgorithm === 'collaborative');
  
  // Set active user sidebar
  const activeUser = getActiveUserObject();
  elements.sidebarUserName.textContent = activeUser.name;
  elements.sidebarUserAvatar.textContent = activeUser.avatar;

  bindEvents();
  render();
});
