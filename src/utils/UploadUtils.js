import {Video, Image} from 'react-native-compressor';
import {createThumbnail} from 'react-native-create-thumbnail';
import {Platform} from 'react-native';
import RNFS from 'react-native-fs';
import request from '../api/request';

export const convertVideoToMP4 = async inputPath => {
  try {
    const result = await Video.compress(
      inputPath,
      {
        compressionMethod: 'auto',
        getCancellationId: cancellationId =>
          console.log('Compression ID:', cancellationId),
        progressDivider: 10,
        downloadProgress: progress => {
          console.log('Compression progress: ', progress);
        },
      },
      progress => {
        console.log('Compression Progress: ', progress);
      },
    );

    return result;
  } catch (error) {
    console.error('Video compression error:', error);
    throw error;
  }
};

export const generateThumbnail = async inputPath => {
  try {
    const uri = await createThumbnail({
      url: inputPath,
      timeStamp: 10000,
    });

    return uri;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return null;
  }
};

export const compressImage = async (inputPath, quality = 0.8) => {
  try {
    const result = await Image.compress(inputPath, {
      compressionMethod: 'auto',
      quality: quality,
      maxWidth: 1024,
      maxHeight: 1024,
    });

    return result;
  } catch (error) {
    console.error('Image compression error:', error);
    // Return original path if compression fails
    return inputPath;
  }
};

export const validateImageFile = filePath => {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const extension = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));
  return validExtensions.includes(extension);
};

export const validateAudioFile = filePath => {
  console.log('validateAudioFile called with:', filePath);
  const validExtensions = ['.wav', '.mp3', '.m4a', '.aac'];
  const extension = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));
  console.log('Extracted extension:', extension);
  console.log('Valid extensions:', validExtensions);
  const isValid = validExtensions.includes(extension);
  console.log('Extension validation result:', isValid);
  return isValid;
};

export const getFileSize = async filePath => {
  try {
    const stats = await RNFS.stat(filePath);
    return stats.size;
  } catch (error) {
    console.error('Error getting file size:', error);
    return 0;
  }
};

export const formatFileSize = bytes => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const convertWavToMp3 = async inputPath => {
  try {
    console.log('Preparing WAV file for upload (backend will convert):', inputPath);
    
    // Just format the path properly for upload - backend will handle conversion
    let formattedPath = inputPath;
    
    if (Platform.OS === 'android' && !inputPath.startsWith('file://') && !inputPath.startsWith('http')) {
      formattedPath = `file://${inputPath}`;
    } else if (Platform.OS === 'ios' && !inputPath.startsWith('file://') && !inputPath.startsWith('http')) {
      formattedPath = `file://${inputPath}`;
    }
    
    console.log('WAV file prepared for upload:', {
      originalPath: inputPath,
      formattedPath: formattedPath
    });
    
    return formattedPath;
    
  } catch (error) {
    console.error('WAV preparation error:', error);
    return inputPath;
  }
};

export const uploadAudioToS3 = async (audioPath, onProgress, duration) => {
  try {
    console.log('Starting audio upload to S3:', audioPath);

    // Convert WAV to MP3 for better compatibility
    const convertedAudioPath = await convertWavToMp3(audioPath);

    // Validate audio file
    console.log('Validating audio file:', convertedAudioPath);
    const isValid = validateAudioFile(convertedAudioPath);
    console.log('Audio file validation result:', isValid);
    
    if (!isValid) {
      console.error('Audio file validation failed for:', convertedAudioPath);
      throw new Error('Invalid audio file format');
    }
    
    console.log('Audio file validation passed');

    // Get file stats from original path (without file:// prefix)
    const originalPath = audioPath.startsWith('file://')
      ? audioPath.replace('file://', '')
      : audioPath;
    const fileStats = await RNFS.stat(originalPath);
    const fileSize = fileStats.size;

    console.log('Audio file size:', formatFileSize(fileSize));

    // Create FormData for upload
    console.log('Creating FormData for upload...');
    const formData = new FormData();
    console.log('FormData created successfully');

    // Add the audio file (M4A format)
    const isM4A = convertedAudioPath.includes('.m4a');
    const isMP3 = convertedAudioPath.includes('.mp3');

    let audioType = 'audio/wav';
    let fileName = `voice_message_${Date.now()}.wav`;

    if (isM4A) {
      audioType = 'audio/m4a';
      fileName = `voice_message_${Date.now()}.m4a`;
    } else if (isMP3) {
      audioType = 'audio/mp3';
      fileName = `voice_message_${Date.now()}.mp3`;
    }

    formData.append('audio', {
      uri: convertedAudioPath,
      type: audioType,
      name: fileName,
    });

    // Add metadata (duration will be passed from VoiceRecorder)
    formData.append('duration', duration ? duration.toString() : '10');

    // Upload to backend using the correct endpoint
    console.log('Making POST request to /messages/upload-audio...');
    console.log('FormData contents:', {
      audioUri: convertedAudioPath,
      audioType: audioType,
      fileName: fileName,
      duration: duration ? duration.toString() : '10'
    });
    
    const response = await request.post('/messages/upload-audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 second timeout
      onUploadProgress: progressEvent => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        console.log('Upload progress:', progress + '%');
        if (onProgress) {
          onProgress(progress);
        }
      },
    });

    console.log('Audio upload successful:', response.data);

    if (response.data && response.data.success && response.data.url) {
      return {
        success: true,
        url: response.data.url,
        duration: response.data.duration || 0,
        size: fileSize,
        localPath: convertedAudioPath,
      };
    } else {
      throw new Error(response.data?.message || 'Invalid response from server');
    }
  } catch (error) {
    console.error('Audio upload error:', error);

    // Return more specific error information
    if (error.response) {
      const errorMessage =
        error.response.data?.message ||
        error.response.statusText ||
        'Upload failed';
      throw new Error(`Upload failed: ${errorMessage}`);
    } else if (error.request) {
      throw new Error('Network error: Unable to reach server');
    } else {
      throw new Error(`Upload error: ${error.message}`);
    }
  }
};

