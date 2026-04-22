import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import BooksPage from './pages/BooksPage.jsx';
import EditBookPage from './pages/EditBookPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import CommentsPage from './pages/CommentsPage.jsx';
import UnauthorizedPage from './pages/UnauthorizedPage.jsx';
import LoginPage from './pages/LoginPage.jsx';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => !!localStorage.getItem('adminToken')
  );

  const handleLogin = (data) => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/unauthorized" element={<UnauthorizedPage onLogout={handleLogout} />} />
        <Route element={<AppLayout onLogout={handleLogout} />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/books/:id/edit" element={<EditBookPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/comments" element={<CommentsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;