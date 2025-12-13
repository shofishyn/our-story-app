import LoginView from "../../views/LoginView.js";
import LoginModel from "../../models/LoginModel.js";
import LoginPresenter from "../../presenters/LoginPresenter.js";

export default class LoginPage {
  render() {
    return `
      <section class="page login-page">
        <h1>Login</h1>

        <form id="loginForm">
          <label for="email">Email</label>
          <input id="email" type="email" required />

          <label for="password">Password</label>
          <input id="password" type="password" required />

          <button type="submit">Login</button>
        </form>

        <p>
          Don't have account?
          <a href="#/register" class="register-link">Register here</a>
        </p>

        <div id="login-message"></div>
      </section>
    `;
  }

  afterRender() {
    const view = new LoginView();
    const model = new LoginModel();
    const presenter = new LoginPresenter(view, model);

    view.onLogin(async (data) => {
      const success = await presenter.handleLogin(data);
      
      if (success) {
        setTimeout(() => {
          window.location.hash = "#/";
        }, 1000);
      }
    });
  }
}