import idbHelper from '../../utils/idb-helper.js';

export default class SavedPage {
  constructor() {
    this._stories = [];
    this._filteredStories = [];
    this._container = null;
    this._searchInput = null;
  }

  async render() {
    return `
      <section class="container">
        <h1>Saved Stories</h1>
        
        <div class="search-container" style="margin: 16px 0;">
          <input 
            type="text" 
            id="search-input" 
            placeholder="🔍 Search stories by name or description..." 
            style="width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 16px;"
          />
        </div>

        <div id="saved-story-list"></div>
      </section>
    `;
  }

  async afterRender() {
    // Check login
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must login first!');
      window.location.hash = '#/login';
      return;
    }

    // Wait for DOM
    await new Promise(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );

    this._container = document.getElementById("saved-story-list");
    this._searchInput = document.getElementById("search-input");

    await this._loadSavedStories();

    this._setupSearch();
  }

  async _loadSavedStories() {
    try {
      this._stories = await idbHelper.getAllStories();
      this._filteredStories = [...this._stories];
      
      console.log('[SavedPage] Loaded stories from IndexedDB:', this._stories.length);
      this.showStories();
    } catch (error) {
      console.error('[SavedPage] Error loading stories:', error);
      this._container.innerHTML = '<p>Error loading saved stories.</p>';
    }
  }

  _setupSearch() {
    if (!this._searchInput) return;

    this._searchInput.addEventListener('input', async (e) => {
      const keyword = e.target.value.trim();

      if (keyword === '') {
        // Show all if search is empty
        this._filteredStories = [...this._stories];
      } else {
        // Search in IndexedDB
        this._filteredStories = await idbHelper.searchStories(keyword);
      }

      this.showStories();
    });
  }

  showStories() {
    const container = this._container;
    if (!container) return;

    // Use filtered stories
    const storiesToShow = this._filteredStories;

    if (storiesToShow.length === 0) {
      const hasSearch = this._searchInput && this._searchInput.value.trim() !== '';
      container.innerHTML = hasSearch 
        ? '<p>No stories found matching your search.</p>'
        : '<p>No saved stories yet.</p>';
      return;
    }

    container.innerHTML = storiesToShow
      .map(story => `
        <div class="story-card">
          <img src="${story.photoUrl || ''}" alt="${story.name || ''}" />
          <h3>${story.name || ''}</h3>
          <p>${story.description || ''}</p>
          <button class="btn-delete-story" data-id="${story.id}">🗑️ Delete</button>
        </div>
      `)
      .join("");

    this._initDeleteButtons();
  }

  _initDeleteButtons() {
    if (!this._container) return;

    const buttons = this._container.querySelectorAll(".btn-delete-story");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => this._handleDelete(btn.dataset.id));
    });
  }

  async _handleDelete(storyId) {
    const confirmDelete = window.confirm("Delete this story from saved?");
    if (!confirmDelete) return;

    try {
      await idbHelper.deleteStory(storyId);
      
      this._stories = this._stories.filter(s => s.id !== storyId);
      this._filteredStories = this._filteredStories.filter(s => s.id !== storyId);
      
      console.log('[SavedPage] Deleted story:', storyId);
      this.showStories();
    } catch (error) {
      console.error('[SavedPage] Error deleting story:', error);
      alert('Failed to delete story');
    }
  }
}