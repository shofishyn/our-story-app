class HomePresenter {
  constructor(view, model) {
    this.view = view;
    this.model = model;
  }

  async loadStories(token) {
    try {
      this.view.showLoading();

      if (!token) {
        this.view.showError("You must login first to view home.");
        return;
      }

      const stories = await this.model.loadStories(token);

      await this.view.renderStories(stories);
      
      // Render map after stories loaded
      setTimeout(() => {
        this.view.renderMap(stories);
      }, 300);

    } catch (error) {
      console.error('[HomePresenter]', error);
      this.view.showError("Failed to load stories.");
    }
  }
}

export default HomePresenter;