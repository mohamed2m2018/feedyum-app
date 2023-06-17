// Library import
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import React, {memo, useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Local import
import ZSafeAreaView from '../../../components/common/ZSafeAreaView';
import ZHeader from '../../../components/common/ZHeader';
import strings from '../../../i18n/strings';
import {moderateScale} from '../../../common/constants';
import {Control, Menu_Dark, Menu_Light} from '../../../assets/svgs';
import {styles} from '../../../themes';
import ZText from '../../../components/common/ZText';
import ZInput from '../../../components/common/ZInput';
import {
  contactUsData,
  helperCategoryData,
  helperData,
} from '../../../api/constant';
import FaqComponent from '../../../components/FaqComponent';

const HelpCenter = () => {
  const colors = useSelector(state => state.theme.theme);
  const [isSelect, setIsSelect] = useState(0);

  const categoryData = [
    {
      id: 0,
      title: strings.faq,
      onPress: () => setIsSelect(0),
    },
    {
      id: 1,
      title: strings.contactUs,
      onPress: () => setIsSelect(1),
    },
  ];

  const BlurredStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.btnColor1,
  };
  const FocusedStyle = {
    backgroundColor: colors.inputFocusColor,
    borderColor: colors.primary,
  };

  const BlurredIconStyle = colors.grayScale5;
  const FocusedIconStyle = colors.primary;

  const [faqData, setFaqData] = useState([]);
  const [search, setSearch] = useState('');
  const [searchInputStyle, setSearchInputStyle] = useState(BlurredStyle);
  const [searchIconStyle, setSearchIconStyle] = useState(BlurredIconStyle);
  const [selectedChips, setSelectedChips] = useState([]);

  useEffect(() => {
    setFaqData(helperData);
  }, []);

  useEffect(() => {
    filterData();
  }, [search]);

  const filterData = () => {
    if (!!search) {
      const filteredData = helperData.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase()),
      );
      setFaqData(filteredData);
    } else {
      setFaqData(helperData);
    }
  };

  const onSearchInput = text => setSearch(text);

  const SearchIcon = () => {
    return (
      <Feather name="search" size={moderateScale(20)} color={searchIconStyle} />
    );
  };
  const onHighlightInput = () => {
    setSearchInputStyle(FocusedStyle);
    setSearchIconStyle(FocusedIconStyle);
  };
  const onUnHighlightInput = () => {
    setSearchInputStyle(BlurredStyle);
    setSearchIconStyle(BlurredIconStyle);
  };

  const RightIcon = () => {
    return (
      <TouchableOpacity style={styles.pr10}>
        {colors.dark ? <Menu_Dark /> : <Menu_Light />}
      </TouchableOpacity>
    );
  };

  const HeaderCategory = () => {
    return categoryData.map((item, index) => {
      return (
        <TouchableOpacity
          onPress={item.onPress}
          style={[
            localStyles.root,
            {
              borderBottomColor:
                isSelect === item.id ? colors.primary : colors.dark3,
            },
          ]}>
          <ZText
            type={'s18'}
            align={'center'}
            style={styles.pb20}
            color={isSelect === item.id ? colors.primary : colors.grayScale7}>
            {item.title}
          </ZText>
        </TouchableOpacity>
      );
    });
  };

  const renderChips = ({item}) => {
    return (
      <TouchableOpacity
        onPress={() => onPressChips(item)}
        style={[
          localStyles.chipsContainer,
          {borderColor: colors.primary},
          selectedChips.includes(item) && {backgroundColor: colors.primary},
        ]}>
        <ZText
          type={'b18'}
          color={selectedChips.includes(item) ? colors.white : colors.primary}>
          {item}
        </ZText>
      </TouchableOpacity>
    );
  };

  const onPressChips = value => {
    if (selectedChips.includes(value)) {
      setSelectedChips(selectedChips.filter(item => item !== value));
    } else {
      setSelectedChips([...selectedChips, value]);
    }
  };

  const RenderHelper = memo(({helperData}) => {
    return helperData.map((item, index) => {
      return <FaqComponent description={item.description} title={item.title} />;
    });
  });

  const ContactUsRender = memo(() => {
    return contactUsData.map((item, index) => {
      return (
        <View
          style={[
            localStyles.contactUsContainer,
            {
              backgroundColor: colors.dark ? colors.inputBg : colors.grayScale1,
            },
          ]}>
          <MaterialCommunityIcons
            name={item.icon}
            size={moderateScale(26)}
            color={colors.primary}
            style={styles.ph20}
          />
          <ZText type={'b18'}>{item.title}</ZText>
        </View>
      );
    });
  });

  return (
    <ZSafeAreaView
      style={{
        backgroundColor: colors.dark ? colors.backgroundColor : colors.white,
      }}>
      <ZHeader title={strings.helpCenter} rightIcon={<RightIcon />} />
      <ScrollView
        bounces={false}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ph20}>
        <View style={localStyles.mainContainer}>
          <HeaderCategory />
        </View>
        {isSelect === 0 ? (
          <View>
            <FlatList
              data={helperCategoryData}
              renderItem={renderChips}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mv10}
            />
            <ZInput
              placeHolder={strings.search}
              _value={search}
              keyBoardType={'default'}
              autoCapitalize={'none'}
              insideLeftIcon={() => <SearchIcon />}
              toGetTextFieldValue={onSearchInput}
              inputContainerStyle={[
                {backgroundColor: colors.inputBg},
                localStyles.inputContainerStyle,
                searchInputStyle,
              ]}
              inputBoxStyle={[localStyles.inputBoxStyle]}
              _onFocus={onHighlightInput}
              onBlur={onUnHighlightInput}
              rightAccessory={() => <Control />}
            />
            {!!faqData.length ? (
              <RenderHelper helperData={faqData} />
            ) : (
              <View>
                <ZText
                  style={styles.mt15}
                  color={colors.primary}
                  align={'center'}
                  type={'b22'}>
                  {strings.noResultFound}
                </ZText>
                <ZText
                  style={styles.mt15}
                  color={colors.textColor}
                  align={'center'}
                  type={'r18'}>
                  {strings.noResultFoundDesc}
                </ZText>
              </View>
            )}
          </View>
        ) : (
          <ContactUsRender />
        )}
      </ScrollView>
    </ZSafeAreaView>
  );
};

export default HelpCenter;

const localStyles = StyleSheet.create({
  mainContainer: {
    ...styles.flexRow,
    width: '100%',
  },
  root: {
    borderBottomWidth: moderateScale(2),
    width: '50%',
  },
  inputContainerStyle: {
    borderRadius: moderateScale(15),
    borderWidth: moderateScale(1),
  },
  inputBoxStyle: {
    ...styles.ph15,
  },
  controlContainer: {
    ...styles.p15,
    ...styles.rowCenter,
    ...styles.ml10,
    ...styles.mt5,
    borderRadius: moderateScale(15),
  },
  chipsContainer: {
    ...styles.ph20,
    ...styles.pv10,
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(25),
    ...styles.mt15,
    ...styles.mh5,
  },
  contactUsContainer: {
    ...styles.mt20,
    ...styles.pv20,
    borderRadius: moderateScale(15),
    ...styles.flexRow,
    ...styles.contentCenter,
  },
});
