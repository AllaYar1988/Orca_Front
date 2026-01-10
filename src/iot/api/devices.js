import api from './axiosInstance';

// Get companies assigned to authenticated user
export const getUserCompanies = async () => {
  const response = await api.get('/user_companies.php');
  return response.data;
};

// Get devices for a specific company (that user has access to)
export const getCompanyDevices = async (companyId) => {
  const response = await api.get('/company_devices.php', {
    params: { company_id: companyId }
  });
  return response.data;
};

// Get device details
export const getDeviceDetails = async (deviceId) => {
  const response = await api.get('/device_details.php', {
    params: { device_id: deviceId }
  });
  return response.data;
};

// Get device logs
export const getDeviceLogs = async (deviceId, params = {}) => {
  const response = await api.get('/device_logs.php', {
    params: { device_id: deviceId, ...params }
  });
  return response.data;
};

/**
 * Get device logs within a date range
 * @param {number} deviceId - Device ID
 * @param {string} from - Start datetime (ISO format: YYYY-MM-DDTHH:mm:ss)
 * @param {string} to - End datetime (ISO format: YYYY-MM-DDTHH:mm:ss)
 * @param {object} options - Optional: { limit, offset } for pagination
 * @returns {Promise} - Logs within the date range
 *
 * Response includes:
 *   - logs: Array of log entries
 *   - total: Total count matching the date range
 *   - from, to: The date range used
 *   - limit, offset, has_more: Pagination info (if limit was provided)
 */
export const getDeviceLogsRange = async (deviceId, from, to, options = {}) => {
  const params = {
    device_id: deviceId,
    from,
    to
  };

  // Add optional pagination params
  if (options.limit !== undefined) {
    params.limit = options.limit;
  }
  if (options.offset !== undefined) {
    params.offset = options.offset;
  }

  const response = await api.get('/device_logs.php', { params });
  return response.data;
};

// Get device events
export const getDeviceEvents = async (deviceId, params = {}) => {
  const response = await api.get('/device_events.php', {
    params: { device_id: deviceId, ...params }
  });
  return response.data;
};

// Get device configs
export const getDeviceConfigs = async (deviceId) => {
  const response = await api.get('/device_configs.php', {
    params: { device_id: deviceId }
  });
  return response.data;
};

// Legacy - get all user devices (for backwards compatibility)
export const getUserDevices = async () => {
  const response = await api.get('/user_devices.php');
  return response.data;
};

// Legacy - get user logs
export const getUserLogs = async (params = {}) => {
  const response = await api.get('/user_logs.php', { params });
  return response.data;
};

// Get all devices with their latest parameters for dashboard
export const getAllDevicesWithParameters = async () => {
  const response = await api.get('/dashboard_devices.php');
  return response.data;
};

// Get latest parameters/readings for a specific device
export const getDeviceLatestReadings = async (deviceId) => {
  const response = await api.get('/device_latest_readings.php', {
    params: { device_id: deviceId }
  });
  return response.data;
};

/**
 * Get the last update timestamp for a device
 * Use this for smart polling - only fetch data if last_update changed
 * @param {number} deviceId - Device ID
 * @returns {Promise} - { success, last_update, has_data }
 */
export const getDeviceLastUpdate = async (deviceId) => {
  const response = await api.get('/device_last_update.php', {
    params: { device_id: deviceId }
  });
  return response.data;
};

// ============ Sensor Config API ============

/**
 * Get all sensor configs for a device
 * @param {number} deviceId - Device ID
 * @returns {Promise} - { success, configs, available_keys }
 */
export const getSensorConfigs = async (deviceId) => {
  const response = await api.get('/sensor_config.php', {
    params: { device_id: deviceId }
  });
  return response.data;
};

/**
 * Get config for a specific sensor
 * @param {number} deviceId - Device ID
 * @param {string} logKey - Sensor key (e.g., 'temperature')
 * @returns {Promise} - { success, config }
 */
export const getSensorConfig = async (deviceId, logKey) => {
  const response = await api.get('/sensor_config.php', {
    params: { device_id: deviceId, key: logKey }
  });
  return response.data;
};

/**
 * Save sensor config (create or update)
 * @param {object} config - Sensor config object
 * @returns {Promise} - { success, config }
 */
export const saveSensorConfig = async (config) => {
  const response = await api.post('/sensor_config.php', config);
  return response.data;
};

/**
 * Delete sensor config
 * @param {number} deviceId - Device ID
 * @param {string} logKey - Sensor key
 * @returns {Promise} - { success }
 */
export const deleteSensorConfig = async (deviceId, logKey) => {
  const response = await api.delete('/sensor_config.php', {
    params: { device_id: deviceId, key: logKey }
  });
  return response.data;
};
