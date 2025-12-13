import HomeView from "../../views/HomeView.js";
import HomeModel from "../../models/HomeModel.js";
import HomePresenter from "../../presenters/HomePresenter.js";

export default class HomePage {
  constructor() {
    this.view = new HomeView();
    this.model = new HomeModel();
    this.presenter = new HomePresenter(this.view, this.model);
  }

  async render() {
    return this.view.getTemplate();
  }

  async afterRender() {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("You must login first!");
      window.location.hash = "#/login";
      return;
    }

    // Jika sudah login, load stories
    await this.presenter.loadStories(token);

    // Tombol Add Story
    const btn = document.querySelector("#addStoryBtn");
    if (btn) btn.addEventListener("click", () => location.hash = "#/add-story");
  }
}
