import { useState, useEffect } from "react";
import { HomePage } from "./components/HomePage";
import { AdminDashboard } from "./components/AdminDashboard";
import { QueenChatAgent } from "./components/QueenChatAgent";

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function navigate(to: string) {
    window.history.pushState({}, "", to);
    setPath(to);
    window.scrollTo(0, 0);
  }

  if (path === "/admin" || path.startsWith("/admin/")) {
    return <AdminDashboard onNavigate={navigate} />;
  }

  return (
    <>
      <HomePage onNavigate={navigate} />
      <QueenChatAgent />
    </>
  );
}
