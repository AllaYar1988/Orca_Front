import { useState, useEffect, useCallback } from 'react';

/**
 * RefreshTimer Component
 *
 * Displays a circular countdown timer that triggers a refresh callback.
 *
 * @param {number} interval - Refresh interval in seconds (default: 60)
 * @param {function} onRefresh - Callback function to execute on refresh
 * @param {boolean} isLoading - Whether data is currently loading
 * @param {string} size - Timer size: "sm", "md", "lg"
 */
const RefreshTimer = ({
  interval = 60,
  onRefresh,
  isLoading = false,
  size = 'md',
}) => {
  const [timeLeft, setTimeLeft] = useState(interval);
  const [isPaused, setIsPaused] = useState(false);

  // Size configurations
  const sizes = {
    sm: { width: 28, strokeWidth: 2, fontSize: '0.6rem' },
    md: { width: 36, strokeWidth: 3, fontSize: '0.7rem' },
    lg: { width: 48, strokeWidth: 4, fontSize: '0.85rem' },
  };

  const config = sizes[size] || sizes.md;
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (timeLeft / interval) * circumference;

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (onRefresh && !isLoading) {
      onRefresh();
    }
    setTimeLeft(interval);
  }, [onRefresh, interval, isLoading]);

  // Countdown timer
  useEffect(() => {
    if (isPaused || isLoading) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleRefresh();
          return interval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, isLoading, interval, handleRefresh]);

  // Reset timer when interval changes
  useEffect(() => {
    setTimeLeft(interval);
  }, [interval]);

  // Manual refresh
  const handleManualRefresh = () => {
    handleRefresh();
  };

  // Toggle pause
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="refresh-timer" title={isPaused ? 'Paused - Click to resume' : `Refreshing in ${timeLeft}s`}>
      <button
        className="refresh-timer__button"
        onClick={handleManualRefresh}
        disabled={isLoading}
        style={{
          width: config.width + 8,
          height: config.width + 8,
        }}
      >
        {isLoading ? (
          <div className="refresh-timer__spinner" style={{ width: config.width * 0.5, height: config.width * 0.5 }} />
        ) : (
          <svg
            width={config.width}
            height={config.width}
            viewBox={`0 0 ${config.width} ${config.width}`}
            className="refresh-timer__svg"
          >
            {/* Background circle */}
            <circle
              cx={config.width / 2}
              cy={config.width / 2}
              r={radius}
              fill="none"
              stroke="var(--iot-border, #e2e8f0)"
              strokeWidth={config.strokeWidth}
            />
            {/* Progress circle */}
            <circle
              cx={config.width / 2}
              cy={config.width / 2}
              r={radius}
              fill="none"
              stroke={isPaused ? 'var(--iot-warning, #f59e0b)' : 'var(--iot-primary, #0d6efd)'}
              strokeWidth={config.strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              transform={`rotate(-90 ${config.width / 2} ${config.width / 2})`}
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
            {/* Time text */}
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={config.fontSize}
              fontWeight="600"
              fill="var(--iot-dark, #1e293b)"
            >
              {timeLeft}
            </text>
          </svg>
        )}
      </button>

      {/* Pause button */}
      <button
        className="refresh-timer__pause"
        onClick={togglePause}
        title={isPaused ? 'Resume auto-refresh' : 'Pause auto-refresh'}
      >
        <i className={`bi bi-${isPaused ? 'play-fill' : 'pause-fill'}`}></i>
      </button>
    </div>
  );
};

export default RefreshTimer;
