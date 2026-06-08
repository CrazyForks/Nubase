# Getting Started

This guide starts Nubase locally, creates a project, and calls the Database and Memory APIs.

## Prerequisites

Install:

- Java 17
- Maven
- Docker
- Node.js
- pnpm

Nubase expects Postgres 15 with the `pgvector` extension. The included Compose file uses the `pgvector/pgvector:pg15` image.

## 1. Start Postgres

From the repository root:

```bash
docker compose -f pg-docker-compose.yml up -d
```

This starts a local metadata database:

```text
jdbc:postgresql://localhost:5432/postgrest_metadata?allowMultiQueries=true
user: postgres
password: postgres
```

These defaults are only for local development.

## 2. Set Required Environment Variables

Nubase encrypts project database passwords and JWT secrets in the metadata database. Set a master key before starting the backend:

```bash
export PGRST_ENCRYPTION_MASTER_KEY="$(openssl rand -base64 32)"
```

Set a metadata service-role key for platform-level bootstrap/admin endpoints:

```bash
export METADATA_SERVICE_ROLE_KEY="replace-with-a-long-random-admin-token"
```

Optional: enable LLM-powered Memory extraction and embedding:

```bash
export OPENAI_API_KEY="sk-..."
```

If `OPENAI_API_KEY` is not set, parts of the Memory API that require LLM calls will report provider configuration errors or use fallback behavior where implemented.

## 3. Start the Backend

```bash
mvn spring-boot:run
```

The backend runs on:

```text
http://localhost:9999
```

## 4. Start Studio

In another terminal:

```bash
cd frontend
pnpm install
pnpm dev:studio
```

Studio runs on:

```text
http://localhost:3000
```

The Studio frontend talks to `http://localhost:9999` by default. Override it with:

```bash
export NEXT_PUBLIC_NUBASE_API_URL="http://localhost:9999"
```

## 5. Create a Platform User

Open Studio and sign up as a platform user.

The platform user is different from project users:

- platform users log into Studio
- project users live inside each project's `auth.users` table

## 6. Create and Provision a Project

In Studio:

1. Create a new project.
2. Provision the database.
3. Open project settings.
4. Copy the project keys.

Provisioning creates:

- a dedicated PostgreSQL database
- auth schema
- storage schema
- memory schema
- public schema
- roles
- RLS helpers
- JWT secret
- service role token
- authenticated token

## 7. Create a Table

Open SQL editor in Studio and run:

```sql
create table public.todos (
  id bigserial primary key,
  text text not null,
  done boolean default false
);
```

Insert a row through the REST API:

```bash
curl -X POST "http://localhost:9999/rest/v1/todos" \
  -H "apikey: $NUBASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Try Nubase"}'
```

Query rows:

```bash
curl "http://localhost:9999/rest/v1/todos?select=*" \
  -H "apikey: $NUBASE_ANON_KEY"
```

## 8. Write Memory

```bash
curl -X POST "http://localhost:9999/mem/v1/memories" \
  -H "apikey: $NUBASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-42",
    "messages": [
      {
        "role": "user",
        "content": "I prefer steak over sushi and my dog is named Mochi."
      }
    ]
  }'
```

Search memory:

```bash
curl -X POST "http://localhost:9999/mem/v1/search" \
  -H "apikey: $NUBASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-42",
    "query": "what food do they like?"
  }'
```

## 9. Try Storage

Configure an S3-compatible backend through environment variables or platform settings.

Common environment variables:

```bash
export R2_ACCOUNT_ID="..."
export R2_ACCESS_KEY_ID="..."
export R2_SECRET_ACCESS_KEY="..."
export R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
export R2_GLOBAL_BUCKET="nubase-storage"
```

Then use Studio or `/storage/v1/*` endpoints to create buckets and upload objects.

## Troubleshooting

### Backend fails because encryption key is missing

Set:

```bash
export PGRST_ENCRYPTION_MASTER_KEY="$(openssl rand -base64 32)"
```

### Memory provider is not configured

Set an LLM provider key:

```bash
export OPENAI_API_KEY="sk-..."
```

Or configure `nubase.mem.chat-provider`, `nubase.mem.embedding-provider`, and the matching provider settings.

### Studio cannot reach backend

Check:

```bash
curl http://localhost:9999/auth/v1/health
```

Then set:

```bash
export NEXT_PUBLIC_NUBASE_API_URL="http://localhost:9999"
```

### Postgres connection fails

Check the Compose service:

```bash
docker compose -f pg-docker-compose.yml ps
```

The local defaults are:

```text
POSTGRES_DB=postgrest_metadata
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

Use environment variables to override them in real deployments.
