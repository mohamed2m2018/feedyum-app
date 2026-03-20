import React, { useMemo } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Image,
    Dimensions,
    Animated,
} from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

import ZText from '../../../../components/common/ZText';
import ZButton from '../../../../components/common/ZButton';
import StarRating from '../../../../components/StarRating';
import { moderateScale, getHeight } from '../../../../common/constants';
import { styles } from '../../../../themes';
import strings from '../../../../i18n/strings';
import images from '../../../../assets/images';
import { getLocalizedText } from '../../../../utils/helpers';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ChefDishPreviewModal = ({
    visible,
    dish,
    onClose,
    onEdit,
    onDelete,
    onToggleVisibility,
}) => {
    const colors = useSelector(state => state.theme.theme);
    const [slideAnim] = React.useState(new Animated.Value(screenHeight));

    React.useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 10,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: screenHeight,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const dishStats = useMemo(() => {
        if (!dish) return [];
        const stats = [];

        if (dish.average_rating > 0) {
            stats.push({
                icon: 'star',
                value: dish.average_rating.toFixed(1),
                label: strings.rating || 'Rating',
                color: '#FFD700',
            });
        }

        if (dish.preparationTime || dish.cookingTime) {
            stats.push({
                icon: 'time-outline',
                value: `${dish.preparationTime || dish.cookingTime} min`,
                label: strings.prepTime || 'Prep Time',
                color: colors.primary,
            });
        }

        stats.push({
            icon: dish.visible !== false ? 'eye' : 'eye-off',
            value: dish.visible !== false ? strings.visible || 'Visible' : strings.hidden || 'Hidden',
            label: strings.status || 'Status',
            color: dish.visible !== false ? colors.success : colors.grayScale5,
        });

        return stats;
    }, [dish, colors]);

    if (!dish) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={[styles.flex, { backgroundColor: colors.black + '60' }]}>
                <TouchableOpacity
                    style={localStyles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <Animated.View
                    style={[
                        localStyles.modalContainer,
                        {
                            backgroundColor: colors.backgroundColor,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {/* Hero Image Section */}
                    <View style={localStyles.heroSection}>
                        <Image
                            source={
                                dish.image
                                    ? { uri: dish.image }
                                    : images.dishPlaceholder
                            }
                            style={localStyles.heroImage}
                            resizeMode="cover"
                        />

                        {/* Gradient Overlay */}
                        <LinearGradient
                            colors={['transparent', colors.backgroundColor]}
                            style={localStyles.heroGradient}
                        />

                        {/* Close Button */}
                        <TouchableOpacity
                            style={[localStyles.closeButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                            onPress={onClose}
                        >
                            <Ionicons name="close" size={moderateScale(22)} color="#FFFFFF" />
                        </TouchableOpacity>

                        {/* Visibility Badge */}
                        <View
                            style={[
                                localStyles.visibilityBadge,
                                { backgroundColor: dish.visible !== false ? colors.success : colors.grayScale5 }
                            ]}
                        >
                            <Ionicons
                                name={dish.visible !== false ? 'eye' : 'eye-off'}
                                size={moderateScale(14)}
                                color={colors.white}
                            />
                            <ZText type="S12" color={colors.white} style={{ marginLeft: moderateScale(4) }}>
                                {dish.visible !== false ? strings.visible || 'Visible' : strings.hidden || 'Hidden'}
                            </ZText>
                        </View>

                        {/* Price Badge */}
                        <View style={[localStyles.priceBadge, { backgroundColor: colors.primary }]}>
                            <ZText type="B18" color={colors.white}>
                                {dish.price} {strings.currency || 'EGP'}
                            </ZText>
                        </View>
                    </View>

                    <ScrollView
                        style={localStyles.contentScroll}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Dish Title & Rating */}
                        <View style={localStyles.titleSection}>
                            <ZText type="B24" color={colors.textColor} style={localStyles.dishTitle}>
                                {getLocalizedText(dish.name, dish.nameArabic, dish.nameEnglish)}
                            </ZText>

                            <StarRating
                                rating={dish.average_rating || 0}
                                size="medium"
                                showText={true}
                                showCount={false}
                                showWhenNoRating={true}
                            />
                        </View>

                        {/* Category & Section Tags */}
                        <View style={localStyles.tagsRow}>
                            {dish.category && (
                                <View style={[localStyles.tag, { backgroundColor: colors.primary + '20' }]}>
                                    <Ionicons name="restaurant" size={moderateScale(12)} color={colors.primary} />
                                    <ZText type="M12" color={colors.primary} style={localStyles.tagText}>
                                        {dish.category}
                                    </ZText>
                                </View>
                            )}
                            {dish.section?.name && (
                                <View style={[localStyles.tag, { backgroundColor: colors.blue + '20' }]}>
                                    <Ionicons name="folder" size={moderateScale(12)} color={colors.blue} />
                                    <ZText type="M12" color={colors.blue} style={localStyles.tagText}>
                                        {dish.section.name}
                                    </ZText>
                                </View>
                            )}
                        </View>

                        {/* Stats Row */}
                        {dishStats.length > 0 && (
                            <View style={[localStyles.statsRow, { backgroundColor: colors.inputBg }]}>
                                {dishStats.map((stat, index) => (
                                    <View key={index} style={localStyles.statItem}>
                                        <Ionicons name={stat.icon} size={moderateScale(20)} color={stat.color} />
                                        <ZText type="B14" color={colors.textColor} style={{ marginTop: moderateScale(4) }}>
                                            {stat.value}
                                        </ZText>
                                        <ZText type="R12" color={colors.grayScale7}>
                                            {stat.label}
                                        </ZText>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Description */}
                        {dish.description && (
                            <View style={localStyles.section}>
                                <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
                                    {strings.description || 'Description'}
                                </ZText>
                                <ZText type="M14" color={colors.grayScale7} style={localStyles.description}>
                                    {getLocalizedText(dish.description, dish.descriptionArabic, dish.descriptionEnglish)}
                                </ZText>
                            </View>
                        )}

                        {/* Ingredients */}
                        {dish.ingredients && dish.ingredients.length > 0 && (
                            <View style={localStyles.section}>
                                <ZText type="B16" color={colors.textColor} style={localStyles.sectionTitle}>
                                    {strings.ingredients || 'Ingredients'}
                                </ZText>
                                <View style={localStyles.ingredientsList}>
                                    {(Array.isArray(dish.ingredients) ? dish.ingredients : [dish.ingredients]).map((ingredient, index) => (
                                        <View key={index} style={localStyles.ingredientItem}>
                                            <View style={[localStyles.ingredientBullet, { backgroundColor: colors.primary }]} />
                                            <ZText type="M14" color={colors.textColor}>
                                                {ingredient}
                                            </ZText>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Dish Info Grid */}
                        <View style={localStyles.infoGrid}>
                            {dish.categories && dish.categories.length > 1 && (
                                <View style={[localStyles.infoCard, { backgroundColor: colors.inputBg }]}>
                                    <MaterialCommunityIcons name="tag-multiple" size={moderateScale(20)} color={colors.primary} />
                                    <ZText type="R12" color={colors.grayScale7} style={localStyles.infoLabel}>
                                        {strings.categories || 'Categories'}
                                    </ZText>
                                    <ZText type="M14" color={colors.textColor} numberOfLines={2}>
                                        {dish.categories.join(', ')}
                                    </ZText>
                                </View>
                            )}

                            {dish.created_at && (
                                <View style={[localStyles.infoCard, { backgroundColor: colors.inputBg }]}>
                                    <Ionicons name="calendar" size={moderateScale(20)} color={colors.primary} />
                                    <ZText type="R12" color={colors.grayScale7} style={localStyles.infoLabel}>
                                        {strings.addedOn || 'Added On'}
                                    </ZText>
                                    <ZText type="M14" color={colors.textColor}>
                                        {new Date(dish.created_at).toLocaleDateString()}
                                    </ZText>
                                </View>
                            )}
                        </View>

                        {/* Spacer for buttons */}
                        <View style={{ height: moderateScale(100) }} />
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={[localStyles.actionsContainer, { backgroundColor: colors.backgroundColor }]}>
                        <TouchableOpacity
                            style={[localStyles.actionBtn, { backgroundColor: colors.inputBg }]}
                            onPress={() => {
                                onClose();
                                setTimeout(() => onToggleVisibility && onToggleVisibility(dish), 300);
                            }}
                        >
                            <Ionicons
                                name={dish.visible !== false ? 'eye-off' : 'eye'}
                                size={moderateScale(20)}
                                color={colors.textColor}
                            />
                            <ZText type="M12" color={colors.textColor} style={{ marginTop: moderateScale(4) }}>
                                {dish.visible !== false ? strings.hide || 'Hide' : strings.show || 'Show'}
                            </ZText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[localStyles.actionBtn, { backgroundColor: colors.blue + '15' }]}
                            onPress={() => {
                                onClose();
                                setTimeout(() => onEdit && onEdit(dish), 300);
                            }}
                        >
                            <Ionicons name="create" size={moderateScale(20)} color={colors.blue} />
                            <ZText type="M12" color={colors.blue} style={{ marginTop: moderateScale(4) }}>
                                {strings.edit || 'Edit'}
                            </ZText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[localStyles.actionBtn, { backgroundColor: colors.redColor + '15' }]}
                            onPress={() => {
                                onClose();
                                setTimeout(() => onDelete && onDelete(dish), 300);
                            }}
                        >
                            <Ionicons name="trash" size={moderateScale(20)} color={colors.redColor} />
                            <ZText type="M12" color={colors.redColor} style={{ marginTop: moderateScale(4) }}>
                                {strings.delete || 'Delete'}
                            </ZText>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const localStyles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: screenHeight * 0.9,
        borderTopLeftRadius: moderateScale(24),
        borderTopRightRadius: moderateScale(24),
        overflow: 'hidden',
    },
    heroSection: {
        height: moderateScale(240),
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: moderateScale(80),
    },
    closeButton: {
        position: 'absolute',
        top: moderateScale(16),
        right: moderateScale(16),
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        justifyContent: 'center',
        alignItems: 'center',
        ...styles.shadowStyle,
    },
    visibilityBadge: {
        position: 'absolute',
        top: moderateScale(16),
        left: moderateScale(16),
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateScale(6),
        borderRadius: moderateScale(16),
    },
    priceBadge: {
        position: 'absolute',
        bottom: moderateScale(16),
        right: moderateScale(16),
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(8),
        borderRadius: moderateScale(20),
        ...styles.shadowStyle,
    },
    contentScroll: {
        flex: 1,
        paddingHorizontal: moderateScale(20),
    },
    titleSection: {
        marginTop: moderateScale(8),
        marginBottom: moderateScale(12),
    },
    dishTitle: {
        marginBottom: moderateScale(8),
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: moderateScale(16),
        gap: moderateScale(8),
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateScale(6),
        borderRadius: moderateScale(16),
    },
    tagText: {
        marginLeft: moderateScale(4),
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: moderateScale(16),
        borderRadius: moderateScale(16),
        marginBottom: moderateScale(20),
    },
    statItem: {
        alignItems: 'center',
    },
    section: {
        marginBottom: moderateScale(20),
    },
    sectionTitle: {
        marginBottom: moderateScale(10),
    },
    description: {
        lineHeight: moderateScale(22),
    },
    ingredientsList: {
        gap: moderateScale(8),
    },
    ingredientItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ingredientBullet: {
        width: moderateScale(6),
        height: moderateScale(6),
        borderRadius: moderateScale(3),
        marginRight: moderateScale(10),
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: moderateScale(12),
        marginBottom: moderateScale(20),
    },
    infoCard: {
        flex: 1,
        minWidth: moderateScale(140),
        padding: moderateScale(16),
        borderRadius: moderateScale(12),
        alignItems: 'center',
    },
    infoLabel: {
        marginTop: moderateScale(6),
        marginBottom: moderateScale(4),
    },
    actionsContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        paddingHorizontal: moderateScale(20),
        paddingVertical: moderateScale(16),
        paddingBottom: moderateScale(32),
        gap: moderateScale(12),
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
        ...styles.shadowStyle,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: moderateScale(12),
        borderRadius: moderateScale(12),
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default ChefDishPreviewModal;
