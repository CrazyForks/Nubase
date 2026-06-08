# Nubase

**Backend services born for AI.** Nubase is an open-source, AI-native backend platform for AI Coding, agentic applications, and modern product teams: **Memory, Database, Storage, and Auth** in one self-hostable service.

AI Coding tools can generate UI fast, but real products still need durable memory, authenticated users, isolated databases, file storage, secure APIs, and an operator-friendly dashboard. Nubase packages those backend primitives so AI-generated apps can move from prototype to production without each project rebuilding the same infrastructure.

Nubase follows the Supabase developer model where it makes sense: Postgres, REST APIs, JWTs, Row Level Security, object storage, and a Studio dashboard. It adds three opinionated changes for teams building with AI:

1. **Memory is a first-class primitive.** Durable user memory, entity extraction, history, and hybrid retrieval are built into the platform, not bolted on as a separate vector-store script.
2. **AI Coding gets a real backend target.** Agents and coding assistants can create tables, call REST APIs, write memory, inspect schema, and operate through MCP-friendly database tools.
3. **Self-hosting supports many projects.** A single Nubase control plane can provision and route to multiple isolated project databases.

## Why Nubase

AI-native applications need more than CRUD. They need user memory, retrieval, auth, storage, database APIs, and project isolation from day one. Without that backend layer, every AI Coding session produces another demo that still needs weeks of infrastructure work.

Supabase is excellent, but its open-source self-hosted stack is designed around a single project. The official Supabase self-hosting docs say that self-hosted Supabase "mimics a single project" and Studio does not support multiple organizations or projects. Supabase Cloud has organizations and projects, where each project is a dedicated Supabase instance with sub-services such as Storage, Auth, Functions, and Realtime.

Nubase is built for AI teams and self-hosters who want one Studio, one backend service, and many isolated AI projects on their own infrastructure.

References:

- Supabase self-hosting: https://supabase.com/docs/guides/self-hosting
- Supabase organizations and projects: https://supabase.com/docs/guides/platform/billing-faq
- Supabase product docs: https://supabase.com/docs

## Core Features

### Memory

- Native backend memory for AI apps and agents.
- Mem0-style memory API for adding, searching, updating, deleting, and inspecting memories.
- LLM-powered fact extraction with ADD, UPDATE, DELETE, and NONE decisions.
- Hybrid retrieval using pgvector cosine search, Postgres full-text search, and entity boost.
- Entity store with linked memories for better recall.
- Append-only memory history for audit and debugging.
- OpenAI, Anthropic, and OpenAI-compatible provider support.

### Database

- One physical PostgreSQL database per project.
- Java implementation of a PostgREST-compatible `/rest/v1/*` API.
- A stable backend surface that AI Coding tools can target with generated SQL and API calls.
- Select, filter, order, pagination, insert, update, upsert, and delete.
- Per-project JWT secrets, roles, and schema cache.
- Row Level Security with JWT claims.
- HikariCP routing data sources per project.

### Auth

- Supabase-style Auth endpoints for signup, login, refresh token rotation, user management, and admin operations.
- Email/password auth.
- OAuth provider abstraction with Google, GitHub, and WeChat providers.
- Per-project `anon`, `authenticated`, and `service_role` tokens.
- User Bearer tokens for RLS and memory ownership.

### Storage

- S3-compatible storage backend.
- Designed for Cloudflare R2, AWS S3, MinIO, and compatible APIs.
- Bucket metadata in Postgres.
- Public/private buckets, signed URLs, file size limits, and MIME controls.
- Optional S3 Vectors integration for large asset/document vector workloads.

### Studio

- Next.js dashboard for projects, SQL, auth users, storage, and memory.
- Project creation and database provisioning.
- SQL editor and execution history.
- Memory explorer with search, entities, history, settings, and reset flows.
- Platform settings for SMTP, storage, OAuth, and LLM providers.

### AI Coding and Agents

- Database MCP tools for schema inspection, SQL execution, RLS export, and project initialization.
- A consistent API model for generated apps: Auth, REST, Storage, and Memory share the same project token model.
- Project-level isolation so generated apps do not share one accidental database boundary.
- Built-in Studio for humans to review and repair what AI Coding tools create.

## Nubase vs Supabase

