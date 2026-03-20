/**
 * Web shim for react-native-share
 * Uses the Web Share API or falls back to clipboard copy.
 */

const Share = {
  open: async (options = {}) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({
        title: options.title,
        text: options.message,
        url: options.url,
      });
      return { success: true };
    }

    // Fallback: copy to clipboard
    const text = [options.message, options.url].filter(Boolean).join(' ');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
    return { success: true };
  },

  shareSingle: async (options = {}) => Share.open(options),

  isPackageInstalled: async () => ({ isInstalled: false }),

  Social: {
    FACEBOOK: 'facebook',
    TWITTER: 'twitter',
    WHATSAPP: 'whatsapp',
    INSTAGRAM: 'instagram',
    EMAIL: 'email',
    SMS: 'sms',
  },
};

export default Share;
