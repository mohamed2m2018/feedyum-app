// Library Imports
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import {useSelector} from 'react-redux';

// Local Imports
import ZSafeAreaView from '../../components/common/ZSafeAreaView';
import ZHeader from '../../components/common/ZHeader';
import {styles} from '../../themes';
import strings from '../../i18n/strings';
import ZText from '../../components/common/ZText';
import {getHeight, moderateScale} from '../../common/constants';
import {StackNav} from '../../navigation/NavigationKeys';
import ZButton from '../../components/common/ZButton';
import {Female_Svg, Male_Svg} from '../../assets/svgs';

const Gender = ({navigation}) => {
  const colors = useSelector(state => state.theme.theme);
  const [isSelected, setIsSelected] = useState(false);

  const onPressContinue = () => {
    navigation.navigate(StackNav.Birthday);
  };
  const onPressSkip = () => {
    navigation.navigate(StackNav.Birthday);
  };

  const onPressMale = itm => setIsSelected(itm);

  const onPressFemale = itm => setIsSelected(itm);

  const ListGenderCategory = ({icon, title, onPressItm}) => {
    const handleDarkMode = () => {
      if (title === isSelected) {
        return colors.primary;
      } else {
        return colors.dark ? colors.borderColor : colors.grayScale4;
      }
    };
    return (
      <TouchableOpacity
        onPress={onPressItm}
        style={[
          localStyles.genderContainer,
          {
            backgroundColor: handleDarkMode(),
          },
        ]}>
        {icon}
        <ZText type={'b22'} style={styles.mv10} color={colors.white}>
          {title}
        </ZText>
      </TouchableOpacity>
    );
  };

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.tellUsYourSelf} />
      <ZText type={'m18'} style={[styles.mv10, styles.mh20]}>
        {strings.tellUsYourSelfDesc}
      </ZText>
      <View style={localStyles.root}>
        <ListGenderCategory
          icon={<Male_Svg width={moderateScale(80)} height={getHeight(80)} />}
          title={strings.male}
          onPressItm={() => onPressMale(strings.male)}
        />
        <ListGenderCategory
          icon={<Female_Svg width={moderateScale(80)} height={getHeight(80)} />}
          title={strings.female}
          onPressItm={() => onPressFemale(strings.female)}
        />
      </View>
      <View style={localStyles.btnContainer}>
        <ZButton
          title={strings.skip}
          textType={'b18'}
          color={!!colors.dark ? colors.white : colors.primary}
          containerStyle={[localStyles.skipBtnContainer]}
          bgColor={colors.dark3}
          onPress={onPressSkip}
        />
        <ZButton
          title={strings.continue}
          textType={'b18'}
          color={colors.white}
          containerStyle={[localStyles.skipBtnContainer]}
          onPress={onPressContinue}
        />
      </View>
    </ZSafeAreaView>
  );
};

export default Gender;

const localStyles = StyleSheet.create({
  genderContainer: {
    height: moderateScale(180),
    width: moderateScale(180),
    ...styles.center,
    ...styles.selfCenter,
    borderRadius: moderateScale(90),
  },
  root: {
    ...styles.flex,
    ...styles.justifyEvenly,
  },
  btnContainer: {
    ...styles.p20,
    ...styles.rowSpaceAround,
  },
  chipsContainer: {
    ...styles.ph20,
    ...styles.pv10,
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(25),
    ...styles.mt15,
    ...styles.mh5,
  },
  skipBtnContainer: {
    width: '45%',
  },
});
