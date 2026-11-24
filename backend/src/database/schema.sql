-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'REQUESTER'
        CHECK (role IN ('REQUESTER', 'ADMIN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. User resource quotas
CREATE TABLE IF NOT EXISTS user_quotas (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    max_cpu INTEGER NOT NULL DEFAULT 8,
    max_ram INTEGER NOT NULL DEFAULT 16,
    max_disk INTEGER NOT NULL DEFAULT 200
);

-- 3. Infrastructure requests
CREATE TABLE IF NOT EXISTS infrastructure_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    vm_name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'PROXMOX',
    os VARCHAR(100) NOT NULL,
    cpu INTEGER NOT NULL,
    ram INTEGER NOT NULL,
    disk INTEGER NOT NULL,
    environment VARCHAR(20) NOT NULL
        CHECK (environment IN ('DEV', 'STAGE', 'PROD')),
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_APPROVAL',
    terraform_config TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Approval history
CREATE TABLE IF NOT EXISTS approvals (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES infrastructure_requests(id),
    admin_id INTEGER NOT NULL REFERENCES users(id),
    decision VARCHAR(20) NOT NULL
        CHECK (decision IN ('APPROVED', 'REJECTED')),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Provisioning jobs
CREATE TABLE IF NOT EXISTS provisioning_jobs (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES infrastructure_requests(id),
    integration VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    logs TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for frequently accessed data
CREATE INDEX IF NOT EXISTS idx_requests_user_id
    ON infrastructure_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_requests_status
    ON infrastructure_requests(status);

CREATE INDEX IF NOT EXISTS idx_approvals_request_id
    ON approvals(request_id);

CREATE INDEX IF NOT EXISTS idx_jobs_request_id
    ON provisioning_jobs(request_id);
