import CONFIG from '../config.js';

const ENDPOINTS = {
  STORIES: `${CONFIG.BASE_URL}/stories`,
};

export async function getStories(token) {
  const fetchResponse = await fetch(ENDPOINTS.STORIES, {
    headers: {
      "Authorization": `Bearer ${token}`,
    }
  });
  return await fetchResponse.json();
}

// src/scripts/data/api.js  (tambahkan)
export async function postStory(token, formData) {
  const API_URL = 'https://story-api.dicoding.dev/v1/stories';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to post story');
    return result;
  } catch (err) {
    throw err;
  }
}

