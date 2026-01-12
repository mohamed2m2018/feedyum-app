import { StyleSheet, View, FlatList, TouchableOpacity } from 'react-native';
import React from 'react';
import ActionSheet from 'react-native-actions-sheet';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZText from '../common/ZText';
import strings from '../../i18n/strings';
import { moderateScale } from '../../common/constants';

export default function Locations({ SheetRef, selectedGov, onClose }) {
  const colors = useSelector(state => state.theme.theme);

  const renderItem = ({ item, index }) => (
    <View style={localStyles.itemContainer}>
      <View style={[localStyles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
        <Ionicons name="location-sharp" size={moderateScale(24)} color={colors.primary} />
      </View>
      <View style={localStyles.textContainer}>
        <ZText type="b18" align={'left'} numberOfLines={2}>
          {item?.description}
        </ZText>
      </View>
    </View>
  );

  const ItemSeparator = () => <View style={[localStyles.divider, { backgroundColor: colors.grayScale3 + '40' }]} />;

  return (
    <ActionSheet
      ref={SheetRef}
      onClose={onClose}
      containerStyle={[
        localStyles.actionSheetContainer,
        { backgroundColor: colors.backgroundColor },
      ]}
      indicatorStyle={{ backgroundColor: colors.grayScale3, width: 60 }}
      gestureEnabled>

      <View style={localStyles.contentContainer}>
        <ZText style={localStyles.title} type="b24" align="center" color={colors.textColor}>
          {strings.branches} 📍
        </ZText>

        {(!selectedGov || selectedGov.length === 0) ? (
          <View style={localStyles.emptyContainer}>
            <Ionicons name="map-outline" size={50} color={colors.grayScale3} />
            <ZText align="center" style={localStyles.emptyText} color={colors.grayScale3}>
              {strings.nobranchesFound}
            </ZText>
          </View>
        ) : (
          <FlatList
            data={selectedGov}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            ItemSeparatorComponent={ItemSeparator}
            contentContainerStyle={localStyles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ActionSheet>
  );
}

const localStyles = StyleSheet.create({
  actionSheetContainer: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 10,
    paddingBottom: 20,
    maxHeight: '80%', // Allow it to be tall but not full screen
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    minHeight: 250, // Ensure it feels substantial
  },
  title: {
    marginBottom: 25,
    marginTop: 5,
    fontWeight: '700',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  divider: {
    height: 1,
    width: '100%',
    marginLeft: 59, // Indent to match text start
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  emptyText: {
    marginTop: 10,
  }
});
