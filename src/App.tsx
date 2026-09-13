import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Biblioteca from "./pages/Biblioteca";
import Progresso from "./pages/Progresso";
import Notas from "./pages/Notas";
import Leitura from "./pages/Leitura";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("leitura-dark-mode", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    setDarkMode(localStorage.getItem("leitura-dark-mode") === "true");
  }, []);

  // A tela de leitura ocupa a janela inteira (sem sidebar), como no mockup "Tela_livro_aberto"
  const isReadingScreen = location.pathname.startsWith("/livro/");

  if (isReadingScreen) {
    return (
      <Routes>
        <Route path="/livro/:id" element={<Leitura />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-cream dark:bg-charcoal">
      <Sidebar darkMode={darkMode} onToggleDarkMode={() => setDarkMode((v) => !v)} />
      <main className="flex-1 overflow-y-auto p-8">
        <Routes>
          <Route path="/" element={<Biblioteca />} />
          <Route path="/progresso" element={<Progresso />} />
          <Route path="/notas" element={<Notas />} />
        </Routes>
      </main>
    </div>
  );
}
