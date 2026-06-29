# MERN CRM Backend

Backend API for the MERN CRM project.

## Folder structure

```text
backend/
  src/
    config/       Database and app configuration
    controllers/  Request handler functions
    middleware/   Express middleware
    models/       Mongoose schemas
    routes/       API route definitions
    scripts/      Utility scripts such as database seeding
    utils/        Shared helpers
    validators/   Request validation rules
    app.js        Express app setup
    server.js     App startup and MongoDB connection
```

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and adjust values if needed.

3. Start MongoDB locally or use a MongoDB Atlas connection string.

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Test the API:

   ```text
   GET http://localhost:5000/api/health
   ```

## Seed test data

After MongoDB is running and `.env` is configured:

```bash
npm run seed
```

Seeded accounts:

```text
Admin: admin@crm.com / password123
Agent: agent@crm.com / password123
```

## API routes

Auth:

```text
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

Users:

```text
GET /api/users/agents
```

Leads:

```text
GET    /api/leads
POST   /api/leads
GET    /api/leads/:id
PATCH  /api/leads/:id
DELETE /api/leads/:id
GET    /api/leads/stats
```

Useful lead query parameters:

```text
status=new
agent=<userId>
search=aarav
startDate=2026-06-01
endDate=2026-06-30
page=1
limit=10
```

Use the returned JWT as:

```text
Authorization: Bearer <token>
```

The React frontend expects this API at `http://localhost:5000/api` by default.

## Access rules

- First signup can become `admin` if `role` is sent as `admin`.
- Later signups become `sales_agent` by default.
- Admin users can see all leads and assign leads to agents.
- Sales agents can only see leads assigned to them.
- Sales agents can create leads, but those leads are assigned to themselves.
