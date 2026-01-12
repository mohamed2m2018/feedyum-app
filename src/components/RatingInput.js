import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { moderateScale } from '../common/constants';
import ZText from './common/ZText';

const RatingInput = ({
    rating = 0,
    onRatingChange,
    label = 'Rate this dish (optional)',
    maxStars = 5,
}) => {
    const colors = useSelector(state => state.theme.theme);

    const handleStarPress = (starIndex) => {
        // If tapping the same star, toggle off
        if (rating === starIndex + 1) {
            onRatingChange(0);
        } else {
            onRatingChange(starIndex + 1);
        }
    };

    return (
        <View style={localStyles.container}>
            <ZText type="B14" color={colors.textColor} style={localStyles.label}>
                {label}
            </ZText>

            <View style={localStyles.starsContainer}>
                {[...Array(maxStars)].map((_, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => handleStarPress(index)}
                        style={localStyles.starButton}
                    >
                        <Ionicons
                            name={index < rating ? 'star' : 'star-outline'}
                            size={32}
                            color={index < rating ? '#FFD700' : colors.grayScale4}
                        />
                    </TouchableOpacity>
                ))}

                {rating > 0 && (
                    <TouchableOpacity
                        onPress={() => onRatingChange(0)}
                        style={localStyles.clearButton}
                    >
                        <ZText type="M12" color={colors.grayScale5}>
                            Clear
                        </ZText>
                    </TouchableOpacity>
                )}
            </View>

            {rating > 0 && (
                <ZText type="M14" color={colors.primary} style={localStyles.ratingText}>
                    {rating} star{rating > 1 ? 's' : ''}
                </ZText>
            )}
        </View>
    );
};

const localStyles = StyleSheet.create({
    container: {
        marginBottom: moderateScale(16),
    },
    label: {
        marginBottom: moderateScale(8),
    },
    starsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starButton: {
        padding: moderateScale(4),
        marginRight: moderateScale(4),
    },
    clearButton: {
        marginLeft: moderateScale(12),
        padding: moderateScale(4),
    },
    ratingText: {
        marginTop: moderateScale(8),
    },
});

export default RatingInput;
