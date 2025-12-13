export default class LoginView {
  constructor() {
    this.form = document.querySelector("#loginForm");
    this.messageBox = document.querySelector("#login-message");
  }

  onLogin(callback) {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = document.querySelector("#email").value;
      const password = document.querySelector("#password").value;

      callback({ email, password });
    });
  }

  showMessage(msg) {
    this.messageBox.textContent = msg;
  }

}
