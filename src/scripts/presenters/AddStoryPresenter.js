class AddStoryPresenter {
  constructor(view, model) {
    this.view = view;
    this.model = model;
  }

  async submit(token, data) {
    try {
      if (!token) return this.view.showError('Silakan login dulu.');
      if (!data.description) return this.view.showError('Deskripsi wajib diisi.');
      if (!data.lat || !data.lon) return this.view.showError('Pilih lokasi di peta.');
      if (!data.file) return this.view.showError('Silakan upload atau ambil foto.');

      this.view.showLoading();

      const formData = new FormData();
      formData.append('description', data.description);
      formData.append('lat', data.lat);
      formData.append('lon', data.lon);
      formData.append('photo', data.file);

      const res = await this.model.submitStory(token, formData);

      this.view.showSuccess('Story berhasil dikirim!');
      this.view.resetForm();

    } catch (err) {
      this.view.showError(err.message || 'Gagal mengirim story.');
    }
  }
}

export default AddStoryPresenter;
