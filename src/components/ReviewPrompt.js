import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { moderateScale } from '../common/constants';

const { width, height } = Dimensions.get('window');

const ReviewPrompt = ({
  visible,
  onClose,
  onReviewNow,
  onRemindLater,
  orderData,
}) => {
  const colors = useSelector(state => state.theme.theme);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
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
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible]);

  if (!visible || !orderData) return null;

  const renderStars = (rating) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name="star"
            size={moderateScale(16)}
            color={star <= rating ? '#FFD700' : '#E0E0E0'}
          />
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.backgroundColor,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#FF6B6B', '#FF8E8E']}
                style={styles.iconGradient}
              >
                <Icon name="rate-review" size={moderateScale(30)} color="#FFFFFF" />
              </LinearGradient>
            </View>
            
            <Text style={[styles.title, { color: colors.textColor }]}>
              How was your order?
            </Text>
            
            <Text style={[styles.subtitle, { color: colors.grayScale5 }]}>
              Share your experience to help others discover great food!
            </Text>
          </View>

          {/* Order Summary */}
          <View style={styles.orderSummary}>
            <View style={styles.orderHeader}>
              <Text style={[styles.orderTitle, { color: colors.textColor }]}>
                Order from {orderData.chef?.name || 'Chef'}
              </Text>
              <Text style={[styles.orderDate, { color: colors.grayScale5 }]}>
                {new Date(orderData.completedAt).toLocaleDateString()}
              </Text>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.dishesContainer}
            >
              {orderData.dishes?.map((dish, index) => (
                <View key={index} style={styles.dishItem}>
                  {dish.dishImage ? (
                    <Image 
                      source={{ uri: dish.dishImage }} 
                      style={styles.dishImage} 
                    />
                  ) : (
                    <View style={[styles.dishPlaceholder, { backgroundColor: colors.grayScale2 }]}>
                      <Icon name="restaurant" size={moderateScale(20)} color={colors.grayScale5} />
                    </View>
                  )}
                  <Text 
                    style={[styles.dishName, { color: colors.textColor }]}
                    numberOfLines={2}
                  >
                    {dish.dishName}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Benefits */}
          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <Icon name="thumb-up" size={moderateScale(20)} color="#4CAF50" />
              <Text style={[styles.benefitText, { color: colors.textColor }]}>
                Help others discover great food
              </Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Icon name="star" size={moderateScale(20)} color="#FFD700" />
              <Text style={[styles.benefitText, { color: colors.textColor }]}>
                Support your favorite chefs
              </Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Icon name="feedback" size={moderateScale(20)} color="#2196F3" />
              <Text style={[styles.benefitText, { color: colors.textColor }]}>
                Share your honest feedback
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              onPress={onReviewNow}
              style={styles.primaryButton}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF8E8E']}
                style={styles.gradientButton}
              >
                <Icon name="rate-review" size={moderateScale(20)} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Review Now</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.secondaryButtons}>
              <TouchableOpacity
                onPress={onRemindLater}
                style={[styles.secondaryButton, { borderColor: colors.borderColor }]}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.textColor }]}>
                  Remind Later
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                style={[styles.secondaryButton, { borderColor: colors.borderColor }]}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.grayScale5 }]}>
                  Skip
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Close Button */}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={moderateScale(20)} color={colors.grayScale5} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  modalContainer: {
    width: '100%',
    maxWidth: moderateScale(400),
    borderRadius: moderateScale(20),
    padding: moderateScale(24),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: moderateScale(24),
  },
  iconContainer: {
    marginBottom: moderateScale(16),
  },
  iconGradient: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: moderateScale(8),
  },
  subtitle: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  orderSummary: {
    marginBottom: moderateScale(24),
  },
  orderHeader: {
    marginBottom: moderateScale(12),
  },
  orderTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: moderateScale(4),
  },
  orderDate: {
    fontSize: moderateScale(12),
  },
  dishesContainer: {
    flexDirection: 'row',
  },
  dishItem: {
    alignItems: 'center',
    marginRight: moderateScale(12),
    width: moderateScale(60),
  },
  dishImage: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    marginBottom: moderateScale(6),
  },
  dishPlaceholder: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(6),
  },
  dishName: {
    fontSize: moderateScale(10),
    textAlign: 'center',
    lineHeight: moderateScale(12),
  },
  benefitsContainer: {
    marginBottom: moderateScale(24),
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  benefitText: {
    fontSize: moderateScale(14),
    marginLeft: moderateScale(12),
    flex: 1,
  },
  buttonsContainer: {
    gap: moderateScale(12),
  },
  primaryButton: {
    borderRadius: moderateScale(25),
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(24),
    gap: moderateScale(8),
  },
  primaryButtonText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: moderateScale(25),
    paddingVertical: moderateScale(12),
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  closeButton: {
    position: 'absolute',
    top: moderateScale(16),
    right: moderateScale(16),
    padding: moderateScale(8),
  },
  starsContainer: {
    flexDirection: 'row',
    marginTop: moderateScale(4),
  },
});

export default ReviewPrompt;
