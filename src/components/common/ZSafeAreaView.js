import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { styles } from '../../themes';
import { useSelector } from 'react-redux';

export default ZSafeAreaView = ({ children, edges = ['top', 'left', 'right'], ...props }) => {
  const colors = useSelector(state => state.theme.theme);
  return (
    <SafeAreaView {...props} edges={edges} style={[localStyles(colors, props.style).root]}>
      {children}
    </SafeAreaView>
  );
};

const localStyles = (colors, style) =>
  StyleSheet.create({
    root: {
      ...styles.flex,
      backgroundColor: colors.backgroundColor,
      ...style,
    },
  });
