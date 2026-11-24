# InfraFlow – Setup and Deployment Guide

This guide explains how to configure and run the InfraFlow proof of concept locally.

## 1. Prerequisites

Install the following software:

| Software | Purpose |
|---|---|
| Node.js and npm | Backend and frontend development |
| Angular CLI | Run the Angular application |
| PostgreSQL | Application database |
| RabbitMQ | Provisioning job queue |
| Git | Source code management |

Ensure PostgreSQL and RabbitMQ services are running before starting the application.

## 2. Clone the Repository

```bash
git clone https://github.com/SandraSadan/infraflow.git
cd infraflow
```

## 3. Database Configuration

Create a PostgreSQL database named `infraflow_db`.

Using PostgreSQL or pgAdmin, execute:

```sql
CREATE DATABASE infraflow_db;
```

The application database schema and demo data are initialized by the backend setup command.

## 4. Backend Configuration

Navigate to the backend directory:

```bash
cd backend
npm install
```

Create a `.env` file by copying `.env.example`.

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Update the database configuration:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=infraflow_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
```

Configure the remaining environment variables as required.

### Authentication

The default local configuration enables demo authentication:

```env
AUTH_PROVIDER=demo
DEMO_MODE=true
```

Configure a secure JWT secret:

```env
JWT_SECRET=your_secure_random_secret
JWT_EXPIRES_IN=1h
```

SAML and LDAP settings are available in `.env.example`. A real identity provider or LDAP server is required to use those authentication integrations.

### RabbitMQ

For a local RabbitMQ instance:

```env
RABBITMQ_URL=amqp://localhost:5672
```

### GitLab CI and AWX

GitLab and AWX environment variables are provided in `.env.example`.

Configure the appropriate project, token, API URL and job template details when connecting external automation services.

These integrations are optional for running the basic local application workflows.

**Important:** Do not commit `.env` or expose authentication tokens, passwords or other credentials.

## 5. Initialize the Database

Ensure PostgreSQL is running and the database exists.

From the backend directory:

```bash
npm run db:setup
```

This command:

- Executes the database schema.
- Creates the required application tables.
- Inserts demo users and their resource quotas.

## 6. Start the Backend API

From the backend directory:

```bash
npm run dev
```

The backend API runs at:

`http://localhost:3000`

## 7. Start the Provisioning Worker

Open a separate terminal and navigate to the backend directory:

```bash
cd backend
npm run worker
```

The worker connects to RabbitMQ and processes provisioning jobs.

Ensure RabbitMQ is running and its connection URL is configured correctly.

## 8. Start the Angular Frontend

Open another terminal:

```bash
cd frontend/infraflow-ui
npm install
ng serve
```

The frontend is available at:

`http://localhost:4200`

## 9. Demo Accounts

The database initialization creates the following demo accounts:

| Role | Email |
|---|---|
| Requester | requester@infraflow.local |
| Administrator | admin@infraflow.local |

Use the application's demo login flow to authenticate.

These accounts are intended only for local POC evaluation.

## 10. Build Verification

To build the backend:

```bash
cd backend
npm run build
```

To build the frontend:

```bash
cd frontend/infraflow-ui
ng build
```

## 11. Integration and Deployment Notes

InfraFlow is a proof of concept. The following external configuration is required for full integration:

- **PostgreSQL:** A running database instance and valid connection credentials.
- **RabbitMQ:** A running message broker.
- **GitLab CI:** A configured GitLab project, pipeline trigger token and branch reference.
- **AWX:** A configured AWX instance, job template and access token.
- **SAML/LDAP:** A configured identity provider or directory service.
- **Infrastructure providers:** Valid Proxmox or cloud provider credentials and connectivity for actual infrastructure provisioning.

Terraform HCL generation and external automation integration code are included. Actual infrastructure provisioning and complete external job lifecycle tracking have not been verified against live infrastructure services.

## 12. Troubleshooting

| Issue | Suggested check |
|---|---|
| Database connection failure | Verify PostgreSQL is running and `.env` credentials are correct. |
| RabbitMQ connection failure | Verify RabbitMQ is running and `RABBITMQ_URL` is correct. |
| Backend startup failure | Check environment variables and backend dependencies. |
| Frontend API errors | Verify the backend is running at `http://localhost:3000`. |
| Provisioning job not submitted | Check RabbitMQ, worker logs and external GitLab/AWX configuration. |
