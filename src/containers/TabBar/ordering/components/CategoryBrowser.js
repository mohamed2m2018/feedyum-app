import React, { useMemo, useState, useRef } from 'react';
import { View, Image, ScrollView, TouchableOpacity, I18nManager, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { moderateScale } from '../../../../common/constants';
import ZText from '../../../../components/common/ZText';
import strings from '../../../../i18n/strings';
import styles from '../chefMenuStyles';

// Color gradients for section cards
const SECTION_GRADIENTS = [
  { primary: '#FF6B8A', secondary: '#FF8FA3' },
  { primary: '#4ECDC4', secondary: '#7EDDD8' },
  { primary: '#45B7D1', secondary: '#6BCFF6' },
  { primary: '#FFA726', secondary: '#FFB74D' },
  { primary: '#AB47BC', secondary: '#BA68C8' },
  { primary: '#66BB6A', secondary: '#81C784' },
  { primary: '#EF5350', secondary: '#E57373' },
  { primary: '#26A69A', secondary: '#4DB6AC' },
];

const OTHER_SECTION_KEY = '__other__';

/**
 * Returns the localized display name for a section object.
 */
const getSectionDisplayName = (sectionObj) => {
  if (!sectionObj) return I18nManager.isRTL ? (strings.other || 'أخرى') : (strings.other || 'Other');
  if (I18nManager.isRTL) {
    return sectionObj.nameArabic || sectionObj.name || (strings.other || 'أخرى');
  }
  return sectionObj.nameEnglish || sectionObj.name || (strings.other || 'Other');
};

/**
 * Horizontal section browser with image/icon cards.
 * Groups dishes by their menu section (chef's custom grouping).
 * Highlights the selected section with a primary-colored border.
 */
const CategoryBrowser = ({ dishes, flatListRef, onScrollStart }) => {
  const colors = useSelector(state => state.theme.theme);
  const [selectedKey, setSelectedKey] = useState(null);
  const scrollViewRef = useRef(null);
  const cardLayoutsRef = useRef({});
  const screenWidth = Dimensions.get('window').width;
  const cardRefs = useRef({});

  // Group dishes by section and build section metadata
  const { sections, sectionMap } = useMemo(() => {
    if (!dishes || dishes.length === 0) return { sections: [], sectionMap: {} };

    const map = {};

    dishes.forEach(dish => {
      const sectionKey = dish.section?._id || dish.section || OTHER_SECTION_KEY;
      if (!map[sectionKey]) {
        map[sectionKey] = {
          key: sectionKey,
          sectionObj: typeof dish.section === 'object' ? dish.section : null,
          dishes: [],
        };
      }
      map[sectionKey].dishes.push(dish);
    });

    const orderedSections = Object.values(map);
    return { sections: orderedSections, sectionMap: map };
  }, [dishes]);

  if (!dishes || dishes.length === 0 || sections.length <= 1) return null;

  const handleSectionPress = (sectionKey) => {
    const sectionData = sectionMap[sectionKey];
    if (!sectionData || !flatListRef.current) return;

    // Toggle: deselect if already selected
    const newKey = selectedKey === sectionKey ? null : sectionKey;
    setSelectedKey(newKey);

    // Auto-scroll the horizontal browser to center the selected card
    const layout = cardLayoutsRef.current[sectionKey];
    if (layout && scrollViewRef.current) {
      const centerX = layout.x + layout.width / 2 - screenWidth / 2;
      scrollViewRef.current.scrollTo({ x: Math.max(0, centerX), animated: true });
    }

    if (newKey === null) return; // Just deselecting, don't scroll dishes

    const firstDish = sectionData.dishes[0];
    const dishIndex = dishes.findIndex(d => d._id === firstDish._id);
    if (dishIndex === -1) return;

    // Lock sticky bar during programmatic scroll
    onScrollStart?.();

    try {
      flatListRef.current.scrollToIndex({
        index: dishIndex,
        animated: true,
        viewPosition: 0,
      });
    } catch (_) { /* handled by onScrollToIndexFailed */ }
  };

  const renderSectionCard = ({ item: section, index }) => {
    const gradientColors = SECTION_GRADIENTS[index % SECTION_GRADIENTS.length];
    const sectionImage = section.dishes.find(d => d.image)?.image;
    const displayName = getSectionDisplayName(section.sectionObj);
    const isSelected = selectedKey === section.key;
    const hasSelection = selectedKey !== null;

    return (
      <TouchableOpacity
        key={section.key}
        onLayout={(e) => {
          cardLayoutsRef.current[section.key] = e.nativeEvent.layout;
        }}
        style={[
          styles.stunningCategoryCard,
          { shadowColor: gradientColors.primary },
          // Dim unselected cards when a selection is active
          hasSelection && !isSelected && { opacity: 0.45 },
          I18nManager.isRTL && { transform: [{ scaleX: -1 }] },
        ]}
        onPress={() => handleSectionPress(section.key)}
        activeOpacity={0.8}
      >
        {sectionImage ? (
          <View>
            <Image source={{ uri: sectionImage }} style={styles.categoryCardImage} />
            <ZText
              type={isSelected ? 'B14' : 'B13'}
              color={isSelected ? colors.primary : colors.textColor}
              numberOfLines={1}
              align="center"
              style={styles.categoryLabelBelow}
            >
              {displayName}
            </ZText>
            {/* Selected accent bar */}
            {isSelected && (
              <View style={{
                height: moderateScale(3),
                backgroundColor: colors.primary,
                borderRadius: moderateScale(2),
                marginHorizontal: moderateScale(12),
                marginTop: moderateScale(2),
              }} />
            )}
          </View>
        ) : (
          <View>
            <View style={[styles.categoryCardFallback, { backgroundColor: gradientColors.primary }]}>
              <Ionicons name="restaurant-outline" size={moderateScale(28)} color="white" />
            </View>
            <ZText
              type={isSelected ? 'B14' : 'B13'}
              color={isSelected ? colors.primary : colors.textColor}
              numberOfLines={1}
              align="center"
              style={styles.categoryLabelBelow}
            >
              {displayName}
            </ZText>
            {isSelected && (
              <View style={{
                height: moderateScale(3),
                backgroundColor: colors.primary,
                borderRadius: moderateScale(2),
                marginHorizontal: moderateScale(12),
                marginTop: moderateScale(2),
              }} />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.stickyBrowseContainer, { backgroundColor: colors.backgroundColor }]}>
      <View style={styles.stunningCategoriesContainer}>
        <View style={{ marginTop: moderateScale(-6), marginBottom: moderateScale(8) }}>
          <ZText type="B16" color={colors.textColor} style={[styles.categoriesTitle, { marginBottom: 0 }]}>
            {strings.browseMenu}
          </ZText>
        </View>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          contentContainerStyle={styles.stunningCategoriesList}
          style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : null}
        >
          {sections.map((section, index) => renderSectionCard({ item: section, index }))}
        </ScrollView>
      </View>
    </View>
  );
};

export default React.memo(CategoryBrowser);
