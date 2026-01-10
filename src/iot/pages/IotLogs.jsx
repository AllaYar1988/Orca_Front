import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useIotAuth } from '../context/IotAuthContext';
import { getUserDevices, getUserLogs } from '../api/devices';
import IotLayout from '../components/IotLayout';

const IotLogs = () => {
  const { iotUser } = useIotAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [devices, setDevices] = useState([]);
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [deviceId, setDeviceId] = useState(searchParams.get('device_id') || '');
  const [logKey, setLogKey] = useState(searchParams.get('log_key') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);

  const limit = 50;

  // Modal state for JSON view
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [selectedJson, setSelectedJson] = useState(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await getUserDevices(iotUser.id);
        if (response.success) {
          setDevices(response.devices);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDevices();
  }, [iotUser.id]);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params = {
          limit,
          offset: (page - 1) * limit
        };

        if (deviceId) params.device_id = deviceId;
        if (logKey) params.log_key = logKey;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;

        const response = await getUserLogs(iotUser.id, params);
        if (response.success) {
          setLogs(response.logs);
          setTotalCount(response.total_count);
        }
      } catch (err) {
        setError('Failed to load logs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [iotUser.id, deviceId, logKey, dateFrom, dateTo, page]);

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(1);
    updateSearchParams();
  };

  const handleClear = () => {
    setDeviceId('');
    setLogKey('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    setSearchParams({});
  };

  const updateSearchParams = () => {
    const params = {};
    if (deviceId) params.device_id = deviceId;
    if (logKey) params.log_key = logKey;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (page > 1) params.page = page;
    setSearchParams(params);
  };

  const totalPages = Math.ceil(totalCount / limit);

  const showJson = (data) => {
    setSelectedJson(data);
    setShowJsonModal(true);
  };

  return (
    <IotLayout>
      <h2 className="iot-page-title">
        <i className="bi bi-journal-text"></i> Logs
      </h2>

      {error && <div className="iot-alert iot-alert-error">{error}</div>}

      {/* Filters */}
      <div className="iot-card">
        <div className="iot-card-header">
          <span><i className="bi bi-filter"></i> Filter Logs</span>
        </div>
        <div className="iot-card-body">
          <form onSubmit={handleFilter} className="iot-filter-form">
            <select
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
            >
              <option value="">All Devices</option>
              {devices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Log key..."
              value={logKey}
              onChange={(e) => setLogKey(e.target.value)}
            />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            <button type="submit" className="iot-btn-primary">
              <i className="bi bi-search"></i> Filter
            </button>
            {(deviceId || logKey || dateFrom || dateTo) && (
              <button type="button" className="iot-btn-outline" onClick={handleClear}>
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Logs Table */}
      <div className="iot-card">
        <div className="iot-card-header">
          <span>Log Entries</span>
          <span className="iot-badge info">{totalCount.toLocaleString()} total</span>
        </div>
        <div className="iot-card-body">
          {loading ? (
            <div className="iot-loading">
              <div className="iot-spinner"></div>
            </div>
          ) : logs.length === 0 ? (
            <p className="iot-empty-state">No logs found.</p>
          ) : (
            <>
              <div className="iot-table-responsive">
                <table className="iot-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Device</th>
                      <th>Key</th>
                      <th>Value</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td className="iot-nowrap">
                          {new Date(log.logged_at).toLocaleString()}
                        </td>
                        <td>{log.device_name || log.serial_number}</td>
                        <td><code>{log.log_key || '-'}</code></td>
                        <td className="iot-truncate" title={log.log_value}>
                          {log.log_value || '-'}
                        </td>
                        <td>
                          {log.log_data ? (
                            <button
                              className="iot-btn-small"
                              onClick={() => showJson(log.log_data)}
                            >
                              <i className="bi bi-code-slash"></i>
                            </button>
                          ) : (
                            <span className="iot-muted">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="iot-pagination">
                  <button
                    className="iot-btn-outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    Previous
                  </button>

                  <span className="iot-page-info">
                    Page {page} of {totalPages}
                  </span>

                  <button
                    className="iot-btn-outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* JSON Modal */}
      {showJsonModal && (
        <div className="iot-modal-overlay" onClick={() => setShowJsonModal(false)}>
          <div className="iot-modal" onClick={e => e.stopPropagation()}>
            <div className="iot-modal-header">
              <h3>Log Data (JSON)</h3>
              <button onClick={() => setShowJsonModal(false)}>&times;</button>
            </div>
            <div className="iot-modal-body">
              <pre>{JSON.stringify(selectedJson, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </IotLayout>
  );
};

export default IotLogs;
