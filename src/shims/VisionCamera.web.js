/**
 * Web shim for react-native-vision-camera
 * No-op on web — camera is not used in chef portal web.
 */
import React from 'react';
import { View } from 'react-native';

export const Camera = React.forwardRef((props, ref) => <View ref={ref} {...props} />);
Camera.displayName = 'Camera';
Camera.getAvailableCameraDevices = () => [];
Camera.getCameraPermissionStatus = () => Promise.resolve('granted');
Camera.requestCameraPermission = () => Promise.resolve('granted');
Camera.getMicrophonePermissionStatus = () => Promise.resolve('granted');
Camera.requestMicrophonePermission = () => Promise.resolve('granted');

export const useCameraDevice = () => null;
export const useCameraDevices = () => ({});
export const useFrameProcessor = () => {};
export const useCameraFormat = () => null;

export default Camera;
