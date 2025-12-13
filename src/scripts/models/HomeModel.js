import { getStories } from '../data/api.js';

export default class HomeModel {
  constructor() {
    this.stories = [];
  }

  async loadStories(token) {
    const response = await getStories(token);

    if (!response || !response.listStory) {
      throw new Error("Failed to load stories");
    }

    this.stories = response.listStory;
    return this.stories;
  }

  getStoriesWithLocation() {
    return this.stories.filter(s => s.lat && s.lon);
  }
}