/**
 * Web shim for react-native-background-upload
 * Uses browser's Fetch API for uploads instead of native background upload.
 */

const Upload = {
  startUpload: async (options) => {
    console.log('[Web] Background upload shim: using fetch', options.url);
    const formData = new FormData();

    if (options.path && options.field) {
      // On web, options.path should be a blob URL or File object
      const response = await fetch(options.path);
      const blob = await response.blob();
      formData.append(options.field, blob, 'upload');
    }

    // Add custom fields
    if (options.parameters) {
      Object.entries(options.parameters).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const headers = { ...(options.headers || {}) };
    delete headers['content-type']; // Let browser set multipart boundary

    const fetchResponse = await fetch(options.url, {
      method: options.method || 'POST',
      body: formData,
      headers,
    });

    return fetchResponse.ok ? 'web-upload-id' : Promise.reject(new Error('Upload failed'));
  },

  addListener: (_event, _uploadId, _callback) => ({
    remove: () => {},
  }),

  cancelUpload: async (_uploadId) => {},

  canSuspendIfBackground: () => {},
};

export default Upload;
