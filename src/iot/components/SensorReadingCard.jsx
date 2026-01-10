import SensorIcon from './SensorIcon';
import Sparkline from './Sparkline';
import { getSensorConfig } from '../config/sensorTypes';

/**
 * Calculate trend from data points
 */
const calculateTrend = (data) => {
  if (!data || data.length < 2) return { direction: 'stable', change: 0 };

  const values = data.map(d => {
    if (typeof d === 'object') {
      // Support both raw logs (log_value) and processed data (value)
      return parseFloat(d.log_value || d.value) || 0;
    }
    return parseFloat(d) || 0;
  });

  const latest = values[values.length - 1];
  const previous = values[0];
  const change = latest - previous;
  const percentChange = previous !== 0 ? ((change / Math.abs(previous)) * 100) : 0;

  let direction = 'stable';
  if (Math.abs(percentChange) > 1) {
    direction = change > 0 ? 'up' : 'down';
  }

  return { direction, change, percentChange };
};

/**
 * Format value with appropriate precision
 */
const formatValue = (value, unit) => {
  const num = parseFloat(value);
  if (isNaN(num)) return value;

  // Format based on magnitude
  if (Math.abs(num) >= 1000) {
    return num.toFixed(0);
  } else if (Math.abs(num) >= 100) {
    return num.toFixed(1);
  } else if (Math.abs(num) >= 1) {
    return num.toFixed(1);
  } else {
    return num.toFixed(2);
  }
};

/**
 * Check alarm status based on value and sensor config
 * @param {number} value - Current sensor value
 * @param {object} sensorConfig - Sensor configuration with alarm settings
 * @returns {object} { isAlarm: bool, type: 'low'|'high'|null }
 */
const checkAlarmStatus = (value, sensorConfig) => {
  if (!sensorConfig || !sensorConfig.alarm_enabled) {
    return { isAlarm: false, type: null };
  }

  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return { isAlarm: false, type: null };
  }

  const minAlarm = sensorConfig.min_alarm;
  const maxAlarm = sensorConfig.max_alarm;

  if (minAlarm !== null && minAlarm !== undefined && numValue < parseFloat(minAlarm)) {
    return { isAlarm: true, type: 'low' };
  }

  if (maxAlarm !== null && maxAlarm !== undefined && numValue > parseFloat(maxAlarm)) {
    return { isAlarm: true, type: 'high' };
  }

  return { isAlarm: false, type: null };
};

/**
 * SensorReadingCard Component
 *
 * Displays a sensor reading with icon, current value, sparkline trend, and change indicator.
 *
 * @param {string} type - Sensor type code (TMP, VLT, HUM, etc.)
 * @param {string} name - Sensor display name
 * @param {number} value - Current value
 * @param {string} unit - Unit of measurement
 * @param {Array} history - Historical data points for sparkline
 * @param {string} className - Additional CSS classes
 * @param {object} sensorConfig - Sensor configuration with alarm settings
 */
const SensorReadingCard = ({
  type = 'GEN',
  name,
  value,
  unit = '',
  history = [],
  className = '',
  sensorConfig = null,
}) => {
  const config = getSensorConfig(type);
  const trend = calculateTrend(history);
  const displayName = name || config.label;
  const color = config.color || '#6b7280';

  // Check alarm status
  const alarmStatus = checkAlarmStatus(value, sensorConfig);
  const cardClassName = `sensor-reading-card ${className} ${alarmStatus.isAlarm ? 'sensor-reading-card--alarm' : ''}`;

  return (
    <div className={cardClassName}>
      {/* Alarm indicator badge */}
      {alarmStatus.isAlarm && (
        <div className={`sensor-reading-card__alarm-badge sensor-reading-card__alarm-badge--${alarmStatus.type}`}>
          <i className={`bi bi-exclamation-triangle-fill`}></i>
          {alarmStatus.type === 'low' ? 'LOW' : 'HIGH'}
        </div>
      )}

      <div className="sensor-reading-card__icon" style={{ color: alarmStatus.isAlarm ? '#ef4444' : color }}>
        <SensorIcon type={type} size="md" />
      </div>

      <div className="sensor-reading-card__info">
        <span className="sensor-reading-card__name">{displayName}</span>
        <div className="sensor-reading-card__value">
          <span className={`sensor-reading-card__number ${alarmStatus.isAlarm ? 'sensor-reading-card__number--alarm' : ''}`}>
            {formatValue(value, unit)}
          </span>
          <span className="sensor-reading-card__unit">{unit}</span>
        </div>
      </div>

      <div className="sensor-reading-card__chart">
        <Sparkline
          data={history}
          height={28}
          color={alarmStatus.isAlarm ? '#ef4444' : color}
          unit={unit}
          todayOnly={false}
        />
      </div>
    </div>
  );
};

export default SensorReadingCard;
