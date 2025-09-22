import { useState } from "react";
import LoginScreen from "@/components/LoginScreen";
import LanguageSelector from "@/components/LanguageSelector";
import HomeScreen from "@/components/HomeScreen";

type AppState = "login" | "language" | "home";

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<AppState>("login");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");

  const handleLogin = () => {
    setCurrentScreen("language");
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setCurrentScreen("home");
  };

  const handleLogout = () => {
    setCurrentScreen("login");
    setSelectedLanguage("");
  };

  switch (currentScreen) {
    case "login":
      return <LoginScreen onLogin={handleLogin} />;
    case "language":
      return <LanguageSelector onLanguageSelect={handleLanguageSelect} />;
    case "home":
      return <HomeScreen language={selectedLanguage} onLogout={handleLogout} />;
    default:
      return <LoginScreen onLogin={handleLogin} />;
  }
};

export default Index;
