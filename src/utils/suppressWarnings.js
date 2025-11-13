'use strict';

// Store original warning handler
const originalEmitWarning = process.emitWarning;

// Override process.emitWarning to filter AWS SDK v2 warnings
process.emitWarning = (warning, type, code, ctor) => {
  // Check if this is the AWS SDK v2 maintenance mode warning
  if (
    typeof warning === 'string' &&
    warning.includes('AWS SDK for JavaScript (v2) is in maintenance mode')
  )
    return;

  return originalEmitWarning.call(process, warning, type, code, ctor);
};

module.exports = {
  suppressAWSSDKWarning: () => {},
};
