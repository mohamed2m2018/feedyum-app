import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import ZText from '../../components/common/ZText';
import strings from '../../i18n/strings';

/**
 * Web-specific top navigation bar.
 * Receives the same props as a custom tabBar from createMaterialTopTabNavigator:
 * { state, descriptors, navigation }
 */
export default function WebNavBar({ state, descriptors, navigation }) {
  const colors = useSelector(s => s.theme.theme);

  return (
    <View style={[navStyles.container, { backgroundColor: colors.backgroundColor, borderBottomColor: colors.bColor }]}>
      {/* Brand */}
      <View style={navStyles.brandContainer}>
        <ZText type="B22" color={colors.primary}>
          FeedYum
        </ZText>
      </View>

      {/* Navigation Links */}
      <View style={navStyles.linksContainer}>
        {state.routes.map((route, index) => {
          // Skip the AddPost tab on web — camera/gallery doesn't apply
          if (route.name === 'AddPost') return null;

          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          // Get a readable label
          const label = getNavLabel(route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[
                navStyles.navLink,
                isFocused && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
              accessibilityRole="link"
            >
              <ZText
                type={isFocused ? 'B16' : 'M16'}
                color={isFocused ? colors.primary : colors.grayScale5}
              >
                {label}
              </ZText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

/** Map route names to human-readable labels */
function getNavLabel(routeName) {
  const labelMap = {
    Discover: strings.explore || 'Explore',
    Orders: strings.orders || 'Orders',
    FollowingTab: strings.watch || 'Watch',
    Search: strings.search || 'Search',
    Chat: strings.chat || 'Chat',
    Profile: strings.profile || 'Profile',
  };
  return labelMap[routeName] || routeName;
}

const navStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    ...(Platform.OS === 'web' ? { position: 'sticky', top: 0, zIndex: 100 } : {}),
  },
  brandContainer: {
    marginRight: 40,
  },
  linksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    gap: 8,
  },
  navLink: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
});
