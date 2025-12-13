export default class RegisterModel {
  register(name, email, password) {
    if (!name || !email || !password) {
      return { success: false, message: "All fields are required" };
    }

    // Simulasi sudah ada email
    if (email === "test@example.com") {
      return { success: false, message: "Email already registered" };
    }

    return {
      success: true,
      message: `Account created for ${name}`
    };
  }
}
