import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { moderateScale } from '../common/constants';

const StarRating = ({
  rating = 0,
  totalReviews = 0,
  size = 'medium',
  showText = true,
  showCount = true,
  style,
}) => {
  const colors = useSelector(state => state.theme.theme);

  const sizes = {
    small: {
      star: moderateScale(12),
      text: moderateScale(10),
      spacing: moderateScale(2),
    },
    medium: {
      star: moderateScale(16),
      text: moderateScale(12),
      spacing: moderateScale(4),
    },
    large: {
      star: moderateScale(20),
      text: moderateScale(14),
      spacing: moderateScale(6),
    },
  };

  const currentSize = sizes[size] || sizes.medium;

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Icon
          key={`full-${i}`}
          name="star"
          size={currentSize.star}
          color="#FFD700"
          style={{ marginRight: moderateScale(1) }}
        />
      );
    }

    // Half star
    if (hasHalfStar) {
      stars.push(
        <View key="half" style={{ position: 'relative', marginRight: moderateScale(1) }}>
          <Icon
            name="star-border"
            size={currentSize.star}
            color="#E0E0E0"
            style={{ position: 'absolute' }}
          />
          <View style={{ width: currentSize.star / 2, overflow: 'hidden' }}>
            <Icon
              name="star"
              size={currentSize.star}
              color="#FFD700"
            />
          </View>
        </View>
      );
    }

    // Empty stars
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Icon
          key={`empty-${i}`}
          name="star-border"
          size={currentSize.star}
          color="#E0E0E0"
          style={{ marginRight: moderateScale(1) }}
        />
      );
    }

    return stars;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsContainer}>
        {renderStars()}
      </View>
      
      {showText && (
        <View style={[styles.textContainer, { marginLeft: currentSize.spacing }]}>
          <Text style={[styles.ratingText, { 
            fontSize: currentSize.text,
            color: colors.textColor 
          }]}>
            {rating.toFixed(1)}
          </Text>
          
          {showCount && totalReviews > 0 && (
            <Text style={[styles.countText, { 
              fontSize: currentSize.text - 1,
              color: colors.grayScale5 
            }]}>
              ({totalReviews})
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontWeight: '600',
    marginRight: moderateScale(4),
  },
  countText: {
    fontWeight: '400',
  },
});

export default StarRating;
