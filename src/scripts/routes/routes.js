import HomePage from "../pages/home/home-page.js";
import SavedPage from "../pages/saved/saved-page.js";
import LoginPage from "../pages/auth/login-page.js";
import RegisterPage from "../pages/auth/register-page.js";
import AddStoryPage from "../pages/addstory/add-story-page.js";

const routes = {
  "/": new HomePage(),
  "/saved": new SavedPage(),
  "/login": new LoginPage(),
  "/register": new RegisterPage(),
  "/add-story": new AddStoryPage(),
};

export default routes;