| Area | Supabase Cloud | Supabase self-hosted | Nubase |
| --- | --- | --- | --- |
| Multi-project dashboard | Yes | No, self-hosted mimics one project | Yes |
| Project isolation | Dedicated project instance | One local/self-hosted project | Dedicated Postgres database per project |
| Database API | PostgREST | PostgREST | Java PostgREST-compatible API |
| Auth | Yes | Yes | Supabase-style Auth |
| Storage | Yes | Yes | S3/R2-compatible storage |
| Realtime | Yes | Available in Supabase stack | Not implemented yet |
| Edge Functions | Yes | Available in Supabase stack | Not implemented yet |
| AI memory | Not a core product primitive | Not a core product primitive | Built-in Memory pillar |
| AI Coding backend target | General backend primitives | General backend primitives | Memory + REST + MCP + Studio for generated apps |
| Self-hosted operations | Managed by Supabase in Cloud | Operator-managed stack | Operator-managed, multi-project-first |

## Architecture

Nubase has two database layers:

- **Metadata database**: stores platform users, project configs, encrypted project credentials, project ownership, platform settings, SQL snippets, and SQL execution records.
- **Project databases**: each project gets its own PostgreSQL database containing auth tables, storage metadata, memory tables, and application tables.

Incoming API requests use a two-token model:

- `apikey`: identifies the project and role (`anon`, `authenticated`, or `service_role`).
- `Authorization: Bearer <jwt>`: identifies the end user for RLS and memory ownership.

The request filter resolves the project from the `apikey`, loads the matching database config, routes JDBC to the correct project database, and sets the request context.

## Quickstart

Requirements:

- Java 17
- Maven
- Docker
- Postgres 15 with pgvector
- Node.js and pnpm for Studio

Start Postgres:

```bash
docker compose -f pg-docker-compose.yml up -d
```

Set required secrets:

```bash
export PGRST_ENCRYPTION_MASTER_KEY="$(openssl rand -base64 32)"
export METADATA_SERVICE_ROLE_KEY="replace-with-a-long-random-admin-token"

# Optional, required only for LLM-powered Memory extraction/search.
export OPENAI_API_KEY="sk-..."
```

Start the backend:

```bash
mvn spring-boot:run
```

Start Studio:

```bash
cd frontend
pnpm install
pnpm dev:studio
```

Open:

- Backend: http://localhost:9999
- Studio: http://localhost:3000

Create a platform account in Studio, create a project, provision the database, then copy the project keys from settings.

## Example: Write and Search Memory

```bash
curl -X POST http://localhost:9999/mem/v1/memories \
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

```bash
curl -X POST http://localhost:9999/mem/v1/search \
  -H "apikey: $NUBASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-42",
    "query": "what food do they like?"
  }'
```

## Example: Use the REST API

Create a table:

```sql
create table public.todos (
  id bigserial primary key,
  text text not null,
  done boolean default false
);
```

Query it:

```bash
curl "http://localhost:9999/rest/v1/todos?select=*" \
  -H "apikey: $NUBASE_ANON_KEY"
```

Insert a row:

```bash
curl -X POST "http://localhost:9999/rest/v1/todos" \
  -H "apikey: $NUBASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Ship the first open-source release"}'
```

## Documentation

- [Documentation plan](docs/documentation-plan.md)
- [Product overview](docs/product-overview.md)
- [Supabase comparison](docs/supabase-comparison.md)
- [Getting started](docs/getting-started.md)
- [Architecture](docs/architecture.md)
- [MCP and agent guide](docs/mcp.md)
- [Connect agents](docs/agent-connect.md)

## Status

Nubase is early-stage infrastructure. The current codebase already includes the main pillars, but the public release should still go through security hardening, license selection, secret cleanup, and clearer defaults before production use.

Known gaps:

- Realtime is not implemented yet.
- Edge Functions are not implemented yet.
- Backups, PITR, HA, billing, and enterprise SSO are not included in the open-source core.
- Some management endpoints should be reviewed before exposing the server to the public internet.

## Commercial Boundary

Recommended open-source core:

- Multi-project self-hosting
- Database-per-project isolation
- Auth, Storage, PostgREST-compatible REST API
- Memory API
- Local Studio

Recommended commercial layer:

- Team/org management
- Fine-grained RBAC
- SSO/SAML/SCIM
- Audit logs
- Backups and PITR
- Monitoring and quotas
- Managed hosting
- Enterprise support

## Contributing

This repository is being prepared for an open-source release. Before accepting external contributions, add:

- `LICENSE`
- `CONTRIBUTING.md`
- `SECURITY.md`
- issue templates
- coding standards
- release process

## License

License has not been selected yet. Choose one before publishing publicly.
