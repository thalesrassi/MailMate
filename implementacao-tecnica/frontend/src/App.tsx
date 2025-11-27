import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Navbar from "./components/Navbar";
import HomePage from "./components/HomePage";
import DashboardPage from "./components/DashboardPage";
import EmailsPage from "./components/EmailsPage";
import CategoriesPage from "./components/CategoriesPage";
import LoginPage from "@/components/LoginPage";
import { useAuth } from "@/hooks/useAuth";
import RegisterPage from "./components/RegisterPage";
type AuthMode = "login" | "register"

// Define os ids das páginas para segurança de type
type PageId = "home" | "dashboard" | "emails" | "categories";

function Router() {
  const [currentPage, setCurrentPage] = useState<PageId>("home");

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage />;
      case "dashboard":
        return <DashboardPage />;
      case "emails":
        return <EmailsPage />;
      case "categories":
        return <CategoriesPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {renderPage()}
      </main>
    </div>
  );
}

function App() {
  const { isAuthenticated } = useAuth()
  const [currentPage, setCurrentPage] = useState<PageId>("home")
  const [authMode, setAuthMode] = useState<AuthMode>("login")

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />

          {isAuthenticated ? (
            <Router
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          ) : authMode === "login" ? (
            <LoginPage
              onLoginSuccess={() => setCurrentPage("home")}
              onGoToRegister={() => setAuthMode("register")}
            />
          ) : (
            <RegisterPage
              onRegisterSuccess={() => {
                setCurrentPage("home")
              }}
              onGoToLogin={() => setAuthMode("login")}
            />
          )}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App;
