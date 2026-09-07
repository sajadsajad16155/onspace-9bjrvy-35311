import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Home from "@/pages/Home";
import SearchProgressPage from "@/pages/SearchProgressPage";
import PersonProfile from "@/pages/PersonProfile";
import MyRequests from "@/pages/MyRequests";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner
        theme="dark"
        toastOptions={{
          style: {
            background: 'hsl(218, 50%, 8%)',
            border: '1px solid hsl(218, 40%, 20%)',
            color: 'hsl(195, 100%, 90%)',
          },
        }}
      />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes with Navbar */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="flex flex-col min-h-screen" style={{ background: 'hsl(218,56%,5%)' }}>
                    <Navbar />
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/search/:searchId" element={<SearchProgressPage />} />
                        <Route path="/profile/:searchId" element={<PersonProfile />} />
                        <Route path="/requests" element={<MyRequests />} />
                        <Route
                          path="/admin"
                          element={
                            <ProtectedRoute requiredRole="admin">
                              <Admin />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
