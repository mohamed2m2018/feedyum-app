/**
 * Web shim for react-native-localization
 * Uses browser's navigator.language instead of the native module.
 * Exports a LocalizedStrings class with the same API.
 */

class LocalizedStrings {
  constructor(props) {
    this._defaultLanguage = Object.keys(props)[0];
    this._props = props;
    this._language = this._getBestMatchingLanguage();
    this.setContent(props);
  }

  _getBestMatchingLanguage() {
    const deviceLang = this.getInterfaceLanguage();
    const shortLang = deviceLang.split('-')[0].split('_')[0];

    if (this._props[deviceLang]) return deviceLang;
    if (this._props[shortLang]) return shortLang;
    return this._defaultLanguage;
  }

  setContent(props) {
    this._props = props;
    const language = this._language;
    const defaultStrings = this._props[this._defaultLanguage] || {};
    const localizedStrings = this._props[language] || {};

    // Merge: defaults + localized overrides
    const merged = { ...defaultStrings, ...localizedStrings };
    Object.keys(merged).forEach(key => {
      this[key] = merged[key];
    });
  }

  setLanguage(language) {
    const shortLang = language.split('-')[0].split('_')[0];
    if (this._props[language]) {
      this._language = language;
    } else if (this._props[shortLang]) {
      this._language = shortLang;
    } else {
      this._language = this._defaultLanguage;
    }
    this.setContent(this._props);
  }

  getLanguage() {
    return this._language;
  }

  getInterfaceLanguage() {
    if (typeof navigator !== 'undefined') {
      return navigator.language || navigator.userLanguage || 'en';
    }
    return 'en';
  }

  formatString(str, ...values) {
    if (!str) return '';
    let result = str;
    values.forEach((value, index) => {
      result = result.replace(`{${index}}`, value);
    });
    return result;
  }

  getAvailableLanguages() {
    return Object.keys(this._props);
  }
}

export default LocalizedStrings;
