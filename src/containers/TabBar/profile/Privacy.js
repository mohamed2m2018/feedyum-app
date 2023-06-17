// Library import
import {
  SectionList,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';

// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZText from '../../../components/common/ZText';
import {styles} from '../../../themes';
import {moderateScale} from '../../../common/constants';
import ZHeader from '../../../components/common/ZHeader';
import strings from '../../../i18n/strings';

export default Privacy = ({navigation}) => {
  const colors = useSelector(state => state.theme.theme);
  const [isEnabled, setIsEnabled] = React.useState({
    privateAccount: false,
    quickUploads: true,
  });

  const SecurityData = [
    {
      title: strings.discoverability,
      data: [
        {
          title: strings.privateAccount,
          icon: 'eye-outline',
          rightIcon: true,
          value: isEnabled.privateAccount,
          toggleSwitch: () =>
            setIsEnabled({
              ...isEnabled,
              privateAccount: isEnabled.privateAccount ? false : true,
            }),
        },
        {
          title: strings.suggestAccOthers,
          icon: 'checkmark-circle-outline',
        },
        {
          title: strings.sync,
          icon: 'swap-vertical-outline',
        },
        {
          title: strings.loationServices,
          icon: 'location-outline',
        },
      ],
    },
    {
      title: strings.personalization,
      data: [
        {
          title: strings.adsPersonalization,
          icon: 'radio-outline',
        },
        {
          title: strings.quickUploads,
          icon: 'cloud-upload-outline',
          rightIcon: true,
          value: isEnabled.quickUploads,
          toggleSwitch: () =>
            setIsEnabled({
              ...isEnabled,
              quickUploads: isEnabled.quickUploads ? false : true,
            }),
        },
        {
          title: strings.downloadData,
          icon: 'download-outline',
        },
      ],
    },
    {
      title: strings.safety,
      data: [
        {
          title: strings.downloads,
          icon: 'download-outline',
        },
        {
          title: strings.comments,
          icon: 'chatbubble-ellipses-outline',
        },
        {
          title: strings.mentionsTags,
          icon: 'person-outline',
        },
        {
          title: strings.followingList,
          icon: 'people-outline',
        },
        {
          title: strings.duet,
          icon: 'download-outline',
        },
        {
          title: strings.likedVideo,
          icon: 'heart-outline',
        },
      ],
    },
  ];

  const RenderData = data => {
    return (
      <TouchableOpacity style={localStyles.settingsContainer}>
        <View style={styles.rowCenter}>
          <Ionicons
            name={data.item.icon}
            size={moderateScale(28)}
            color={colors.textColor}
            style={styles.mr10}
          />
          <ZText type="s18">{data.item.title}</ZText>
        </View>
        <View style={localStyles.rightContainer}>
          {!!data?.item?.rightIcon ? (
            <Switch
              trackColor={{
                false: colors.grayScale3,
                true: colors.primary,
              }}
              thumbColor={colors.white}
              onValueChange={data?.item?.toggleSwitch}
              value={data?.item?.value}
            />
          ) : (
            <Ionicons
              name="chevron-forward-outline"
              size={moderateScale(20)}
              color={colors.dark ? colors.white : colors.grayScale9}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.privacy} />
      <SectionList
        sections={SecurityData}
        keyExtractor={(item, index) => item + index}
        renderItem={({item}) => <RenderData item={item} />}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({section: {title}}) => (
          <ZText type="b20" style={[styles.mb25, styles.mt10]}>
            {title}
          </ZText>
        )}
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={localStyles.sectionListContainer}
      />
    </ZSafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  settingsContainer: {
    ...styles.flexRow,
    ...styles.itemsCenter,
    ...styles.mb15,
  },
  rightContainer: {
    ...styles.flex,
    ...styles.rowEnd,
  },
  sectionListContainer: {
    ...styles.ph20,
    ...styles.pb30,
  },
});
