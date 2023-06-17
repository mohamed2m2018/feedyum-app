import {SafeAreaView, StyleSheet} from 'react-native';
import React from 'react';
import {styles} from '../../themes';
import {useSelector} from 'react-redux';

export default ZSafeAreaView = ({children, ...props}) => {
  const colors = useSelector(state => state.theme.theme);
  return (
    <SafeAreaView {...props} style={[localStyles(colors, props.style).root]}>
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
