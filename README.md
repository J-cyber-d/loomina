# loomina 🔮

**Weave real-time embedded analytics into your SaaS in 5 minutes.**

![Loomina Preview](https://www.loomina.app/preview.png)

Loomina is the open-source embedded analytics platform that empowers you to embed beautiful, interactive dashboards into your SaaS application with **zero data engineering overhead**. Go from raw SQL to production-ready analytics in under 5 minutes.

## 🌟 Key Features

- **📝 No-Code Schema Designer**: Drag-and-drop SQL editor to define metrics, dimensions, and virtual fields
- **🔗 Live Data Sync**: Real-time connectivity to PostgreSQL, MySQL, BigQuery, and more
- **🔐 Embed Anywhere**: Embeddable analytics components with JWT-based authentication
- **⚙️ Developer SDK**: Lightweight SDK for seamless integration into React, Vue, and Angular apps
- **🎛️ Dashboard Builder**: Visual dashboard creation with drag-and-drop widget placement
- **🎨 15+ Chart Types**: Bar, line, pie, donut, heatmap, scatter, treemap, and more
- **⚡ Blazing Fast**: Built on Cube.js for enterprise-grade query performance
- **🔓 Open Source**: Apache 2.0 license, fully customizable and self-hostable
- **🧩 Modular Architecture**: Separate analytics engine from application layer
- **🔐 Private API Access**: Whitelist-based API key management
- **🎚️ Widget Customization**: Granular control over chart appearance and behavior

## 🚀 Getting Started

### 1. One-Command Local Setup

```bash
curl -fsSL https://raw.githubusercontent.com/loomina-ai/loomina/main/scripts/setup.sh | bash
```

This script will:

1. Install Docker and Docker Compose
2. Pull and run all required services (Loomina, Cube.js, PostgreSQL, Better Auth)
3. Create sample databases and seed schemas
4. Start the development server on `http://localhost:4000`

### 2. Quick Start with Docker Compose

```bash
# Clone the repository
git clone https://github.com/loomina-ai/loomina.git
cd loomina

# Copy environment template
cp .env.example .env

# Edit .env with your database credentials and secrets
# See .env.example for detailed configuration options

# Start the application
./scripts/dev.sh

# Or using Docker Compose directly
docker-compose up -d --build
```

The application will be available at `http://localhost:4000`

## 🌐 Available Services

| Service          | Port      | Description                                  |
| ---------------- | --------- | -------------------------------------------- |
| **Loomina**      | 4000      | Main application with dashboard builder      |
| **Cube.js**      | 4001      | Analytical backend (read-only access)        |
| **PostgreSQL**   | 5432      | Primary metadata and analytics database      |
| **Better Auth**  | 4005      | Developer console and user management        |
| **Adminer**      | 8080      | Database GUI for PostgreSQL                  |
| **Swagger Docs** | 4000/docs | API documentation                            |
| **Redis**        | 6379      | Caching (optional, run separately if needed) |

## 🧩 Architecture

```
┌────────────────────────────────────────┐
│      Your SaaS Application             │
├────────────────────────────────────────┤
│  - Embeds SDK components               │
│  - Authenticates via JWT               │
│  - Sends SQL queries                   │
└────────────────────────────────────────┘
                   │
                   │ JWT Token (HMAC-SHA256)
                   ▼
┌────────────────────────────────────────┐
│        Loomina API (Port 4000)        │
│  - Authentication & Authorization      │
│  - Dashboard & Widget Management       │
│  - SQL Query Execution                 │
│  - Schema Designer                     │
└────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│      Cube.js (Port 4001)               │
│  - Analytical Engine                   │
│  - Caching & Query Optimization      │
│  - Security Layer                      │
└────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│        PostgreSQL (Port 5432)          │
│  - Metadata Store                      │
│  - Schema Definitions                  │
│  - Analytics Data                      │
└────────────────────────────────────────┘
```

## 🤝 Embedding Analytics in Your App

### 1. Install SDK

```bash
# For React
npm install @loomina/embed

# Or yarn
yarn add @loomina/embed
```

### 2. Initialize SDK

```javascript
import { Loomina } from '@loomina/embed';

const loomina = new Loomina({
  apiUrl: 'http://localhost:4000',
  embedSecret: process.env.LOOMINA_EMBED_SECRET,
});
```

### 3. Generate Embed Token (Backend)

```javascript
async function generateEmbedToken(userId, dashboardId) {
  const response = await fetch(`${process.env.LOOMINA_API_URL}/api/embed/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, dashboardId }),
  });

  const { token } = await response.json();
  return token;
}
```

### 4. Embed Dashboard

```jsx
import React, { useState, useEffect } from 'react';
import { LoominaDashboard } from '@loomina/embed';

function AnalyticsDashboard({ userId, dashboardId }) {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      const embedToken = await generateEmbedToken(userId, dashboardId);
      setToken(embedToken);
    };

    fetchToken();
  }, [userId, dashboardId]);

  if (!token) return <div>Loading analytics...</div>;

  return (
    <div style={{ height: '800px', width: '100%' }}>
      <LoominaDashboard
        apiUrl="http://localhost:4000"
        embedToken={token}
        dashboardId={dashboardId}
        theme="light"
      />
    </div>
  );
}

export default AnalyticsDashboard;
```

## 🛠️ Development

### Development Environment

```bash
# Start development mode with auto-reload
./scripts/dev.sh

# View logs
./scripts/dev.sh logs

# Stop services
./scripts/dev.sh stop

# Reset and restart
./scripts/dev.sh reset
```

### Running Individual Components

**Loomina Backend**

```bash
docker-compose run --rm -p 4000:4000 loomina yarn dev
```

**Cube.js**

```bash
docker-compose run --rm -p 4001:4001 cubejs
```

**PostgreSQL**

```bash
docker-compose run --rm -p 5432:5432 postgres
```

**Adminer**

```bash
docker-compose run --rm -p 8080:8080 adminer
```

**Better Auth**

```bash
docker-compose run --rm -p 4005:4005 better-auth
```

### Adding New Schemas

1. Create SQL file in `packages/cubejs-backend/schemas/`
2. Example: `schemas/users.sql`

```sql
drop table if exists users;

create table users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null unique,
  created_at timestamptz default now(),
  is_admin boolean default false
);

insert into users (name, email, is_admin)
values
  ('Alice', [EMAIL_ADDRESS]', true),

```
