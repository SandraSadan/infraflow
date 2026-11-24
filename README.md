# InfraFlow

**Infrastructure Self-Service Portal – Proof of Concept**

InfraFlow is a self-service infrastructure management portal that demonstrates how users can request virtual machines, manage approvals, track infrastructure requests and generate Terraform configurations.

## Implemented Features

- Infrastructure service catalog and VM request submission
- Resource quota validation
- Role-based access control for requesters and administrators
- Request approval and rejection workflow
- Request status tracking and detailed request views
- Terraform HCL configuration generation
- RabbitMQ-based provisioning job processing
- GitLab CI and AWX integration points
- Demo JWT authentication with SAML/LDAP integration support

## Technology Stack

- **Frontend:** Angular, TypeScript, SCSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL
- **Message Queue:** RabbitMQ
- **Infrastructure as Code:** Terraform
- **Automation:** GitLab CI, AWX

## Repository Structure

```text
InfraFlow/
├── backend/
├── frontend/
├── docs/
│   ├── architecture.png
│   ├── SETUP.md
│   └── DEMO.md
└── README.md
```

## Documentation

- [Architecture Diagram](docs/architecture.png)
- [Setup and Deployment Instructions](docs/SETUP.md)
- [Demo and Implemented Features](docs/DEMO.md)

## Project Status

Proof of Concept – Core application workflows and external automation integration points implemented.

Actual infrastructure deployment and external identity-provider integrations require additional environment configuration and credentials.
