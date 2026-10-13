# Smart Study Planner

A Java full-stack web app that helps students manage subjects, tasks, a study timetable, exams and deadlines, and see their progress.

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), React Router, Axios, plain CSS |
| Backend | Java 17, Spring Boot 3, Spring Web, Spring Data JPA (Hibernate), Maven |
| Database | MySQL 8 |
| Deployment | GitHub, Render (backend), Vercel or Netlify (frontend) |

## Project structure

```
smart-study-planner/
├── backend/            Spring Boot REST API
│   └── src/main/java/com/studyplanner/
│       ├── controller/   REST endpoints
│       ├── service/      business logic
│       ├── repository/   Spring Data JPA interfaces
│       ├── entity/       JPA entities (Subject, StudyTask, StudySession, Exam)
│       ├── dto/          request and response objects (with validation)
│       ├── exception/    @ControllerAdvice error handling
│       └── config/       CORS configuration
├── frontend/           React app (pages, components, services, hooks, styles)
├── database/schema.sql MySQL schema
└── README.md
```

**How the layers connect:** React page → Axios service → REST controller → service → repository → MySQL.
Relationships: one `Subject` has many `StudyTask`, `StudySession` and `Exam` rows (foreign key `subject_id`, `ON DELETE CASCADE`).

## 1. Prerequisites

- JDK 17+, Maven 3.9+ (or use an IDE such as IntelliJ / Eclipse / VS Code)
- Node.js 18+ and npm
- MySQL 8 (server + MySQL Workbench or the `mysql` command line)
- Git, and a GitHub account

## 2. Database setup

Option A – run the script (MySQL Workbench: open `database/schema.sql` and click Execute; or CLI):

```bash
mysql -u root -p < database/schema.sql
```

Option B – let the app create the tables. Create only the database:

```sql
CREATE DATABASE smart_study_planner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

(`spring.jpa.hibernate.ddl-auto=update` creates the tables on first start.)

## 3. Run the backend

Credentials are read from environment variables, so no password is stored in the code.

```bash
cd backend
# macOS / Linux
export DB_USERNAME=root
export DB_PASSWORD=your_mysql_password
mvn spring-boot:run
```

```powershell
# Windows PowerShell
$env:DB_USERNAME="root"; $env:DB_PASSWORD="your_mysql_password"
mvn spring-boot:run
```

Defaults if a variable is not set: `DB_URL=jdbc:mysql://localhost:3306/smart_study_planner...`, `DB_USERNAME=root`, empty password.
The API runs at `http://localhost:8080`. Check it: <http://localhost:8080/api/health>.

### Easiest ways to start the backend (Windows friendly)

**With MySQL:** open `backend/src/main/resources/application-local.properties`, replace `PUT_YOUR_MYSQL_PASSWORD_HERE` with your MySQL root password, then:

```powershell
cd backend
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
```

**Without MySQL (quick test or demo):**

```powershell
mvn spring-boot:run "-Dspring-boot.run.profiles=h2"
```

## 4. Run the frontend

```bash
cd frontend
cp .env.example .env        # Windows: copy .env.example .env
npm install
npm run dev
```

Open <http://localhost:5173>. The app calls `VITE_API_BASE_URL` (default `http://localhost:8080/api`).

> Start by adding a **Subject**; tasks, sessions and exams all belong to a subject.

## 5. Test the REST API with Postman

Base URL `http://localhost:8080/api`. Send `Content-Type: application/json`.

| Method | Endpoint | Body / notes |
|---|---|---|
| POST | `/subjects` | `{"name":"Mathematics","description":"Calculus","priority":"HIGH","targetStudyHours":20}` |
| GET | `/subjects`, `/subjects/{id}` | |
| PUT | `/subjects/{id}` | same body as POST |
| DELETE | `/subjects/{id}` | 204; also deletes its tasks, sessions, exams |
| POST | `/tasks` | `{"title":"Chapter 3 exercises","description":"","dueDate":"2026-10-20","priority":"MEDIUM","estimatedDurationMinutes":90,"completed":false,"subjectId":1}` |
| GET / PUT / DELETE | `/tasks`, `/tasks/{id}` | |
| PATCH | `/tasks/{id}/complete` | marks completed (`/pending` reverses it) |
| POST | `/study-sessions` | `{"topic":"Limits","studyDate":"2026-10-14","startTime":"18:00","endTime":"19:30","completedDurationMinutes":0,"subjectId":1}` (planned minutes are calculated) |
| GET / PUT / DELETE | `/study-sessions`, `/study-sessions/{id}` | |
| POST | `/exams` | `{"title":"Midterm","description":"Units 1-3","examDate":"2026-11-02","examType":"EXAM","subjectId":1}` |
| GET / PUT / DELETE | `/exams`, `/exams/{id}` | |
| GET | `/dashboard/summary`, `/progress`, `/progress/subjects` | calculated from database rows |

