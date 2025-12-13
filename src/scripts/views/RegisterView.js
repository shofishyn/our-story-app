export default class RegisterView {
  constructor() {
    this.nameInput = document.querySelector("#name");
    this.emailInput = document.querySelector("#email");
    this.passwordInput = document.querySelector("#password");
    this.form = document.querySelector("#registerForm");
    this.messageBox = document.querySelector("#register-message");
  }

  onRegister(handler) {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      handler({
        name: this.nameInput.value,
        email: this.emailInput.value,
        password: this.passwordInput.value,
      });
    });
  }

  showMessage(text) {
    this.messageBox.textContent = text;
  }
}
