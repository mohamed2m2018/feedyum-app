import {StyleSheet, View, I18nManager} from 'react-native';
import React from 'react';
import ActionSheet from 'react-native-actions-sheet';
import {useSelector} from 'react-redux';
import ZText from '../common/ZText';
import {GestureHandlerRootView, ScrollView} from 'react-native-gesture-handler';
import strings from '../../i18n/strings';

export default function Description({SheetRef, selectedGov}) {
  const colors = useSelector(state => state.theme.theme);

  return (
    <ActionSheet
      ref={SheetRef}
      containerStyle={[
        localStyles.actionSheetContainer,
        {backgroundColor: colors.backgroundColor},
      ]}
      overlayColor="transparent">
      <GestureHandlerRootView>
        <View style={localStyles.contentContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={localStyles.content}>
            <ZText style={{marginVertical: 5}} type="b18" align="center">
              Branches
            </ZText>
            <ZText type="b18" align="center" style={styles.mb20}>
              {(selectedGov?.length === 0 || !selectedGov) && (
                <ZText>No Branches found!</ZText>
              )}
              {selectedGov?.map?.(area => (
                <>
                  {/* <ZText>{index + 1}- </ZText> */}
                  <ZText align={'left'} key={area?._id}>
                    {area?.description}
                    {'\n'} {'\n'}
                  </ZText>
                </>
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
