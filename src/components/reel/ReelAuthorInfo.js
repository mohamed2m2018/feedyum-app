/**
 * ReelAuthorInfo Component
 * Displays author avatar, name, rating pill, and follow button
 */

import React from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import ZText from '../common/ZText';
import FollowButton from '../common/FollowButton';
import { authorInfoStyles as styles } from './styles';
import images from '../../assets/images';

/**
 * Rating Pill Sub-Component
 */
const RatingPill = React.memo(({ rating }) => (
    <View style={styles.ratingPill}>
        <ZText style={styles.ratingValue}>{rating.toFixed(1)}</ZText>
        <ZText style={styles.ratingStar}>⭐</ZText>
    </View>
));

RatingPill.displayName = 'RatingPill';

/**
 * Props for ReelAuthorInfo
 * @typedef {Object} ReelAuthorInfoProps
 * @property {Object} author - Author data (avatar, fullName, type, averageDishRating, currentUserFollowed)
 * @property {string} channelName - Channel/display name
 * @property {string} currentUserId - Current logged-in user ID
 * @property {Function} onPressProfile - Handler for profile press
 */

const ReelAuthorInfo = React.memo(({
    author,
    channelName,
    currentUserId,
    onPressProfile,
}) => {
    const colors = useSelector((state) => state.theme.theme);

    // Determine avatar source
    const avatarSource = author?.avatar
        ? { uri: author.avatar }
        : colors.dark
            ? images.userDark
            : images.userLight;

    const displayName = channelName || author?.fullName;
    const rating = author?.averageDishRating || 0;
    const isOwnPost = author?._id === currentUserId;

    return (
        <View style={styles.innerContainer}>
            {/* Avatar */}
            <TouchableOpacity onPress={onPressProfile}>
                <View style={styles.avatarRing}>
                    <Image
                        resizeMode="cover"
                        source={avatarSource}
                        style={styles.avatarImage}
                    />
                </View>
            </TouchableOpacity>

            {/* User Info */}
            <TouchableOpacity style={styles.userInfoContainer} onPress={onPressProfile}>
                <View style={styles.userNameRow}>
                    <ZText style={styles.userName} numberOfLines={1}>
                        {displayName}
                    </ZText>

                    {/* Rating Pill */}
                    {rating > 0 && <RatingPill rating={rating} />}
                </View>

                {/* Follow Button - Hidden for own posts */}
                {author?._id && !isOwnPost && (
                    <FollowButton
                        userId={author._id}
                        isFollowed={author.currentUserFollowed}
                        compact={true}
                        size="small"
                        style={styles.followButton}
                    />
                )}
            </TouchableOpacity>
        </View>
    );
});

ReelAuthorInfo.displayName = 'ReelAuthorInfo';

export default ReelAuthorInfo;
