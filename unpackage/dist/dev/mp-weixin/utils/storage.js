"use strict";
const common_vendor = require("../common/vendor.js");
const STORAGE_PREFIX = "huanjuju_";
const getStorage = (key) => {
  try {
    const fullKey = STORAGE_PREFIX + key;
    const data = common_vendor.index.getStorageSync(fullKey);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (e) {
    common_vendor.index.__f__("error", "at utils/storage.js:12", "getStorage error:", e);
    return null;
  }
};
const setStorage = (key, value) => {
  try {
    const fullKey = STORAGE_PREFIX + key;
    common_vendor.index.setStorageSync(fullKey, JSON.stringify(value));
    return true;
  } catch (e) {
    common_vendor.index.__f__("error", "at utils/storage.js:23", "setStorage error:", e);
    return false;
  }
};
const removeStorage = (key) => {
  try {
    const fullKey = STORAGE_PREFIX + key;
    common_vendor.index.removeStorageSync(fullKey);
    return true;
  } catch (e) {
    common_vendor.index.__f__("error", "at utils/storage.js:34", "removeStorage error:", e);
    return false;
  }
};
exports.getStorage = getStorage;
exports.removeStorage = removeStorage;
exports.setStorage = setStorage;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/storage.js.map
