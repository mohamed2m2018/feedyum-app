import { StyleSheet, View, Clipboard, TouchableOpacity } from 'react-native';
import React from 'react';
import ActionSheet from 'react-native-actions-sheet';
import { useSelector } from 'react-redux';

import { styles } from '../../themes';
import ZText from '../common/ZText';
import { ScrollView } from 'react-native';
import { showSuccessToast } from '../../utils/toast';
import strings from '../../i18n/strings';

export default function Description({ SheetRef, description }) {
  const colors = useSelector(state => state.theme.theme);

  const copyToClipboard = () => {
    Clipboard.setString(description);
    showSuccessToast(strings.copied || 'Copied', strings.textCopiedSuccess);
  };

  return (
    <ActionSheet
      gestureEnabled
      ref={SheetRef}
      containerStyle={[
        localStyles.actionSheetContainer,
        { backgroundColor: colors.backgroundColor },
      ]}
      overlayColor="transparent">
      <View style={localStyles.contentContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={localStyles.content}>
          <TouchableOpacity onLongPress={copyToClipboard}>
            <ZText type="b24" align="center" style={styles.mb20}>
              {description}
            </ZText>
          </TouchableOpacity>
        </ScrollView>
      </View>
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
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
