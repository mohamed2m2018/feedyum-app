import React from 'react';
import {StyleSheet, View, Image} from 'react-native';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

import ZText from '../../../../components/common/ZText';
import {moderateScale} from '../../../../common/constants';
import {commonColor} from '../../../../themes/colors';

const RANK_COLORS = {
  1: '#FFD300',
  2: '#C0C0C0',
  3: '#CD7F32',
};

const LeaderboardRow = ({participant, rank, isCurrentUser, style}) => {
  const colors = useSelector(state => state.theme.theme);

  const rankColor = RANK_COLORS[rank] || commonColor.grayScale5;

  const renderAvatar = () => {
    if (participant?.user?.photo) {
      return (
        <Image
          source={{uri: participant.user.photo}}
          style={localStyles.avatar}
        />
      );
    }
    return (
      <Ionicons
        name="person-circle"
        size={moderateScale(40)}
        color={commonColor.grayScale4}
      />
    );
  };

  return (
    <View
      style={[
        localStyles.row,
        isCurrentUser && {
          backgroundColor: commonColor.primaryTransparent,
          borderLeftWidth: moderateScale(3),
          borderLeftColor: commonColor.primary,
        },
        style,
      ]}>
      <View style={localStyles.rankContainer}>
        <ZText type="b16" color={rankColor}>
          {rank}
        </ZText>
      </View>

      {renderAvatar()}

      <ZText
        type="s14"
        numberOfLines={1}
        style={localStyles.name}>
        {participant?.user?.name || 'Anonymous'}
      </ZText>

      <ZText type="b14" color={commonColor.primary}>
        {participant?.completedOrders || 0}
      </ZText>
    </View>
  );
};

const localStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
  },
  rankContainer: {
    width: moderateScale(32),
    alignItems: 'center',
  },
  avatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    marginLeft: moderateScale(8),
  },
  name: {
    flex: 1,
    marginLeft: moderateScale(10),
    marginRight: moderateScale(8),
  },
});

export default LeaderboardRow;
