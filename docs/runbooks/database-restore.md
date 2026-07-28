# Database Restore Runbook — Recognition-Platform

**Applies to:** RDS PostgreSQL (`recognition-platform-postgres`)  
**Last tested:** _(update this field after each DR exercise)_  
**Owner:** Platform Engineering  
**Policy ref:** `rel.backup_configured`

---

## 1. Backup overview

| Property | Value |
|---|---|
| Engine | PostgreSQL 15 (AWS RDS) |
| Backup type | Automated RDS backups + manual snapshots |
| Retention period | 30 days (configurable via `var.db_backup_retention_days`) |
| Backup window | 02:00–03:00 UTC daily |
| Point-in-time recovery (PITR) | Enabled (RDS PITR is active whenever `backup_retention_period > 0`) |
| Cross-region replication | Automated backups replicated to `var.db_backup_replication_region` (default `eu-west-2`) |
| Encryption | AES-256 via AWS-managed KMS key |

---

## 2. Pre-requisites

- AWS CLI ≥ 2.x configured with a role that has `rds:RestoreDBInstanceToPointInTime`  
  and `rds:RestoreDBInstanceFromDBSnapshot` permissions.
- Terraform ≥ 1.3.0 (if restoring via IaC).
- Target VPC, subnet group, and security groups already provisioned.

---

## 3. Restore from a specific point in time (PITR)

PITR lets you restore the database to any second within the 30-day retention window.

### 3.1 Via AWS Console

1. Open **RDS → Databases** and select `recognition-platform-postgres`.
2. Choose **Actions → Restore to point in time**.
3. Select **Custom date and time** and enter the target UTC timestamp.
4. Set a new **DB instance identifier** (e.g. `recognition-platform-postgres-restore-YYYYMMDD`).
5. Choose the same subnet group (`recognition-platform-db-subnet-group`) and security groups.
6. Click **Restore DB instance** and wait for the instance to become **Available** (~10–20 min).
7. Update the application's `DATABASE_URL` environment variable to point to the new endpoint.
8. Run Django migrations if necessary: `python manage.py migrate --run-syncdb`.
9. Verify application health and run smoke tests.
10. Once validated, rename or promote the restored instance and decommission the old one.

### 3.2 Via AWS CLI

```bash
# Determine the earliest and latest restorable times
aws rds describe-db-instances \
  --db-instance-identifier recognition-platform-postgres \
  --query 'DBInstances[0].{Earliest:EarliestRestorableTime,Latest:LatestRestorableTime}'

# Restore to a specific point in time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier recognition-platform-postgres \
  --target-db-instance-identifier recognition-platform-postgres-restore-$(date +%Y%m%d%H%M) \
  --restore-time "2026-07-15T14:30:00Z" \
  --db-instance-class db.t3.medium \
  --db-subnet-group-name recognition-platform-db-subnet-group \
  --no-publicly-accessible

# Wait for the instance to become available
aws rds wait db-instance-available \
  --db-instance-identifier recognition-platform-postgres-restore-$(date +%Y%m%d%H%M)
```

---

## 4. Restore from a manual or automated snapshot

```bash
# List available automated snapshots (sorted by creation time)
aws rds describe-db-snapshots \
  --db-instance-identifier recognition-platform-postgres \
  --snapshot-type automated \
  --query 'sort_by(DBSnapshots, &SnapshotCreateTime)[*].{ID:DBSnapshotIdentifier,Created:SnapshotCreateTime,Status:Status}' \
  --output table

# Restore from a chosen snapshot
SNAPSHOT_ID="rds:recognition-platform-postgres-2026-07-14-02-00"

aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier recognition-platform-postgres-restore-$(date +%Y%m%d%H%M) \
  --db-snapshot-identifier "${SNAPSHOT_ID}" \
  --db-instance-class db.t3.medium \
  --db-subnet-group-name recognition-platform-db-subnet-group \
  --no-publicly-accessible

aws rds wait db-instance-available \
  --db-instance-identifier recognition-platform-postgres-restore-$(date +%Y%m%d%H%M)
```

---

## 5. Cross-region restore (DR scenario)

If the primary region is unavailable, restore from the replicated backup in `eu-west-2`:

```bash
# Switch AWS CLI to the DR region
export AWS_DEFAULT_REGION=eu-west-2

# List replicated automated backups
aws rds describe-db-instance-automated-backups \
  --query 'DBInstanceAutomatedBackups[?DBInstanceIdentifier==`recognition-platform-postgres`]'

# Restore to point in time from the replicated backup
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-automated-backups-arn "<ARN-from-above>" \
  --target-db-instance-identifier recognition-platform-postgres-dr-$(date +%Y%m%d%H%M) \
  --restore-time "2026-07-15T14:30:00Z" \
  --db-instance-class db.t3.medium \
  --db-subnet-group-name <dr-region-subnet-group> \
  --no-publicly-accessible
```

---

## 6. Post-restore validation checklist

- [ ] RDS instance status is **Available**.
- [ ] Application can connect to the restored instance (check `DATABASE_URL`).
- [ ] `python manage.py check --database default` returns no errors.
- [ ] Run the application smoke-test suite against the restored instance.
- [ ] Confirm row counts and data integrity on key tables (users, recognition records).
- [ ] Update monitoring/alerting to point to the new instance endpoint.
- [ ] Record the restore event in the incident log with: snapshot/PITR timestamp used, RTO achieved, and data-loss window (RPO).

---

## 7. Scheduled DR testing

Per policy, the restore procedure must be tested **at least once before go-live** and at least **once per year** thereafter.

| Date | Tester | Scenario | RTO | RPO | Result |
|---|---|---|---|---|---|
| _(pre-go-live test — add row when completed)_ | | | | | |

---

## 8. Related resources

- [AWS RDS Backup & Restore docs](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html)
- [AWS RDS Point-in-Time Recovery](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html)
- [Terraform `aws_db_instance` reference](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/db_instance)
- Infrastructure: `infra/database.tf`
