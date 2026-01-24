/**
 * ReelActionBar Component
 * Vertical action icons: report, like, comment, views, share
 */

import React from 'react';
import { View } from 'react-native';
import millify from 'millify';
import { VideoItem } from '../../containers/TabBar/home/VideoItem';
import { useSelector } from 'react-redux';
import { moderateScale } from '../../common/constants';
import { actionBarStyles as styles } from './styles';

/**
 * Props for ReelActionBar
 * @typedef {Object} ReelActionBarProps
 * @property {Object} item - The reel item data
 * @property {number} commentsCount - Number of comments
 * @property {Object} likeRef - Reference for like callbacks
 * @property {number} index - Item index
 * @property {Function} onPressReport - Report handler
 * @property {Function} onPressLike - Like handler
 * @property {Function} onPressComment - Comment handler
 * @property {Function} onPressShare - Share handler
 */

const ReelActionBar = React.memo(({
    item,
    commentsCount,
    likeRef,
    index,
    onPressReport,
    onPressLike,
    onPressComment,
    onPressShare,
}) => {
    const colors = useSelector((state) => state.theme.theme);

    return (
        <View style={styles.container}>
            {/* Report */}
            <VideoItem
                icon="flag"
                size={moderateScale(24)}
                onPress={onPressReport}
            />

            {/* Like */}
            <VideoItem
                icon="heart"
                data={millify(item?.likesNo || 0)}
                initialIsLiked={item?.currentUserLiked}
                color={colors.primary}
                onPress={onPressLike}
                index={index}
                likeRef={likeRef}
                id={item?._id}
            />

            {/* Comment */}
            <VideoItem
                icon="chatbubble-ellipses"
                data={millify(commentsCount || 0)}
                onPress={onPressComment}
            />

            {/* Views */}
            <VideoItem
                icon="eye"
                data={millify(item?.views || 0)}
            />

            {/* Share */}
            <VideoItem
                icon="share"
                onPress={onPressShare}
            />
        </View>
    );
});

ReelActionBar.displayName = 'ReelActionBar';

export default ReelActionBar;
