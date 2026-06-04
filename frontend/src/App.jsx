import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = !!localStorage.getItem("admin_token");

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm">
      <span className="text-xl font-bold text-purple-600">🧠 JobMatch</span>
      <div className="flex gap-6 items-center">
        <Link
          to="/"
          className={`text-sm font-medium ${location.pathname === "/" ? "text-purple-600 border-b-2 border-purple-600 pb-1" : "text-gray-500 hover:text-purple-600"}`}
        >
          Match Jobs
        </Link>
        {isAdmin ? (
          <>
            <Link
              to="/admin"
              className={`text-sm font-medium ${location.pathname === "/admin" ? "text-purple-600 border-b-2 border-purple-600 pb-1" : "text-gray-500 hover:text-purple-600"}`}
            >
              Admin
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-500 hover:text-red-500"
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className={`text-sm font-medium ${location.pathname === "/login" ? "text-purple-600 border-b-2 border-purple-600 pb-1" : "text-gray-500 hover:text-purple-600"}`}
          >
            Admin Login
          </Link>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
