# Vaulta

A cloud-based media file storage and sharing service — a Google Drive-style app with folders, file sharing, public links, search, starring, and trash.

**Stack:** FastAPI + SQLAlchemy + PostgreSQL (Supabase) on the backend, React + Vite + Tailwind + Framer Motion + React Query on the frontend.

## Features

- Email/password auth with JWT access + refresh tokens
- Nested folders, drag-and-drop file uploads with progress
- File preview (images, PDFs, text), version history
- User-to-user sharing with viewer/editor roles
- Public shareable links, with optional password protection and expiry
- Search, starring, trash with restore
- Fully responsive, animated UI

## Project structure

```
vaulta/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entrypoint
│   │   ├── core/
│   │   │   ├── config.py            # env settings (Pydantic)
│   │   │   ├── database.py          # DB engine/session
│   │   │   ├── security.py          # JWT + bcrypt hashing
│   │   │   └── dependencies.py      # get_current_user, role checks
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── folder.py
│   │   │   ├── file.py
│   │   │   ├── file_version.py
│   │   │   ├── share.py
│   │   │   ├── link_share.py
│   │   │   ├── star.py
│   │   │   └── activity.py
│   │   ├── schemas/                 # Pydantic request/response models
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   ├── folder.py
│   │   │   ├── file.py
│   │   │   ├── share.py
│   │   │   └── link_share.py
│   │   ├── routes/                  # API endpoints, one router per resource
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── files.py
│   │   │   ├── folders.py
│   │   │   ├── shares.py
│   │   │   ├── public_links.py
│   │   │   ├── search.py
│   │   │   ├── stars.py
│   │   │   └── trash.py
│   │   ├── services/                # business logic layer
│   │   │   ├── auth_service.py
│   │   │   ├── file_service.py
│   │   │   ├── folder_service.py
│   │   │   ├── storage_service.py   # Supabase/S3 signed URLs
│   │   │   ├── sharing_service.py
│   │   │   ├── search_service.py
│   │   │   ├── star_service.py
│   │   │   └── activity_service.py
│   │   └── utils/
│   │       ├── validators.py
│   │       ├── permissions.py
│   │       ├── file_helpers.py
│   │       └── response.py
│   ├── migrations/                  # Alembic migrations
│   │   └── versions/
│   ├── tests/                       # pytest suite (55 tests)
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_files.py
│   │   ├── test_folders.py
│   │   ├── test_sharing.py
│   │   └── test_search.py
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── runtime.txt                  # pins Python version for Render
│   ├── .env.example
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/              # Navbar, Sidebar, Breadcrumbs, AppShell
│   │   │   ├── files/                # FileCard, FileGrid, FileList, FilePreview, UploadDropzone, UploadProgress
│   │   │   ├── folders/              # FolderCard, CreateFolderModal
│   │   │   ├── sharing/              # ShareModal
│   │   │   └── common/               # Loading, ProtectedRoute, ItemMenu
│   │   ├── pages/                   # Login, Register, Dashboard, MyDrive,
│   │   │   │                         # Shared, Starred, Trash, Search,
│   │   │   │                         # PublicShare, NotFound
│   │   ├── services/                # Axios API layer (one file per resource)
│   │   ├── hooks/                   # React Query hooks (useAuth, useFiles,
│   │   │   │                         # useFolders, useUpload, useSearch)
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── utils/                   # formatFileSize, formatDate, fileTypes
│   │   ├── styles/
│   │   │   └── index.css            # Tailwind v4 + brand theme
│   │   ├── App.jsx                  # routes
│   │   └── main.jsx                 # QueryClientProvider root
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json                  # SPA rewrite for client-side routing
│   └── README.md
│
├── docs/
│   └── screenshots/
│
├── .gitignore
├── README.md
└── LICENSE
```

## Quick start

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # fill in your DATABASE_URL, SECRET_KEY, etc.
alembic upgrade head
uvicorn app.main:app --reload
```
Full details in [`backend/README.md`](backend/README.md).

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

The frontend expects the backend running at `http://localhost:8000` by default (configurable via `VITE_API_URL` in a `frontend/.env` file).

## Screenshots

<!--
  Add your screenshots to docs/screenshots/ and they'll render right here
  on GitHub automatically. Suggested shots: login, My Drive (grid view),
  file preview, share modal, mobile view. Recommended width ~1200px for
  desktop shots so they don't look huge on the repo page.
-->

| | |
|---|---|
| ![Login](docs/screenshots/login.png) | ![My Drive](docs/screenshots/my-drive.png) |
| ![File Preview](docs/screenshots/file-preview.png) | ![Share Modal](docs/screenshots/share-modal.png) |

## License

MIT