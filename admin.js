import { supabase } from "../src/lib/db.js";

// --- State Management ---
const state = {
  genres: [],
  screenshots: [],
  qualities: [
    { label: '480p', size: '', link: '' },
    { label: '720p', size: '', link: '' },
    { label: '1080p', size: '', link: '' }
  ],
  tmdbKey: '5629b3e6f4f1f6b3df59bed51e260b74'
};

// --- TMDB API Helpers ---
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p';

async function tmdbFetch(endpoint, params = {}) {
  const key = state.tmdbKey;
  if (!key) {
    showToast('TMDB API Key missing', 'error');
    return null;
  }

  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.append('api_key', key);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));

  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB Error: ${res.statusText}`);
  return res.json();
}

const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

const $ = (id) => document.getElementById(id);
const form = $('movieForm');
const submitBtn = $('submitBtn');
const toast = $('toast');

// --- Initialization ---
function init() {
  renderGenres();
  renderScreenshots();
  renderQualities();
  bindEvents();
}

// --- Event Listeners ---
function bindEvents() {
  // Auto-slug
  $('title').addEventListener('input', (e) => {
    if (!$('slug').dataset.edited) {
      $('slug').value = e.target.value
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
    }
  });

  $('slug').addEventListener('input', () => {
    $('slug').dataset.edited = true;
  });

  // Image Previews
  $('poster').addEventListener('input', (e) => updatePreview('posterPreview', e.target.value));
  $('banner').addEventListener('input', (e) => updatePreview('bannerPreview', e.target.value));

  // Add Items
  $('addGenreBtn').addEventListener('click', () => {
    const val = $('genreInput').value.trim();
    if (val && !state.genres.includes(val)) {
      state.genres.push(val);
      $('genreInput').value = '';
      renderGenres();
    }
  });

  $('addScreenshotBtn').addEventListener('click', () => {
    const val = $('screenshotInput').value.trim();
    if (val && !state.screenshots.includes(val)) {
      state.screenshots.push(val);
      $('screenshotInput').value = '';
      renderScreenshots();
    }
  });

  $('addQualityBtn').addEventListener('click', () => {
    state.qualities.push({ label: '', size: '', link: '' });
    renderQualities();
  });

  // TMDB Search
  const searchInput = $('tmdbSearchInput');
  const resultsDiv = $('tmdbResults');

  const performTmdbSearch = async (query) => {
    if (!query) {
      resultsDiv.classList.remove('active');
      return;
    }
    
    try {
      $('searchStatus').style.display = 'block';
      const data = await tmdbFetch('/search/movie', { query });
      if (data && data.results) {
        renderTmdbResults(data.results.slice(0, 8));
      }
    } catch (err) {
      console.error(err);
    } finally {
      $('searchStatus').style.display = 'none';
    }
  };

  const debouncedTmdbSearch = debounce(performTmdbSearch, 500);
  searchInput.addEventListener('input', (e) => debouncedTmdbSearch(e.target.value));

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.tmdb-search-section')) {
      resultsDiv.classList.remove('active');
    }
  });

  // Form Submit
  form.addEventListener('submit', handlePreviewAndSubmit);
}

// --- TMDB Logic ---
function renderTmdbResults(movies) {
  const div = $('tmdbResults');
  div.innerHTML = movies.map(m => `
    <div class="tmdb-item" onclick="selectTmdbMovie(${m.id})">
      <img src="${m.poster_path ? TMDB_IMG + '/w92' + m.poster_path : 'https://via.placeholder.com/45x68?text=N/A'}" />
      <div class="tmdb-item-info">
        <h4>${m.title}</h4>
        <p>${m.release_date ? m.release_date.split('-')[0] : 'N/A'} • ★ ${m.vote_average}</p>
      </div>
    </div>
  `).join('');
  div.classList.add('active');
}

window.selectTmdbMovie = async (id) => {
  $('tmdbResults').classList.remove('active');
  $('tmdbSearchInput').value = 'Fetching details...';
  
  try {
    const m = await tmdbFetch(`/movie/${id}`, { append_to_response: 'images' });
    if (!m) return;

    $('title').value = m.title;
    $('slug').value = m.title.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
    $('year').value = m.release_date ? m.release_date.split('-')[0] : '';
    $('rating').value = m.vote_average.toFixed(1);
    $('duration').value = m.runtime ? `${Math.floor(m.runtime / 60)}h ${m.runtime % 60}m` : '';
    $('description').value = m.overview;
    
    if (m.genres && m.genres.length > 0) {
      $('genre').value = m.genres[0].name;
      state.genres = m.genres.map(g => g.name);
      renderGenres();
    }

    const poster = m.poster_path ? `${TMDB_IMG}/w500${m.poster_path}` : '';
    const banner = m.backdrop_path ? `${TMDB_IMG}/original${m.backdrop_path}` : '';
    
    $('poster').value = poster;
    $('banner').value = banner;
    updatePreview('posterPreview', poster);
    updatePreview('bannerPreview', banner);

    if (m.images && m.images.backdrops) {
      state.screenshots = m.images.backdrops.slice(0, 10).map(img => `${TMDB_IMG}/original${img.file_path}`);
      renderScreenshots();
    }

    $('tmdbSearchInput').value = '';
    showToast(`Autofilled: ${m.title}`, 'success');
  } catch (err) {
    console.error(err);
    showToast('Failed to fetch TMDB details', 'error');
  }
};

// --- Renderers ---
function renderGenres() {
  $('genreList').innerHTML = state.genres.map((g, i) => `
    <div class="tag">
      ${g}
      <button type="button" onclick="removeGenre(${i})">&times;</button>
    </div>
  `).join('');
}

window.removeGenre = (i) => {
  state.genres.splice(i, 1);
  renderGenres();
};

function renderScreenshots() {
  $('screenshotList').innerHTML = state.screenshots.map((s, i) => `
    <div class="screenshot-item">
      <img src="${s}" alt="Screenshot" onerror="this.src='https://via.placeholder.com/150?text=Invalid+URL'">
      <button type="button" onclick="removeScreenshot(${i})">&times;</button>
    </div>
  `).join('');
}

window.removeScreenshot = (i) => {
  state.screenshots.splice(i, 1);
  renderScreenshots();
};

function renderQualities() {
  const container = $('qualityList');
  container.innerHTML = state.qualities.map((q, i) => `
    <tr>
      <td><input type="text" value="${q.label}" oninput="updateQuality(${i}, 'label', this.value)" placeholder="e.g. 2160p"></td>
      <td><input type="text" value="${q.size}" oninput="updateQuality(${i}, 'size', this.value)" placeholder="e.g. 2.4GB"></td>
      <td><input type="url" value="${q.link}" oninput="updateQuality(${i}, 'link', this.value)" placeholder="Download link"></td>
      <td><button type="button" class="btn-add" onclick="removeQuality(${i})" style="color:#ff5560">&times;</button></td>
    </tr>
  `).join('');
}

window.updateQuality = (i, field, val) => {
  state.qualities[i][field] = val;
};

window.removeQuality = (i) => {
  state.qualities.splice(i, 1);
  renderQualities();
};

function updatePreview(id, url) {
  const img = $(id);
  const span = img.nextElementSibling;
  if (url) {
    img.src = url;
    img.style.display = 'block';
    if (span) span.style.display = 'none';
  } else {
    img.style.display = 'none';
    if (span) span.style.display = 'block';
  }
}

// --- Submit Logic ---
async function handlePreviewAndSubmit(e) {
  e.preventDefault();
  
  const movieData = {
    title: $('title').value.trim(),
    slug: $('slug').value.trim(),
    year: parseInt($('year').value),
    rating: parseFloat($('rating').value) || 0,
    quality: $('quality').value.trim(),
    duration: $('duration').value.trim(),
    genre: $('genre').value.trim(),
    description: $('description').value.trim(),
    poster: $('poster').value.trim(),
    banner: $('banner').value.trim(),
    genres: state.genres,
    screenshots: state.screenshots,
    sizes: {},
    links: {}
  };

  state.qualities.forEach(q => {
    if (q.label && q.size) movieData.sizes[q.label] = q.size;
    if (q.label && q.link) movieData.links[q.label] = q.link;
  });

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Uploading to Database...</span>';

    const { error } = await supabase
      .from('movies')
      .insert([movieData]);

    if (error) throw error;

    showToast('Movie successfully published!', 'success');
    form.reset();
    state.genres = [];
    state.screenshots = [];
    state.qualities = [
      { label: '480p', size: '', link: '' },
      { label: '720p', size: '', link: '' },
      { label: '1080p', size: '', link: '' }
    ];
    renderGenres();
    renderScreenshots();
    renderQualities();
    updatePreview('posterPreview', '');
    updatePreview('bannerPreview', '');

  } catch (err) {
    console.error(err);
    showToast('Error: ' + err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Publish Movie to CineVault</span>';
  }
}

function showToast(msg, type) {
  toast.textContent = msg;
  toast.style.borderLeftColor = type === 'success' ? '#00ff88' : '#ff1e2d';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

init();
