/**
 * Web entry — used ONLY for the screenshot harness (Metro resolves index.web.js for the
 * web platform; Android bundles index.js and never include this file or the harness).
 * RTL must be decided before any app module reads I18nManager at load time.
 */
import { I18nManager } from 'react-native';
import { registerRootComponent } from 'expo';

const lang = new URLSearchParams(window.location.search).get('lang') || 'en';
if (lang === 'ar') {
  I18nManager.isRTL = true;
  document.documentElement.setAttribute('dir', 'rtl');
}
registerRootComponent(require('./tools/screenshots/Harness').default);
