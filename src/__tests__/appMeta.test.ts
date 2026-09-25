import { APP_NAME, APP_VERSION, SUPPORT_EMAIL, EMAILS, COMPANY_DETAILS } from '../appMeta';

describe('appMeta', () => {
  it('APP_VERSION matches app.json and package.json', () => {
    const app = require('../../app.json');
    const pkg = require('../../package.json');
    expect(app.expo.version).toBe(APP_VERSION);
    expect(pkg.version).toBe(APP_VERSION);
  });
  it('carries the TillCount identity with the Till-family publisher details', () => {
    const app = require('../../app.json');
    expect(APP_NAME).toBe('TillCount');
    expect(app.expo.name).toBe('TillCount');
    expect(app.expo.android.package).toBe('com.tillcount.app');
    expect(app.expo.ios.bundleIdentifier).toBe('com.tillcount.app');
    expect(SUPPORT_EMAIL).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/i);
    for (const e of Object.values(EMAILS)) expect(e).toMatch(/@/);
    expect(COMPANY_DETAILS.registrationNumber).toMatch(/^\d+$/);
  });
});
