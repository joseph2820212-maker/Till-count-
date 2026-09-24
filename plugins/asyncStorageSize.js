/**
 * asyncStorageSize — raises the Android AsyncStorage database cap from the 6 MB
 * default to 128 MB (gradle property AsyncStorage_db_size_in_MB). A shop with a few
 * thousand products and a long count history needs more than 6 MB; values themselves
 * stay chunked well below the 2 MB CursorWindow limit (src/storage/kv.ts).
 */
const { withGradleProperties } = require('expo/config-plugins');

const KEY = 'AsyncStorage_db_size_in_MB';
const SIZE_MB = '128';

module.exports = function withAsyncStorageSize(config) {
  return withGradleProperties(config, cfg => {
    cfg.modResults = cfg.modResults.filter(item => !(item.type === 'property' && item.key === KEY));
    cfg.modResults.push({ type: 'property', key: KEY, value: SIZE_MB });
    return cfg;
  });
};
