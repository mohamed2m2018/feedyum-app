import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useQuery} from 'react-query';
import {moderateScale} from '../common/constants';
import StarRating from './StarRating';
import {reviewService} from '../api/reviewService';
import request from '../api/request';
import strings from '../i18n/strings';

const ReviewsList = ({
  chefId,
  dishId,
  type,
  style,
  showHeader = true,
  maxItems,
  onViewAll,
}) => {
  const colors = useSelector(state => state.theme.theme);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Get current user
  const { data: userData } = useQuery('user', () => request.get('/user'));
  const currentUser = userData?.data?.user;
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadReviews = async (pageNum = 1, refresh = false) => {
    if (loading && !refresh) return;

    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = {
        page: pageNum,
        limit: maxItems || 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      if (chefId) params.chefId = chefId;
      if (dishId) params.dishId = dishId;
      if (type) params.type = type;

      const response = await reviewService.getReviews(params);

      if (response.success) {
        const newReviews = response.data.reviews;

        if (refresh || pageNum === 1) {
          setReviews(newReviews);
        } else {
          setReviews(prev => [...prev, ...newReviews]);
        }

        setStats(response.data.stats);
        setHasMore(response.data.pagination.hasNextPage);
        setPage(pageNum);
      }
    } catch (error) {
Alert.alert(strings.error, strings.failedToLoadReviews);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [chefId, dishId, type]);

  const handleRefresh = () => {
    loadReviews(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadReviews(page + 1);
    }
  };

  const handleHelpful = async reviewId => {
    try {
      await reviewService.markHelpful(reviewId);
      // Refresh the specific review or reload all reviews
      handleRefresh();
    } catch (error) {
Alert.alert(strings.error, strings.failedToMarkHelpful);
    }
  };

  const handleReport = reviewId => {
    Alert.alert(strings.reportReview, strings.whyReportingReview, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Inappropriate Content',
        onPress: () => submitReport(reviewId, 'inappropriate'),
      },
      {
        text: 'Spam',
        onPress: () => submitReport(reviewId, 'spam'),
      },
      {
        text: 'Fake Review',
        onPress: () => submitReport(reviewId, 'fake'),
      },
    ]);
  };

  const handleDelete = reviewId => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(reviewId),
        },
      ]
    );
  };

  const confirmDelete = async reviewId => {
    try {
      await reviewService.deleteReview(reviewId);
      Alert.alert(strings.success, strings.reviewDeletedSuccessfully);
      // Refresh the reviews list
      handleRefresh();
    } catch (error) {
Alert.alert('Error', 'Failed to delete review. Please try again.');
    }
  };

  const submitReport = async (reviewId, reason) => {
    try {
      await reviewService.reportReview(reviewId, reason);
      Alert.alert('Thank You', 'Your report has been submitted.');
    } catch (error) {
Alert.alert('Error', 'Failed to report review');
    }
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  const renderReviewItem = ({item}) => (
    <View style={[styles.reviewItem, {borderBottomColor: colors.borderColor}]}>
      {/* User Info */}
      <View style={styles.userInfo}>
        <Image
          source={{
            uri: item.user?.profileImage || 'https://via.placeholder.com/40x40',
          }}
          style={styles.userAvatar}
        />
        <View style={styles.userDetails}>
          <Text style={[styles.userName, {color: colors.textColor}]}>
            {item.user?.fullName || item.user?.username || 'Anonymous'}
          </Text>
          <View style={styles.reviewMeta}>
            <StarRating
              rating={item.rating}
              size="small"
              showText={false}
              showCount={false}
            />
            <Text style={[styles.reviewDate, {color: colors.grayScale5}]}>
              • {formatDate(item.createdAt)}
            </Text>
            {item.isVerified && (
              <View style={styles.verifiedBadge}>
                <Icon
                  name="verified"
                  size={moderateScale(12)}
                  color="#4CAF50"
                />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Review Content */}
      {item.comment && (
        <Text style={[styles.reviewComment, {color: colors.textColor}]}>
          {item.comment}
        </Text>
      )}

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <View
              key={index}
              style={[styles.tag, {backgroundColor: colors.grayScale1}]}>
              <Text style={[styles.tagText, {color: colors.grayScale6}]}>
                {tag.replace('_', ' ')}
              </Text>
            </View>
          ))}
          {item.tags.length > 3 && (
            <Text style={[styles.moreTagsText, {color: colors.grayScale5}]}>
              +{item.tags.length - 3} more
            </Text>
          )}
        </View>
      )}

      {/* Review Images */}
      {item.images && item.images.length > 0 && (
        <View style={styles.reviewImages}>
          {item.images.slice(0, 3).map((image, index) => (
            <Image
              key={index}
              source={{uri: image}}
              style={styles.reviewImage}
            />
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.reviewActions}>
        <TouchableOpacity
          onPress={() => handleHelpful(item._id)}
          style={styles.actionButton}>
          <Icon
            name="thumb-up"
            size={moderateScale(16)}
            color={colors.grayScale5}
          />
          <Text style={[styles.actionText, {color: colors.grayScale5}]}>
            Helpful ({item.helpfulCount || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleReport(item._id)}
          style={styles.actionButton}>
          <Icon
            name="flag"
            size={moderateScale(16)}
            color={colors.grayScale5}
          />
          <Text style={[styles.actionText, {color: colors.grayScale5}]}>
            Report
          </Text>
        </TouchableOpacity>

                 {item.user?._id === currentUser?._id && (
           <TouchableOpacity
             onPress={() => handleDelete(item._id)}
             style={styles.actionButton}>
             <Icon
               name="delete"
               size={moderateScale(16)}
               color={colors.grayScale5}
             />
             <Text style={[styles.actionText, {color: colors.grayScale5}]}>
               Delete
             </Text>
           </TouchableOpacity>
         )}
      </View>
    </View>
  );

  const renderHeader = () => {
    if (!showHeader || !stats) return null;

    return (
      <View style={styles.header}>
        <View style={styles.statsContainer}>
          <StarRating
            rating={stats.averageRating}
            totalReviews={stats.totalReviews}
            size="large"
          />
        </View>

        {stats.totalReviews > 0 && (
          <View style={styles.distributionContainer}>
            {[5, 4, 3, 2, 1].map(rating => (
              <View key={rating} style={styles.distributionRow}>
                <Text style={[styles.ratingLabel, {color: colors.textColor}]}>
                  {rating}
                </Text>
                <Icon name="star" size={moderateScale(12)} color="#FFD700" />
                <View
                  style={[
                    styles.distributionBar,
                    {backgroundColor: colors.grayScale2},
                  ]}>
                  <View
                    style={[
                      styles.distributionFill,
                      {
                        width: `${(stats.distribution[rating] / stats.totalReviews) * 100}%`,
                        backgroundColor: '#FFD700',
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.distributionCount,
                    {color: colors.grayScale5},
                  ]}>
                  {stats.distribution[rating] || 0}
                </Text>
              </View>
            ))}
          </View>
        )}

        {onViewAll && stats.totalReviews > (maxItems || 10) && (
          <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
            <Text style={[styles.viewAllText, {color: colors.primary}]}>
              View All Reviews ({stats.totalReviews})
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading || refreshing) return null;

    return (
      <View style={styles.loadingFooter}>
        <Text style={[styles.loadingText, {color: colors.grayScale5}]}>
          Loading more reviews...
        </Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon
        name="rate-review"
        size={moderateScale(48)}
        color={colors.grayScale3}
      />
      <Text style={[styles.emptyTitle, {color: colors.textColor}]}>
        No Reviews Yet
      </Text>
      <Text style={[styles.emptySubtitle, {color: colors.grayScale5}]}>
        Be the first to share your experience!
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={item => item._id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statsContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  distributionContainer: {
    marginBottom: moderateScale(16),
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  ratingLabel: {
    width: moderateScale(12),
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  distributionBar: {
    flex: 1,
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    marginHorizontal: moderateScale(8),
    overflow: 'hidden',
  },
  distributionFill: {
    height: '100%',
    borderRadius: moderateScale(4),
  },
  distributionCount: {
    width: moderateScale(24),
    fontSize: moderateScale(12),
    textAlign: 'right',
  },
  viewAllButton: {
    alignSelf: 'center',
    paddingVertical: moderateScale(8),
  },
  viewAllText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  reviewItem: {
    padding: moderateScale(16),
    borderBottomWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    marginBottom: moderateScale(12),
  },
  userAvatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    marginRight: moderateScale(12),
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginBottom: moderateScale(4),
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewDate: {
    fontSize: moderateScale(12),
    marginLeft: moderateScale(8),
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: moderateScale(8),
  },
  verifiedText: {
    fontSize: moderateScale(10),
    color: '#4CAF50',
    marginLeft: moderateScale(2),
  },
  reviewComment: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(12),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: moderateScale(12),
  },
  tag: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    marginRight: moderateScale(6),
    marginBottom: moderateScale(4),
  },
  tagText: {
    fontSize: moderateScale(10),
    textTransform: 'capitalize',
  },
  moreTagsText: {
    fontSize: moderateScale(10),
    alignSelf: 'center',
  },
  reviewImages: {
    flexDirection: 'row',
    marginBottom: moderateScale(12),
  },
  reviewImage: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(8),
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(4),
  },
  actionText: {
    fontSize: moderateScale(12),
    marginLeft: moderateScale(4),
  },
  loadingFooter: {
    padding: moderateScale(16),
    alignItems: 'center',
  },
  loadingText: {
    fontSize: moderateScale(12),
  },
  emptyContainer: {
    alignItems: 'center',
    padding: moderateScale(32),
  },
  emptyTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  emptySubtitle: {
    fontSize: moderateScale(14),
    textAlign: 'center',
  },
});

export default ReviewsList;
