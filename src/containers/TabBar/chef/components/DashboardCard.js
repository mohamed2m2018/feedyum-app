// Library imports
import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local imports
import ZText from '../../../../components/common/ZText';
import {moderateScale} from '../../../../common/constants';
import {styles} from '../../../../themes';

const DashboardCard = ({
  title,
  value,
  icon,
  color,
  onPress,
  containerStyle,
  isLoading = false,
}) => {
  const colors = useSelector(state => state.theme.theme);

  return (
    <TouchableOpacity
      style={[
        localStyles.container,
        {
          backgroundColor: colors.inputBg,
          borderColor: color || colors.primary,
        },
        containerStyle,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}>
      <View style={localStyles.header}>
        {icon && (
          <View style={[localStyles.iconContainer, {backgroundColor: color || colors.primary}]}>
            <Ionicons
              name={icon}
              size={moderateScale(24)}
              color={colors.white}
            />
          </View>
        )}
        <View style={localStyles.valueContainer}>
          <ZText
            type="B24"
            color={color || colors.primary}
            style={localStyles.value}>
            {isLoading ? '...' : value}
          </ZText>
        </View>
      </View>
      <ZText
        type="M14"
        color={colors.grayScale7}
        style={localStyles.title}
        numberOfLines={2}>
        {title}
      </ZText>
    </TouchableOpacity>
  );
};

const localStyles = StyleSheet.create({
  container: {
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    minHeight: moderateScale(100),
    justifyContent: 'space-between',
    ...styles.shadowStyle,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  iconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  valueContainer: {
    flex: 1,
  },
  value: {
    textAlign: 'left',
  },
  title: {
    textAlign: 'left',
    lineHeight: moderateScale(18),
  },
});

export default DashboardCard;