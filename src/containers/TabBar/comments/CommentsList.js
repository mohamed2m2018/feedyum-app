import React, {useRef, useState, useEffect} from 'react';
import {
  FlatList,
  View,
  UIManager,
  findNodeHandle,
  Keyboard,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Comment from './Comment';
import commentListStyling from './commentListStyling';

const CommentsList = props => {
  const [itemHeights, setItemHeights] = useState([]);
  const [initialScrollIndex, setInitialScrollIndex] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const flatlistRef = useRef();
  const itemRefs = useRef([]);

  const displayLikeCondition = commentId => {
    // ...existing code...
  };

  const scrollToComment = commentIndex => {
    if (commentIndex !== -1) {
      setInitialScrollIndex(commentIndex);
    }
  };

  const {data, topMargin, inputRef} = props;

  useEffect(() => {
    const calculateHeights = () => {
      const heights = [];
      itemRefs.current.forEach((itemRef, index) => {
        const itemNode = findNodeHandle(itemRef.current);

        if (Platform.OS === 'android') {
          UIManager.measureInWindow(itemNode, (x, y, width, height) => {
            heights[index] = height;
          });
        } else {
          UIManager.measure(itemNode, (x, y, width, height) => {
            heights[index] = height;
          });
        }
      });
      setItemHeights(heights);
    };

    const timeoutId = setTimeout(calculateHeights, 0);

    return () => clearTimeout(timeoutId);
  }, [data]);

  useEffect(() => {
    const scrollToOffset = () => {
      let offset = 0;
      for (let i = 0; i < initialScrollIndex; i++) {
        offset += itemHeights[i] || 100;
      }

      flatlistRef.current?.scrollToOffset({offset, animated: true});
    };

    const timeoutId = setTimeout(scrollToOffset, 0);

    return () => clearTimeout(timeoutId);
  }, [initialScrollIndex, itemHeights, keyboardHeight]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      event => {
        setKeyboardHeight(event.endCoordinates.height);
      },
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const renderItem = ({item, index}) => {
    itemRefs.current[index] = itemRefs.current[index] || React.createRef();
    return (
      <Comment
        commentData={item}
        inputRef={inputRef}
        onAddComment={props.onAddComment}
        index={index}
        flatlistRef={flatlistRef}
        displayLike={displayLikeCondition(item.id)}
        scrollToComment={scrollToComment}
        ref={itemRefs.current[index]}
      />
    );
  };

  const handleLoadMore = () => {
    if (props.hasNextPage) {
      props.fetchNextPage();
    }
  };

  return (
    <View style={commentListStyling.mainContainer}>
      <FlatList
        style={{marginTop: topMargin}}
        extraData={props}
        onEndReachedThreshold={0.9}
        onEndReached={handleLoadMore}
        ListFooterComponent={
          props.isFetchingNextPage && <ActivityIndicator size="large" />
        }
        ref={flatlistRef}
        onScrollToIndexFailed={() => {
          flatlistRef.current.scrollToIndex({
            index: initialScrollIndex,
            animated: true,
          });
        }}
        data={data || []}
        keyExtractor={item => item?.id}
        renderItem={renderItem}
      />
    </View>
  );
};

export default CommentsList;
