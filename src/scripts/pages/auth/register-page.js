import RegisterView from "../../views/RegisterView.js";
import RegisterModel from "../../models/RegisterModel.js";
import RegisterPresenter from "../../presenters/RegisterPresenter.js";

export default class RegisterPage {
  render() {
    return `
      <section class="page register-page">
        <h1>Register</h1>

        <form id="registerForm">
          <label for="name">Full Name</label>
          <input 
            id="name" 
            name="name" 
            type="text" 
            required 
            aria-required="true"
            aria-label="Full name"
          />

          <label for="email">Email</label>
          <input 
            id="email" 
            name="email" 
            type="email" 
            required 
            aria-required="true"
            aria-label="Email address"
          />

          <label for="password">Password</label>
          <input 
            id="password" 
            name="password" 
            type="password" 
            required 
            aria-required="true"
            aria-label="Password"
          />

          <button type="submit">Create Account</button>
        </form>

        <p class="go-login">
          Have an account? <a href="#/login">Sign in here</a>
        </p>

        <div id="register-message" role="alert" aria-live="polite"></div>
      </section>
    `;
  }

  afterRender() {
    const view = new RegisterView();
    const model = new RegisterModel();
    new RegisterPresenter(view, model);
  }
}
