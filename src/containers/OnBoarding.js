/* eslint-disable react/no-unstable-nested-components */
// Library Imports
import {StyleSheet, View} from 'react-native';
import Image from 'react-native-fast-image';
import React from 'react';
import Swiper from 'react-native-swiper';
import {useSelector} from 'react-redux';

//Local Imports
import ZText from '../components/common/ZText';
import images from '../assets/images';
import {styles} from '../themes';
import {
  APP_OPEN_FIRST_TIME,
  getHeight,
  moderateScale,
} from '../common/constants';
import {StackNav} from '../navigation/NavigationKeys';
import ZButton from '../components/common/ZButton';
import strings from '../i18n/strings';
import {useStorage} from '../utils/useStorage';

const OnBoarding = ({navigation}) => {
  const colors = useSelector(state => state.theme.theme);
  const [_, setAppOpen] = useStorage(APP_OPEN_FIRST_TIME);

  const OnBoardingData = {
    tutorialText1: {
      id: 1,
      title: strings.followTheBest,
      image: images.onBoardingLight1,
      desc: strings.bestCollection,
      btnTitle: strings.next,
      onPress: () => onPressNext(),
    },
    tutorialText2: {
      id: 2,
      title: strings.wideVariety,
      desc: strings.withBestPrices,
      image: images.onBoardingLight2,
      btnTitle: strings.next,
      onPress: () => onPressNext(),
    },
    tutorialText3: {
      id: 3,
      title: strings.showUs,
      desc: strings.zeroFee,
      image: images.onBoardingLight3,
      btnTitle: strings.next,
      onPress: () => onPressGetStarted(),
    },
  };

  const TutorialItem = ({bgImage, header, btnPress, btnTitle}) => {
    return (
      <View
        style={[
          localStyles.tutorialContainer,
          {backgroundColor: colors.backgroundColor},
        ]}>
        <Image
          resizeMode="contain"
          source={bgImage.image}
          style={localStyles.tutorialImage}
        />
        <View style={localStyles.headerContainer}>
          <ZText type={'b36'} align={'center'}>
            {header.title}
          </ZText>
        </View>
        <ZButton
          textType={'b18'}
          title={btnTitle.btnTitle}
          onPress={btnPress.onPress}
          containerStyle={localStyles.btnContainerStyle}
        />
      </View>
    );
  };

  const onPressGetStarted = async () => {
    setAppOpen('firstTimeOpen');
    navigation.reset({
      index: 0,
      routes: [{name: StackNav.Auth}],
    });
  };

  const onPressNext = () => {
    swiper.scrollBy(1);
  };

  return (
    <Swiper
      ref={ref => (swiper = ref)}
      showsButtons={false}
      loop={false}
      activeDotStyle={[
        localStyles.activeDotStyle,
        {backgroundColor: colors.primary},
      ]}
      dotStyle={[localStyles.dotStyle, {backgroundColor: colors.white}]}
      paginationStyle={localStyles.paginationStyle}>
      <TutorialItem
        bgImage={OnBoardingData.tutorialText1}
        header={OnBoardingData.tutorialText1}
        btnPress={OnBoardingData.tutorialText1}
        btnTitle={OnBoardingData.tutorialText1}
      />
      <TutorialItem
        bgImage={OnBoardingData.tutorialText2}
        header={OnBoardingData.tutorialText2}
        btnPress={OnBoardingData.tutorialText2}
        btnTitle={OnBoardingData.tutorialText2}
      />
      <TutorialItem
        bgImage={OnBoardingData.tutorialText3}
        header={OnBoardingData.tutorialText3}
        btnPress={OnBoardingData.tutorialText3}
        btnTitle={OnBoardingData.tutorialText3}
      />
    </Swiper>
  );
};

export default OnBoarding;

const localStyles = StyleSheet.create({
  tutorialContainer: {
    ...styles.flex,
    ...styles.justifyCenter,
  },
  tutorialImage: {
    resizeMode: 'contain',
    height: 150,
    width: '75%',
    ...styles.mt50,
    ...styles.selfCenter,
    ...styles.flex,
  },
  paginationStyle: {
    bottom: getHeight(150),
  },
  btnContainerStyle: {
    ...styles.m25,
    bottom: getHeight(30),
  },
  dotStyle: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(10),
    ...styles.mh5,
  },
  activeDotStyle: {
    width: moderateScale(25),
    height: moderateScale(8),
  },
  headerContainer: {
    bottom: getHeight(100),
    ...styles.mh15,
    ...styles.pt40,
    ...styles.itemsCenter,
    ...styles.justifyEnd,
  },
});
