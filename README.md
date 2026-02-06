# PromptForge - AI-Driven Prompt Engineering Platform

A comprehensive, production-ready platform for designing, testing, optimizing, and deploying AI prompts. Built with a modern microservices architecture featuring 59 specialized tools organized across 16 categories, covering everything from basic prompt creation to advanced reasoning techniques, multi-agent orchestration, and automated prompt optimization.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Feature Catalog](#feature-catalog)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [User Profile Management](#user-profile-management)
- [Docker Services](#docker-services)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**PromptForge** is an enterprise-grade prompt engineering platform that provides a unified workspace for:

- **Prompt Design & Iteration**: Create, refine, and version-control prompts with real-time AI feedback
- **Quality Assurance**: Test prompts with automated test suites, batch evaluation, consistency analysis, and benchmark dashboards
- **Advanced AI Techniques**: Leverage Chain-of-Thought, Tree of Thoughts, Self-Consistency, ReAct patterns, multi-agent workflows, and more
- **Production Readiness**: Export deployment packages, generate API integration code snippets, optimize costs, and compare models
- **Team Collaboration**: Share prompts through a community gallery, organize work in projects, and manage team workspaces
- **Learning & Growth**: Interactive tutorials, challenges, technique library, and before/after comparators for continuous learning

The platform supports multiple LLM providers (OpenAI, Anthropic) and includes protocol support for MCP (Model Context Protocol) and A2A (Agent-to-Agent) communication.

---

## Key Features

### 59 Specialized Tools Across 16 Categories

| Category | Tools | Description |
|----------|-------|-------------|
| **Prompt Features** | 6 tools | Core prompt creation and domain-specific templates |
| **Advanced** | 8 tools | Grading, A/B testing, schema enforcement, self-correction |
| **Knowledge** | 3 tools | Expert panels, document Q&A, compliance checking |
| **Specialized** | 3 tools | Tone transformation, misconception detection, CoT visualization |
| **Extended** | 3 tools | RAG simulation, scenario testing, localization |
| **Reasoning** | 3 tools | Self-consistency voting, Tree of Thoughts, reflection loops |
| **Agent Patterns** | 3 tools | ReAct agents, role design, coordinator/router patterns |
| **Auto-Optimization** | 3 tools | APE Studio, prompt evolution, meta-prompt generation |
| **Safety** | 2 tools | Guardrail building, self-verification chains |
| **Context & Memory** | 2 tools | Context packing optimization, memory-aware prompting |
| **Learning Hub** | 4 tools | Tutorials, challenges, technique library, before/after |
| **Workspace** | 4 tools | Project management, version history, diff viewer, favorites |
| **Testing** | 4 tools | Test suites, batch evaluation, benchmarks, consistency |
| **Production** | 4 tools | Deployment export, code snippets, cost optimizer, model comparison |
| **Community** | 2 tools | Prompt gallery, user account & profile management |
| **System** | 5 tools | Template library, execution history, multi-agent workflows, MCP explorer, dashboard |

### Platform Highlights

- **JWT Authentication** with registration, login, profile management, and account deletion
- **Profile Pictures** via base64 upload (no external storage needed)
- **Dark/Light Theme** support with user preference persistence
- **Real-time Cost Tracking** for all AI operations with token-level metrics
- **Multi-Model Support** with side-by-side model comparison
- **Protocol Support** for MCP (Model Context Protocol) and A2A (Agent-to-Agent)
- **Responsive UI** with collapsible sidebar navigation and tabbed interfaces

---

## Architecture

```
                                    ┌─────────────────────────────────┐
                                    │         Nginx (Port 3080)       │
                                    │       Reverse Proxy / CDN       │
                                    └──────────┬──────────┬───────────┘
                                               │          │
                              ┌────────────────┘          └────────────────┐
                              ▼                                            ▼
                 ┌────────────────────────┐              ┌─────────────────────────────┐
                 │   React Frontend       │              │   Node.js Gateway (4070)    │
                 │   (Static Assets)      │              │   MCP + A2A Protocols       │
                 │   TypeScript + Vite    │              │   WebSocket Support         │
                 └────────────────────────┘              └──────────────┬──────────────┘
                                                                       │
                                                                       ▼
                                                        ┌──────────────────────────────┐
                                                        │   Django Backend (8070)      │
                                                        │   REST API + Business Logic  │
                                                        │   4 Django Apps              │
                                                        └───────┬──────────┬───────────┘
                                                                │          │
                                                   ┌────────────┘          └──────────────┐
                                                   ▼                                      ▼
                                      ┌──────────────────────┐           ┌────────────────────────┐
                                      │  PostgreSQL (5443)   │           │  Redis (6390)          │
                                      │  Primary Database    │           │  Cache + Celery Broker  │
                                      └──────────────────────┘           └────────────┬───────────┘
                                                                                      │
                                                                                      ▼
                                                                         ┌────────────────────────┐
                                                                         │  Celery Worker         │
                                                                         │  Async Task Processing │
                                                                         └────────────────────────┘
```

### Request Flow

1. **Client** sends request to **Nginx** (port 3080)
2. **Nginx** routes `/api/*` to **Gateway** (port 4070) and static assets to **Frontend**
3. **Gateway** forwards API requests to **Django Backend** (port 8070), adding auth headers
4. **Backend** processes the request, interacting with **PostgreSQL** for data and **Redis** for caching
5. Long-running tasks are dispatched to **Celery Workers** via Redis message broker
6. MCP and A2A protocol requests are handled directly by the Gateway

### Architecture Diagram

A detailed draw.io architecture diagram is available at [`docs/architecture.drawio`](docs/architecture.drawio). You can open it at [app.diagrams.net](https://app.diagrams.net/) or any draw.io compatible editor.

A PowerPoint presentation of the technical architecture is also available at [`docs/PromptForge_Technical_Architecture.pptx`](docs/PromptForge_Technical_Architecture.pptx).

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.x | UI framework |
| TypeScript | 5.x | Type-safe development |
| Vite | 6.x | Build tool & dev server |
| Axios | 1.x | HTTP client |
| React Markdown | 9.x | Markdown rendering |
| React Syntax Highlighter | 15.x | Code highlighting |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.11+ | Runtime |
| Django | 5.x | Web framework |
| Django REST Framework | 3.15+ | REST API |
| SimpleJWT | 5.x | JWT authentication |
| Celery | 5.x | Async task queue |
| Gunicorn | 22.x | WSGI HTTP server |
| psycopg2 | 2.9+ | PostgreSQL adapter |

### Gateway
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 20.x | Runtime |
| Express | 4.x | HTTP framework |
| http-proxy-middleware | 3.x | API proxy |
| ws | 8.x | WebSocket server |
| ioredis | 5.x | Redis client |

### Infrastructure
| Technology | Version | Purpose |
|-----------|---------|---------|
| Docker | 24+ | Containerization |
| Docker Compose | 3.9 | Multi-container orchestration |
| PostgreSQL | 16 | Primary database |
| Redis | 7 | Cache + message broker |
| Nginx | Alpine | Reverse proxy & static files |

---

## Getting Started

### Prerequisites

- **Docker** and **Docker Compose** installed
- **OpenAI API Key** and/or **Anthropic API Key** for AI features
- **Git** for cloning the repository

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/hassanmzia/AI-Driven-Capabilities.git
   cd AI-Driven-Capabilities
   ```

2. **Set up environment variables**:
   ```bash
   # Create a .env file in the root directory
   cat > .env << EOF
   OPENAI_API_KEY=your-openai-api-key-here
   ANTHROPIC_API_KEY=your-anthropic-api-key-here
   EOF
   ```

3. **Build and start all services**:
   ```bash
   docker compose up --build -d
   ```

4. **Wait for services to be healthy** (usually 30-60 seconds):
   ```bash
   docker compose ps
   ```

5. **Access the platform**:
   - **Web UI**: http://localhost:3080
   - **API Gateway**: http://localhost:4070
   - **Django Backend**: http://localhost:8070
   - **Django Admin**: http://localhost:8070/admin/

6. **Seed initial data** (tutorials, challenges, templates):
   ```bash
   # Via API
   curl -X POST http://localhost:4070/api/v1/platform/seed-data/

   # Or via Django management command
   docker compose exec backend python manage.py seed_templates
   ```

### Stopping the Platform

```bash
docker compose down          # Stop services
docker compose down -v       # Stop services and remove volumes (resets data)
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes* | - | OpenAI API key for GPT models |
| `ANTHROPIC_API_KEY` | No | - | Anthropic API key for Claude models |
| `DATABASE_URL` | Auto | PostgreSQL connection string | Set automatically by Docker Compose |
| `REDIS_URL` | Auto | Redis connection string | Set automatically by Docker Compose |
| `DJANGO_SECRET_KEY` | Auto | Dev key provided | Change in production |
| `DJANGO_SETTINGS_MODULE` | Auto | `config.settings` | Django settings path |
| `DEBUG` | No | `1` | Set to `0` in production |
| `ALLOWED_HOSTS` | No | `*` | Restrict in production |
| `CORS_ALLOWED_ORIGINS` | No | `localhost:3080` | Frontend URL for CORS |
| `MCP_AGENT_POOL_SIZE` | No | `5` | MCP agent pool size |
| `A2A_PROTOCOL_VERSION` | No | `1.0` | A2A protocol version |

*At least one LLM API key is required for AI features to function.

---

## Project Structure

```
AI-Driven-Capabilities/
├── backend/                          # Django Backend
│   ├── config/                       # Django project settings
│   │   ├── settings.py               # Main configuration
│   │   ├── urls.py                   # Root URL routing
│   │   ├── wsgi.py                   # WSGI application
│   │   └── celery.py                 # Celery configuration
│   ├── promptengine/                 # Core prompt engineering app
│   │   ├── models.py                 # Execution, Template models
│   │   ├── views.py                  # 13+ advanced prompt endpoints
│   │   ├── services.py               # AI service layer (ADVANCED_PROMPTS)
│   │   ├── serializers.py            # Request/Response serializers
│   │   └── urls.py                   # URL patterns
│   ├── agents/                       # MCP/A2A agent management
│   │   ├── models.py                 # Agent models
│   │   ├── views.py                  # Agent CRUD + execution
│   │   └── services.py               # Agent orchestration
│   ├── analytics/                    # Usage analytics & reporting
│   │   ├── models.py                 # Analytics models
│   │   └── views.py                  # Dashboard data endpoints
│   ├── prompt_platform/              # Platform features (app_label: platform_app)
│   │   ├── models.py                 # UserProfile, Project, TestSuite, etc.
│   │   ├── views.py                  # Auth + CRUD + action endpoints
│   │   ├── serializers.py            # All platform serializers
│   │   ├── services.py               # Test runner, search, evaluation
│   │   ├── urls.py                   # Platform URL patterns
│   │   └── migrations/               # Database migrations
│   ├── manage.py                     # Django management
│   ├── requirements.txt              # Python dependencies
│   └── Dockerfile                    # Backend container
│
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── App.tsx                   # Root component with routing (59 pages)
│   │   ├── main.tsx                  # Entry point
│   │   ├── pages/                    # 59 page components
│   │   │   ├── Dashboard.tsx         # Main dashboard with metrics
│   │   │   ├── AuthPage.tsx          # Login/Register/Profile management
│   │   │   ├── FeedbackAnalysis.tsx  # Feedback analysis tool
│   │   │   ├── TreeOfThoughts.tsx    # Tree of Thoughts explorer
│   │   │   ├── ReActAgent.tsx        # ReAct agent builder
│   │   │   ├── GuardrailBuilder.tsx  # Guardrail configuration
│   │   │   └── ... (54 more pages)
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Sidebar.tsx       # Navigation sidebar (16 sections)
│   │   │   └── shared/
│   │   │       └── FormattedOutput.tsx  # Markdown/code output renderer
│   │   ├── services/
│   │   │   └── api.ts                # Axios API client + all endpoints
│   │   └── types/
│   │       └── index.ts              # TypeScript type definitions
│   ├── package.json                  # NPM dependencies
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── vite.config.ts                # Vite build configuration
│   └── Dockerfile                    # Frontend multi-stage build
│
├── gateway/                          # Node.js API Gateway
│   ├── src/
│   │   ├── index.ts                  # Gateway entry point
│   │   ├── proxy.ts                  # API proxy configuration
│   │   ├── mcp/                      # MCP Protocol handlers
│   │   └── a2a/                      # A2A Protocol handlers
│   ├── package.json                  # NPM dependencies
│   └── Dockerfile                    # Gateway container
│
├── nginx/
│   └── nginx.conf                    # Nginx reverse proxy configuration
│
├── scripts/
│   └── init-db.sql                   # Database initialization script
│
├── docs/
│   ├── architecture.drawio           # Technical architecture diagram
│   └── PromptForge_Technical_Architecture.pptx  # Architecture presentation
│
├── docker-compose.yml                # Multi-service orchestration
├── .env                              # Environment variables (not in repo)
└── README.md                         # This file
```

---

## Feature Catalog

### 1. Prompt Features (Core)
| Tool | Description |
|------|-------------|
| **Feedback Analysis** | Analyze customer feedback with AI-powered sentiment and theme extraction |
| **Meeting Summarizer** | Generate structured meeting summaries with action items and key decisions |
| **Quiz Generator** | Create educational quizzes from topics or source material |
| **Slide Script Generator** | Generate presentation scripts and talking points for slides |
| **Complaint Response** | Draft professional, empathetic responses to customer complaints |
| **Custom Prompt** | Free-form prompt execution with full parameter control |

### 2. Advanced Techniques
| Tool | Description |
|------|-------------|
| **Prompt Grader** | Score and evaluate prompt quality on multiple dimensions |
| **A/B Tester** | Compare two prompt variants side-by-side with metrics |
| **Schema Enforcer** | Enforce JSON/structured output schemas on AI responses |
| **Self-Correcting Loop** | Iteratively refine AI output through automated feedback |
| **Quality Gate Pipeline** | Multi-stage quality validation with configurable thresholds |
| **Decomposition Workflow** | Break complex tasks into manageable sub-prompts |
| **Injection Tester** | Test prompts against common injection/jailbreak attacks |
| **Few-Shot Builder** | Design and optimize few-shot example sets for prompts |

### 3. Knowledge & Compliance
| Tool | Description |
|------|-------------|
| **Expert Panel** | Simulate multi-expert discussion with diverse perspectives |
| **Document Q&A** | Answer questions based on provided document context |
| **Compliance Checker** | Validate AI outputs against regulatory/policy requirements |

### 4. Specialized Tools
| Tool | Description |
|------|-------------|
| **Tone Transformer** | Rewrite text in different tones (formal, casual, empathetic, etc.) |
| **Misconception Detector** | Identify and correct factual errors or misconceptions |
| **CoT Visualizer** | Visualize Chain-of-Thought reasoning step-by-step |

### 5. Extended Capabilities
| Tool | Description |
|------|-------------|
| **RAG Simulator** | Simulate Retrieval-Augmented Generation with custom documents |
| **Scenario Simulator** | Test prompts across diverse scenario variations |
| **Localizer** | Adapt prompts for different languages and cultural contexts |

### 6. Reasoning Techniques
| Tool | Description |
|------|-------------|
| **Self-Consistency Voter** | Run multiple inference passes and vote on the most consistent answer |
| **Tree of Thoughts Explorer** | Explore branching thought paths for complex problem-solving |
| **Reflection Loop** | Multi-round self-reflection where the model critiques and improves its output |

### 7. Agent Patterns
| Tool | Description |
|------|-------------|
| **ReAct Agent Builder** | Build agents using the Reasoning + Acting (ReAct) paradigm |
| **Agent Role Designer** | Design specialized agent roles with capabilities and constraints |
| **Coordinator/Router** | Design coordinator agents that route tasks to specialized sub-agents |

### 8. Auto-Optimization
| Tool | Description |
|------|-------------|
| **APE Studio** | Automatic Prompt Engineering - AI generates and ranks prompt variations |
| **Prompt Evolution Lab** | Evolve prompts through genetic algorithm-inspired mutation and selection |
| **Meta Prompt Designer** | Generate prompts that generate prompts (meta-level prompt engineering) |

### 9. Safety & Verification
| Tool | Description |
|------|-------------|
| **Guardrail Builder** | Build input/output guardrails with custom rules and constraints |
| **Self-Verification Chain** | Chain verification steps to validate AI output accuracy |

### 10. Context & Memory
| Tool | Description |
|------|-------------|
| **Context Packing Studio** | Optimize token usage by intelligently packing context into prompts |
| **Memory-Aware Prompting** | Design prompts that maintain conversation history and context |

### 11. Learning Hub
| Tool | Description |
|------|-------------|
| **Tutorials** | Step-by-step interactive tutorials for prompt engineering |
| **Challenges** | Timed challenges to test and improve prompt engineering skills |
| **Technique Library** | Reference library of prompt engineering techniques with examples |
| **Before/After Comparator** | Compare original vs. optimized prompts side-by-side |

### 12. Workspace
| Tool | Description |
|------|-------------|
| **Project Manager** | Organize prompts into projects with metadata and tagging |
| **Version History** | Track and browse prompt revision history |
| **Prompt Diff Viewer** | Visual diff between prompt versions highlighting changes |
| **Favorites Manager** | Bookmark and organize favorite prompts and templates |

### 13. Testing & Quality
| Tool | Description |
|------|-------------|
| **Test Suite Builder** | Create and manage automated test suites for prompts |
| **Batch Evaluation** | Run prompts against multiple inputs simultaneously |
| **Benchmark Dashboard** | Track and visualize prompt performance metrics over time |
| **Consistency Analyzer** | Measure output consistency across multiple runs |

### 14. Production & Deployment
| Tool | Description |
|------|-------------|
| **Deployment Export** | Export prompt configurations as deployable packages |
| **Code Snippet Generator** | Generate integration code in Python, JavaScript, cURL, or LangChain |
| **Cost Optimizer** | Analyze and optimize token usage and API costs |
| **Model Comparison** | Compare responses across different LLM models side-by-side |

### 15. Community
| Tool | Description |
|------|-------------|
| **Prompt Gallery** | Browse, share, upvote, and download community prompts |
| **Account Management** | User registration, login, profile, password management |

### 16. System
| Tool | Description |
|------|-------------|
| **Template Library** | Pre-built prompt templates for common use cases |
| **Execution History** | Browse and search past prompt executions with full details |
| **Multi-Agent Workflow** | Orchestrate multi-agent collaborative workflows |
| **MCP Explorer** | Interact with MCP protocol tools and resources |
| **Dashboard** | Platform-wide metrics, recent activity, and quick actions |

---

## API Reference

### Base URLs
- **Gateway (recommended)**: `http://localhost:4070/api/v1/`
- **Direct Backend**: `http://localhost:8070/api/v1/`

### Prompt Engine Endpoints (`/api/v1/prompts/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/execute/` | Execute a prompt |
| POST | `/execute/self-consistency/` | Self-consistency voting |
| POST | `/execute/tree-of-thoughts/` | Tree of Thoughts exploration |
| POST | `/execute/reflection-loop/` | Multi-round reflection |
| POST | `/execute/react-agent/` | ReAct agent execution |
| POST | `/execute/agent-role-designer/` | Design agent roles |
| POST | `/execute/coordinator-router/` | Coordinator/router pattern |
| POST | `/execute/ape-studio/` | Automatic prompt engineering |
| POST | `/execute/prompt-evolution/` | Evolutionary prompt optimization |
| POST | `/execute/meta-prompt/` | Meta-prompt generation |
| POST | `/execute/guardrail-builder/` | Build guardrails |
| POST | `/execute/self-verification/` | Self-verification chain |
| POST | `/execute/context-packer/` | Context packing optimization |
| POST | `/execute/memory-aware/` | Memory-aware prompt design |
| GET | `/templates/` | List prompt templates |
| GET | `/executions/` | List execution history |
| GET | `/health/` | Health check |

### Platform Endpoints (`/api/v1/platform/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register/` | User registration |
| POST | `/auth/login/` | JWT token login |
| POST | `/auth/refresh/` | Refresh JWT token |
| GET | `/auth/me/` | Get current user info |
| PATCH | `/auth/profile/` | Update user profile |
| PATCH | `/auth/user-info/` | Update name/email |
| POST | `/auth/change-password/` | Change password |
| DELETE | `/auth/delete-account/` | Delete account |
| GET/POST | `/projects/` | List/Create projects |
| GET/POST | `/collections/` | List/Create collections |
| GET/POST | `/favorites/` | List/Create favorites |
| GET/POST | `/test-suites/` | List/Create test suites |
| GET/POST | `/test-cases/` | List/Create test cases |
| GET | `/test-runs/` | List test runs |
| POST | `/run-test-suite/` | Execute a test suite |
| POST | `/batch-evaluation/` | Batch evaluation |
| POST | `/consistency-check/` | Consistency analysis |
| POST | `/cost-optimizer/` | Cost optimization |
| POST | `/model-comparison/` | Model comparison |
| POST | `/snippet-generator/` | Generate code snippets |
| GET | `/technique-library/` | Get technique library |
| GET | `/tutorials/` | List tutorials |
| GET | `/challenges/` | List challenges |
| POST | `/submit-challenge/` | Submit challenge attempt |
| GET/POST | `/community/` | Community prompts |
| GET/POST | `/teams/` | Team workspaces |
| POST | `/search/` | Global search |
| POST | `/seed-data/` | Seed initial data |

### Gateway Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Gateway health check |
| WS | `/ws` | WebSocket connection |
| POST | `/mcp/*` | MCP protocol endpoints |
| POST | `/a2a/*` | A2A protocol endpoints |

---

## Authentication

PromptForge uses **JWT (JSON Web Tokens)** for authentication via `djangorestframework-simplejwt`.

### Token Configuration
- **Access Token Lifetime**: 12 hours
- **Refresh Token Lifetime**: 7 days
- **Token Rotation**: Enabled (new refresh token on each refresh)
- **Blacklisting**: Enabled for revoked tokens

### Authentication Flow

1. **Register** a new account:
   ```bash
   curl -X POST http://localhost:4070/api/v1/platform/auth/register/ \
     -H "Content-Type: application/json" \
     -d '{"username": "john", "email": "john@example.com", "password": "securepass123"}'
   ```

2. **Login** to get tokens:
   ```bash
   curl -X POST http://localhost:4070/api/v1/platform/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"username": "john", "password": "securepass123"}'
   ```

3. **Use access token** in subsequent requests:
   ```bash
   curl http://localhost:4070/api/v1/platform/auth/me/ \
     -H "Authorization: Bearer <access_token>"
   ```

4. **Refresh** when the access token expires:
   ```bash
   curl -X POST http://localhost:4070/api/v1/platform/auth/refresh/ \
     -H "Content-Type: application/json" \
     -d '{"refresh": "<refresh_token>"}'
   ```

---

## User Profile Management

Users can manage their complete profile through the Account page:

### Personal Information
- First name, last name, email
- Phone number, company, job title
- Bio and address
- Profile picture (base64 upload, max 2MB)

### Preferences
- Avatar color selection
- Theme switching (dark/light mode)
- Onboarding status tracking

### Security
- Password change (requires current password verification)
- New JWT tokens issued automatically on password change

### Account Deletion
- Requires password confirmation
- Requires typing "DELETE" for double confirmation
- Permanently removes all user data

---

## Docker Services

| Service | Container | Internal Port | External Port | Description |
|---------|-----------|--------------|---------------|-------------|
| **postgres** | pe_postgres | 5432 | 5443 | PostgreSQL 16 database |
| **redis** | pe_redis | 6379 | 6390 | Redis 7 cache & broker |
| **backend** | pe_backend | 8000 | 8070 | Django REST API (4 workers) |
| **celery_worker** | pe_celery_worker | - | - | Async task processor (4 workers) |
| **gateway** | pe_gateway | 4000 | 4070 | Node.js API gateway |
| **frontend** | pe_frontend | - | - | React build (served by Nginx) |
| **nginx** | pe_nginx | 80 | 3080 | Reverse proxy & static files |

### Health Checks
- PostgreSQL: `pg_isready` every 10s
- Redis: `redis-cli ping` every 10s
- Gateway and Backend have `/health` endpoints

### Volumes
- `postgres_data`: Persistent database storage
- `redis_data`: Persistent Redis storage (AOF enabled)
- `backend_static`: Collected static files for Nginx

---

## Development

### Local Development (without Docker)

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev     # Development server on port 5173
npm run build   # Production build
```

#### Gateway
```bash
cd gateway
npm install
npm run dev     # Development server on port 4000
```

### Code Quality

```bash
# Frontend type checking
cd frontend && npx tsc --noEmit

# Frontend linting
cd frontend && npx eslint src/

# Frontend production build (catches all errors)
cd frontend && npm run build

# Backend checks
cd backend && python manage.py check
cd backend && python manage.py test
```

### Database Management

```bash
# Create new migrations
docker compose exec backend python manage.py makemigrations

# Apply migrations
docker compose exec backend python manage.py migrate

# Create superuser for Django admin
docker compose exec backend python manage.py createsuperuser
```

---

## Testing

### Test Suite Builder
The platform includes a built-in test suite builder accessible from the UI:
1. Navigate to **Testing > Test Suites** in the sidebar
2. Create a new test suite with test cases
3. Define expected outputs, assertions, or evaluation criteria
4. Run tests against any supported model
5. View results on the **Benchmark Dashboard**

### Batch Evaluation
Run prompts against multiple inputs simultaneously:
1. Navigate to **Testing > Batch Evaluation**
2. Enter your prompt and list of inputs
3. Execute batch and review aggregated results

### Consistency Analysis
Measure output stability:
1. Navigate to **Testing > Consistency**
2. Run the same prompt 2-10 times
3. View consistency metrics and variations

---

## Deployment

### Production Checklist

1. **Security**:
   - Change `DJANGO_SECRET_KEY` to a strong random value
   - Change `JWT_SECRET` in gateway configuration
   - Set `DEBUG=0` in backend environment
   - Set `ALLOWED_HOSTS` to your domain
   - Set `CORS_ALLOWED_ORIGINS` to your frontend URL
   - Update database credentials

2. **Performance**:
   - Increase Gunicorn workers based on CPU cores (`2 * cores + 1`)
   - Tune PostgreSQL for production workloads
   - Configure Redis maxmemory appropriately
   - Enable Nginx caching for static assets

3. **SSL/TLS**:
   - Configure SSL certificates in Nginx
   - Update all URLs to use HTTPS
   - Enable HSTS headers

4. **Monitoring**:
   - Set up health check monitoring
   - Configure log aggregation
   - Set up error tracking (Sentry recommended)

5. **Backup**:
   - Configure automated PostgreSQL backups
   - Set up Redis persistence monitoring

### Docker Production Build

```bash
# Build with production settings
REACT_APP_API_URL=https://api.yourdomain.com \
REACT_APP_WS_URL=wss://api.yourdomain.com \
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and ensure all tests pass
4. Run `npm run build` in the frontend to verify no TypeScript errors
5. Commit your changes: `git commit -m 'Add my feature'`
6. Push to the branch: `git push origin feature/my-feature`
7. Open a Pull Request

### Code Style
- **Frontend**: TypeScript strict mode, functional components with hooks
- **Backend**: PEP 8 style, Django conventions
- **Gateway**: TypeScript, Express middleware patterns

---

## License

This project is proprietary software. All rights reserved.

---

## Acknowledgments

- Built with [React](https://react.dev/), [Django](https://www.djangoproject.com/), [Node.js](https://nodejs.org/)
- AI powered by [OpenAI](https://openai.com/) and [Anthropic](https://www.anthropic.com/)
- MCP Protocol by [Anthropic](https://modelcontextprotocol.io/)
- Containerized with [Docker](https://www.docker.com/)
