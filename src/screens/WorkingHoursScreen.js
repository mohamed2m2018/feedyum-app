import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  FlatList,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZText from '../components/common/ZText';
import ZHeader from '../components/common/ZHeader';
import ZSafeAreaView from '../components/common/ZSafeAreaView';
import ZButton from '../components/common/ZButton';
import { moderateScale } from '../common/constants';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import branchService from '../api/branchService';
import strings from '../i18n/strings';

const DAYS = [
  { key: 'sunday', label: () => strings.sunday, short: () => strings.sunShort },
  { key: 'monday', label: () => strings.monday, short: () => strings.monShort },
  { key: 'tuesday', label: () => strings.tuesday, short: () => strings.tueShort },
  { key: 'wednesday', label: () => strings.wednesday, short: () => strings.wedShort },
  { key: 'thursday', label: () => strings.thursday, short: () => strings.thuShort },
  { key: 'friday', label: () => strings.friday, short: () => strings.friShort },
  { key: 'saturday', label: () => strings.saturday, short: () => strings.satShort },
];

// Generate time slots every 30 minutes: ["00:00", "00:30", "01:00", ...]
const TIME_SLOTS = (() => {
  const slots = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
})();

const formatTime12h = (timeStr) => {
  if (!timeStr) return '--:--';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const WorkingHoursScreen = () => {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();
  const route = useRoute();
  const { branch, onSave, mode, pendingBranchData } = route.params;
  const isCreateMode = mode === 'create';

  // Initialize operating hours from branch data
  const initHours = useCallback(() => {
    const existing = branch?.operatingHours || [];
    return DAYS.map(day => {
      const found = existing.find(h => h.day === day.key);
      return {
        day: day.key,
        isOpen: found ? found.isOpen : true,
        openTime: found?.openTime || '09:00',
        closeTime: found?.closeTime || '22:00',
      };
    });
  }, [branch]);

  const [hours, setHours] = useState(initHours);
  const [saving, setSaving] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerContext, setPickerContext] = useState(null); // { dayIndex, field }

  const updateDay = (index, updates) => {
    setHours(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const openTimePicker = (dayIndex, field) => {
    setPickerContext({ dayIndex, field });
    setPickerVisible(true);
  };

  const selectTime = (timeStr) => {
    if (pickerContext) {
      updateDay(pickerContext.dayIndex, { [pickerContext.field]: timeStr });
    }
    setPickerVisible(false);
    setPickerContext(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isCreateMode && pendingBranchData) {
        // Create branch with location + hours together (atomic)
        await branchService.addBranch({
          ...pendingBranchData,
          operatingHours: hours,
        });
        showSuccessToast(strings.success, strings.branchAddedSuccess || 'Branch added successfully');
      } else {
        // Edit existing branch hours
        await branchService.editBranch(branch._id, {
          operatingHours: hours,
        });
        showSuccessToast(strings.success, strings.workingHoursSaved);
      }
      if (onSave) onSave(hours);
      navigation.goBack();
    } catch (error) {
      showErrorToast(strings.error || 'Error', error?.response?.data?.message || error.message);
    } finally {
      setSaving(false);
    }
  };

  const getCurrentPickerValue = () => {
    if (!pickerContext) return null;
    return hours[pickerContext.dayIndex]?.[pickerContext.field];
  };

  const renderTimeSlot = ({ item }) => {
    const isSelected = item === getCurrentPickerValue();
    return (
      <TouchableOpacity
        style={[
          localStyles.timeSlot,
          { borderBottomColor: colors.grayScale3 },
          isSelected && { backgroundColor: colors.primary + '15' },
        ]}
        onPress={() => selectTime(item)}
      >
        <ZText
          type={isSelected ? 'B16' : 'R16'}
          color={isSelected ? colors.primary : colors.textColor}
        >
          {formatTime12h(item)}
        </ZText>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={moderateScale(20)} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  const renderDayRow = (dayData, index) => {
    const dayInfo = DAYS[index];
    return (
      <View
        key={dayData.day}
        style={[
          localStyles.dayRow,
          { backgroundColor: colors.backgroundColor, borderBottomColor: colors.grayScale3 },
        ]}
      >
        {/* Day header with toggle */}
        <View style={localStyles.dayHeader}>
          <View style={localStyles.dayLabelRow}>
            <View style={[localStyles.dayDot, { backgroundColor: dayData.isOpen ? colors.success || '#4CAF50' : colors.grayScale5 }]} />
            <ZText type="B16" color={colors.textColor}>
              {dayInfo.label()}
            </ZText>
          </View>
          <Switch
            value={dayData.isOpen}
            onValueChange={(val) => updateDay(index, { isOpen: val })}
            trackColor={{ false: colors.grayScale4, true: (colors.success || '#4CAF50') + '60' }}
            thumbColor={dayData.isOpen ? colors.success || '#4CAF50' : colors.grayScale5}
          />
        </View>

        {/* Time pickers (only show if day is open) */}
        {dayData.isOpen && (
          <View style={localStyles.timePickerRow}>
            {/* Open time */}
            <TouchableOpacity
              style={[localStyles.timeButton, { backgroundColor: colors.inputBg || colors.grayScale2 }]}
              onPress={() => openTimePicker(index, 'openTime')}
            >
              <Ionicons name="time-outline" size={moderateScale(16)} color={colors.primary} />
              <View style={localStyles.timeTextContainer}>
                <ZText type="M10" color={colors.grayScale6}>
                  {strings.selectOpenTime}
                </ZText>
                <ZText type="B14" color={colors.textColor}>
                  {formatTime12h(dayData.openTime)}
                </ZText>
              </View>
            </TouchableOpacity>

            <Ionicons name="arrow-forward" size={moderateScale(16)} color={colors.grayScale5} style={{ marginHorizontal: moderateScale(8) }} />

            {/* Close time */}
            <TouchableOpacity
              style={[localStyles.timeButton, { backgroundColor: colors.inputBg || colors.grayScale2 }]}
              onPress={() => openTimePicker(index, 'closeTime')}
            >
              <Ionicons name="time-outline" size={moderateScale(16)} color={colors.alertColor || '#FF5252'} />
              <View style={localStyles.timeTextContainer}>
                <ZText type="M10" color={colors.grayScale6}>
                  {strings.selectCloseTime}
                </ZText>
                <ZText type="B14" color={colors.textColor}>
                  {formatTime12h(dayData.closeTime)}
                </ZText>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {!dayData.isOpen && (
          <View style={localStyles.closedBadge}>
            <ZText type="M12" color={colors.grayScale6}>
              {strings.closed}
            </ZText>
          </View>
        )}
      </View>
    );
  };

  return (
    <ZSafeAreaView>
      <ZHeader title={isCreateMode ? strings.setWorkingHours : strings.workingHours} showBack />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.backgroundColor }}
        contentContainerStyle={localStyles.scrollContent}
      >
        {/* Branch name */}
        <View style={[localStyles.branchInfoCard, { backgroundColor: colors.inputBg || colors.grayScale2 }]}>
          <Ionicons name="storefront-outline" size={moderateScale(20)} color={colors.primary} />
          <ZText type="B16" color={colors.textColor} style={{ marginLeft: moderateScale(8), flex: 1 }}>
            {branch?.branchName || pendingBranchData?.branchName || branch?.addressDetails?.formattedAddress || ''}
          </ZText>
        </View>

        {/* Days list */}
        <View style={[localStyles.daysContainer, { borderColor: colors.grayScale3 }]}>
          {hours.map((dayData, index) => renderDayRow(dayData, index))}
        </View>
      </ScrollView>

      {/* Save button */}
      <View style={[localStyles.footer, { backgroundColor: colors.backgroundColor, borderTopColor: colors.grayScale3 }]}>
        <ZButton
          title={saving ? (strings.saving || 'Saving...') : strings.saveWorkingHours}
          onPress={handleSave}
          disabled={saving}
          containerStyle={localStyles.saveButton}
        />
      </View>

      {/* Time picker modal — pure JS, no native dependency */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableOpacity
          style={localStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        >
          <View style={[localStyles.modalContainer, { backgroundColor: colors.backgroundColor }]}>
            {/* Header */}
            <View style={[localStyles.modalHeader, { borderBottomColor: colors.grayScale3 }]}>
              <ZText type="B18" color={colors.textColor}>
                {pickerContext?.field === 'openTime' ? strings.selectOpenTime : strings.selectCloseTime}
              </ZText>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close" size={moderateScale(24)} color={colors.grayScale6} />
              </TouchableOpacity>
            </View>

            {/* Time slots list */}
            <FlatList
              data={TIME_SLOTS}
              keyExtractor={(item) => item}
              renderItem={renderTimeSlot}
              style={{ maxHeight: moderateScale(400) }}
              initialScrollIndex={Math.max(0, TIME_SLOTS.indexOf(getCurrentPickerValue()))}
              getItemLayout={(data, index) => ({
                length: moderateScale(50),
                offset: moderateScale(50) * index,
                index,
              })}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </ZSafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  scrollContent: {
    padding: moderateScale(16),
    paddingBottom: moderateScale(100),
  },
  branchInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(14),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(16),
  },
  daysContainer: {
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    borderWidth: 1,
  },
  dayRow: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    marginRight: moderateScale(10),
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(10),
    paddingLeft: moderateScale(18),
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(10),
  },
  timeTextContainer: {
    marginLeft: moderateScale(8),
  },
  closedBadge: {
    marginTop: moderateScale(6),
    paddingLeft: moderateScale(18),
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: moderateScale(16),
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveButton: {
    borderRadius: moderateScale(12),
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    paddingBottom: moderateScale(34),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(16),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timeSlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(20),
    height: moderateScale(50),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

export default WorkingHoursScreen;
