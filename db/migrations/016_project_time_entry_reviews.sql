ALTER TABLE project_time_entries
  ADD COLUMN review_status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING' AFTER description,
  ADD COLUMN reviewed_by VARCHAR(64) NULL AFTER review_status,
  ADD COLUMN reviewed_at DATETIME(3) NULL AFTER reviewed_by,
  ADD COLUMN rejection_reason TEXT NULL AFTER reviewed_at,
  ADD INDEX idx_pte_review_status (review_status),
  ADD CONSTRAINT fk_pte_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id);

ALTER TABLE project_hour_bag_entries
  ADD COLUMN review_status ENUM('EMPTY', 'PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'EMPTY' AFTER date,
  ADD COLUMN reviewed_by VARCHAR(64) NULL AFTER review_status,
  ADD COLUMN reviewed_at DATETIME(3) NULL AFTER reviewed_by,
  ADD COLUMN rejection_reason TEXT NULL AFTER reviewed_at,
  ADD INDEX idx_hour_bag_review_status (review_status),
  ADD CONSTRAINT fk_hour_bag_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id);
