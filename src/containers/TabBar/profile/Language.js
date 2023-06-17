// Library import
import {SectionList, StyleSheet, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {useDispatch, useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import strings from '../../../i18n/strings';
import ZText from '../../../components/common/ZText';
import {styles} from '../../../themes';
import {moderateScale} from '../../../common/constants';
import {changeLanguageAction} from '../../../redux/action/profileAction';
import {languageData} from '../../../api/constant';

const Language = ({navigation}) => {
  const colors = useSelector(state => state.theme.theme);
  const language = useSelector(state => state.profile);
  const dispatch = useDispatch();
  const [isSelected, setIsSelected] = React.useState(language);

  const RenderHeader = ({title}) => {
    return (
      <ZText type="b20" style={styles.mt20}>
        {title}
      </ZText>
    );
  };

  const onPressItem = item => {
    dispatch(changeLanguageAction(item));
    setIsSelected(item);
  };

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
