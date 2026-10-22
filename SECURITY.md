# Security Policy

## CVE scanning — `sec.no_critical_cves`

No dependency may carry a **CRITICAL** or **HIGH** severity CVE at the time of
deployment.  This applies to:

- Python packages listed in `backend/requirements.txt`
- The `python:3.12-slim` base image declared in `backend/Dockerfile`

### Running Trivy locally

Install [Trivy](https://aquasecurity.github.io/trivy/) then run from the repo
root:

```bash
# Scan the Python dependency manifest
trivy fs --config trivy.yaml backend/requirements.txt

# Scan the built container image (replace <tag> with the image tag)
trivy image --severity CRITICAL,HIGH python:3.12-slim
trivy image --severity CRITICAL,HIGH recog-plat-acb:<tag>
```

Both commands must exit with code **0** before a release may be deployed.

### CI enforcement

Add `aquasecurity/trivy-action` (or equivalent) to your CI pipeline targeting:

1. `backend/requirements.txt` (filesystem scan)
2. The built Docker image (image scan)

Use the settings in `trivy.yaml` (severity: CRITICAL, HIGH; exit-code: 1).

### Dependency pinning

All packages in `backend/requirements.txt` are pinned to exact versions
(`==`).  When a CVE fix is released:

1. Update the affected package to the patched version.
2. Re-run both Trivy scans locally to confirm the finding is resolved.
3. Open a pull request; CI must pass before merge.

### Accepted-risk process

If no patched version is available yet, the CVE **must** be documented here
with:

| CVE ID | Package | Severity | Justification | Review date |
|--------|---------|----------|---------------|-------------|
| *(none at this time)* | | | | |

A review date must be no more than **90 days** from the date of acceptance.
The entry must be removed once a patched version is pinned.

## Reporting a vulnerability

Please report security issues by emailing the maintainers directly rather than
opening a public GitHub issue.
