import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  UIManager,
  findNodeHandle,
  Keyboard,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { FlatList, NativeViewGestureHandler } from 'react-native-gesture-handler';
import Comment from './Comment';
import { useSelector } from 'react-redux';

const CommentsList = props => {
  const colors = useSelector(state => state.theme.theme);
  const flatlistRef = useRef();
  // Removed complex height calculation logic in favor of scrollToIndex

  const scrollToComment = commentIndex => {
    if (commentIndex !== -1 && flatlistRef.current) {
      flatlistRef.current.scrollToIndex({
        index: commentIndex,
        animated: true,
        viewPosition: 0.5 // Center the item
      });
    }
  };

  const { data, topMargin, inputRef } = props;

  const renderItem = ({ item, index }) => {
    console.log('Rendering Comment Item:', index, item?._id);
    return (
      <Comment
        commentData={item}
        SheetRef={props.SheetRef}
        postId={props.postId}
        inputRef={inputRef}
        onAddComment={props.onAddComment}
        index={index}
        flatlistRef={flatlistRef}
        scrollToComment={scrollToComment}
        theme={colors}
      />
    );
  };

  const handleLoadMore = () => {
    if (props.hasNextPage) {
      props.fetchNextPage();
    }
  };

  return (
    <NativeViewGestureHandler disallowInterruption={true}>
      <View style={commentListStyling.mainContainer}>
        <FlatList
          ref={flatlistRef}
          style={{ marginTop: topMargin }}
          extraData={props}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.9}
          onEndReached={handleLoadMore}
          ListFooterComponent={
            props.isFetchingNextPage && (
              <ActivityIndicator size="large" color={colors.primary} />
            )
          }
          onScrollToIndexFailed={info => {
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              flatlistRef.current?.scrollToIndex({ index: info.index, animated: true });
            });
          }}
          data={data || []}
          keyExtractor={item => item?._id}
          renderItem={renderItem}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
        />
      </View>
    </NativeViewGestureHandler>
  );
};

const commentListStyling = StyleSheet.create({
  icon: { marginTop: 14, marginLeft: 5, marginRight: 7 },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default CommentsList;
