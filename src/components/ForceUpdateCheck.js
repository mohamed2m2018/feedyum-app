import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { useSelector } from 'react-redux';
import * as Application from 'expo-application';
import ZText from './common/ZText';
import strings from '../i18n/strings';
import { API_BASE_URL, moderateScale } from '../common/constants';
import Ionicons from 'react-native-vector-icons/Ionicons';

/**
 * ForceUpdateCheck
 * 
 * Checks backend /api/config for minVersionCode.
 * If the app's native build version is less than the minimum,
 * shows a blocking modal that forces the user to update.
 * 
 * When minVersionCode is null/undefined on the backend, no enforcement.
 */
export default function ForceUpdateCheck({ children }) {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [storeUrl, setStoreUrl] = useState(null);
  const colors = useSelector(state => state.theme.theme);

  useEffect(() => {
    checkVersion();
  }, []);

  const checkVersion = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/config`);
      if (!response.ok) return; // Fail silently — don't block the app

      const data = await response.json();
      
      // If minVersionCode is null/undefined, no enforcement
      if (data.minVersionCode == null) return;

      // Get the native build version code
      const currentVersionCode = parseInt(
        Application.nativeBuildVersion || '0',
        10
      );

      if (currentVersionCode < data.minVersionCode) {
        setNeedsUpdate(true);
        const url = Platform.OS === 'ios'
          ? data.storeUrls?.ios
          : data.storeUrls?.android;
        setStoreUrl(url);
      }
    } catch (error) {
      // Network error — fail silently, don't block the app
      console.log('ForceUpdateCheck: Could not check version', error.message);
    }
  };

  const handleUpdate = () => {
    if (storeUrl) {
      Linking.openURL(storeUrl);
    }
  };

  if (needsUpdate) {
    return (
      <>
        {children}
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          statusBarTranslucent
        >
          <View style={localStyles.overlay}>
            <StatusBar backgroundColor="rgba(0,0,0,0.85)" barStyle="light-content" />
            <View style={[localStyles.container, { backgroundColor: colors.inputBg }]}>
              <View style={localStyles.iconContainer}>
                <Ionicons
                  name="cloud-download-outline"
                  size={moderateScale(56)}
                  color={colors.primary}
                />
              </View>

              <ZText type="b22" color={colors.textColor} style={localStyles.title}>
                {strings.updateRequired}
              </ZText>

              <ZText
                type="r14"
                color={colors.grayScale7}
                align="center"
                style={localStyles.message}
              >
                {strings.updateRequiredMessage}
              </ZText>

              <View
                style={[localStyles.button, { backgroundColor: colors.primary }]}
                onTouchEnd={handleUpdate}
              >
                <Ionicons
                  name="arrow-up-circle-outline"
                  size={moderateScale(20)}
                  color="#FFFFFF"
                  style={{ marginRight: moderateScale(8) }}
                />
                <ZText type="b16" color="#FFFFFF">
                  {strings.updateNow}
                </ZText>
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  return children;
}

const localStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(24),
  },
  container: {
    width: '100%',
    borderRadius: moderateScale(20),
    padding: moderateScale(32),
    alignItems: 'center',
  },
  iconContainer: {
    width: moderateScale(96),
    height: moderateScale(96),
    borderRadius: moderateScale(48),
    backgroundColor: 'rgba(255,107,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(24),
  },
  title: {
    marginBottom: moderateScale(12),
    textAlign: 'center',
  },
  message: {
    marginBottom: moderateScale(28),
    lineHeight: moderateScale(22),
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
  },
});
