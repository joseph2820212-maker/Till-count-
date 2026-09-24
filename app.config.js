/**
 * TillCount build variants on top of app.json. app.json holds the production identity;
 * APP_VARIANT=review gives the review APK its own identity (installs beside, never over,
 * a production install). The build guard runs on every config read and refuses unsafe
 * combinations (e.g. the billing bypass in a production build).
 */
const { VARIANTS, variantFromEnv, assertBuild } = require('./scripts/buildGuard');

module.exports = ({ config }) => {
  const { variant } = variantFromEnv(process.env);
  const spec = VARIANTS[variant];
  const resolved = spec
    ? {
      ...config,
      name: spec.name,
      android: { ...config.android, package: spec.id },
      ios: { ...config.ios, bundleIdentifier: spec.id },
      extra: { ...config.extra, appVariant: variant },
    }
    : config;
  assertBuild(process.env, resolved);
  return resolved;
};
