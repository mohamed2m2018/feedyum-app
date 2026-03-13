import { StyleSheet, View, FlatList, Animated, TouchableOpacity, Linking, Platform } from 'react-native';
import React, { useRef, useEffect } from 'react';
import ActionSheet from 'react-native-actions-sheet';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZText from '../common/ZText';
import strings from '../../i18n/strings';
import { moderateScale } from '../../common/constants';

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const formatTime12h = (timeStr) => {
  if (!timeStr) return '--:--';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const getTodayHours = (operatingHours) => {
  if (!operatingHours || operatingHours.length === 0) return null;
  const todayKey = DAY_KEYS[new Date().getDay()];
  return operatingHours.find(h => h.day === todayKey) || null;
};

export default function Locations({ SheetRef, selectedGov, onClose, onBranchSelect, selectedBranchId }) {
  const colors = useSelector(state => state.theme.theme);

  const itemAnims = useRef(
    (selectedGov || []).map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (selectedGov && selectedGov.length > 0) {
      itemAnims.forEach(anim => anim.setValue(0));
      Animated.stagger(
        100,
        itemAnims.slice(0, selectedGov.length).map(anim =>
          Animated.spring(anim, {
            toValue: 1,
            tension: 65,
            friction: 9,
            useNativeDriver: true,
          })
        )
      ).start();
    }
  }, [selectedGov]);

  const openMaps = (lat, lng, label) => {
    if (!lat || !lng) return;
    const encodedLabel = encodeURIComponent(label || '');
    const url = Platform.select({
      ios: `maps:0,0?q=${encodedLabel}@${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${encodedLabel})`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    });
  };

  const renderItem = ({ item, index }) => {
    const animValue = itemAnims[index] || new Animated.Value(1);
    const todaySchedule = getTodayHours(item?.operatingHours);
    const isSelected = selectedBranchId && item?._id === selectedBranchId;
    const canSelect = !!onBranchSelect;

    const cardContent = (
      <Animated.View
        style={[
          localStyles.branchCard,
          {
            backgroundColor: colors.inputBg || colors.grayScale2,
            borderColor: isSelected ? colors.primary : (colors.bColor || colors.grayScale3 + '30'),
            borderWidth: isSelected ? 1.5 : 1,
            opacity: animValue,
            transform: [{
              translateY: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          },
        ]}
      >
        {/* Location dot */}
        <View style={[localStyles.locationDot, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="location" size={moderateScale(20)} color={colors.primary} />
        </View>

        {/* Address + today's hours */}
        <View style={localStyles.textContainer}>
          <ZText type="b16" color={colors.textColor} numberOfLines={2}>
            {item?.description}
          </ZText>

          {/* Today's working hours */}
          {todaySchedule ? (
            <View style={localStyles.hoursRow}>
              <Ionicons name="time-outline" size={moderateScale(12)} color={todaySchedule.isOpen ? (colors.success || '#4CAF50') : '#FF5252'} />
              <ZText
                type="M11"
                color={todaySchedule.isOpen ? (colors.success || '#4CAF50') : '#FF5252'}
                style={{ marginLeft: moderateScale(4) }}
              >
                {todaySchedule.isOpen
                  ? `${formatTime12h(todaySchedule.openTime)} - ${formatTime12h(todaySchedule.closeTime)}`
                  : (strings.closedNow || strings.closed)
                }
              </ZText>
            </View>
          ) : (
            <View style={localStyles.hoursRow}>
              <Ionicons name="time-outline" size={moderateScale(12)} color={colors.grayScale6} />
              <ZText type="M11" color={colors.grayScale6} style={{ marginLeft: moderateScale(4) }}>
                {strings.openAllDay || 'Open'}
              </ZText>
            </View>
          )}

          {/* Selected indicator */}
          {isSelected && (
            <View style={[localStyles.selectedBadge, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="checkmark-circle" size={moderateScale(12)} color={colors.primary} />
              <ZText type="M10" color={colors.primary} style={{ marginLeft: moderateScale(4) }}>
                {strings.selected || 'Selected'}
              </ZText>
            </View>
          )}
        </View>

        {/* Navigate arrow */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation?.();
            openMaps(item?.lat, item?.long, item?.description);
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={[localStyles.arrowBtn, { backgroundColor: colors.primary + '12' }]}>
            <Ionicons name="navigate-outline" size={moderateScale(16)} color={colors.primary} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );

    if (canSelect) {
      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            onBranchSelect(item);
            SheetRef?.current?.hide();
          }}
        >
          {cardContent}
        </TouchableOpacity>
      );
    }

    return cardContent;
  };

  return (
    <ActionSheet
      ref={SheetRef}
      onClose={onClose}
      containerStyle={[
        localStyles.sheet,
        { backgroundColor: colors.backgroundColor },
      ]}
      indicatorStyle={{
        backgroundColor: colors.grayScale5,
        width: moderateScale(36),
        height: moderateScale(4),
        borderRadius: moderateScale(2),
      }}
      gestureEnabled
    >
      <View style={localStyles.content}>
        {/* Header */}
        <View style={localStyles.header}>
          <Ionicons name="storefront-outline" size={moderateScale(22)} color={colors.primary} />
          <ZText type="B20" color={colors.textColor} style={localStyles.headerTitle}>
            {strings.branches}
          </ZText>
          <View style={[localStyles.countBadge, { backgroundColor: colors.primary + '15' }]}>
            <ZText type="B13" color={colors.primary}>
              {selectedGov?.length || 0}
            </ZText>
          </View>
        </View>

        {/* Hint for selection */}
        {onBranchSelect && selectedGov?.length > 1 && (
          <ZText type="M12" color={colors.grayScale6} style={{ marginBottom: moderateScale(12), marginTop: moderateScale(-10) }}>
            {strings.selectBranchHint || 'Tap a branch to order from it'}
          </ZText>
        )}

        {/* List */}
        {(!selectedGov || selectedGov.length === 0) ? (
          <View style={localStyles.emptyContainer}>
            <Ionicons name="map-outline" size={moderateScale(44)} color={colors.grayScale5} />
            <ZText type="B15" align="center" color={colors.grayScale5} style={{ marginTop: moderateScale(12) }}>
              {strings.nobranchesFound}
            </ZText>
          </View>
        ) : (
          <FlatList
            data={selectedGov}
            renderItem={renderItem}
            keyExtractor={(item, index) => item?._id || index.toString()}
            contentContainerStyle={localStyles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ActionSheet>
  );
}

const localStyles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingTop: moderateScale(8),
    maxHeight: '80%',
  },
  content: {
    paddingHorizontal: moderateScale(18),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(34),
    minHeight: moderateScale(250),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(20),
    paddingBottom: moderateScale(14),
  },
  headerTitle: {
    marginLeft: moderateScale(10),
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
  },
  branchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(14),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    marginBottom: moderateScale(10),
  },
  locationDot: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  textContainer: {
    flex: 1,
    marginRight: moderateScale(8),
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(4),
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(8),
    marginTop: moderateScale(4),
  },
  arrowBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: moderateScale(10),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(40),
  },
});
