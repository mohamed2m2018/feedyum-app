import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { showWarningToast } from '../utils/toast';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { moderateScale } from '../common/constants';
import strings from '../i18n/strings';

const { width, height } = Dimensions.get('window');

const ReviewModal = ({
  visible,
  onClose,
  orderData,
  onSubmitReview,
  loading = false,
}) => {
  const colors = useSelector(state => state.theme.theme);
  const [currentStep, setCurrentStep] = useState(0);
  const [reviews, setReviews] = useState({});
  const [slideAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  const reviewSteps = [
    {
      type: 'chef',
      title: strings.rateChef,
      subtitle: strings.rateChefSubtitle,
    },
    ...(orderData?.dishes || []).map((dish, index) => ({
      type: 'dish',
      dishId: dish.dishId,
      title: `${strings.rate} ${dish.dishName}`,
      subtitle: strings.rateDishSubtitle,
      image: dish.dishImage,
    })),
  ];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible]);

  const handleRatingPress = rating => {
    const currentReview = reviewSteps[currentStep];
    setReviews(prev => ({
      ...prev,
      [currentReview.type === 'chef' ? 'chef' : currentReview.dishId]: {
        ...prev[currentReview.type === 'chef' ? 'chef' : currentReview.dishId],
        rating,
        type: currentReview.type,
        ...(currentReview.type === 'dish' && { dishId: currentReview.dishId }),
      },
    }));
  };

  const handleCommentChange = comment => {
    const currentReview = reviewSteps[currentStep];
    setReviews(prev => ({
      ...prev,
      [currentReview.type === 'chef' ? 'chef' : currentReview.dishId]: {
        ...prev[currentReview.type === 'chef' ? 'chef' : currentReview.dishId],
        comment,
        type: currentReview.type,
        ...(currentReview.type === 'dish' && { dishId: currentReview.dishId }),
      },
    }));
  };

  const handleTagPress = tag => {
    const currentReview = reviewSteps[currentStep];
    const key = currentReview.type === 'chef' ? 'chef' : currentReview.dishId;
    const currentTags = reviews[key]?.tags || [];

    setReviews(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        tags: currentTags.includes(tag)
          ? currentTags.filter(t => t !== tag)
          : [...currentTags, tag],
        type: currentReview.type,
        ...(currentReview.type === 'dish' && { dishId: currentReview.dishId }),
      },
    }));
  };

  const handleNext = () => {
    if (currentStep < reviewSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const reviewsArray = Object.values(reviews).filter(review => review.rating);

    if (reviewsArray.length === 0) {
      showWarningToast(
        'No Reviews',
        'Please provide at least one rating before submitting.',
      );
      return;
    }

    onSubmitReview(reviewsArray);
  };

  const getCurrentReview = () => {
    const currentReview = reviewSteps[currentStep];
    const key = currentReview.type === 'chef' ? 'chef' : currentReview.dishId;
    return reviews[key] || {};
  };

  const renderStars = () => {
    const currentReview = getCurrentReview();
    const rating = currentReview.rating || 0;

    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRatingPress(star)}
            style={styles.starButton}>
            <Animated.View
              style={[
                styles.starWrapper,
                {
                  transform: [
                    {
                      scale: rating >= star ? 1.1 : 1,
                    },
                  ],
                },
              ]}>
              <Icon
                name="star"
                size={moderateScale(40)}
                color={rating >= star ? '#FFD700' : '#E0E0E0'}
              />
            </Animated.View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderTags = () => {
    const currentReview = reviewSteps[currentStep];
    const currentTags = getCurrentReview().tags || [];

    const availableTags =
      currentReview.type === 'chef'
        ? ['friendly', 'professional', 'fast_delivery', 'clean', 'creative']
        : [
          'delicious',
          'fresh',
          'hot',
          'presentation',
          'value_for_money',
          'authentic',
        ];

    return (
      <View style={styles.tagsContainer}>
        <Text style={[styles.tagsTitle, { color: colors.textColor }]}>
          {strings.addTagsOptional}
        </Text>
        <View style={styles.tagsWrapper}>
          {availableTags.map(tag => (
            <TouchableOpacity
              key={tag}
              onPress={() => handleTagPress(tag)}
              style={[
                styles.tagButton,
                {
                  backgroundColor: currentTags.includes(tag)
                    ? '#FF6B6B'
                    : colors.backgroundColor,
                  borderColor: currentTags.includes(tag)
                    ? '#FF6B6B'
                    : colors.borderColor,
                },
              ]}>
              <Text
                style={[
                  styles.tagText,
                  {
                    color: currentTags.includes(tag)
                      ? '#FFFFFF'
                      : colors.textColor,
                  },
                ]}>
                {tag.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderProgressBar = () => {
    const progress = (currentStep + 1) / reviewSteps.length;

    return (
      <View style={styles.progressContainer}>
        <View
          style={[styles.progressBar, { backgroundColor: colors.borderColor }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.textColor }]}>
          {currentStep + 1} of {reviewSteps.length}
        </Text>
      </View>
    );
  };

  if (!visible) return null;

  const currentReview = reviewSteps[currentStep];
  const currentReviewData = getCurrentReview();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.backgroundColor,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [height, 0],
                    }),
                  },
                  { scale: scaleAnim },
                ],
              },
            ]}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon
                  name="close"
                  size={moderateScale(24)}
                  color={colors.textColor}
                />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.textColor }]}>
                {strings.leaveReview}
              </Text>
              <View style={styles.placeholder} />
            </View>

            {renderProgressBar()}

            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}>
              {/* Current Item */}
              <View style={styles.itemContainer}>
                {currentReview.image && (
                  <Image
                    source={{ uri: currentReview.image }}
                    style={styles.dishImage}
                  />
                )}
                {!currentReview.image && currentReview.type === 'chef' && (
                  <View
                    style={[
                      styles.chefAvatar,
                      { backgroundColor: colors.primary },
                    ]}>
                    <Icon
                      name="person"
                      size={moderateScale(40)}
                      color="#FFFFFF"
                    />
                  </View>
                )}

                <Text style={[styles.itemTitle, { color: colors.textColor }]}>
                  {currentReview.title}
                </Text>
                <Text style={[styles.itemSubtitle, { color: colors.grayScale5 }]}>
                  {currentReview.subtitle}
                </Text>
              </View>

              {/* Rating Stars */}
              {renderStars()}

              {/* Rating Text */}
              {currentReviewData.rating > 0 && (
                <Text style={[styles.ratingText, { color: colors.primary }]}>
                  {currentReviewData.rating === 1 && strings.poor}
                  {currentReviewData.rating === 2 && strings.fair}
                  {currentReviewData.rating === 3 && strings.good}
                  {currentReviewData.rating === 4 && strings.veryGood}
                  {currentReviewData.rating === 5 && strings.excellent}
                </Text>
              )}

              {/* Tags */}
              {renderTags()}

              {/* Comment Input */}
              <View style={styles.commentContainer}>
                <Text style={[styles.commentTitle, { color: colors.textColor }]}>
                  {strings.shareExperienceOptional}
                </Text>
                <TextInput
                  style={[
                    styles.commentInput,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.borderColor,
                      color: colors.textColor,
                    },
                  ]}
                  placeholder={strings.reviewPlaceholder}
                  placeholderTextColor={colors.grayScale5}
                  multiline
                  numberOfLines={4}
                  value={currentReviewData.comment || ''}
                  onChangeText={handleCommentChange}
                  maxLength={500}
                />
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              {currentStep > 0 && (
                <TouchableOpacity
                  onPress={handlePrevious}
                  style={[styles.footerButton, styles.previousButton]}>
                  <Text style={styles.previousButtonText}>{strings.previous}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleNext}
                disabled={loading || !currentReviewData.rating}
                style={[
                  styles.footerButton,
                  styles.nextButton,
                  {
                    backgroundColor: currentReviewData.rating
                      ? '#FF6B6B'
                      : colors.grayScale3,
                    flex: currentStep === 0 ? 1 : 0.6,
                  },
                ]}>
                <LinearGradient
                  colors={
                    currentReviewData.rating
                      ? ['#FF6B6B', '#FF8E8E']
                      : [colors.grayScale3, colors.grayScale3]
                  }
                  style={styles.gradientButton}>
                  <Text style={styles.nextButtonText}>
                    {loading
                      ? strings.submitting
                      : currentStep === reviewSteps.length - 1
                        ? strings.submitReviews
                        : strings.next}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: height * 0.9,
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: moderateScale(5),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
  },
  placeholder: {
    width: moderateScale(34),
  },
  progressContainer: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(15),
  },
  progressBar: {
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: moderateScale(2),
  },
  progressText: {
    fontSize: moderateScale(12),
    textAlign: 'center',
    marginTop: moderateScale(8),
  },
  content: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
  },
  itemContainer: {
    alignItems: 'center',
    paddingVertical: moderateScale(20),
  },
  dishImage: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    marginBottom: moderateScale(15),
  },
  chefAvatar: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(15),
  },
  itemTitle: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: moderateScale(5),
  },
  itemSubtitle: {
    fontSize: moderateScale(14),
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: moderateScale(20),
  },
  starButton: {
    marginHorizontal: moderateScale(5),
  },
  starWrapper: {
    padding: moderateScale(5),
  },
  ratingText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: moderateScale(20),
  },
  tagsContainer: {
    marginVertical: moderateScale(20),
  },
  tagsTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: moderateScale(10),
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  tagButton: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(15),
    borderWidth: 1,
  },
  tagText: {
    fontSize: moderateScale(12),
    textTransform: 'capitalize',
  },
  commentContainer: {
    marginVertical: moderateScale(20),
  },
  commentTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: moderateScale(10),
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: moderateScale(10),
    padding: moderateScale(12),
    textAlignVertical: 'top',
    fontSize: moderateScale(14),
    minHeight: moderateScale(80),
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(15),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: moderateScale(10),
  },
  footerButton: {
    borderRadius: moderateScale(25),
    overflow: 'hidden',
  },
  previousButton: {
    flex: 0.4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
  },
  previousButtonText: {
    fontSize: moderateScale(16),
    color: '#666',
  },
  nextButton: {
    flex: 0.6,
  },
  gradientButton: {
    paddingVertical: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default ReviewModal;
