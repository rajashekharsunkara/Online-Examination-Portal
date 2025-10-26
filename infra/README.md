# Infrastructure Configuration

This directory contains infrastructure-as-code for deploying the exam platform.

## Subdirectories

### `/k8s` - Kubernetes Manifests
**Implementation planned for Chunk 17.**

Will contain:
- Deployments for API, workers, frontend
- Services and Ingress configurations
- ConfigMaps and Secrets
- StatefulSets for PostgreSQL and Redis
- HorizontalPodAutoscalers
- Network policies

### `/helm` - Helm Charts
**Implementation planned for Chunk 17.**

Helm chart for simplified deployment and configuration management.

### `/monitoring` - Monitoring Stack
**Implementation planned for Chunk 19.**

Will contain:
- Prometheus configuration
- Grafana dashboards (JSON)
- Alert rules
- Fluentd/ELK logging setup

## Usage

See individual subdirectory READMEs for deployment instructions.
