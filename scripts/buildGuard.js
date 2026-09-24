#!/usr/bin/env node
/**
 * TillCount build-safety guard (handoff §14 / §28). Plain Node, no dependencies, so it
 * can run before `npm install` on a build server. Pattern shared with TillLabel.
 *
 *   APP_VARIANT=production → com.tillcount.app          store build; billing bypass FORBIDDEN
 *   APP_VARIANT=review     → com.tillcount.app.review   review APK; installs beside production;
 *                                                        bypass allowed; RevenueCat keys forbidden
 *
 * Fails closed. app.config.js calls assertBuild on every Expo config read (prebuild, the
 * release JS bundle step inside Gradle, EAS); `npm run validate:build` also checks eas.json.
 */
const fs = require('fs');
const path = require('path');

const PRODUCTION_ID = 'com.tillcount.app';
const REVIEW_ID = 'com.tillcount.app.review';
const VARIANTS = {
  production: { id: PRODUCTION_ID, name: 'TillCount', bypassAllowed: false, easProfile: 'production', androidBuildType: 'app-bundle' },
  review: { id: REVIEW_ID, name: 'TillCount Review', bypassAllowed: true, easProfile: 'review', androidBuildType: 'apk' },
};

/** Unset means production — the safe default (bypass forbidden). */
function variantFromEnv(env) {
  const raw = env.APP_VARIANT;
  if (raw === undefined || raw === '') return { variant: 'production', explicit: false };
  return { variant: raw, explicit: true };
}

/** Anything other than unset, '' or '0' counts as "bypass requested". */
function bypassRequested(env) {
  const v = env.EXPO_PUBLIC_BILLING_BYPASS;
  return v !== undefined && v !== '' && v !== '0';
}

function checkBuild(env, resolved, options = {}) {
  const errors = [];
  const { variant, explicit } = variantFromEnv(env);
  const spec = VARIANTS[variant];
  if (!spec) return [`APP_VARIANT="${variant}" is not a TillCount build variant (use "production" or "review").`];
  if (env.EXPO_PUBLIC_BILLING_BYPASS !== undefined && !['', '0', '1'].includes(env.EXPO_PUBLIC_BILLING_BYPASS)) {
    errors.push(`EXPO_PUBLIC_BILLING_BYPASS="${env.EXPO_PUBLIC_BILLING_BYPASS}" is ambiguous; use "1" (review only) or leave it unset.`);
  }
  if (bypassRequested(env) && !spec.bypassAllowed) errors.push(`EXPO_PUBLIC_BILLING_BYPASS is set for a ${variant} build. The billing bypass is allowed only with APP_VARIANT=review.`);
  if (env.EXPO_PUBLIC_APP_VARIANT !== undefined && env.EXPO_PUBLIC_APP_VARIANT !== '' && env.EXPO_PUBLIC_APP_VARIANT !== variant) {
    errors.push(`EXPO_PUBLIC_APP_VARIANT="${env.EXPO_PUBLIC_APP_VARIANT}" does not match APP_VARIANT="${variant}".`);
  }
  const rcKeys = ['EXPO_PUBLIC_RC_ANDROID_KEY', 'EXPO_PUBLIC_RC_IOS_KEY'].filter(k => env[k] && String(env[k]).trim());
  if (variant === 'review' && rcKeys.length) errors.push(`A review build must not carry RevenueCat keys (${rcKeys.join(', ')}).`);
  if (env.EAS_BUILD === 'true' || env.EAS_BUILD === '1') {
    const profile = env.EAS_BUILD_PROFILE;
    if (!explicit) errors.push('EAS build without APP_VARIANT: set it in the eas.json profile env.');
    const expected = Object.keys(VARIANTS).find(k => VARIANTS[k].easProfile === profile);
    if (!expected) errors.push(`EAS profile "${profile}" is not a TillCount profile (production or review).`);
    else if (expected !== variant) errors.push(`EAS profile "${profile}" must build APP_VARIANT=${expected}, not ${variant}.`);
    if (variant === 'production' && !options.skipSecrets) {
      const platform = env.EAS_BUILD_PLATFORM === 'ios' ? 'IOS' : 'ANDROID';
      for (const k of [`EXPO_PUBLIC_RC_${platform}_KEY`, `EXPO_PUBLIC_RC_LIFETIME_ID_${platform}`]) {
        if (!env[k] || !String(env[k]).trim()) errors.push(`Production EAS build without ${k}: Pro could not be bought.`);
      }
    }
  }
  if (resolved) {
    const androidId = resolved.android && resolved.android.package;
    const iosId = resolved.ios && resolved.ios.bundleIdentifier;
    if (androidId !== spec.id) errors.push(`Android package is "${androidId}" but a ${variant} build must be "${spec.id}".`);
    if (iosId !== spec.id) errors.push(`iOS bundle identifier is "${iosId}" but a ${variant} build must be "${spec.id}".`);
  }
  return errors;
}

