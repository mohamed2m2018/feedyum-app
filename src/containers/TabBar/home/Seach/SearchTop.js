// Library import
import {FlatList, StyleSheet, View} from 'react-native';
import React from 'react';

// Local import
import UserDetailComponent from '../../../../components/UserDetailComponent';
import ReelComponent from '../../../../components/ReelComponent';
import {searchMusicData, userDetail, videoData} from '../../../../api/constant';
import SoundComponent from '../../../../components/SoundComponent';
import ZText from '../../../../components/common/ZText';
import {styles} from '../../../../themes';
import {getVideoExtension} from '../../../../common/constants';

export default function SearchTop() {
  const UserItemTitle = ({title}) => {
    return (
      <ZText type="b20" numberOfLines={1} style={localStyles.headerTitle}>
        {title}
      </ZText>
    );
  };

  return (
    <View>
      <FlatList
        data={userDetail.slice(0, 3)}
        renderItem={({item, index}) => (
          <UserDetailComponent
            userName={item.name}
            userImage={item.imgUrl}
            userDescription={item.description}
            isFollowed={item.isFollow}
            key={index}
          />
        )}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={() => <UserItemTitle title={'User'} />}
        showsVerticalScrollIndicator={false}
      />

      <FlatList
        data={videoData.slice(0, 3)}
        renderItem={({item, index}) => (
          <ReelComponent
            key={item?._id}
            data={item?.viewsCount}
            isPlay={!item?.avatarUri}
            reelUrl={item?.avatarUri}
            style={styles.mt10}
          />
        )}
        numColumns={3}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={() => <UserItemTitle title={'Video'} />}
      />
      <FlatList
        data={searchMusicData.slice(0, 3)}
        renderItem={({item, index}) => (
          <SoundComponent
            key={index}
            title={item?.title}
            imgUrl={item?.imgUrl}
            artist={item?.artist}
            time={item?.time}
            totalViews={item?.viewsCount}
          />
        )}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={() => <UserItemTitle title={'Sound'} />}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  headerTitle: {
    ...styles.ml5,
    ...styles.mt20,
  },
});
