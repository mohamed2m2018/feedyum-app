import {StyleSheet, View} from 'react-native';
import React from 'react';
import ActionSheet from 'react-native-actions-sheet';
import {useSelector} from 'react-redux';
import ZText from '../common/ZText';
import {GestureHandlerRootView, ScrollView} from 'react-native-gesture-handler';
import strings from '../../i18n/strings';

export default function Locations({SheetRef, selectedGov}) {
  const colors = useSelector(state => state.theme.theme);

  return (
    <ActionSheet
      ref={SheetRef}
      containerStyle={[
        localStyles.actionSheetContainer,
        {backgroundColor: colors.backgroundColor},
      ]}
      gestureEnabled
      overlayColor="transparent">
      <GestureHandlerRootView>
        <View style={localStyles.contentContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={localStyles.content}>
            <ZText style={{marginBottom: 20}} type="b26" align="center">
              {strings.branches}
            </ZText>
            <ZText type="b18" align="center">
              {(selectedGov?.length === 0 || !selectedGov) && (
                <ZText>{strings.nobranchesFound}</ZText>
              )}
              {selectedGov?.map?.((area, index) => (
                <ZText key={index} align={'left'}>
                  {area?.description}
                  {index !== selectedGov.length - 1 &&
                    '\n' + '_____________________'}
                  {'\n'} {'\n'}
                </ZText>
              ))}
            </ZText>
          </ScrollView>
        </View>
      </GestureHandlerRootView>
    </ActionSheet>
  );
}

const localStyles = StyleSheet.create({
  actionSheetContainer: {
    justifyContent: 'flex-end',
    marginHorizontal: 15,
  },
  contentContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    maxHeight: 400,
    minHeight: 150,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
});
