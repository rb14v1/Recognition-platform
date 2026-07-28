variable "tenant_id" {
  description = "Azure / cloud tenant identifier used for cost allocation and incident attribution."
  type        = string
}

variable "submission_id" {
  description = "Submission identifier that links the deployment to the originating work item."
  type        = string
}

variable "cost_centre" {
  description = "Cost-centre code used for financial chargeback and automated governance."
  type        = string
}

# ---------------------------------------------------------------------------
# Database / backup variables
# ---------------------------------------------------------------------------

variable "db_instance_class" {
  description = "RDS instance class for the PostgreSQL database."
  type        = string
  default     = "db.t3.medium"
}

variable "db_engine_version" {
  description = "PostgreSQL engine version."
  type        = string
  default     = "15.5"
}

variable "db_name" {
  description = "Name of the initial database created on the RDS instance."
  type        = string
  default     = "recognition_platform"
}

variable "db_username" {
  description = "Master username for the RDS PostgreSQL instance."
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Master password for the RDS PostgreSQL instance."
  type        = string
  sensitive   = true
}

variable "db_allocated_storage_gb" {
  description = "Allocated storage for the RDS instance in gigabytes."
  type        = number
  default     = 20
}

variable "db_backup_retention_days" {
  description = "Number of days to retain automated RDS backups. Minimum 30 required by policy."
  type        = number
  default     = 30

  validation {
    condition     = var.db_backup_retention_days >= 30
    error_message = "db_backup_retention_days must be at least 30 to meet the backup-retention policy."
  }
}

variable "db_backup_window" {
  description = "Preferred daily backup window (UTC). Format: hh24:mi-hh24:mi."
  type        = string
  default     = "02:00-03:00"
}

variable "db_maintenance_window" {
  description = "Preferred weekly maintenance window (UTC). Format: ddd:hh24:mi-ddd:hh24:mi."
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "db_backup_replication_region" {
  description = "AWS region to which automated backups are replicated for cross-region DR storage."
  type        = string
  default     = "eu-west-2"
}

variable "db_subnet_ids" {
  description = "List of subnet IDs for the RDS subnet group (must span at least two AZs)."
  type        = list(string)
}

variable "db_vpc_security_group_ids" {
  description = "List of VPC security group IDs to associate with the RDS instance."
  type        = list(string)
}