Enums: `priority` = LOW / MEDIUM / HIGH; `examType` = EXAM / QUIZ / ASSIGNMENT / PROJECT.
Errors return JSON with a `message` (and per-field `errors`): `400` validation, `404` missing record, `409` conflict, `500` server error.

## 6. Push to GitHub

```bash
cd smart-study-planner
git init
git add .
git commit -m "Smart Study Planner: initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/smart-study-planner.git
git push -u origin main
```

`.gitignore` already excludes `node_modules`, `target`, and `.env` files. Never commit passwords.

## 7. Production MySQL database

Render cannot reach the MySQL on your laptop, so use a hosted MySQL service. Pick one that offers MySQL (for example Aiven, Railway, TiDB Cloud, or another provider; check their current free-tier terms). Then:

1. Create a MySQL database named `smart_study_planner` (or use the default one the provider gives you).
2. Copy the host, port, database name, username and password.
3. Build the JDBC URL: `jdbc:mysql://HOST:PORT/DATABASE?useSSL=true&serverTimezone=UTC`
   (if the provider requires SSL, keep `useSSL=true`; some also give an SSL mode option, e.g. `sslMode=REQUIRED`).
4. Optionally run `database/schema.sql` against it, or just let Hibernate create tables on first start.
5. If the provider has an IP allow-list, allow access from Render (or enable public access).

## 8. Deploy the backend to Render

The backend includes a `Dockerfile`, which is how Render runs Java apps.

1. In Render: **New → Web Service** → connect your GitHub repository.
2. Settings: **Root Directory** `backend`, **Runtime/Language** `Docker`.
3. Add **Environment Variables**:
   - `DB_URL` = the JDBC URL from step 7
   - `DB_USERNAME` = your database user
   - `DB_PASSWORD` = your database password
   - `CORS_ALLOWED_ORIGINS` = your frontend URL, e.g. `https://smart-study-planner.vercel.app` (comma-separate several; add `http://localhost:5173` if you also test locally)
4. Deploy. Render sets `PORT` automatically (the app reads it).
5. Open `https://<your-service>.onrender.com/api/health` – it should return `{"status":"UP"}`.

Free Render services sleep after inactivity, so the first request can take around a minute.

## 9. Deploy the frontend (Vercel or Netlify)

**Vercel:** New Project → import the repo → **Root Directory** `frontend` → framework preset **Vite** → add environment variable `VITE_API_BASE_URL` = `https://<your-service>.onrender.com/api` → Deploy. (`vercel.json` handles page refreshes on routes.)

**Netlify:** Add new site → import the repo → **Base directory** `frontend`, build command `npm run build`, publish directory `frontend/dist` → add `VITE_API_BASE_URL` in Site settings → Environment variables → Deploy. (`public/_redirects` handles routing.)

`VITE_` variables are read at build time, so redeploy after changing them.
After you know the final frontend URL, put it in Render's `CORS_ALLOWED_ORIGINS` (no trailing slash) and redeploy the backend.

## 10. Verify the deployed app

1. Open the frontend URL → **Settings → Test connection** should say "Connected".
2. Add a subject, then a task, a study session and an exam.
3. Edit each one, mark a task complete, then delete one.
4. Check Dashboard and Progress update, and refresh the page to confirm the data persists in MySQL.

## Troubleshooting

- **"Cannot reach the server"**: backend not running, wrong `VITE_API_BASE_URL`, or CORS origin missing.
- **`Access denied for user`**: check `DB_USERNAME` / `DB_PASSWORD`.
- **CORS error in the browser console**: add your exact frontend URL to `CORS_ALLOWED_ORIGINS`.
- **`Communications link failure` on Render**: the database host is not reachable from the internet, or SSL settings are wrong.
