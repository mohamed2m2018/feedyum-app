// Library Imports
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Local Imports
import ZSafeAreaView from '../../components/common/ZSafeAreaView';
import ZHeader from '../../components/common/ZHeader';
import { styles } from '../../themes';
import strings from '../../i18n/strings';
import ZText from '../../components/common/ZText';
import { moderateScale, screenWidth } from '../../common/constants';
import { StackNav } from '../../navigation/NavigationKeys';
import ZButton from '../../components/common/ZButton';
import { useRoute } from '@react-navigation/native';
import request from '../../api/request';
import { useQuery } from 'react-query';
import { getCategoryEmoji } from '../../utils/categoryEmojis';

const CARD_GAP = moderateScale(10);
const CARD_WIDTH = (screenWidth - moderateScale(16) * 2 - CARD_GAP * 2) / 3;

const SelectInterest = ({ navigation }) => {
  const colors = useSelector(state => state.theme.theme);
  const [selectedChips, setSelectedChips] = useState([]);
  const [chips, setchips] = useState([]);
  const route = useRoute();
  const {
    email = '',
    password = '',
    type = '',
  } = route.params || { email: '', password: '', type: '' };

  const { isLoading } = useQuery(
    'categories',
    () => request.get('/categories').then(res => setchips(res.data)),
    {
      retry: 0,
    },
  );

  const onPressChips = useCallback((value) => {
    setSelectedChips(prev => {
      if (prev.includes(value)) {
        return prev.filter(item => item !== value);
      }
      return [...prev, value];
    });
  }, []);

  const onPressContinue = () => { };

  const renderCategoryItem = useCallback(({ item }) => {
    const isSelected = selectedChips.includes(item?.name);
    const emoji = getCategoryEmoji(item?.name);

    return (
      <TouchableOpacity
        onPress={() => onPressChips(item?.name)}
        style={[
          localStyles.card,
          {
            backgroundColor: colors.dark ? colors.inputBg : colors.white,
            borderColor: isSelected ? colors.primary : (colors.dark ? colors.grayScale8 : colors.grayScale3),
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        activeOpacity={0.7}
      >
        {/* Food Image */}
        {item?.image ? (
          <Image
            source={{ uri: item.image }}
            style={localStyles.foodImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[localStyles.emojiCircle, { backgroundColor: colors.primary + '15' }]}>
            <ZText type={'b22'}>{emoji}</ZText>
          </View>
        )}

        {/* Category Name */}
        <ZText
          type={'s12'}
          numberOfLines={2}
          align={'center'}
          color={isSelected ? colors.primary : colors.textColor}
          style={localStyles.cardName}
        >
          {item?.name}
        </ZText>

        {/* Selected Check */}
        {isSelected && (
          <View style={[localStyles.checkBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={moderateScale(10)} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  }, [selectedChips, colors, onPressChips]);

  return (
    <ZSafeAreaView>
      <ZHeader title={strings.selectInterest} />
      {isLoading ? (
        <View style={localStyles.loadingContainer}>
          <ActivityIndicator size={'large'} color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={chips}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item?._id}
          numColumns={3}
          columnWrapperStyle={localStyles.row}
          contentContainerStyle={localStyles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <ZText type={'m14'} color={colors.grayScale5} style={localStyles.subtitle}>
              {strings.selectInterestDescription}
            </ZText>
          }
          ListFooterComponent={<View style={{ height: moderateScale(80) }} />}
        />
      )}
      {/* Floating Continue Button */}
      <View style={[localStyles.btnWrapper, { backgroundColor: colors.dark ? colors.backgroundColor + 'F0' : '#fff' + 'F0' }]}>
        <TouchableOpacity onPress={onPressContinue} activeOpacity={0.8}>
          <LinearGradient
            colors={[colors.primary, colors.lightRed || '#FF7B8E']}
            style={localStyles.continueBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <ZText type={'b16'} color={'#fff'}>
              {strings.continue}
            </ZText>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ZSafeAreaView>
  );
};

export default SelectInterest;

const localStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    marginBottom: moderateScale(16),
  },
  listContent: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(12),
  },
  row: {
    justifyContent: 'flex-start',
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: moderateScale(14),
    alignItems: 'center',
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(10),
    paddingHorizontal: moderateScale(4),
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  foodImage: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    marginBottom: moderateScale(6),
  },
  emojiCircle: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(6),
  },
  cardName: {
    lineHeight: moderateScale(15),
    minHeight: moderateScale(30),
  },
  checkBadge: {
    position: 'absolute',
    top: moderateScale(5),
    right: moderateScale(5),
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(24),
  },
  continueBtn: {
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
