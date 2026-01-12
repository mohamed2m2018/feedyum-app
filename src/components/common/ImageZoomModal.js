import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  PanResponder,
  Animated,
  Text,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { moderateScale } from '../../common/constants';
import strings from '../../i18n/strings';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ImageZoomModal = ({ visible, imageUri, onClose }) => {
  const colors = useSelector(state => state.theme.theme);
  const [scale] = useState(new Animated.Value(1));
  const [translateX] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(0));
  const [modalOpacity] = useState(new Animated.Value(0));
  const [lastScale, setLastScale] = useState(1);
  const [lastTranslateX, setLastTranslateX] = useState(0);
  const [lastTranslateY, setLastTranslateY] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const initialDistanceRef = useRef(null);
  const isZoomedRef = useRef(false);
  const lastPanRef = useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    if (visible) {
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, modalOpacity]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        scale.setOffset(lastScale);
        scale.setValue(1);
        translateX.setOffset(lastTranslateX);
        translateX.setValue(0);
        translateY.setOffset(lastTranslateY);
        translateY.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length === 2) {
          // Pinch to zoom with focal point
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          const distance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) +
            Math.pow(touch2.pageY - touch1.pageY, 2),
          );

          if (!initialDistanceRef.current) {
            initialDistanceRef.current = distance;
            // Store the focal point (center between two touches)
            lastPanRef.current = {
              x: (touch1.pageX + touch2.pageX) / 2,
              y: (touch1.pageY + touch2.pageY) / 2,
            };
          }

          const scaleValue = distance / initialDistanceRef.current;
          const newScale = Math.max(0.8, Math.min(scaleValue, 4));
          scale.setValue(newScale);

          // Update zoom state
          const totalScale = lastScale * newScale;
          isZoomedRef.current = totalScale > 1.1;
        } else {
          // Pan when single touch (and zoomed in)
          if (lastScale > 1.1) {
            // More generous boundaries for better panning experience
            const maxMoveX = screenWidth * lastScale;
            const maxMoveY = screenHeight * lastScale;

            const newX = Math.max(-maxMoveX, Math.min(maxMoveX, gestureState.dx));
            const newY = Math.max(-maxMoveY, Math.min(maxMoveY, gestureState.dy));

            translateX.setValue(newX);
            translateY.setValue(newY);
          }
        }
      },
      onPanResponderRelease: () => {
        initialDistanceRef.current = null;
        lastPanRef.current = { x: 0, y: 0 };

        scale.flattenOffset();
        translateX.flattenOffset();
        translateY.flattenOffset();

        // Update the last values
        const scaleListener = scale.addListener(({ value }) => {
          setLastScale(value);
          isZoomedRef.current = value > 1.1;
        });
        const translateXListener = translateX.addListener(({ value }) => setLastTranslateX(value));
        const translateYListener = translateY.addListener(({ value }) => setLastTranslateY(value));

        // Remove listeners after a short delay to avoid memory leaks
        setTimeout(() => {
          scale.removeListener(scaleListener);
          translateX.removeListener(translateXListener);
          translateY.removeListener(translateYListener);
        }, 100);

        // Reset if zoomed out too much
        if (lastScale < 1) {
          Animated.parallel([
            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: true,
            }),
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
            }),
          ]).start();
          setLastScale(1);
          setLastTranslateX(0);
          setLastTranslateY(0);
          isZoomedRef.current = false;
        }
      },
    }),
  ).current;

  const handleClose = () => {
    // Reset zoom and position
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();

    setLastScale(1);
    setLastTranslateX(0);
    setLastTranslateY(0);
    isZoomedRef.current = false;
    onClose();
  };

  const handleDoubleTap = (evt) => {
    const targetScale = lastScale > 1.5 ? 1 : 2.5;

    let targetX = 0;
    let targetY = 0;

    if (targetScale > 1 && evt?.nativeEvent) {
      // Zoom to the tapped point
      const touchX = evt.nativeEvent.pageX;
      const touchY = evt.nativeEvent.pageY;

      // Calculate offset to center the touch point
      const offsetX = (screenWidth / 2 - touchX) * (targetScale - 1) / targetScale;
      const offsetY = (screenHeight / 2 - touchY) * (targetScale - 1) / targetScale;

      targetX = offsetX;
      targetY = offsetY;
    }

    Animated.parallel([
      Animated.spring(scale, {
        toValue: targetScale,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(translateX, {
        toValue: targetX,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(translateY, {
        toValue: targetY,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();

    setLastScale(targetScale);
    setLastTranslateX(targetX);
    setLastTranslateY(targetY);
    isZoomedRef.current = targetScale > 1.1;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}>
      <StatusBar backgroundColor="black" barStyle="light-content" />
      <Animated.View style={[styles.modalContainer, { opacity: modalOpacity }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.8}>
          <Ionicons
            name="close"
            size={moderateScale(30)}
            color="white"
          />
        </TouchableOpacity>

        <View style={styles.imageContainer} {...panResponder.panHandlers}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={(evt) => handleDoubleTap(evt)}
            style={styles.imageTouchable}>
            <Animated.View
              style={[
                styles.animatedImageContainer,
                {
                  transform: [
                    { scale },
                    { translateX },
                    { translateY },
                  ],
                },
              ]}>
              <FastImage
                source={{ uri: imageUri }}
                style={styles.image}
                resizeMode={FastImage.resizeMode.contain}
                onLoadStart={() => setImageLoading(true)}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
              />
              {imageLoading && (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingSpinner} />
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>
        </View>

        <View style={styles.instructionsContainer}>
          <View style={styles.instructionItem}>
            <Ionicons name="finger-print" size={moderateScale(16)} color="rgba(255,255,255,0.7)" />
            <Text style={styles.instructionText}>{strings.pinchToZoom}</Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="hand-left" size={moderateScale(16)} color="rgba(255,255,255,0.7)" />
            <Text style={styles.instructionText}>{strings.doubleTapToZoom}</Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="move" size={moderateScale(16)} color="rgba(255,255,255,0.7)" />
            <Text style={styles.instructionText}>{strings.dragToPan}</Text>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  imageContainer: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageTouchable: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedImageContainer: {
    width: screenWidth,
    height: screenHeight * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 10,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginLeft: 5,
  },
});

export default ImageZoomModal;