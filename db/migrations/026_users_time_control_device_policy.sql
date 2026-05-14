ALTER TABLE users
  ADD COLUMN time_control_device_policy ENUM(
    'TABLET_ONLY',
    'MOBILE_ONLY',
    'TABLET_OR_MOBILE'
  ) NOT NULL DEFAULT 'TABLET_ONLY' AFTER can_manage_time_control_requests;
