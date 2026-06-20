<div align="center">

# 🏛️ Totem

**B2B SaaS Platform for Tour & Course Management**

[![Deploy](https://github.com/yehsb123/totem/actions/workflows/deploy.yml/badge.svg)](https://github.com/yehsb123/totem/actions/workflows/deploy.yml)

Next.js · Express · MongoDB · Tailwind CSS

</div>

---

## Overview

Totem은 투어·코스 관리, 일정 스케줄링, 대시보드 시각화를 제공하는 B2B SaaS 플랫폼입니다.

## Tech Stack

| Layer | Stack |
|-------|-------|
| **Frontend** | Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 |
| **Backend** | Express 5 · Node.js · Mongoose (MongoDB) |
| **Auth** | JWT · bcrypt |
| **Visualization** | Recharts · D3.js · Three.js |
| **UI Components** | Lucide Icons · FullCalendar · DnD Kit |
| **Security** | Helmet · Rate Limiting · CORS |
| **Deploy** | GitHub Pages (FE) · GitHub Actions CI/CD |

## Project Structure

```
totem/
├── totemFE/
│   ├── FE/                     # Main frontend (Next.js)
│   │   └── src/app/
│   │       ├── mainpage/       # Landing & service intro
│   │       │   ├── pricing/    # Pricing plans
│   │       │   └── resources/  # Resources
│   │       └── toolpage/       # Core application
│   │           ├── dashboard/  # Analytics dashboard
│   │           ├── coursemaker/ # Course builder
│   │           ├── tour/       # Tour management
│   │           ├── schedule/   # Schedule calendar
│   │           ├── review/     # Review system
│   │           └── setting/    # User settings
│   └── my-dashboard-app/      # Dashboard prototype
│
├── totemBE/                    # Backend API server
│   ├── routes/
│   │   ├── auth/               # Authentication
│   │   ├── users/              # User management
│   │   ├── tour/               # Tour endpoints
│   │   ├── courses/            # Course endpoints
│   │   └── plan/               # Plan endpoints
│   ├── models/                 # Mongoose schemas
│   ├── controller/             # Business logic
│   └── middlewares/            # Error handling
│
└── .github/workflows/         # CI/CD pipeline
```

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB

### Backend

```bash
cd totemBE
cp .env.example .env    # Configure your environment variables
npm install
npm run dev             # http://localhost:8000
```

### Frontend

```bash
cd totemFE/FE
npm install
npm run dev             # http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `*` | `/auth/**` | 인증 (로그인/회원가입) |
| `*` | `/users/**` | 사용자 관리 |
| `*` | `/tour/**` | 투어 CRUD |
| `*` | `/courses/**` | 코스 CRUD |

## Key Features

- **🗺️ Tour Management** — 투어 생성·편집·관리
- **📚 Course Builder** — 드래그 앤 드롭 기반 코스 제작
- **📅 Schedule** — FullCalendar 기반 일정 관리
- **📊 Dashboard** — Recharts·D3 기반 데이터 시각화
- **💳 Pricing Plans** — 구독 플랜 관리
- **🔐 Auth** — JWT 기반 인증 시스템

## License

This project is private and proprietary.
