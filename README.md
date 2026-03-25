# מאגר תיקי בתי משפט ישראלי 🏛️

> Israeli Legal Database — חיפוש, עיון וניתוח נתוני תיקי בתי משפט בישראל

מאגר נתונים משפטי ישראלי מלא (Full-Stack) המבוסס על נתונים ציבוריים בלבד, עם ממשק חיפוש עברי מלא, דשבורד סטטיסטי ויכולות ייצוא.

---

## ⚡ הפעלה מהירה

```bash
# שכפל את הפרויקט
git clone <repo-url>
cd israeli-legal-db

# העתק משתני סביבה
cp .env.example .env

# הרץ את כל השירותים
docker compose up -d

# האפליקציה זמינה בכתובת:
# http://localhost
```

> **זה הכל!** Docker Compose מטפל בהכל — מסד נתונים, Redis, backend, frontend ו-Nginx.

---

## 🏗️ ארכיטקטורה

```
┌─────────────────────────────────────────────────┐
│                   Nginx (Port 80)                │
│              Reverse Proxy + Rate Limiting        │
└─────────┬───────────────────────┬───────────────┘
          │                       │
          ▼                       ▼
┌─────────────────┐   ┌─────────────────────────┐
│  React Frontend  │   │   FastAPI Backend        │
│  (TypeScript)    │   │   (Python 3.12)          │
│  Tailwind CSS    │   │   Port 8000              │
│  RTL/Hebrew      │   │                          │
└─────────────────┘   └────────┬────────────────┘
                                │
              ┌─────────────────┼──────────────────┐
              ▼                 ▼                  ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ PostgreSQL 16 │  │   Redis 7    │  │Celery Workers│
    │ Full-Text     │  │   Cache +    │  │+ Beat        │
    │ Search (FTS)  │  │   Broker     │  │Scheduler     │
    └──────────────┘  └──────────────┘  └──────────────┘
```

### שירותים ב-Docker Compose

| שירות | תפקיד | Port |
|-------|--------|------|
| `nginx` | Reverse proxy + rate limiting | 80 |
| `backend` | FastAPI REST API | 8000 (internal) |
| `frontend` | React app (built) | 80 (internal) |
| `db` | PostgreSQL 16 | 5432 (internal) |
| `redis` | Cache + Celery broker | 6379 (internal) |
| `worker` | Celery background tasks | — |
| `beat` | Celery periodic scheduler | — |

---

## 🗄️ מבנה הפרויקט

```
.
├── docker-compose.yml          # הגדרת כל השירותים
├── .env.example                # משתני סביבה לדוגמה
├── nginx/
│   └── nginx.conf              # Reverse proxy + rate limiting
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic/                # Database migrations
│   │   └── versions/
│   │       └── 001_initial_schema.py
│   └── app/
│       ├── main.py             # FastAPI app entry point
│       ├── config.py           # Settings
│       ├── database.py         # SQLAlchemy async engine
│       ├── cache.py            # Redis caching
│       ├── models/             # SQLAlchemy models
│       │   ├── court.py
│       │   ├── case.py         # + FTS search_vector
│       │   ├── party.py
│       │   ├── attorney.py
│       │   ├── judge.py
│       │   ├── document.py
│       │   └── hearing.py
│       ├── schemas/            # Pydantic schemas
│       ├── api/v1/             # API endpoints
│       │   ├── search.py       # חיפוש + Facets
│       │   ├── cases.py        # CRUD תיקים
│       │   ├── parties.py
│       │   ├── attorneys.py
│       │   ├── judges.py
│       │   ├── statistics.py   # Dashboard data
│       │   ├── export.py       # CSV/Excel/JSON
│       │   └── admin.py        # Admin endpoints
│       ├── collectors/         # Data collection modules
│       │   ├── odata.py        # odata.org.il CKAN API
│       │   ├── data_gov.py     # data.gov.il API
│       │   ├── net_hamishpat.py # Placeholder (requires auth)
│       │   └── bulk_importer.py # CSV/Excel import
│       ├── tasks/
│       │   └── celery_app.py   # Celery tasks + beat schedule
│       └── seed/
│           └── seed_data.py    # Court + case type seed data
└── frontend/
    ├── Dockerfile
    ├── package.json            # React 18 + TypeScript
    ├── tailwind.config.js      # RTL Hebrew design
    ├── src/
    │   ├── pages/
    │   │   ├── HomePage.tsx    # חיפוש מרכזי + סטטיסטיקות
    │   │   ├── SearchResultsPage.tsx  # תוצאות + Facets
    │   │   ├── CasePage.tsx    # פרטי תיק + Tabs
    │   │   ├── JudgePage.tsx   # פרופיל שופט + גרפים
    │   │   ├── DashboardPage.tsx  # Dashboard סטטיסטי
    │   │   └── AdminPage.tsx   # ממשק ניהול
    │   ├── components/
    │   │   ├── Layout.tsx      # Header + Footer
    │   │   ├── CaseCard.tsx    # כרטיס תיק
    │   │   ├── FacetPanel.tsx  # פאנל פילטרים
    │   │   └── Timeline.tsx    # ציר זמן
    │   ├── api/client.ts       # Axios API client
    │   ├── types/index.ts      # TypeScript types
    │   └── utils/formatters.ts # Date/number formatters
```

