import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { moderateScale, getHeight } from '../../common/constants';
import ZText from '../common/ZText';
import ZButton from '../common/ZButton';
import strings from '../../i18n/strings';

const { height: screenHeight } = Dimensions.get('window');

const CategorySelectionModal = ({
  visible,
  onClose,
  categories = [],
  onSelectCategory,
  selectedCategory = '',
  // Multi-select support
  multiSelect = false,
  selectedCategories = [],
  onToggleCategory,
  onDone,
  title = strings.selectCategory,
  subtitle = strings.chooseCategoryForDish,
}) => {
  const colors = useSelector(state => state.theme.theme);
  const [searchQuery, setSearchQuery] = useState('');
  const [slideAnim] = useState(new Animated.Value(screenHeight));

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  const handleSelectCategory = (category) => {
    if (multiSelect) {
      onToggleCategory && onToggleCategory(category);
    } else {
      onSelectCategory(category);
      setSearchQuery('');
      onClose();
    }
  };

  const renderCategoryItem = ({ item, index }) => {
    const isSelected = multiSelect
      ? (selectedCategories || []).includes(item.name)
      : selectedCategory === item.name;

    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          {
            backgroundColor: isSelected ? colors.primary : colors.backgroundColor,
            borderColor: isSelected ? colors.primary : colors.bColor,
          }
        ]}
        onPress={() => handleSelectCategory(item)}
        activeOpacity={0.7}>
        <View style={styles.categoryContent}>
          <View style={styles.categoryIconContainer}>
            <View
              style={[
                styles.categoryIcon,
                {
                  backgroundColor: isSelected ? colors.white : colors.primary + '20',
                }
              ]}>
              <ZText
                type="B16"
                color={isSelected ? colors.primary : colors.primary}
                style={styles.categoryEmoji}>
                {getCategoryIcon(item.name)}
              </ZText>
            </View>
          </View>

          <View style={styles.categoryTextContainer}>
            <ZText
              type="B16"
              color={isSelected ? colors.white : colors.textColor}
              style={styles.categoryName}>
              {item.name}
            </ZText>
            {item.description && (
              <ZText
                type="R12"
                color={isSelected ? colors.white + '80' : colors.grayScale7}
                style={styles.categoryDescription}>
                {item.description}
              </ZText>
            )}
          </View>

          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Ionicons
                name="checkmark-circle"
                size={moderateScale(20)}
                color={colors.white}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      'Italian': '🍝',
      'Pasta': '🍜',
      'Soups and Stews': '🍲',
      'Sandwiches and Wraps': '🥪',
      'Seafood': '🐟',
      'Chicken': '🍗',
      'Main Courses': '🍽️',
      'Homemade': '🏠',
      'Bakery': '🍰',
      'Desserts': '🧁',
      'Foul and Flafel': '🥙',
      'Side Dishes': '🥗',
      'Coupons': '🎫',
      'Dessert': '🍨',
      'Main Course': '🍽️',
    };
    return iconMap[categoryName] || '🍴';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.black + '50' }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.backgroundColor,
                transform: [{ translateY: slideAnim }],
              }
            ]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.bColor }]}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons
                  name="close"
                  size={moderateScale(24)}
                  color={colors.grayScale7}
                />
              </TouchableOpacity>

              <View style={styles.headerTextContainer}>
                <ZText type="B20" color={colors.textColor} style={styles.title}>
                  {title}
                </ZText>
                <ZText type="R14" color={colors.grayScale7} style={styles.subtitle}>
                  {subtitle}
                </ZText>
              </View>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: colors.inputBg }]}>
              <Ionicons
                name="search-outline"
                size={moderateScale(20)}
                color={colors.grayScale7}
                style={styles.searchIcon}
              />
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    color: colors.textColor,
                    backgroundColor: 'transparent',
                  }
                ]}
                placeholder={strings.searchCategories || "Search categories..."}
                placeholderTextColor={colors.grayScale7}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}>
                  <Ionicons
                    name="close-circle"
                    size={moderateScale(18)}
                    color={colors.grayScale7}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Categories List */}
            <View style={styles.listContainer}>
              {filteredCategories.length > 0 ? (
                <FlatList
                  data={filteredCategories}
                  renderItem={renderCategoryItem}
                  keyExtractor={(item, index) => `${item.name}-${index}`}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Ionicons
                    name="search-outline"
                    size={moderateScale(48)}
                    color={colors.grayScale5}
                  />
                  <ZText type="B18" color={colors.grayScale7} style={styles.emptyTitle}>
                    {strings.noCategoriesFound || "No categories found"}
                  </ZText>
                  <ZText type="R14" color={colors.grayScale5} style={styles.emptySubtitle}>
                    {strings.tryDifferentSearch || "Try a different search term"}
                  </ZText>
                </View>
              )}
            </View>

            {multiSelect && (
              <View style={[styles.footer, { borderTopColor: colors.bColor }]}>
                <ZButton
                  title={strings.done || 'Done'}
                  onPress={() => { onDone ? onDone() : onClose(); }}
                  color={colors.white}
                />
              </View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: screenHeight * 0.85,
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(20),
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    marginRight: moderateScale(32), // To compensate for close button
  },
  title: {
    marginBottom: moderateScale(4),
  },
  subtitle: {
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: moderateScale(20),
    marginTop: moderateScale(16),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(12),
  },
  searchIcon: {
    marginRight: moderateScale(12),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(16),
    padding: 0,
  },
  clearButton: {
    marginLeft: moderateScale(8),
  },
  listContainer: {
    flex: 1,
    paddingTop: moderateScale(16),
  },
  listContent: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(20),
  },
  categoryItem: {
    borderRadius: moderateScale(16),
    borderWidth: 1,
    overflow: 'hidden',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
  },
  categoryIconContainer: {
    marginRight: moderateScale(16),
  },
  categoryIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: moderateScale(20),
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryName: {
    marginBottom: moderateScale(2),
  },
  categoryDescription: {
    lineHeight: moderateScale(16),
  },
  selectedIndicator: {
    marginLeft: moderateScale(12),
  },
  separator: {
    height: moderateScale(12),
  },
  footer: {
    padding: moderateScale(16),
    borderTopWidth: 1,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(40),
  },
  emptyTitle: {
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
});

export default CategorySelectionModal;
