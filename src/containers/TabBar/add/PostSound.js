// import React, {useEffect, useState} from 'react';
// import {
//   View,
//   StyleSheet,
//   ActivityIndicator,
//   TouchableOpacity,
// } from 'react-native';
// import {
//   Camera,
//   useCameraDevices,
//   CameraPosition,
// } from 'react-native-vision-camera';
// import {useSelector} from 'react-redux';
// import {
//   moderateScale,
//   screenFullHeight,
//   screenWidth,
// } from '../../../common/constants';
// import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
// import {styles} from '../../../themes';
// import Ionicons from 'react-native-vector-icons/Ionicons';

// export default PostSound = () => {
//   const colors = useSelector(state => state.theme.theme);
//   const devices = useCameraDevices();
//   const cameraFlip = devices.front;
//   const supportsFlash = devices?.hasTorch ?? false;
//   const [cemeraRotate, setCameraRotate] = useState(true);
//   const [flash, setFlash] = useState(false);
//   const [cameraPermission, setCameraPermission] = useState();

//   useEffect(() => {
//     (async () => {
//       const cameraPermissionStatus = await Camera.requestCameraPermission();
//       setCameraPermission(cameraPermissionStatus);
//     })();
//   }, []);

//   console.log('cameraFlash', devices);

//   const onPressFlip = () => setCameraRotate(!cemeraRotate);

//   const onPressFlash = () => {
//     if (supportsFlash) {
//       setFlash(!flash);
//     }
//   };

//   const onPressRecord = () => {};

//   const renderDetectorContent = () => {
//     if (cameraFlip && cameraPermission === 'authorized') {
//       return (
//         <Camera
//           style={localStyles.camera}
//           device={cemeraRotate ? devices.back : devices.front}
//           isActive={true}
//           torch={'on'}
//         />
//       );
//     }
//     return (
//       <ActivityIndicator
//         size="large"
//         color={colors.primary}
//         style={[styles.center, styles.flex]}
//       />
//     );
//   };

//   return (
//     <ZSafeAreaView>
//       {renderDetectorContent()}
//       <View style={localStyles.flipBtn}>
//         <TouchableOpacity
//           style={localStyles.btnContainer}
//           onPress={onPressFlip}>
//           <Ionicons
//             name="sync-outline"
//             size={moderateScale(24)}
//             color={colors.white}
//           />
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={localStyles.btnContainer}
//           onPress={onPressFlash}>
//           <Ionicons
//             name={flash ? 'flash-outline' : 'flash-off-outline'}
//             size={moderateScale(24)}
//             color={colors.white}
//           />
//         </TouchableOpacity>
//       </View>

//       <TouchableOpacity onPress={onPressRecord} style={localStyles.captureBtn}>
//         <Ionicons name="close" size={30} color={colors.lightRed} />
//       </TouchableOpacity>
//     </ZSafeAreaView>
//   );
// };

// const localStyles = StyleSheet.create({
//   camera: {
//     flex: 1,
//     width: screenWidth,
//     height: screenFullHeight,
//   },
//   captureBtn: {
//     position: 'absolute',
//     bottom: moderateScale(20),
//     width: moderateScale(60),
//     height: moderateScale(60),
//     borderRadius: moderateScale(30),
//     backgroundColor: '#00000099',
//     ...styles.selfCenter,
//     ...styles.center,
//   },
//   flipBtn: {
//     position: 'absolute',
//     top: moderateScale(30),
//     right: moderateScale(20),
//   },
//   btnContainer: {
//     width: moderateScale(40),
//     height: moderateScale(40),
//     borderRadius: moderateScale(20),
//     backgroundColor: '#00000099',
//     ...styles.selfCenter,
//     ...styles.center,
//     ...styles.mt20,
//   },
// });

import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';

export default function PostSound() {
  return (
    <ZSafeAreaView>
      <Text>PostSound</Text>
    </ZSafeAreaView>
  );
}

const styles = StyleSheet.create({});
