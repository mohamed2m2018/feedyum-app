// Library import
import {FlatList, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {memo} from 'react';
import {useSelector} from 'react-redux';

// Local import
import ZText from '../../../../components/common/ZText';
import {styles} from '../../../../themes';
import {moderateScale} from '../../../../common/constants';
import {hashtagDetail} from '../../../../api/constant';

export default function SearchHashtag() {
  const colors = useSelector(state => state.theme.theme);

  const RenderHashtagItem = memo(({item, index}) => {
    return (
      <TouchableOpacity key={index} style={localStyles.renderItemCoontainer}>
        <View
          style={[
            localStyles.hashtagImgContainer,
            {
              backgroundColor: colors.primaryTransparent,
            },
          ]}>
          <ZText type="s28" color={colors.primary} numberOfLines={1}>
            {'#'}
          </ZText>
        </View>
        <ZText type="b18" style={[styles.mh10, styles.flex]} numberOfLines={1}>
          {item.title}
        </ZText>
        <ZText
          type="b14"
          color={colors.dark ? colors.grayScale3 : colors.grayScale7}
          style={styles.mr5}>
          {item.views}
        </ZText>
      </TouchableOpacity>
    );
  });

  return (
    <View>
      <FlatList
        data={hashtagDetail}
        renderItem={({item, index}) => (
          <RenderHashtagItem item={item} index={index} />
        )}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  renderItemCoontainer: {
    ...styles.rowCenter,
    ...styles.mt15,
  },
  hashtagImgContainer: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    ...styles.rowCenter,
  },
});
