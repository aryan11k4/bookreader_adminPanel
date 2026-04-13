import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import BooksPage from './pages/BooksPage.jsx';
import EditBookPage from './pages/EditBookPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import CommentsPage from './pages/CommentsPage.jsx';
import UnauthorizedPage from './pages/UnauthorizedPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/books/:id/edit" element={<EditBookPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/comments" element={<CommentsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
