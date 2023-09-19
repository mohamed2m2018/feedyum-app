import React from 'react';
import {ActivityIndicator, View} from 'react-native';
import LiveComponent from '../../../../components/LiveComponent';
import ZText from '../../../../components/common/ZText';
import strings from '../../../../i18n/strings';
import {FlatList} from 'react-native';
import {useSelector} from 'react-redux';

export default function SearchVideo({
  stories = [],
  isFetchingNextPage,
  ...props
}) {
  const colors = useSelector(state => state.theme.theme);
  return (
    <View>
      <FlatList
        data={stories}
        ListFooterComponent={
          <View style={{height: 100}}>
            {isFetchingNextPage && (
              <ActivityIndicator color={colors.primary} size={'small'} />
            )}
          </View>
        }
        ListEmptyComponent={
          !props.isFetching && (
            <ZText style={{textAlign: 'center', marginTop: 250}} type={'B20'}>
              {strings.noDishesYet}
            </ZText>
          )
        }
        renderItem={({item}) => {
          return (
            <LiveComponent
              id={item._id}
              data={item?.title}
              reelUrl={
                item?.avatarUri?.replace(
                  'https://foodtokforever.s3.amazonaws.com',
                  'https://d1wfcrbbkg3bzd.cloudfront.net',
                ) ||
                item?.poster?.replace(
                  'https://foodtokforever.s3.amazonaws.com',
                  'https://d1wfcrbbkg3bzd.cloudfront.net',
                )
              }
              userName={item?.title}
              userId={item?.author}
            />
          );
        }}
        {...props}
        keyExtractor={item => item?._id}
        numColumns={2}
        legacyImplementation
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
