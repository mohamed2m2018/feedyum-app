/**
 * NewOrderAlarmBanner - Floating banner shown when new order alarm is active
 * 
 * Displays a pulsing red banner at the top of chef screens with:
 * - "New Order!" text
 * - "Tap to view orders" action
 * - Dismiss (stop alarm) button
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZText from '../../../../components/common/ZText';
import OrderAlarmService from '../../../../services/OrderAlarmService';
import BackgroundAlarmService from '../../../../services/BackgroundAlarmService';
import strings from '../../../../i18n/strings';
import { moderateScale } from '../../../../common/constants';
import { StackNav } from '../../../../navigation/NavigationKeys';

const NewOrderAlarmBanner = () => {
  const [isActive, setIsActive] = useState(false);
  const navigation = useNavigation();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const unsubscribe = OrderAlarmService.subscribe((active) => {
      setIsActive(active);
    });
    return unsubscribe;
  }, []);

  // Pulsing animation when alarm is active
  useEffect(() => {
    if (isActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.85,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isActive, pulseAnim]);

  if (!isActive) return null;

  const handleViewOrders = () => {
    OrderAlarmService.stopAlarm();
    BackgroundAlarmService.stopForegroundAlarm();
    navigation.navigate(StackNav.OrderManagement);
  };

  const handleDismiss = () => {
    OrderAlarmService.stopAlarm();
    BackgroundAlarmService.stopForegroundAlarm();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: pulseAnim }] },
      ]}
    >
      <TouchableOpacity
        style={styles.banner}
        onPress={handleViewOrders}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="notifications" size={moderateScale(28)} color="#FFFFFF" />
        </View>

        <View style={styles.textContainer}>
          <ZText type="B16" color="#FFFFFF">
            🔔 {strings.newOrderAlarm || 'New Order!'}
          </ZText>
          <ZText type="M12" color="rgba(255,255,255,0.9)">
            {strings.tapToViewOrders || 'Tap to view orders'}
          </ZText>
        </View>

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={moderateScale(28)} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: moderateScale(10),
    left: moderateScale(16),
    right: moderateScale(16),
    zIndex: 9999,
    elevation: 20,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E53935',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(16),
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  iconContainer: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  textContainer: {
    flex: 1,
  },
  dismissButton: {
    marginLeft: moderateScale(8),
    padding: moderateScale(4),
  },
});

export default NewOrderAlarmBanner;
