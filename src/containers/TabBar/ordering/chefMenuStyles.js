import { StyleSheet } from 'react-native';
import { moderateScale } from '../../../common/constants';

const chefMenuStyles = StyleSheet.create({
  listContainer: {
    paddingBottom: moderateScale(20),
  },
  headerContainer: {
    padding: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    marginBottom: moderateScale(4),
  },
  chefInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chefAvatar: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    marginRight: moderateScale(15),
  },
  chefDetails: {
    flex: 1,
  },

  // Hero Banner
  heroBanner: {
    width: '100%',
    height: moderateScale(200),
    justifyContent: 'flex-end',
  },
  heroBannerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: moderateScale(80),
    backgroundColor: 'transparent',
  },

  // Restaurant Info Section
  restaurantHeader: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(14),
    paddingBottom: moderateScale(10),
  },
  nameFollowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Card-Style Stat Badges
  statCardsRow: {
    flexDirection: 'row',
    marginTop: moderateScale(14),
    gap: moderateScale(8),
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(12),
    borderWidth: 1,
  },

  // Prominent Overall Rating Card
  overallRatingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  ratingBigNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  ratingDetails: {
    flexDirection: 'column',
  },

  // Legacy styles (keeping for compatibility)
  premiumHeader: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(8),
  },
  chefInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chefAvatarSmall: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    marginRight: moderateScale(12),
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  chefInfoText: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(4),
    gap: moderateScale(12),
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.15)',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(10),
  },

  // Sticky Browse Menu Container
  stickyBrowseContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterChip: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(16),
    borderWidth: 1,
  },

  // Dish Card
  dishCard: {
    marginHorizontal: moderateScale(16),
    marginVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  heroImageContainer: {
    position: 'relative',
    height: moderateScale(160),
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  topGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: moderateScale(40),
    backgroundColor: 'transparent',
  },
  dishContent: {
    padding: moderateScale(16),
  },
  dishInfo: {
    marginBottom: moderateScale(12),
  },
  dishName: {
    marginBottom: moderateScale(4),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dishDescription: {
    lineHeight: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  categoryBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
  },
  categoryText: {
    fontWeight: '600',
    fontSize: moderateScale(9),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Action Section
  actionSection: {
    alignItems: 'stretch',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(14),
    backgroundColor: '#FF4D67',
    gap: moderateScale(6),
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  quantityController: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  quantityControl: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  quantityBadge: {
    minWidth: moderateScale(40),
    alignItems: 'center',
    paddingHorizontal: moderateScale(8),
  },
  unavailableState: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(16),
    gap: moderateScale(6),
  },

  // Error / Empty states
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(40),
  },
  errorTitle: {
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  errorSubtitle: {
    textAlign: 'center',
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(24),
  },
  retryButton: {
    paddingHorizontal: moderateScale(32),
    paddingVertical: moderateScale(12),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(40),
  },
  emptyTitle: {
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  emptySubtitle: {
    lineHeight: moderateScale(20),
  },

  // Category Browser
  stunningCategoriesContainer: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(4),
    paddingBottom: moderateScale(8),
  },
  categoriesTitle: {
    marginBottom: moderateScale(15),
    marginLeft: moderateScale(5),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  stunningCategoriesList: {
    paddingHorizontal: moderateScale(5),
    gap: moderateScale(15),
  },
  stunningCategoryCard: {
    width: moderateScale(110),
    alignItems: 'center',
  },
  categoryCardImage: {
    width: moderateScale(110),
    height: moderateScale(90),
    borderRadius: moderateScale(14),
    resizeMode: 'cover',
  },
  categoryCardFallback: {
    width: moderateScale(110),
    height: moderateScale(90),
    borderRadius: moderateScale(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabelBelow: {
    marginTop: moderateScale(6),
    fontWeight: '600',
  },

  // Section Header
  sectionHeader: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    marginTop: moderateScale(20),
    marginBottom: moderateScale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default chefMenuStyles;
