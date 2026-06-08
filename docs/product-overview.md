# Product Overview

Nubase is a self-hostable backend service born for AI-native applications and AI Coding workflows.

AI Coding tools can generate product surfaces quickly, but those products still need a real backend: database, auth, storage, memory, secure APIs, project isolation, and a dashboard where humans can inspect and fix the system. Nubase is designed to be that backend target.

It combines four primitives:

- **Memory**: durable, searchable, evolving user memory for LLM apps
- **Database**: PostgreSQL with REST APIs and Row Level Security
- **Storage**: S3/R2-compatible object storage with Postgres metadata
- **Auth**: Supabase-style authentication, JWTs, and refresh tokens

The goal is to give AI developers, coding agents, and product teams a backend that understands AI-native needs from the start.

## The Problem

Traditional backend-as-a-service platforms give developers Database, Storage, and Auth. That works for CRUD applications, but AI-native applications and AI-generated apps also need Memory:

- facts about a user
- preferences
- entities
- long-term conversation context
- evolving knowledge
- audit trails for why a memory changed

Teams usually rebuild this with a vector table, prompt glue, and ad hoc retrieval logic. Nubase makes Memory a first-class platform primitive.

AI Coding adds another problem: code agents can create features faster than teams can prepare durable backend infrastructure. Generated apps need a consistent place to create tables, call APIs, store files, authenticate users, and persist memory. Nubase gives agents and humans the same backend surface.

There is also a self-hosting gap. Supabase Cloud supports organizations and projects, but the official self-hosted Supabase stack is single-project oriented. Nubase is designed so one self-hosted control plane can manage many projects, with each project isolated at the database level.

## Target Users

Nubase is for:

- developers building products with AI Coding tools
- agentic app builders who need a backend that agents can operate safely
- AI app developers who need persistent user memory
- teams that want Supabase-style APIs but prefer Java/Spring infrastructure
- self-hosters running multiple small or medium projects
- agencies or internal platforms managing many apps
- developers who want Postgres isolation without running many full Supabase stacks

It is not yet a complete replacement for Supabase Cloud because Realtime, Edge Functions, managed backups, PITR, HA orchestration, and enterprise operations are not part of the current open-source core.

## Four Pillars

The four pillars are designed to be used by both humans and AI Coding agents. Studio gives humans a review surface; REST APIs and MCP tools give agents a stable operational surface.

### Memory

Memory turns user messages into durable facts.

Current capabilities:

- add memory from messages
- search memory
- update and delete memory
- inspect memory history
- extract entities
- retrieve with vector search, full-text search, and entity boost
- use OpenAI, Anthropic, or OpenAI-compatible providers

Main tables:

- `mem.memories`
- `mem.memory_history`
- `mem.entities`
- `mem.session_messages`
- `mem.config`

### Database

Each project gets a dedicated PostgreSQL database.

Current capabilities:

- database-per-project isolation
- PostgREST-compatible REST endpoints
- schema cache
- RLS with JWT claims
- project provisioning
- SQL execution through Studio
- per-project roles and JWT secrets

Main concepts:

- metadata database stores project routing
- project database stores tenant data
- `apikey` resolves project and role
- Bearer token resolves end user

### Storage

Storage stores object metadata in Postgres and object bytes in an S3-compatible backend.

Current capabilities:

- bucket create/list/update/delete
- public and private buckets
- object upload/download
- signed URLs
- R2/S3-compatible backend
- per-tenant object key layout
- optional S3 Vectors integration

### Auth

Auth provides Supabase-style identity flows and token issuance.

Current capabilities:

- email/password signup and login
- refresh token rotation
- email confirmation and recovery flows
- OAuth provider abstraction
- Google, GitHub, and WeChat OAuth providers
- admin user management
- per-project JWT secrets

## Why Database-per-Project

Nubase uses a physical database boundary for each project.

Benefits:

- stronger tenant isolation than schema-only multi-tenancy
- independent database credentials per project
- independent JWT secrets per project
- easier backup/restore boundaries
- easier project export or migration
- clearer blast radius

Tradeoffs:

- more connections to manage
- more operational responsibility
- pool sizing matters
- provisioning requires database-level privileges

## Open-Source and Commercial Boundary

Recommended open-source core:

- project creation
- database-per-project isolation
- Auth
- Storage
- REST API
- Memory
- local Studio
- local development docs

Recommended commercial layer:

- organizations and teams
- fine-grained RBAC
- SSO/SAML/SCIM
- audit logs
- quotas and billing
- managed backups and PITR
- high availability
- monitoring
- managed hosting
- enterprise support

This boundary keeps the open-source product useful while preserving a real business model.

## Current Status

Nubase is in active development. The core architecture is present, but the public open-source release should still complete:

- security hardening
- license selection
- better production deployment docs
- secret cleanup
- endpoint permission review
- CI setup
- contributor documentation
