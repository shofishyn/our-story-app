export default class LoginPresenter {
  constructor(view, model) {
    this.view = view;
    this.model = model;
  }

  async handleLogin({ email, password }) {
    const result = await this.model.login(email, password);

    if (result.error === false) {
      const token = result.loginResult.token;

      localStorage.setItem("token", token);

      this.view.showMessage("Login Successfully! Redirecting...");
      
      return true;

    } else {
      this.view.showMessage(result.message);
      
      return false;
    }
  }
}