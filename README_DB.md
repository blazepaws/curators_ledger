Postgres & Prisma setup

1. Create a PostgreSQL database and set the DATABASE_URL environment variable. Example:

   DATABASE_URL=postgresql://user:password@localhost:5432/wow_tasks

2. Install dependencies:

```bash
npm install
```

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Run migrations to create the tables (this will prompt and create a migration):

```bash
npm run prisma:migrate
```

5. Start dev server:

```bash
npm run dev
```

API endpoints:
- `GET /api/tasks?userId=<id>` - list tasks for user (includes tags and board state)
- `POST /api/tasks` - create a task. JSON body: `{ userId, name, character, description, deadline, unlocksAt, tags }`

