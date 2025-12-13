export default class RegisterPresenter {
  constructor(view, model) {
    this.view = view;
    this.model = model;

    this.view.onRegister(this.handleRegister.bind(this));
  }

  handleRegister({ name, email, password }) {
    const result = this.model.register(name, email, password);

    this.view.showMessage(result.message);
  }
}
