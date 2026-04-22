const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

function getToken() {
  return localStorage.getItem('adminToken');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    window.location.href = '/unauthorized';
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || 'Request failed');
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return null;
  }

  return res.json();
}

// Dashboard
export const fetchStats = () => request('/api/admin/stats');
export const fetchRecentBooks = () => request('/api/admin/books?limit=5&sort=createdAt:desc');

// Books
export const fetchBooks = () => request('/api/admin/books');
export const fetchBook = (id) => request(`/api/admin/books/${id}`);
export const fetchBookChapters = (id) => request(`/api/admin/books/${id}/chapters`);
export const createBook = (data) =>
  request('/api/admin/books/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
export const updateBook = (id, data) =>
  request(`/api/admin/books/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
export const deleteBook = (id) =>{
  console.log('Deleting book:', id);
  console.log('Token:', getToken());
  return request(`/api/admin/books/${id}`, { method: 'DELETE' });
};
export const uploadEpub = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return request('/api/admin/books/extract', {
    method: 'POST',
    body: formData,
  });
};
export const uploadCover = (id, file) => {
  const formData = new FormData();
  formData.append('cover', file);
  return request(`/api/admin/books/${id}/cover`, {
    method: 'POST',
    body: formData,
  });
};
export const toggleBookStatus = (id) =>
  request(`/api/admin/books/${id}/status`, { method: 'PATCH' });

// Users
export const fetchUsers = () => request('/api/admin/users');
export const updateUserRole = (id) =>
  request(`/api/admin/users/${id}/role`, { method: 'PATCH' });

// Comments
export const fetchComments = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/admin/comments${qs ? '?' + qs : ''}`);
};
export const deleteComment = (id) =>
  request(`/api/admin/comments/${id}`, { method: 'DELETE' });
