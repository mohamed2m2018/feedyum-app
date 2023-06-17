// Library import
import {FlatList, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useCallback, useState} from 'react';
import ActionSheet from 'react-native-actions-sheet';
import {useSelector} from 'react-redux';

// Local import
import {moderateScale} from '../../common/constants';
import {styles} from '../../themes';
import ZText from '../common/ZText';
import {userDetail} from '../../api/constant';
import UserDetailComponent from '../UserDetailComponent';
import strings from '../../i18n/strings';

export default function WeeklyRanking(props) {
  const colors = useSelector(state => state.theme.theme);
  const {SheetRef} = props;
  const [isSelect, setIsSelect] = useState(0);

  const categoryData = [
    {
      id: 0,
      title: strings.weeklyRankings,
      onPress: () => setIsSelect(0),
    },
    {
      id: 1,
      title: strings.risingStar,
      onPress: () => setIsSelect(1),
    },
  ];

  const HeaderCategory = ({item}) => {
    return (
      <TouchableOpacity
        onPress={item.onPress}
        style={[
          localStyles.tabItemStyle,
          {
            borderBottomColor:
              isSelect === item.id ? colors.primary : colors.bColor,
          },
        ]}>
        <ZText
          type={'b18'}
          color={isSelect === item.id ? colors.primary : colors.iconColor}>
          {item.title}
        </ZText>
      </TouchableOpacity>
    );
  };

  const renderItem = useCallback(
    ({item, index}) => {
      return (
        <View style={localStyles.renderItemStyle}>
          <ZText type={'b16'} style={styles.mh20} color={colors.textColor}>
            {index + 1}
          </ZText>
          <UserDetailComponent
            userName={item?.name}
            userImage={item?.imgUrl}
            isFollowed={item?.isFollow}
            key={index}
          />
        </View>
      );
    },
    [userDetail],
  );

  return (
    <ActionSheet
      ref={SheetRef}
      containerStyle={[
        localStyles.actionSheetContainer,
        {backgroundColor: colors.backgroundColor},
      ]}>
      <View style={localStyles.mainContainer}>
        {categoryData.map((item, index) => (
          <HeaderCategory item={item} key={index} />
        ))}
      </View>

      <FlatList
        data={userDetail.slice(0, 5)}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.pb40}
        showsVerticalScrollIndicator={false}
        bounces={false}
      />
    </ActionSheet>
  );
}

const localStyles = StyleSheet.create({
  actionSheetContainer: {
    ...styles.p20,
  },
  mainContainer: {
    ...styles.flexRow,
    width: '100%',
  },
  tabItemStyle: {
    borderBottomWidth: moderateScale(2),
    width: '50%',
    ...styles.itemsCenter,
    ...styles.pv15,
  },
  renderItemStyle: {
    ...styles.flexRow,
    ...styles.itemsCenter,
  },
});
