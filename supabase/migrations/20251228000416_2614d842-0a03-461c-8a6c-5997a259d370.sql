-- Add new project types to the enum
ALTER TYPE project_type ADD VALUE IF NOT EXISTS 'duplex';
ALTER TYPE project_type ADD VALUE IF NOT EXISTS 'single_family';