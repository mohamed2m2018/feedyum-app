import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import StarRating from './StarRating';
import strings from '../i18n/strings';

const ChefProfileCard = ({ chef, onPress, onViewMenu, showMenuButton = true }) => {
  const handlePress = () => {
    if (onPress) {
      onPress(chef);
    }
  };

  const handleViewMenu = () => {
    if (onViewMenu) {
      onViewMenu(chef);
    }
  };

  // Use backend-provided rating only
  const ratingValue = Number.isFinite(chef?.averageDishRating) ? chef.averageDishRating : 0;
  const reviewsCount = chef?.ratedDishesCount || 0;

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.header}>
        <Image
          source={{ uri: chef.avatar || 'https://via.placeholder.com/60' }}
          style={styles.avatar}
        />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {chef.fullName || chef.username}
            </Text>
            <StarRating
              rating={ratingValue}
              totalReviews={reviewsCount}
              size="small"
              showText={true}
              showCount={reviewsCount > 0}
              showWhenNoRating={true}
              style={styles.rating}
            />
          </View>
          <Text style={styles.type}>{strings.yes}</Text>
          {chef.bio && (
            <Text style={styles.bio} numberOfLines={2}>
              {chef.bio}
            </Text>
          )}
        </View>
      </View>

      {/* Tags */}
      {chef.tags && chef.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {chef.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag.name}</Text>
            </View>
          ))}
          {chef.tags.length > 3 && (
            <Text style={styles.moreTagsText}>+{chef.tags.length - 3} more</Text>
          )}
        </View>
      )}

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{chef.postsNo || 0}</Text>
          <Text style={styles.statLabel}>{strings.posts}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{chef.likesNo || 0}</Text>
          <Text style={styles.statLabel}>{strings.likes}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {chef.menu?.dishCount || 0}
          </Text>
          <Text style={styles.statLabel}>{strings.dishes}</Text>
        </View>
      </View>

      {/* Menu Button */}
      {showMenuButton && chef.hasMenu && (
        <TouchableOpacity
          style={styles.menuButton}
          onPress={handleViewMenu}
        >
          <Text style={styles.menuButtonText}>{strings.viewMenu}</Text>
        </TouchableOpacity>
      )}

      {/* No Menu Message */}
      {showMenuButton && !chef.hasMenu && (
        <View style={styles.noMenuContainer}>
          <Text style={styles.noMenuText}>{strings.noMenuAvailable}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  rating: {
    marginLeft: 8,
  },
  noRating: {
    marginLeft: 8,
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  type: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#1976D2',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  menuButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noMenuContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  noMenuText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default ChefProfileCard;