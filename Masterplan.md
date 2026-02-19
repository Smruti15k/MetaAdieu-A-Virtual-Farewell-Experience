# MetaAdieu Master Development Plan

## Phase 1: Foundation (Current Focus)
- [ ] **Project Setup**
    - [ ] Initialize Git repository
    - [ ] Create directory structure (`client`, `server`)
    - [ ] Initialize `client` (Vite + React + TypeScript)
    - [ ] Initialize `server` (Node.js + Express + TypeScript)
    - [ ] Set up global `README.md`
- [ ] **Backend Configuration**
    - [ ] Set up Express server structure
    - [ ] Configure environment variables (`dotenv`)
    - [ ] Set up database connection (MySQL/Sequelize stub or local SQLite for dev)
    - [ ] Implement basic error handling middleware
- [ ] **Frontend Configuration**
    - [ ] Install essential dependencies (React Router, Axios, etc.)
    - [ ] Set up detailed folder structure (`components`, `pages`, `hooks`, `context`)
    - [ ] Configure basic routing
    - [ ] initialize Global Styles / Theme (CSS Variables/Modules)
- [ ] **Authentication Module (Skeleton)**
    - [ ] Define User model
    - [ ] Create Register/Login API endpoints (mocked or basic logic)
    - [ ] Create Login/Register UI pages

## Phase 2: Core Features
- [ ] **Event Management**
    - [ ] Event creation API & UI
    - [ ] Event dashboard for Hosts
    - [ ] Invitation link generation
- [ ] **Memory Wall**
    - [ ] Post model (Photo, Video, Text)
    - [ ] Upload functionality (Multer + ImgBB API)
    - [ ] UI for Memory Wall Masonry Layout
- [ ] **Digital Guestbook**
    - [ ] Guestbook entry model
    - [ ] Rich Text Editor integration
    - [ ] Guestbook UI listing

## Phase 3: Real-time Features
- [ ] **Real-time Infrastructure**
    - [ ] Set up Socket.IO server
    - [ ] configure Client-side Socket provider
- [ ] **Live Interaction**
    - [ ] Implement Chat (Rooms based on Event ID)
    - [ ] Emoji reactions
- [ ] **Video Broadcasting**
    - [ ] WebRTC simple peer implementation or integration
    - [ ] Speaker controls

## Phase 4: Polish & Advanced
- [ ] **Keepsake Generation** (PDF Generation)
- [ ] **Performance Optimization**
- [ ] **Final UI/UX Polish** (Animations, Responsive checks)
