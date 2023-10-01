// Library import
import {StyleSheet, View} from 'react-native';
import React from 'react';
import {useSelector} from 'react-redux';
import ActionSheet from 'react-native-actions-sheet';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';

// Custom import
import {moderateScale} from '../../common/constants';
import {styles} from '../../themes';
import ZText from '../common/ZText';
import ZButton from '../common/ZButton';

const Location = props => {
  const {
    SheetRef,
    setLocations,
    locationIndexToEdit,
    setlocationIndexToEdit,
    locations,
  } = props;
  const colors = useSelector(state => state.theme.theme);

  const handleLocations = (data, details = null) => {
    // 'details' is provided when fetchDetails = true
    if (locationIndexToEdit === undefined) {
      setLocations(existinglocations => {
        return [
          ...(existinglocations || []),
          ...[
            {
              description: data.description,
              lat: details.geometry.location.lat,
              long: details.geometry.location.lng,
            },
          ],
        ];
      });
    } else {
      const tempLocations = [...locations];
      tempLocations[locationIndexToEdit] = {
        description: data.description,
        lat: details.geometry.location.lat,
        long: details.geometry.location.lng,
      };
      setLocations(tempLocations);
      setlocationIndexToEdit(undefined);
    }
    SheetRef.current.hide();
  };

  return (
    <ActionSheet
      ref={SheetRef}
      gestureEnabled={true}
      indicatorStyle={{width: moderateScale(100)}}
      containerStyle={[
        localStyles.actionSheetContainer,
        {backgroundColor: colors.backgroundColor},
      ]}>
      <ZText>{!locationIndexToEdit ? 'Add Location' : 'Edit Location'}</ZText>
      <View style={localStyles.bottomContainer}>
        <GooglePlacesAutocomplete
          placeholder="Search"
          fetchDetails
          styles={{width: '120%'}}
          onPress={handleLocations}
          query={{
            key: '***REMOVED***',
            language: 'ar',
            components: 'country:eg',
          }}
        />
        <ZButton onPress={() => SheetRef.current.hide()} title={'Submit'} />
      </View>
    </ActionSheet>
  );
};

const localStyles = StyleSheet.create({
  actionSheetContainer: {
    ...styles.p25,
    height: 300,
  },
  contextContainer: {
    ...styles.flexRow,
    ...styles.itemsCenter,
    ...styles.mt20,
    ...styles.p15,
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(15),
  },
  bottomContainer: {
    width: '120%',
    ...styles.selfCenter,
    flex: 1,
    paddingHorizontal: moderateScale(40),
    ...styles.mv30,
  },
});

export default Location;
