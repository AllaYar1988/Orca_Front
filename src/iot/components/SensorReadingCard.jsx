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
 */
const SensorReadingCard = ({
  type = 'GEN',
  name,
  value,
  unit = '',
  history = [],
  className = '',
}) => {
  const config = getSensorConfig(type);
  const trend = calculateTrend(history);
  const displayName = name || config.label;

  // Get color based on sensor type
  const getColor = () => {
    const colors = {
      TMP: '#ef4444', // red for temperature
      VLT: '#f59e0b', // amber for voltage
      CUR: '#eab308', // yellow for current
      HUM: '#3b82f6', // blue for humidity
      PRS: '#8b5cf6', // purple for pressure
      CO2: '#10b981', // green for CO2
      default: '#0d6efd', // primary blue
    };
    return colors[type] || colors.default;
  };

  const color = getColor();

  return (
    <div className={`sensor-reading-card ${className}`}>
      <div className="sensor-reading-card__icon" style={{ color }}>
        <SensorIcon type={type} size="md" />
      </div>

      <div className="sensor-reading-card__info">
        <span className="sensor-reading-card__name">{displayName}</span>
        <div className="sensor-reading-card__value">
          <span className="sensor-reading-card__number">{formatValue(value, unit)}</span>
          <span className="sensor-reading-card__unit">{unit}</span>
        </div>
      </div>

      <div className="sensor-reading-card__chart">
        <Sparkline
          data={history}
          width={100}
          height={28}
          color={color}
          unit={unit}
          todayOnly={false}
        />
      </div>
    </div>
  );
};

export default SensorReadingCard;
