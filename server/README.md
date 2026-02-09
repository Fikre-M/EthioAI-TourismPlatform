# EthioAI Tourism Platform - Server

Backend server for EthioAI Tourism Platform with Express.js, TypeScript, Prisma, and MySQL.

## Quick Start

```bash
cd server
npm install
npm start
```

## Database Setup

1. **Start MySQL** (port 3307)
2. **Create database**: `CREATE DATABASE ethio_ai;`
3. **Run migrations**: `npx prisma migrate dev`
4. **Optional - Create test user**: `node setup-db.js`

Database credentials are in `.env`:
```env
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASS=root
DB_NAME=ethio_ai
```

**Current Schema:** 10 tables (see [DATABASE_STATUS.md](./DATABASE_STATUS.md) for details)
- users, refresh_tokens, password_reset_tokens, email_verification_tokens
- tours, bookings, payments, orders, reviews, chat_messages

## Available Scripts

- `npm start` - Start development server (hot-reload)
- `npm run dev` - Same as npm start
- `npm run build` - Build for production
- `npm run start:prod` - Run production build
- `npm test` - Run tests
- `npx prisma migrate dev` - Run database migrations
- `npm run prisma:studio` - Open database GUI
- `node setup-db.js` - Create test user (email: test@example.com, password: password123)

## API Endpoints

- `GET /health` - Health check
- `GET /api/docs` - API documentation
- `/api/auth` - Authentication
- `/api/tours` - Tours management
- `/api/bookings` - Bookings
- `/api/payments` - Payments
- `/api/reviews` - Reviews
- `/api/chat` - AI chat
- `/api/admin` - Admin panel

## Environment Variables

Key variables in `.env`:
- `PORT` - Server port (default: 5002)
- `DATABASE_URL` - Prisma connection string
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` - Direct MySQL connection
- `JWT_SECRET` - JWT signing key
- `CLIENT_URL` - Frontend URL

See `.env.example` for all available options.