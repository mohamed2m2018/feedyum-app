// Library import
import {BackHandler, StyleSheet, View} from 'react-native';
import React from 'react';
import {useSelector} from 'react-redux';
import FreeAddressSearch from '../FreeAddressSearch';

// Custom import
import {moderateScale} from '../../common/constants';
import {styles} from '../../themes';
import ZText from '../common/ZText';
import strings from '../../i18n/strings';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';

const Location = () => {
  const {params} = useRoute();
  const {goBack} = useNavigation();
  const {setLocations, locationIndexToEdit, setlocationIndexToEdit, locations} =
    params;
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
    goBack();
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        setlocationIndexToEdit(undefined);
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => subscription.remove();
    }, [setlocationIndexToEdit]),
  );

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
      }}>
      <ZText type={'B26'} style={{marginTop: 5}} color={colors.textColor}>
        {locationIndexToEdit === undefined
          ? strings.addLocation
          : strings.editLocation}
      </ZText>
      <View style={localStyles.bottomContainer}>
        <FreeAddressSearch
          placeholder={strings.search}
          onLocationSelect={handleLocations}
          autoFocus={true}
        />
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  actionSheetContainer: {
    backgroundColor: 'black',
    flex: 1,
  },
  contextContainer: {
    ...styles.flexRow,
    ...styles.itemsCenter,
    backgroundColor: 'black',
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(15),
  },
  bottomContainer: {
    ...styles.selfCenter,
    ...styles.mv30,
    width: '90%',
    flex: 1,
  },
});

export default Location;
