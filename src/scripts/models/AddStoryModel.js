import CONFIG from '../config.js';

class AddStoryModel {
  async submitStory(token, formData) {
    const url = `${CONFIG.BASE_URL}/stories`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Upload gagal');

    return result;
  }
}

export default AddStoryModel;
