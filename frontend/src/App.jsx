import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import TypingTrainer from "./pages/TypingTrainer.jsx";
import StenoTrainer from "./pages/StenoTrainer.jsx";
import Lessons from "./pages/Lessons.jsx";
import Pricing from "./pages/Pricing.jsx";
import AdminStats from "./pages/AdminStats.jsx";
import NotFound from "./pages/NotFound.jsx";
import Protected from "./components/Protected.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pricing" element={<Pricing />} />

        <Route path="/app" element={<Protected><Dashboard /></Protected>} />
        <Route path="/app/typing" element={<Protected><TypingTrainer /></Protected>} />
        <Route path="/app/steno" element={<Protected><StenoTrainer /></Protected>} />
        <Route path="/app/lessons" element={<Protected><Lessons /></Protected>} />
        <Route path="/admin" element={<Protected><AdminStats /></Protected>} />

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
}
