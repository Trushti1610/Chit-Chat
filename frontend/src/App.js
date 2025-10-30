import {
  Route,
  BrowserRouter as Router,
} from "react-router-dom/cjs/react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "react-toastify/dist/ReactToastify.css";
import HomePage from "./Pages/HomePage";
import ChatPage from "./Pages/ChatPage";
import "./App.css";

function App() {
  return (
    <Router>
      <Route path="/" component={HomePage} exact />
      <Route path="/chats" component={ChatPage} />
    </Router>
  );
}

export default App;
