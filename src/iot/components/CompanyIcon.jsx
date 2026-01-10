import { getCompanyConfig } from '../config/companyTypes';

/**
 * CompanyIcon Component
 *
 * Renders the appropriate icon for a company based on its type code.
 *
 * @param {string} type - Company type code (e.g., "MFG", "AGR", "ENR")
 * @param {string} size - Icon size: "sm", "md", "lg", "xl"
 * @param {boolean} showLabel - Whether to show the label next to icon
 * @param {boolean} showColor - Whether to apply the type's color
 * @param {string} className - Additional CSS classes
 */
const CompanyIcon = ({
  type,
  size = "md",
  showLabel = false,
  showColor = true,
  className = "",
}) => {
  const config = getCompanyConfig(type);

  const sizeClasses = {
    sm: "company-icon--sm",
    md: "company-icon--md",
    lg: "company-icon--lg",
    xl: "company-icon--xl",
  };

  const style = showColor ? { color: config.color } : {};

  return (
    <span
      className={`company-icon ${sizeClasses[size]} ${className}`}
      title={config.label}
      style={style}
    >
      <i className={`bi bi-${config.icon}`}></i>
      {showLabel && <span className="company-icon__label">{config.label}</span>}
    </span>
  );
};

export default CompanyIcon;
