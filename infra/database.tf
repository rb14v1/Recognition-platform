# ---------------------------------------------------------------------------
# database.tf
#
# Managed PostgreSQL (RDS) for the Recognition-Platform.
#
# Backup policy (rel.backup_configured):
#   • Automated daily backups retained for 30 days (var.db_backup_retention_days)
#   • Preferred backup window isolated from the maintenance window
#   • Point-in-time recovery (PITR) is enabled automatically when
#     backup_retention_period > 0 on RDS
#   • Automated backup replication to a separate AWS region via
#     aws_db_instance_automated_backups_replication (cross-region DR)
#   • Restore procedure documented in docs/runbooks/database-restore.md
# ---------------------------------------------------------------------------

# ── Subnet group ────────────────────────────────────────────────────────────

resource "aws_db_subnet_group" "main" {
  name        = "recognition-platform-db-subnet-group"
  subnet_ids  = var.db_subnet_ids
  description = "Subnet group for the Recognition-Platform RDS PostgreSQL instance"

  tags = {
    Name = "recognition-platform-db-subnet-group"
  }
}

# ── Parameter group (enables SSL enforcement & standard audit settings) ──────

resource "aws_db_parameter_group" "postgres" {
  name        = "recognition-platform-postgres15"
  family      = "postgres15"
  description = "Custom parameter group for Recognition-Platform PostgreSQL 15"

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }
}

# ── RDS PostgreSQL instance ─────────────────────────────────────────────────

resource "aws_db_instance" "postgres" {
  identifier = "recognition-platform-postgres"

  engine         = "postgres"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  allocated_storage     = var.db_allocated_storage_gb
  max_allocated_storage = var.db_allocated_storage_gb * 4 # allow autoscaling up to 4x
  storage_type          = "gp3"
  storage_encrypted     = true

  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = var.db_vpc_security_group_ids
  parameter_group_name   = aws_db_parameter_group.postgres.name

  # ── Backup & PITR configuration ──────────────────────────────────────────
  # Setting backup_retention_period > 0 automatically enables PITR on RDS.
  # The minimum required by policy is 30 days; the variable validation
  # enforces this at plan time.
  backup_retention_period   = var.db_backup_retention_days # 30-day minimum (policy)
  backup_window             = var.db_backup_window         # "02:00-03:00" UTC
  maintenance_window        = var.db_maintenance_window    # "sun:04:00-sun:05:00" UTC
  copy_tags_to_snapshot     = true

  # Prevent accidental deletion of the instance (and its snapshots)
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "recognition-platform-postgres-final-snapshot"

  # Automatic minor version upgrades keep the engine patched
  auto_minor_version_upgrade = true

  # Publish database logs to CloudWatch Logs
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name = "recognition-platform-postgres"
  }
}

# ── Cross-region automated backup replication ────────────────────────────────
#
# Replicates RDS automated backups to var.db_backup_replication_region (default
# eu-west-2) so that backups are stored in a region separate from the primary
# database, satisfying the cross-region storage requirement.

resource "aws_db_instance_automated_backups_replication" "cross_region" {
  source_db_instance_arn = aws_db_instance.postgres.arn
  retention_period       = var.db_backup_retention_days

  provider = aws.backup_region
}

# ── Outputs ──────────────────────────────────────────────────────────────────

output "db_endpoint" {
  description = "RDS PostgreSQL connection endpoint."
  value       = aws_db_instance.postgres.endpoint
  sensitive   = true
}

output "db_arn" {
  description = "ARN of the RDS PostgreSQL instance (required to manage snapshots via CLI)."
  value       = aws_db_instance.postgres.arn
}
