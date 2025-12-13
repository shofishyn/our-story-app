import AddStoryView from '../../views/AddStoryView.js';
import AddStoryPresenter from '../../presenters/AddStoryPresenter.js';
import AddStoryModel from '../../models/AddStoryModel.js';

export default class AddStoryPage {
  async render() {
    return new AddStoryView().render();
  }

  async afterRender() {
    // Cek login
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must login first!');
      window.location.hash = '#/login';
      return;
    }

    // Init view, model, presenter
    const view = new AddStoryView();
    view.init();

    const model = new AddStoryModel();
    const presenter = new AddStoryPresenter(view, model);

    // Bind submit form ke presenter
    view.onSubmit(async (data) => {
      await presenter.submit(token, data);
    });

  }
}
