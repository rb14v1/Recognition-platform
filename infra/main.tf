terraform {
  required_version = ">= 1.3.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ---------------------------------------------------------------------------
# Provider – default_tags ensures every child resource inherits the three
# mandatory FinOps tags (tenantId, submissionId, costCentre) automatically.
# ---------------------------------------------------------------------------
provider "aws" {
  default_tags {
    tags = {
      tenantId     = var.tenant_id
      submissionId = var.submission_id
      costCentre   = var.cost_centre
    }
  }
}

# Secondary provider used exclusively for cross-region automated backup
# replication (aws_db_instance_automated_backups_replication in database.tf).
# Backups are stored in this region, satisfying the requirement that backup
# storage must be separate from the primary database region.
provider "aws" {
  alias  = "backup_region"
  region = var.db_backup_replication_region

  default_tags {
    tags = {
      tenantId     = var.tenant_id
      submissionId = var.submission_id
      costCentre   = var.cost_centre
    }
  }
}