export const compressAudio = async inputPath => {
  try {
    // For now, we'll return the original path since react-native-compressor
    // doesn't have built-in audio compression
    // In a production app, you might want to use a different library
    // or handle compression on the server side

    const fileStats = await RNFS.stat(inputPath);
    console.log('Audio file info:', {
      path: inputPath,
      size: formatFileSize(fileStats.size),
      modified: new Date(fileStats.mtime).toISOString(),
    });

    return inputPath;
  } catch (error) {
    console.error('Audio compression error:', error);
    return inputPath;
  }
};

export const convertWavForCompatibility = async inputPath => {
  try {
    console.log(
      'Converting WAV file for react-native-video compatibility:',
      inputPath,
    );

    // Ensure proper file path formatting first
    let formattedPath = inputPath;

    // Handle different path formats
    if (Platform.OS === 'android') {
      // Android needs file:// prefix for local files
      if (!inputPath.startsWith('file://') && !inputPath.startsWith('http')) {
        formattedPath = `file://${inputPath}`;
      }
    } else if (Platform.OS === 'ios') {
      // iOS can handle both with and without file:// but let's be consistent
      if (!inputPath.startsWith('file://') && !inputPath.startsWith('http')) {
        formattedPath = `file://${inputPath}`;
      }
    }

    // Verify the file exists and get stats
    const originalPath = inputPath.startsWith('file://')
      ? inputPath.replace('file://', '')
      : inputPath;
    const fileStats = await RNFS.stat(originalPath);

    console.log('Original WAV file info:', {
      originalPath: inputPath,
      formattedPath: formattedPath,
      size: formatFileSize(fileStats.size),
      modified: new Date(fileStats.mtime).toISOString(),
    });

    // Check if we need to create a more compatible version
    // For react-native-video, we want to ensure the WAV file has proper headers
    const outputPath = `${RNFS.CachesDirectoryPath}/compatible_voice_${Date.now()}.wav`;

    try {
      // Copy the file to a new location with a clean name
      await RNFS.copyFile(originalPath, outputPath);

      // Return the new path with proper formatting
      const finalPath =
        Platform.OS === 'android' ? `file://${outputPath}` : outputPath;

      console.log('Created compatible WAV file:', {
        outputPath: finalPath,
        exists: await RNFS.exists(outputPath),
      });

      return finalPath;
    } catch (copyError) {
      console.warn(
        'Failed to create compatible copy, using original:',
        copyError,
      );
      return formattedPath;
    }
  } catch (error) {
    console.error('WAV conversion error:', error);
    // Return original path with basic formatting if conversion fails
    let fallbackPath = inputPath;
    if (!inputPath.startsWith('file://') && !inputPath.startsWith('http')) {
      fallbackPath = `file://${inputPath}`;
    }
    return fallbackPath;
  }
};

export const uploadProgress = {
  listeners: new Map(),

  addListener: (id, callback) => {
    uploadProgress.listeners.set(id, callback);
  },

  removeListener: id => {
    uploadProgress.listeners.delete(id);
  },

  updateProgress: (id, progress) => {
    const callback = uploadProgress.listeners.get(id);
    if (callback) {
      callback(progress);
    }
  },
};
