// Library import
import {FlatList, StyleSheet, View} from 'react-native';
import React, {useCallback} from 'react';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';

// Local import
import {styles} from '../../../themes';
import ReelComponent from '../../../components/ReelComponent';
import {StackNav} from '../../../navigation/NavigationKeys';
import {soundTrendingData, videoData} from '../../../api/constant';
import SoundComponent from '../../../components/SoundComponent';
import {getVideoExtension} from '../../../common/constants';

export default function SoundCategory() {
  const navigation = useNavigation();

  const onPressTrendingSound = item =>
    navigation.navigate(StackNav.TrendingSound, {item: item});

  const RenderSoundsItem = useCallback(
    ({item, index}) => {
      return (
        <View style={localStyles.soundContainer}>
          <SoundComponent
            key={index}
            title={item?.title}
            imgUrl={item?.imgUrl}
            artist={item?.artist}
            time={item?.time}
            totalViews={item?.totalViews}
            isforwadIcon={true}
            onPressSound={() => onPressTrendingSound(item)}
          />
          <FlatList
            data={videoData.slice(0, 3)}
            renderItem={({item}) => (
              <ReelComponent
                data={item?.views}
                reelUrl={item?.uri?.replace(
                  getVideoExtension(item?.uri),
                  'jpg',
                )}
              />
            )}
            numColumns={3}
            keyExtractor={(item, index) => item?._id}
            style={styles.mt25}
          />
        </View>
      );
    },
    [soundTrendingData],
  );

  return (
    <FlatList
      data={soundTrendingData}
      renderItem={({item, index}) => (
        <RenderSoundsItem item={item} index={index} />
      )}
      showsVerticalScrollIndicator={false}
      bounces={false}
      keyExtractor={(item, index) => index.toString()}
    />
  );
}

const localStyles = StyleSheet.create({
  soundContainer: {
    ...styles.mv10,
    ...styles.ph20,
  },
});
