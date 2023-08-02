import {StyleSheet, View, I18nManager} from 'react-native';
import React from 'react';
import ActionSheet from 'react-native-actions-sheet';
import {useSelector} from 'react-redux';
import ZText from '../common/ZText';
import {GestureHandlerRootView, ScrollView} from 'react-native-gesture-handler';
import strings from '../../i18n/strings';
import {governorates} from '../../containers/TabBar/home/DropDownGovr';

export default function Description({SheetRef, selectedAreas, selectedGov}) {
  const colors = useSelector(state => state.theme.theme);
  const selected = governorates.filter(
    element => element.value === selectedGov,
  )?.[0];

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
            <ZText type="b18" align="center">
              {strings.dishAvailableIn}{' '}
              {I18nManager.isRTL ? selected?.arabicValue : selected.value}
              {/* in the following areas{' '} */}
              {'\n'}
            </ZText>
            {/* <ZText type="b18" align="center" style={styles.mb20}>
              {selectedAreas?.map(area => (
                <ZText key={area}>
                  {area}
                  {'\n'}
                </ZText>
              ))}
            </ZText> */}
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