function checkEasJson(eas) {
  const errors = [];
  const build = (eas && eas.build) || {};
  for (const [variant, spec] of Object.entries(VARIANTS)) {
    const p = build[spec.easProfile];
    if (!p) { errors.push(`eas.json has no "${spec.easProfile}" profile.`); continue; }
    const env = p.env || {};
    if (env.APP_VARIANT !== variant) errors.push(`eas.json "${spec.easProfile}" must set env.APP_VARIANT="${variant}".`);
    if (env.EXPO_PUBLIC_APP_VARIANT !== variant) errors.push(`eas.json "${spec.easProfile}" must set env.EXPO_PUBLIC_APP_VARIANT="${variant}".`);
    const buildType = p.android && p.android.buildType;
    if (buildType !== spec.androidBuildType) errors.push(`eas.json "${spec.easProfile}" must set android.buildType="${spec.androidBuildType}".`);
    errors.push(...checkBuild({ ...env, EAS_BUILD: 'true', EAS_BUILD_PROFILE: spec.easProfile }, null, { skipSecrets: true }).map(e => `eas.json "${spec.easProfile}": ${e}`));
  }
  for (const name of Object.keys(build)) {
    if (!Object.values(VARIANTS).some(v => v.easProfile === name)) errors.push(`eas.json profile "${name}" is not a TillCount profile.`);
  }
  return errors;
}

class BuildGuardError extends Error {
  constructor(errors) { super(`TillCount build guard refused this build:\n  - ${errors.join('\n  - ')}`); this.name = 'BuildGuardError'; this.errors = errors; }
}

function assertBuild(env, resolved) {
  const errors = checkBuild(env, resolved);
  if (errors.length) throw new BuildGuardError(errors);
}

module.exports = { PRODUCTION_ID, REVIEW_ID, VARIANTS, variantFromEnv, bypassRequested, checkBuild, checkEasJson, assertBuild, BuildGuardError };

if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  const errors = [];
  try { errors.push(...checkEasJson(JSON.parse(fs.readFileSync(path.join(root, 'eas.json'), 'utf8')))); }
  catch (e) { errors.push(`eas.json could not be read: ${e.message}`); }
  try {
    const appJson = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
    const resolved = require(path.join(root, 'app.config.js'))({ config: appJson.expo });
    const { variant } = variantFromEnv(process.env);
    console.log(`TillCount build guard: variant=${variant} android=${resolved.android.package} ios=${resolved.ios.bundleIdentifier} bypass=${bypassRequested(process.env) ? 'ON' : 'off'}`);
  } catch (e) {
    errors.push(...(e instanceof BuildGuardError ? e.errors : [e.message]));
  }
  if (errors.length) {
    console.error(`TillCount build guard FAILED:\n  - ${errors.join('\n  - ')}`);
    process.exit(1);
  }
  console.log('TillCount build guard: OK');
}
