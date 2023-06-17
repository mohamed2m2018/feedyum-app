import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';

import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import {styles} from '../../../themes';
import strings from '../../../i18n/strings';
import ZText from '../../../components/common/ZText';
import ZHeader from '../../../components/common/ZHeader';
import {privacyPolicyData} from '../../../api/constant';

const PrivacyPolicy = () => {
  const RenderData = () => {
    return privacyPolicyData.map((item, index) => {
      return (
        <View key={index} style={styles.mt15}>
          <ZText type={'b18'} style={styles.mb10}>
            {item.title}
          </ZText>
          <ZText type={'r16'} style={[styles.font16, styles.mb10]}>
            {item.description}
          </ZText>
        </View>
      );
    });
  };

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.privacyPolicy} />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ph20}>
        <RenderData />
      </ScrollView>
    </ZSafeAreaView>
  );
};

export default PrivacyPolicy;

const localStyles = StyleSheet.create({});
