const packageJson = require('../../package.json') as { version?: string };

const padBuildSegment = (version: string): string => {
  const parts = version.split('.');
  if (parts.length === 0) {
    return '0.0.000';
  }
  const lastIndex = parts.length - 1;
  parts[lastIndex] = parts[lastIndex].padStart(3, '0');
  return parts.join('.');
};

export const getBuildVersionLabel = (): string => {
  const version = packageJson.version?.trim() || '0.0.1';
  return `Build Version ${padBuildSegment(version)}`;
};
