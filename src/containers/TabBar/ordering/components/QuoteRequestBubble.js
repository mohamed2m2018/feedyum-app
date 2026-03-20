import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZText from '../../../../components/common/ZText';
import { moderateScale } from '../../../../common/constants';
import strings from '../../../../i18n/strings';
import { formatTime } from '../../../../utils/helpers';

const QuoteRequestBubble = ({
  quoteRequest,
  isCurrentUser,
  isChef = false,
  colors,
  createdAt,
  language,
  onSetPrice,
  orderPrice,
  orderStatus,
}) => {
  const { dishName, selectedOptions, notes } = quoteRequest;

  return (
    <View style={styles.container}>
      {/* Header Badge */}
      <View style={[styles.headerBadge, { backgroundColor: colors.primary + '20' }]}>
        <Ionicons name="document-text" size={moderateScale(14)} color={colors.primary} />
        <ZText type="B12" color={colors.primary} style={styles.headerText}>
          {strings.quoteRequest}
        </ZText>
      </View>

      {/* Dish Name */}
      <ZText type="B16" color={isCurrentUser ? colors.white : colors.textColor} style={styles.dishName}>
        {dishName}
      </ZText>

      {/* Selected Options */}
      {selectedOptions?.length > 0 && (
        <View style={styles.optionsContainer}>
          {selectedOptions.map((option, idx) => (
            <View
              key={idx}
              style={[styles.optionChip, {
                backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.2)' : colors.primary + '15',
              }]}
            >
              <ZText type="R12" color={isCurrentUser ? colors.white : colors.primary}>
                {option}
              </ZText>
            </View>
          ))}
        </View>
      )}

      {/* Customer Notes */}
      {notes ? (
        <View style={[styles.notesContainer, {
          backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.1)' : colors.backgroundColor,
          borderColor: isCurrentUser ? 'rgba(255,255,255,0.15)' : colors.bColor,
        }]}>
          <Ionicons
            name="chatbubble-outline"
            size={moderateScale(12)}
            color={isCurrentUser ? 'rgba(255,255,255,0.6)' : colors.grayScale7}
            style={styles.notesIcon}
          />
          <ZText
            type="R13"
            color={isCurrentUser ? 'rgba(255,255,255,0.85)' : colors.textColor}
            style={styles.notesText}
          >
            {notes}
          </ZText>
        </View>
      ) : null}

      {/* Quoted Price — clean inline row */}
      {orderPrice > 0 && (
        <View style={styles.priceRow}>
          <ZText type="M13" color={isCurrentUser ? 'rgba(255,255,255,0.7)' : colors.grayScale7}>
            {strings.offeredQuote}
          </ZText>
          <ZText type="B16" color={isCurrentUser ? colors.white : colors.primary} style={{ marginLeft: moderateScale(6) }}>
            {orderPrice.toFixed(0)} {strings.EGP || 'EGP'}
          </ZText>
        </View>
      )}

      {/* Set/Edit Price — subtle text link for chef */}
      {isChef && onSetPrice && (
        <TouchableOpacity
          onPress={onSetPrice}
          activeOpacity={0.7}
          style={styles.setPriceLink}
        >
          <Ionicons
            name={orderPrice > 0 ? 'create-outline' : 'pricetag-outline'}
            size={moderateScale(13)}
            color={isCurrentUser ? 'rgba(255,255,255,0.8)' : colors.primary}
            style={{ marginRight: moderateScale(4) }}
          />
          <ZText type="B13" color={isCurrentUser ? 'rgba(255,255,255,0.8)' : colors.primary}>
            {orderPrice > 0
              ? (strings.editQuotePrice || 'Edit Price')
              : (strings.setQuotePrice || 'Set Price')}
          </ZText>
        </TouchableOpacity>
      )}

      {/* Time */}
      <ZText
        type="R10"
        color={isCurrentUser ? 'rgba(255,255,255,0.5)' : colors.grayScale5}
        style={styles.time}
      >
        {formatTime(createdAt, language)}
      </ZText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: moderateScale(12),
    minWidth: moderateScale(200),
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(8),
  },
  headerText: {
    marginLeft: moderateScale(4),
  },
  dishName: {
    marginBottom: moderateScale(8),
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
    marginBottom: moderateScale(8),
  },
  optionChip: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(8),
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: moderateScale(10),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    marginBottom: moderateScale(4),
  },
  notesIcon: {
    marginRight: moderateScale(6),
    marginTop: moderateScale(2),
  },
  notesText: {
    flex: 1,
    flexShrink: 1,
    lineHeight: moderateScale(18),
  },
  setPriceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(6),
  },
  time: {
    marginTop: moderateScale(6),
    alignSelf: 'flex-end',
  },
});

export default QuoteRequestBubble;

