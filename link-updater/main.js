import { supabase } from "../db.js";

// State
let moviesState = [];
let filteredMoviesState = [];

// DOM Elements
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const moviesTable = document.getElementById("moviesTable");
const moviesTableBody = document.getElementById("moviesTableBody");
const searchInput = document.getElementById("searchInput");
const toast = document.getElementById("toast");
const toastIcon = document.getElementById("toastIcon");
const toastMessage = document.getElementById("toastMessage");

// Init
async function init() {
  try {
    await fetchMovies();
    bindEvents();
  } catch (err) {
    console.error("Initialization failed:", err);
    showToast("Failed to initialize: " + err.message, "error");
  }
}

// Fetch Movies from Supabase
async function fetchMovies() {
  showLoading(true);
  try {
    const { data, error } = await supabase
      .from("movies")
      .select("*")
      .order("title", { ascending: true });

    if (error) throw error;

    moviesState = data || [];
    filteredMoviesState = [...moviesState];
    renderMovies();
  } catch (err) {
    console.error("Error fetching movies:", err);
    showToast("Error loading movies from database", "error");
  } finally {
    showLoading(false);
  }
}

// Render Table
function renderMovies() {
  if (filteredMoviesState.length === 0) {
    moviesTable.style.display = "none";
    emptyState.style.display = "flex";
    return;
  }

  emptyState.style.display = "none";
  moviesTable.style.display = "table";

  moviesTableBody.innerHTML = filteredMoviesState.map(movie => {
    return `
      <tr id="movie-row-${movie.id}">
        <td>
          <div class="poster-container">
            <img class="poster-img" src="${movie.poster || 'https://via.placeholder.com/80x120?text=No+Poster'}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/80x120?text=No+Poster'">
          </div>
        </td>
        <td>
          <div class="movie-info">
            <div class="movie-title">${movie.title}</div>
            <div class="movie-meta">${movie.year || 'N/A'} • ${movie.duration || 'N/A'}</div>
            <div class="genres-container">
              ${(movie.genres || []).map(g => `<span class="genre-tag">${g}</span>`).join('')}
            </div>
          </div>
        </td>
        <td>
          <div class="quality-rows">
            <div class="quality-row-info">
              <span class="quality-badge badge-480p">480p</span>
              <div class="link-display">
                ${renderLinkInfo(movie, '480p')}
              </div>
            </div>
            <div class="quality-row-info">
              <span class="quality-badge badge-720p">720p</span>
              <div class="link-display">
                ${renderLinkInfo(movie, '720p')}
              </div>
            </div>
            <div class="quality-row-info">
              <span class="quality-badge badge-1080p">1080p</span>
              <div class="link-display">
                ${renderLinkInfo(movie, '1080p')}
              </div>
            </div>
          </div>
        </td>
        <td>
          <div class="input-fields-container">
            <div class="input-with-label">
              <span class="quality-label-fixed">480p</span>
              <input type="url" class="new-link-input" id="input-480p-${movie.id}" placeholder="Paste new 480p link...">
            </div>
            <div class="input-with-label">
              <span class="quality-label-fixed">720p</span>
              <input type="url" class="new-link-input" id="input-720p-${movie.id}" placeholder="Paste new 720p link...">
            </div>
            <div class="input-with-label">
              <span class="quality-label-fixed">1080p</span>
              <input type="url" class="new-link-input" id="input-1080p-${movie.id}" placeholder="Paste new 1080p link...">
            </div>
            <div class="action-cell">
              <button class="btn-update" id="btn-update-${movie.id}" onclick="updateMovieLinks(${movie.id})">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                <span>Update</span>
              </button>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Render Link Info Column
function renderLinkInfo(movie, quality) {
  const size = movie.sizes ? movie.sizes[quality] : null;
  const link = movie.links ? movie.links[quality] : null;

  if (!link) {
    return `<span class="no-link">No link set</span>`;
  }

  const sizeLabel = size ? `(${size})` : '';

  return `
    <span class="size-label" style="font-weight: 600; font-size: 0.8rem; color: var(--text-dim); margin-right: 4px;">${sizeLabel}</span>
    <a href="${link}" target="_blank" class="link-text-truncated" title="${link}">${link}</a>
    <button class="copy-btn" onclick="copyToClipboard('${link}')" title="Copy Link">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
    </button>
  `;
}

// Helpers
function showLoading(show) {
  loadingState.style.display = show ? "flex" : "none";
  if (show) {
    moviesTable.style.display = "none";
    emptyState.style.display = "none";
  }
}

// Toast Notifications
function showToast(message, type = "success") {
  toastMessage.textContent = message;
  
  if (type === "success") {
    toast.style.borderLeftColor = "var(--success)";
    toastIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else {
    toast.style.borderLeftColor = "var(--error)";
    toastIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  }

  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}

// Copy to Clipboard
window.copyToClipboard = function(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast("Link copied to clipboard!");
  }).catch(err => {
    console.error("Could not copy link:", err);
    showToast("Failed to copy link", "error");
  });
};

// Bind Search Event
function bindEvents() {
  searchInput.addEventListener("input", (e) => {
    const val = e.target.value.toLowerCase().trim();
    if (!val) {
      filteredMoviesState = [...moviesState];
    } else {
      filteredMoviesState = moviesState.filter(movie => {
        const titleMatch = (movie.title || "").toLowerCase().includes(val);
        const yearMatch = (movie.year || "").toString().includes(val);
        const genresMatch = (movie.genres || []).some(g => g.toLowerCase().includes(val));
        return titleMatch || yearMatch || genresMatch;
      });
    }
    renderMovies();
  });
}

// Helper: Try to parse size from the URL filename
function parseSizeFromUrl(url) {
  if (!url) return null;
  // Decode URL in case of encoded characters like %20
  let decodedUrl = "";
  try {
    decodedUrl = decodeURIComponent(url);
  } catch (e) {
    decodedUrl = url;
  }
  
  // Look for patterns like 800MB, 1.2GB, etc.
  const sizeMatch = decodedUrl.match(/(\d+(?:\.\d+)?\s?(?:GB|MB))/i);
  return sizeMatch ? sizeMatch[1].toUpperCase() : null;
}

// Update Movie Links
window.updateMovieLinks = async function(id) {
  const movie = moviesState.find(m => m.id === id);
  if (!movie) return;

  const val480 = document.getElementById(`input-480p-${id}`).value.trim();
  const val720 = document.getElementById(`input-720p-${id}`).value.trim();
  const val1080 = document.getElementById(`input-1080p-${id}`).value.trim();

  // If all fields are empty, alert user
  if (!val480 && !val720 && !val1080) {
    showToast("Please enter at least one new link to update.", "error");
    return;
  }

  const btn = document.getElementById(`btn-update-${id}`);
  const origBtnContent = btn.innerHTML;
  
  // Set Loading State
  btn.disabled = true;
  btn.innerHTML = `<span class="loader"></span> <span>Updating...</span>`;

  try {
    // Clone existing links and sizes objects
    const updatedLinks = movie.links ? { ...movie.links } : {};
    const updatedSizes = movie.sizes ? { ...movie.sizes } : {};

    let hasChanges = false;

    // 480p update
    if (val480) {
      updatedLinks["480p"] = val480;
      const parsedSize = parseSizeFromUrl(val480);
      if (parsedSize) {
        updatedSizes["480p"] = parsedSize;
      }
      hasChanges = true;
    }

    // 720p update
    if (val720) {
      updatedLinks["720p"] = val720;
      const parsedSize = parseSizeFromUrl(val720);
      if (parsedSize) {
        updatedSizes["720p"] = parsedSize;
      }
      hasChanges = true;
    }

    // 1080p update
    if (val1080) {
      updatedLinks["1080p"] = val1080;
      const parsedSize = parseSizeFromUrl(val1080);
      if (parsedSize) {
        updatedSizes["1080p"] = parsedSize;
      }
      hasChanges = true;
    }

    if (!hasChanges) {
      showToast("No valid links to update.", "error");
      btn.disabled = false;
      btn.innerHTML = origBtnContent;
      return;
    }

    // Update in Supabase
    const { error } = await supabase
      .from("movies")
      .update({
        links: updatedLinks,
        sizes: updatedSizes
      })
      .eq("id", id);

    if (error) throw error;

    // Update local state
    movie.links = updatedLinks;
    movie.sizes = updatedSizes;

    // Re-render the table row
    // Clear the input fields for this row
    document.getElementById(`input-480p-${id}`).value = "";
    document.getElementById(`input-720p-${id}`).value = "";
    document.getElementById(`input-1080p-${id}`).value = "";

    // Refresh the movies list visualization
    renderMovies();
    showToast(`Successfully updated links for "${movie.title}"`);
  } catch (err) {
    console.error("Update failed:", err);
    showToast("Update failed: " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = origBtnContent;
  }
};

// Start
init();
