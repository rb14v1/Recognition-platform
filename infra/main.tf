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
