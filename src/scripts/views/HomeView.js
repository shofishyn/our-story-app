// src/scripts/views/HomeView.js

import idbHelper from '../utils/idb-helper.js';

export default class HomeView {
  constructor() {
    this.map = null;
    this.markers = {};
  }

  getTemplate() {
    return `
      <section class="page home-page">
        <h1>Story Map</h1>
        <div id="map" class="map-container"></div>

        <h2>Stories</h2>
        <div id="story-list" class="story-list"></div>

        <button id="addStoryBtn" class="add-story-btn float-btn">
          + Add Story
        </button>
      </section>
    `;
  }

  showLoading() {
    const container = document.querySelector("#story-list");
    if (container) container.innerHTML = "<p>Loading stories...</p>";
  }

  showError(message) {
    const container = document.querySelector("#story-list");
    if (container) container.innerHTML = `<p>${message}</p>`;
  }

  async renderStories(stories) {
    const container = document.querySelector("#story-list");
    if (!container) return;

    // Check saved stories from IndexedDB
    const savedStories = await idbHelper.getAllStories();
    const savedIds = savedStories.map(s => s.id);

    container.innerHTML = stories
      .map(s => {
        const altText = s.name ? `Image of ${s.name}` : "Story image";

        return `
          <div class="story-card" data-id="${s.id}">
            <img 
              src="${s.photoUrl || ''}" 
              alt="${altText}" 
            />
            <div class="story-content">
              <h3>${s.name || ''}</h3>
              <p>${s.description || ''}</p>
              <small>Lat: ${s.lat || "-"} | Lon: ${s.lon || "-"}</small>

              <button class="save-btn" data-id="${s.id}">
                ${savedIds.includes(s.id) ? "★ Saved" : "☆ Save"}
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    // Attach save button listeners
    document.querySelectorAll(".save-btn").forEach(btn => {
      const story = stories.find(st => st.id == btn.dataset.id);
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent card click
        this.toggleSave(btn.dataset.id, btn, story);
      });
    });
  }

  async toggleSave(id, btn, story) {
    try {
      const isSaved = await idbHelper.hasStory(id);

      if (isSaved) {
        await idbHelper.deleteStory(id);
        btn.textContent = "☆ Save";
        console.log('[HomeView] Removed from saved:', id);
      } else {
        await idbHelper.saveStory(story);
        btn.textContent = "★ Saved";
        console.log('[HomeView] Added to saved:', id);
      }
    } catch (error) {
      console.error('[HomeView] Error toggling save:', error);
      alert('Failed to save/remove story');
    }
  }

  renderMap(stories) {
    const container = document.getElementById("map");
    if (!container) {
      console.error('[HomeView] Map container not found');
      return;
    }

    // Clear existing map if any
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.markers = {};
    }

    // Create tile layers
    const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap'
    });
    const dark = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '© CartoDB'
    });
    const satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: '© Esri'
    });

    // Initialize map
    this.map = L.map("map", {
      center: [-2.5, 118],
      zoom: 5,
      layers: [osm],
    });

    // Add layer control
    L.control.layers({
      "OpenStreetMap": osm,
      "Dark Mode": dark,
      "Satellite": satellite
    }).addTo(this.map);

    // Add markers
    stories.forEach(s => {
      if (s.lat && s.lon) {
        const marker = L.marker([s.lat, s.lon])
          .addTo(this.map)
          .bindPopup(`<strong>${s.name}</strong><br>${s.description || ''}`);

        this.markers[s.id] = marker;

        // Marker click -> scroll to card
        marker.on("click", () => {
          const card = document.querySelector(`.story-card[data-id="${s.id}"]`);
          if (card) {
            card.scrollIntoView({ behavior: "smooth", block: "center" });
            this.highlightCard(s.id);
          }
        });
      }
    });

    // Card click -> zoom to marker (attach after map is ready)
    this.attachCardClickListeners();
  }

  attachCardClickListeners() {
    // Wait a bit for DOM to be fully ready
    setTimeout(() => {
      document.querySelectorAll(".story-card").forEach(card => {
        card.addEventListener("click", (e) => {
          // Ignore if clicking save button
          if (e.target.classList.contains('save-btn')) return;

          const id = card.dataset.id;
          const marker = this.markers[id];

          if (marker && this.map) {
            // Scroll to map
            document.querySelector("#map")?.scrollIntoView({ behavior: "smooth" });

            // Zoom to marker after scroll
            setTimeout(() => {
              this.map.setView(marker.getLatLng(), 12, { animate: true });
              marker.openPopup();
            }, 600);
          }

          this.highlightCard(id);
        });
      });
    }, 300);
  }

  highlightCard(id) {
    document.querySelectorAll(".story-card").forEach(c => {
      c.classList.remove("active-story");
    });
    document.querySelector(`.story-card[data-id="${id}"]`)?.classList.add("active-story");
  }

  // Cleanup when leaving page
  destroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.markers = {};
    }
  }
}