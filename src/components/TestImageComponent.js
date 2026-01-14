import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { showInfoToast } from '../utils/toast';
import FastImage from 'react-native-fast-image';
import strings from '../i18n/strings';

const TestImageComponent = () => {
  const [imageLoadState, setImageLoadState] = useState('loading');
  const [fastImageLoadState, setFastImageLoadState] = useState('loading');

  const unsplashUrl = 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=600&fit=crop';

  const handleImageLoad = (component) => {
    if (component === 'standard') {
      setImageLoadState('loaded');
    } else {
      setFastImageLoadState('loaded');
    }
  };

  const handleImageError = (component, error) => {
    if (component === 'standard') {
      setImageLoadState('error');
    } else {
      setFastImageLoadState('error');
    }
  };

  const testDirectAccess = () => {
    showInfoToast(
      strings.imageUrlTest,
      `URL: ${unsplashUrl}\n\n${strings.tryOpeningUrl}`
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{strings.testImageTitle}</Text>

      {/* Standard React Native Image */}
      <View style={styles.imageContainer}>
        <Text style={styles.label}>{strings.standardImageComp}</Text>
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: unsplashUrl }}
            style={styles.image}
            onLoad={() => handleImageLoad('standard')}
            onError={(error) => handleImageError('standard', error)}
            resizeMode="cover"
          />
          {imageLoadState === 'loading' && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.statusText}>{strings.loading}</Text>
            </View>
          )}
          {imageLoadState === 'error' && (
            <View style={styles.errorOverlay}>
              <Text style={styles.statusText}>{strings.failedToLoad}</Text>
            </View>
          )}
        </View>
        <Text style={styles.status}>{strings.formatString(strings.statusLabel, imageLoadState)}</Text>
      </View>

      {/* FastImage Component */}
      <View style={styles.imageContainer}>
        <Text style={styles.label}>{strings.fastImageComp}</Text>
        <View style={styles.imageWrapper}>
          <FastImage
            source={{
              uri: unsplashUrl,
              priority: FastImage.priority.normal,
            }}
            style={styles.image}
            onLoad={() => handleImageLoad('fastImage')}
            onError={(error) => handleImageError('fastImage', error)}
            resizeMode={FastImage.resizeMode.cover}
          />
          {fastImageLoadState === 'loading' && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.statusText}>{strings.loading}</Text>
            </View>
          )}
          {fastImageLoadState === 'error' && (
            <View style={styles.errorOverlay}>
              <Text style={styles.statusText}>{strings.failedToLoad}</Text>
            </View>
          )}
        </View>

        <Text style={styles.status}>{strings.formatString(strings.statusLabel, fastImageLoadState)}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={testDirectAccess}>
        <Text style={styles.buttonText}>{strings.testUrlBrowser}</Text>
      </TouchableOpacity>

      <Text style={styles.debugInfo}>
        {strings.debugInfo}{'\n'}
        {strings.formatString(strings.debugInfoBody, unsplashUrl, Platform.OS, strings.checkConsole)}
      </Text>
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  imageWrapper: {
    position: 'relative',
    height: 200,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    marginTop: 5,
    fontSize: 12,
    color: '#333',
  },
  status: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  debugInfo: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    lineHeight: 18,
  },
});

export default TestImageComponent; 