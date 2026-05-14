CREATE TABLE time_control_trusted_networks (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  network_value VARCHAR(64) NOT NULL,
  network_type ENUM('EXACT_IP', 'CIDR') NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uq_time_control_trusted_networks_value (network_value),
  KEY idx_time_control_trusted_networks_active (is_active),
  KEY idx_time_control_trusted_networks_type (network_type)
);
