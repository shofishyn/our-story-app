class AddStoryView {
  constructor() {
    this.container = null;
    this.map = null;
    this.marker = null;
    this.stream = null;
    this.capturedFile = null;
    this.captured = false;
  }

render() {
  return `
    <section class="page add-story-page">
      <h1>Add Story</h1>

      <form id="add-story-form">
        <!-- Description -->
        <label for="input-description">Description</label>
        <textarea id="input-description" rows="4" required></textarea>

        <!-- Photo Upload -->
        <label for="input-photo">Photo (upload)</label>
        <input type="file" id="input-photo" accept="image/*" />

        <!-- Camera Buttons -->
        <div style="margin:8px 0">
          <button type="button" id="btn-camera">Use Camera</button>
          <button type="button" id="btn-capture" style="display:none;">Capture Photo</button>
          <button type="button" id="btn-close-camera" style="display:none;">Close Camera</button>
        </div>

        <!-- Camera Preview -->
        <div id="camera-preview" style="display:none;">
          <video id="video-stream" autoplay playsinline style="max-width:100%;"></video>
          <canvas id="canvas-snapshot" style="display:none;"></canvas>
        </div>

        <!-- Location Section with Fieldset -->
        <fieldset style="border:1px solid #ccc; padding:12px; margin:16px 0; border-radius:4px;">
          <legend>Select Location (click on map)</legend>
          
          <!-- Map -->
          <div id="mini-map" style="height: 300px; margin-bottom:12px;"></div>

          <!-- Latitude Input -->
          <div style="margin-bottom:8px;">
            <label for="input-lat">Latitude</label>
            <input 
              type="text" 
              id="input-lat" 
              placeholder="Latitude" 
              readonly 
              aria-label="Latitude coordinate"
            />
          </div>

          <!-- Longitude Input -->
          <div style="margin-bottom:8px;">
            <label for="input-lon">Longitude</label>
            <input 
              type="text" 
              id="input-lon" 
              placeholder="Longitude" 
              readonly 
              aria-label="Longitude coordinate"
            />
          </div>
        </fieldset>

        <!-- Submit Button -->
        <div style="margin-top:12px">
          <button id="btn-submit" type="submit">Submit Story</button>
        </div>

        <!-- Message Box -->
        <div id="form-message" style="margin-top:8px" role="alert" aria-live="polite"></div>
      </form>
    </section>
  `;
}

  init() {
    this.container = document.querySelector('.add-story-page');
    this.form = document.getElementById('add-story-form');
    this.descInput = document.getElementById('input-description');
    this.photoInput = document.getElementById('input-photo');
    this.latInput = document.getElementById('input-lat');
    this.lonInput = document.getElementById('input-lon');
    this.msgBox = document.getElementById('form-message');

    this.btnCamera = document.getElementById('btn-camera');
    this.btnCapture = document.getElementById('btn-capture');
    this.btnCloseCamera = document.getElementById('btn-close-camera');
    this.video = document.getElementById('video-stream');
    this.canvas = document.getElementById('canvas-snapshot');
    this.cameraPreview = document.getElementById('camera-preview');

    const miniMapContainer = document.getElementById('mini-map');
    this.map = L.map(miniMapContainer).setView([-6.2, 106.8], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

    this.map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      this.setMarker(lat, lng);
      this.latInput.value = lat.toFixed(6);
      this.lonInput.value = lng.toFixed(6);
    });

    this.btnCamera.addEventListener('click', () => this.openCamera());
    this.btnCapture.addEventListener('click', () => this.capturePhoto());
    this.btnCloseCamera.addEventListener('click', () => this.closeCamera());
  }

  setMarker(lat, lon) {
    if (this.marker) this.map.removeLayer(this.marker);
    this.marker = L.marker([lat, lon]).addTo(this.map);
  }

  async openCamera() {
    if (this.stream) return;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      this.video.srcObject = this.stream;
      this.cameraPreview.style.display = 'block';
      this.video.style.display = 'block';
      this.canvas.style.display = 'none';
      this.btnCapture.style.display = 'inline-block';
      this.btnCloseCamera.style.display = 'inline-block';
      if (this.btnRetake) this.btnRetake.style.display = 'none';
      this.btnCamera.style.display = 'none';
      this.captured = false;
    } catch {
      this.showError('Cannot access camera.');
    }
  }

  capturePhoto() {
    const w = this.video.videoWidth;
    const h = this.video.videoHeight;
    this.canvas.width = w;
    this.canvas.height = h;
    const ctx = this.canvas.getContext('2d');
    ctx.drawImage(this.video, 0, 0, w, h);

    // Tampilkan preview
    this.canvas.style.display = 'block';
    this.video.style.display = 'none';
    this.btnCapture.style.display = 'none';
    this.btnCamera.style.display = 'none';
    this.btnCloseCamera.style.display = 'inline-block';

    this.canvas.toBlob(blob => {
      this.capturedFile = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
      this.showMessage('Photo captured! You can retake if you want.');
      this.captured = true;

      // Tambahkan tombol retake jika belum ada
      if (!this.btnRetake) {
        this.btnRetake = document.createElement('button');
        this.btnRetake.type = 'button';
        this.btnRetake.innerText = 'Retake Photo';
        this.btnRetake.style.marginLeft = '8px';
        this.cameraPreview.appendChild(this.btnRetake);
        this.btnRetake.addEventListener('click', () => this.retakePhoto());
      }
      this.btnRetake.style.display = 'inline-block';
    }, 'image/jpeg', 0.9);
  }

  retakePhoto() {
    this.capturedFile = null;
    this.captured = false;
    this.canvas.style.display = 'none';
    this.video.style.display = 'block';
    this.btnCapture.style.display = 'inline-block';
    this.btnRetake.style.display = 'none';
    this.showMessage('Camera reopened. Take your photo again.');
  }

  closeCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.video.srcObject = null;
    this.cameraPreview.style.display = 'none';
    this.btnCapture.style.display = 'none';
    this.btnCloseCamera.style.display = 'none';
    if (this.btnRetake) this.btnRetake.style.display = 'none';
    this.btnCamera.style.display = 'inline-block';
  }

  onSubmit(callback) {
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        description: this.descInput.value.trim(),
        lat: this.latInput.value ? parseFloat(this.latInput.value) : null,
        lon: this.lonInput.value ? parseFloat(this.lonInput.value) : null,
        file: this.capturedFile || (this.photoInput.files[0] || null),
      };
      callback(data);
    });
  }

  showLoading() { this.showMessage('Submitting story...'); }
  showError(msg) { this.showMessage(msg, true); }
  showSuccess(msg) { this.showMessage(msg, false); }

  showMessage(msg, isError = false) {
    this.msgBox.innerText = msg;
    this.msgBox.style.color = isError ? 'red' : 'green';
  }

  resetForm() {
    this.form.reset();
    this.latInput.value = '';
    this.lonInput.value = '';
    this.capturedFile = null;
    this.captured = false;
    if (this.marker) this.map.removeLayer(this.marker);
    this.closeCamera();
  }
}

export default AddStoryView;
