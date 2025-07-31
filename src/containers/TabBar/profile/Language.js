/* eslint-disable react/no-unstable-nested-components */
// Library import
import {
  I18nManager,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RNRestart from 'react-native-restart';
// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import strings from '../../../i18n/strings';
import ZText from '../../../components/common/ZText';
import {styles} from '../../../themes';
import {moderateScale} from '../../../common/constants';
import {changeLanguageAction} from '../../../redux/action/profileAction';
import {useStorage} from '../../../utils/useStorage';

const Language = ({navigation}) => {
  const colors = useSelector(state => state.theme.theme);
  const [language, setLanguage] = useStorage('language');

  const dispatch = useDispatch();
  const [lang, setlang] = useState('en');
  const [isSelected, setIsSelected] = React.useState(
    lang === 'en' ? strings.english : 'العربية',
  );

  const RenderHeader = ({title}) => {
    return (
      <ZText type="b20" style={styles.mt20}>
        {title}
      </ZText>
    );
  };

  const languageData = [
    {
      title: strings.language,
      data: [
        {
          lnName: strings.english,
        },
        {
          lnName: 'العربية',
        },
      ],
    },
  ];

  const onPressItem = async item => {
    dispatch(changeLanguageAction(item));
    setIsSelected(item);
    if (item === strings.english) {
      setLanguage('en');
      await I18nManager.allowRTL(false);
      await I18nManager.forceRTL(false);
      RNRestart.restart();
    } else {
      setLanguage('ar');
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(true);
      RNRestart.restart();
    }
  };

  useEffect(() => {
    const getLanguage = async () => {
      const l = language;
      setlang(l);
      setIsSelected(l === 'en' || !l ? strings.english : 'العربية');
    };
    getLanguage();
  }, [language]);

  const RenderData = ({item}) => {
    return (
      <TouchableOpacity
        onPress={() => onPressItem(item.lnName)}
        style={localStyles.settingsContainer}>
        <ZText type="s18">{item.lnName}</ZText>
        <View style={localStyles.rightContainer}>
          <Ionicons
            name={
              isSelected === item.lnName
                ? 'radio-button-on'
                : 'radio-button-off'
            }
            size={moderateScale(24)}
            color={colors.primary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.language} />
      <View style={styles.ph20}>
        <SectionList
          sections={languageData}
          keyExtractor={(item, index) => item + index}
          renderItem={({item}) => <RenderData item={item} />}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({section: {title}}) => (
            <RenderHeader title={title} />
          )}
          bounces={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ZSafeAreaView>
  );
};

export default Language;

const localStyles = StyleSheet.create({
  settingsContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mt20,
  },
});
