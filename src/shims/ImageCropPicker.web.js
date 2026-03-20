/**
 * Web shim for react-native-image-crop-picker
 * Uses browser's native <input type="file"> to pick images
 * Returns the same shape as the native library: { path, mime, width, height }
 */

const createFileInput = (accept, multiple = false) => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    input.style.display = 'none';

    input.onchange = (event) => {
      const files = Array.from(event.target.files);
      if (files.length === 0) {
        reject({ code: 'E_PICKER_CANCELLED', message: 'User cancelled' });
        return;
      }

      const processFile = (file) => {
        return new Promise((resolveFile) => {
          const url = URL.createObjectURL(file);

          if (file.type.startsWith('image/')) {
            const img = new window.Image();
            img.onload = () => {
              resolveFile({
                path: url,
                sourceURL: url,
                mime: file.type,
                width: img.naturalWidth,
                height: img.naturalHeight,
                size: file.size,
                filename: file.name,
                _file: file, // Raw File object for FormData upload
              });
            };
            img.src = url;
          } else {
            // Video or other
            resolveFile({
              path: url,
              sourceURL: url,
              mime: file.type,
              size: file.size,
              filename: file.name,
              duration: null,
              _file: file,
            });
          }
        });
      };

      if (multiple) {
        Promise.all(files.map(processFile)).then(resolve);
      } else {
        processFile(files[0]).then(resolve);
      }

      // Cleanup
      document.body.removeChild(input);
    };

    input.oncancel = () => {
      reject({ code: 'E_PICKER_CANCELLED', message: 'User cancelled' });
      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click();
  });
};

const ImageCropPicker = {
  openPicker: (options = {}) => {
    const accept = options.mediaType === 'video'
      ? 'video/*'
      : options.mediaType === 'any'
        ? 'image/*,video/*'
        : 'image/*';
    return createFileInput(accept, options.multiple);
  },

  openCamera: (_options = {}) => {
    // Web fallback: open file picker (camera access requires getUserMedia which is complex)
    return createFileInput('image/*;capture=camera', false);
  },

  openCropper: (options = {}) => {
    // No-op on web — return the image as-is
    return Promise.resolve({
      path: options.path,
      sourceURL: options.path,
      mime: 'image/jpeg',
      width: options.width || 0,
      height: options.height || 0,
    });
  },

  clean: () => Promise.resolve(),
  cleanSingle: () => Promise.resolve(),
};

export default ImageCropPicker;
