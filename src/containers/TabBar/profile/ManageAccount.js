// Library import
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {memo} from 'react';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import {styles} from '../../../themes';
import {moderateScale} from '../../../common/constants';
import ZText from '../../../components/common/ZText';
import {SectionList} from 'react-native';
import strings from '../../../i18n/strings';
import {manageAccData} from '../../../api/constant';

export default function ManageAccount() {
  const colors = useSelector(state => state.theme.theme);

  const RenderInfoItem = memo(({item}) => {
    return (
      <TouchableOpacity style={localStyles.infoContainer}>
        <View style={styles.rowCenter}>
          <Ionicons
            name={item.icon}
            size={moderateScale(26)}
            color={item?.trash ? colors.redColor : colors.textColor}
            style={styles.mr10}
          />
          <ZText
            type="s18"
            color={item?.trash ? colors.redColor : colors.textColor}>
            {item.type}
          </ZText>
        </View>

        {!item?.trash && (
          <View style={[styles.flexRow, styles.flex]}>
            <ZText
              type="s18"
              numberOfLines={1}
              align="right"
              style={[styles.flex, styles.mh10]}>
              {item.value}
            </ZText>
            <Ionicons
              name={
                !!item?.rightIcon ? item?.rightIcon : 'chevron-forward-outline'
              }
              size={moderateScale(20)}
              color={colors.textColor}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  });

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.editProfile} />

      <SectionList
        sections={manageAccData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item}) => <RenderInfoItem item={item} key={item.id} />}
        renderSectionHeader={({section: {title}}) => (
          <View style={localStyles.titleContainer}>
            <ZText type={'b20'}>{title}</ZText>
          </View>
        )}
        stickyHeaderHiddenOnScroll={true}
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ph20}
      />
    </ZSafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  userImageContainer: {
    ...styles.flexRow,
    ...styles.justifyCenter,
    ...styles.pb30,
  },
  userImage: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  infoContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mb25,
  },
  titleContainer: {
    ...styles.pt20,
    ...styles.mb30,
  },
});
