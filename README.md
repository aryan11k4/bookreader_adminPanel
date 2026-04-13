# Whisper Reads Admin

React admin panel for Whisper Reads book management system.

## Stack

- **React 18** + **Vite**
- **Ant Design 5** — all UI components
- **React Router v6** — client-side routing
- **TanStack React Query v5** — server state / data fetching

## Setup

```bash
cp .env.example .env
# Edit .env and set VITE_API_BASE_URL to your API server

npm install
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API | `http://localhost:3000` |

## Auth

The app reads `adminToken` from `localStorage` and sends it as `Authorization: Bearer <token>` on every request. Set it before using the app:

```js
localStorage.setItem('adminToken', 'your-token-here');
```

On a `401` response the app redirects to `/unauthorized`.

## Pages

| Route | Description |
|---|---|
| `/` | Dashboard — stats cards + recent books |
| `/books` | Books list with add/delete |
| `/books/:id/edit` | Edit book metadata, chapters, cover |
| `/users` | Users list with role management |
| `/comments` | Comments with search and delete |
| `/unauthorized` | Shown on 401 — logout button clears localStorage |

## File Structure

```
src/
  api/
    adminApi.js          # All fetch helpers, auth header, 401 redirect
  components/
    AppLayout.jsx        # Fixed sidebar + content shell
    BookUploadModal.jsx  # 2-step EPUB upload → Review modal
    ChapterEditor.jsx    # Editable chapter list with merge/delete
  pages/
    DashboardPage.jsx
    BooksPage.jsx
    EditBookPage.jsx
    UsersPage.jsx
    CommentsPage.jsx
    UnauthorizedPage.jsx
  App.jsx               # Router setup
  main.jsx              # React Query + ReactDOM entry
```
