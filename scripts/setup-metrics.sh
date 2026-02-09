#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# Citizen Ledger – Node Metrics Collection Setup
# Installs Prometheus + node-exporter and configures scraping
# for a validator / full node.
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

echo "═══════════════════════════════════════════"
echo "  Citizen Ledger – Metrics Setup"
echo "═══════════════════════════════════════════"

# ── 1. Install Prometheus ────────────────────────────────────────────
echo ""
echo "Installing Prometheus..."
PROM_VERSION="2.53.0"
wget -q "https://github.com/prometheus/prometheus/releases/download/v${PROM_VERSION}/prometheus-${PROM_VERSION}.linux-amd64.tar.gz"
tar xzf "prometheus-${PROM_VERSION}.linux-amd64.tar.gz"
sudo mv "prometheus-${PROM_VERSION}.linux-amd64/prometheus" /usr/local/bin/
sudo mv "prometheus-${PROM_VERSION}.linux-amd64/promtool" /usr/local/bin/
rm -rf "prometheus-${PROM_VERSION}.linux-amd64"*

# ── 2. Install node_exporter ────────────────────────────────────────
echo "Installing node_exporter..."
NE_VERSION="1.8.1"
wget -q "https://github.com/prometheus/node_exporter/releases/download/v${NE_VERSION}/node_exporter-${NE_VERSION}.linux-amd64.tar.gz"
tar xzf "node_exporter-${NE_VERSION}.linux-amd64.tar.gz"
sudo mv "node_exporter-${NE_VERSION}.linux-amd64/node_exporter" /usr/local/bin/
rm -rf "node_exporter-${NE_VERSION}.linux-amd64"*

# ── 3. Configure Prometheus ─────────────────────────────────────────
echo "Configuring Prometheus..."
sudo mkdir -p /etc/prometheus /var/lib/prometheus

cat <<'EOF' | sudo tee /etc/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # Tendermint / CometBFT metrics
  - job_name: 'citizen-ledger-node'
    static_configs:
      - targets: ['localhost:26660']
    metrics_path: /metrics

  # System metrics
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  # Optional: wasmd application metrics
  - job_name: 'wasmd-app'
    static_configs:
      - targets: ['localhost:1317']
    metrics_path: /metrics

rule_files:
  - 'alerts.yml'
EOF

# ── 4. Alert Rules ──────────────────────────────────────────────────
echo "Setting up alert rules..."
cat <<'EOF' | sudo tee /etc/prometheus/alerts.yml
groups:
  - name: citizen_ledger_alerts
    rules:
      - alert: NodeNotSyncing
        expr: rate(tendermint_consensus_height[5m]) == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Node has stopped syncing"
          description: "Block height has not increased in 5 minutes"

      - alert: ValidatorNotSigning
        expr: tendermint_consensus_validator_power == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Validator has zero voting power"
          description: "Validator may be jailed or unbonded"

      - alert: LowPeerCount
        expr: tendermint_p2p_peers < 3
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Low peer count"
          description: "Node has fewer than 3 connected peers"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage above 85%"

      - alert: DiskSpaceLow
        expr: node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} < 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Low disk space"
          description: "Less than 10% disk space remaining"

      - alert: HighConsensusRounds
        expr: tendermint_consensus_rounds > 3
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High consensus rounds"
          description: "Multiple consensus rounds indicate network issues"
EOF

# ── 5. Systemd Services ─────────────────────────────────────────────
echo "Creating systemd services..."

# node_exporter service
cat <<'EOF' | sudo tee /etc/systemd/system/node_exporter.service
[Unit]
Description=Prometheus Node Exporter
After=network.target

[Service]
User=nobody
ExecStart=/usr/local/bin/node_exporter
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# prometheus service
cat <<'EOF' | sudo tee /etc/systemd/system/prometheus.service
[Unit]
Description=Prometheus Monitoring
After=network.target

[Service]
User=nobody
ExecStart=/usr/local/bin/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/var/lib/prometheus \
  --storage.tsdb.retention.time=30d
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo chown -R nobody:nogroup /var/lib/prometheus

# ── 6. Start Services ───────────────────────────────────────────────
echo "Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable --now node_exporter
sudo systemctl enable --now prometheus

echo ""
echo "═══════════════════════════════════════════"
echo "  Setup Complete!"
echo "═══════════════════════════════════════════"
echo ""
echo "  Prometheus:    http://localhost:9090"
echo "  Node Exporter: http://localhost:9100/metrics"
echo "  Node Metrics:  http://localhost:26660/metrics"
echo ""
echo "  Grafana Dashboard: Import ID 11036"
echo "  Alert rules:  /etc/prometheus/alerts.yml"
echo ""