---

## 🔌 API Endpoints

### חיפוש
```
GET /api/v1/search?q=<query>&case_type=<type>&court_id=<id>&date_from=<date>&date_to=<date>&status=<status>&page=<n>&per_page=<n>&sort=<relevance|date_desc|date_asc>
```
מחזיר: רשימת תיקים עם pagination + facets (סוגי הליך, בתי משפט, שנים, סטטוס)

### תיקים
```
GET /api/v1/cases/{id}                    — פרטי תיק מלאים
GET /api/v1/cases/{id}/parties            — צדדים
GET /api/v1/cases/{id}/documents          — מסמכים
GET /api/v1/cases/{id}/hearings           — דיונים
GET /api/v1/cases/{id}/timeline           — ציר זמן
GET /api/v1/cases/by-number/{case_number} — חיפוש לפי מספר תיק
```

### שופטים
```
GET /api/v1/judges                        — רשימה
GET /api/v1/judges/{id}                   — פרופיל
GET /api/v1/judges/{id}/cases             — תיקי שופט
GET /api/v1/judges/{id}/statistics        — סטטיסטיקות
```

### צדדים ועו"ד
```
GET /api/v1/parties/search?name=<name>
GET /api/v1/parties/{id}/cases
GET /api/v1/attorneys/search?name=<name>
GET /api/v1/attorneys/{id}/cases
```

### סטטיסטיקות
```
GET /api/v1/statistics/overview
GET /api/v1/statistics/by-year
GET /api/v1/statistics/by-type
GET /api/v1/statistics/by-court
GET /api/v1/statistics/trends?months=24
GET /api/v1/statistics/top-judges
GET /api/v1/statistics/top-attorneys
```

### ייצוא
```
GET /api/v1/export/csv?<filters>
GET /api/v1/export/excel?<filters>
GET /api/v1/export/json?<filters>
```

### ניהול (דורש `X-API-Key` header)
```
POST /api/v1/admin/sync/odata             — סנכרון ידני
POST /api/v1/admin/import/csv             — ייבוא CSV
POST /api/v1/admin/cache/clear            — ניקוי קאש
GET  /api/v1/admin/stats                  — סטטיסטיקות מערכת
GET  /api/v1/admin/sync/status            — סטטוס משימות
```

**תיעוד Swagger מלא:** http://localhost/api/docs

---

## ⚙️ משתני סביבה

| משתנה | ברירת מחדל | תיאור |
|-------|------------|--------|
| `POSTGRES_USER` | `legal_user` | שם משתמש PostgreSQL |
| `POSTGRES_PASSWORD` | `legal_pass` | סיסמת PostgreSQL |
| `POSTGRES_DB` | `legal_db` | שם מסד הנתונים |
| `SECRET_KEY` | — | מפתח סודי (שנה לפרודקשן!) |
| `ADMIN_API_KEY` | — | מפתח API לממשק הניהול |
| `ALLOWED_ORIGINS` | `http://localhost` | CORS origins |
| `ENVIRONMENT` | `production` | סביבת הרצה |

---

## 🔒 אבטחה

- **Rate Limiting:** 100 req/min per IP (Nginx + SlowAPI)
- **Admin API Key:** כל endpoints של `/admin/` דורשים `X-API-Key` header
- **CORS:** מוגדר ל-origins מורשים בלבד
- **SQL Injection:** SQLAlchemy ORM עם parameterized queries
- **Input Sanitization:** Pydantic validation על כל inputs
- **Security Headers:** X-Frame-Options, X-Content-Type-Options, X-XSS-Protection

---

## 📊 מקורות נתונים

| מקור | URL | סטטוס |
|------|-----|--------|
| odata.org.il | https://www.odata.org.il/api/3 | ✅ פעיל |
| data.gov.il | https://data.gov.il/api/3 | ✅ פעיל |
| נט המשפט | courts.gov.il | ⏳ דורש אימות כרטיס חכם |

**כל הנתונים נאספים ממקורות ציבוריים בלבד.**

---

## 🔧 פיתוח מקומי

```bash
# Backend
cd backend
pip install -r requirements.txt
alembic upgrade head
python -m app.seed.seed_data
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

Backend יורץ על: http://localhost:8000
Frontend יורץ על: http://localhost:3000

---

## 📝 הערות חשובות

1. **חוקי לחלוטין** — אוסף רק נתונים ממקורות פתוחים ופומביים
2. **פרטיות** — לא נאחסן מידע חסוי. מידע פומבי בלבד
3. **אין תוכן מסמכים** — מטא-דאטה בלבד, לא תוכן פסקי דין
4. **Seed Data** — רשימת כל בתי המשפט בישראל נטענת אוטומטית

---

## 📄 רישיון

MIT License — ראה קובץ LICENSE לפרטים.
