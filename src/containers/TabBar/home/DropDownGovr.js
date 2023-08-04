import React from 'react';
import {SelectList} from 'react-native-dropdown-select-list';
import {I18nManager, StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import strings from '../../../i18n/strings';
export const governorates = [
  {key: '1', value: 'Alexandria', arabicValue: 'الإسكندرية'},
  {key: '2', value: 'Aswan', arabicValue: 'أسوان'},
  {key: '3', value: 'Asyut', arabicValue: 'أسيوط'},
  {key: '4', value: 'Beheira', arabicValue: 'البحيرة'},
  {key: '5', value: 'Beni Suef', arabicValue: 'بني سويف'},
  {key: '6', value: 'Cairo', arabicValue: 'القاهرة'},
  {key: '7', value: 'Dakahlia', arabicValue: 'الدقهلية'},
  {key: '8', value: 'Damietta', arabicValue: 'دمياط'},
  {key: '9', value: 'Faiyum', arabicValue: 'الفيوم'},
  {key: '10', value: 'Gharbia', arabicValue: 'الغربية'},
  {key: '11', value: 'Giza', arabicValue: 'الجيزة'},
  {key: '12', value: 'Ismailia', arabicValue: 'الإسماعيلية'},
  {key: '13', value: 'Kafr El Sheikh', arabicValue: 'كفر الشيخ'},
  {key: '14', value: 'Luxor', arabicValue: 'الأقصر'},
  {key: '15', value: 'Matrouh', arabicValue: 'مطروح'},
  {key: '16', value: 'Minya', arabicValue: 'المنيا'},
  {key: '17', value: 'Monufia', arabicValue: 'المنوفية'},
  {
    key: '18',
    value: 'New Valley (Al Wadi Al Jadid)',
    arabicValue: 'الوادي الجديد',
  },
  {key: '19', value: 'North Sinai (Shamal Sina)', arabicValue: 'شمال سيناء'},
  {key: '20', value: 'Port Said', arabicValue: 'بورسعيد'},
  {key: '21', value: 'Qalyubia', arabicValue: 'القليوبية'},
  {key: '22', value: 'Qena', arabicValue: 'قنا'},
  {
    key: '23',
    value: 'Red Sea (Al Bahr al Ahmar)',
    arabicValue: 'البحر الأحمر',
  },
  {key: '24', value: 'Sharqia', arabicValue: 'الشرقية'},
  {key: '25', value: 'Sohag', arabicValue: 'سوهاج'},
  {key: '26', value: 'South Sinai (Janub Sina)', arabicValue: 'جنوب سيناء'},
  {key: '27', value: 'Suez', arabicValue: 'السويس'},
];

const arabicGovernorates = [
  {key: '1', value: 'الإسكندرية'},
  {key: '2', value: 'أسوان'},
  {key: '3', value: 'أسيوط'},
  {key: '4', value: 'البحيرة'},
  {key: '5', value: 'بني سويف'},
  {key: '6', value: 'القاهرة'},
  {key: '7', value: 'الدقهلية'},
  {key: '8', value: 'دمياط'},
  {key: '9', value: 'الفيوم'},
  {key: '10', value: 'الغربية'},
  {key: '11', value: 'الجيزة'},
  {key: '12', value: 'الإسماعيلية'},
  {key: '13', value: 'كفر الشيخ'},
  {key: '14', value: 'الأقصر'},
  {key: '15', value: 'مطروح'},
  {key: '16', value: 'المنيا'},
  {key: '17', value: 'المنوفية'},
  {key: '18', value: 'الوادي الجديد'},
  {key: '19', value: 'شمال سيناء'},
  {key: '20', value: 'بورسعيد'},
  {key: '21', value: 'القليوبية'},
  {key: '22', value: 'قنا'},
  {key: '23', value: 'البحر الأحمر'},
  {key: '24', value: 'الشرقية'},
  {key: '25', value: 'سوهاج'},
  {key: '26', value: 'جنوب سيناء'},
  {key: '27', value: 'السويس'},
];

const DropdownGovr = ({postedData, setpostedData}) => {
  const colors = useSelector(state => state.theme.theme);

  const styles = {
    container: {
      flex: 1,
      margin: 20,
    },
    selectBox: {
      borderRadius: 12,
      backgroundColor: colors.inputBg,
      borderColor: colors.bColor,
      paddingVertical: 10,
      paddingHorizontal: 12,
      width: '95%',
      marginTop: 14,
    },
    selectTextGover: {
      color: postedData?.governorate?.length
        ? colors.textColor
        : colors?.placeHolderColor, // Dark mode select text color
    },
    selectTextAreas: {
      color: postedData?.areas?.length
        ? colors.textColor
        : colors?.placeHolderColor, // Dark mode select text color
    },
    dropdown: {
      borderRadius: 8,
      boderWidth: 0,
      width: '95%',
    },
    dropdownItem: {
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    dropdownText: {
      color: colors.textColor, // Dark mode dropdown text color
    },
    disabledItem: {
      opacity: 0.5,
    },
    disabledText: {
      color: colors.textColor, // Dark mode dropdown text color
    },
  };

  const areas = {
    Alexandria: [
      {key: '1', value: 'Agamy'},
      {key: '2', value: 'Borg El Arab'},
      {key: '3', value: 'Montaza'},
      // Add more areas in Alexandria here
    ],
    Aswan: [
      {key: '1', value: 'Aswan City'},
      {key: '2', value: 'Kom Ombo'},
      {key: '3', value: 'Edfu'},
      // Add more areas in Aswan here
    ],
    Asyut: [
      {key: '1', value: 'Asyut City'},
      {key: '2', value: 'Dairut'},
      {key: '3', value: 'Abnub'},
      // Add more areas in Asyut here
    ],
    Beheira: [
      {key: '1', value: 'Damanhur'},
      {key: '2', value: 'Rosetta'},
      {key: '3', value: 'Edko'},
      // Add more areas in Beheira here
    ],
    BeniSuef: [
      {key: '1', value: 'Beni Suef City'},
      {key: '2', value: 'Al Wasty'},
      {key: '3', value: 'Naser'},
      // Add more areas in Beni Suef here
    ],
    Cairo: [
      {key: '1', value: 'Nasr City'},
      {key: '2', value: 'Maadi'},
      {key: '3', value: 'Heliopolis'},
      // Add more areas in Cairo here
    ],
    Dakahlia: [
      {key: '1', value: 'Mansoura'},
      {key: '2', value: 'Talkha'},
      {key: '3', value: 'Aga'},
      // Add more areas in Dakahlia here
    ],
    Damietta: [
      {key: '1', value: 'Damietta City'},
      {key: '2', value: 'Faraskur'},
      {key: '3', value: 'Zarqa'},
      // Add more areas in Damietta here
    ],
    Faiyum: [
      {key: '1', value: 'Faiyum City'},
      {key: '2', value: 'Tamiya'},
      {key: '3', value: 'Sinnuris'},
      // Add more areas in Faiyum here
    ],
    Gharbia: [
      {key: '1', value: 'Tanta'},
      {key: '2', value: 'Kafr El Zayat'},
      {key: '3', value: 'Mahalla'},
      // Add more areas in Gharbia here
    ],
    Giza: [
      {key: '1', value: 'Giza City'},
      {key: '2', value: '6th of October City'},
      {key: '3', value: 'Sheikh Zayed City'},
      // Add more areas in Giza here
    ],
    Ismailia: [
      {key: '1', value: 'Ismailia City'},
      {key: '2', value: 'Fayed'},
      {key: '3', value: 'Qantara Sharq'},
      // Add more areas in Ismailia here
    ],
    KafrElSheikh: [
      {key: '1', value: 'Kafr El Sheikh City'},
      {key: '2', value: 'Desouk'},
      {key: '3', value: 'Burg El Burullus'},
      // Add more areas in Kafr El Sheikh here
    ],
    Luxor: [
      {key: '1', value: 'Luxor City'},
      {key: '2', value: 'Karnak'},
      {key: '3', value: 'Al Bayadeya'},
      // Add more areas in Luxor here
    ],
    Matrouh: [
      {key: '1', value: 'Marsa Matrouh'},
      {key: '2', value: 'El Hamam'},
      {key: '3', value: 'Al Alamein'},
      // Add more areas in Matrouh here
    ],
    Minya: [
      {key: '1', value: 'Minya City'},
      {key: '2', value: 'Maghagha'},
      {key: '3', value: 'Samalut'},
      // Add more areas in Minya here
    ],
    Monufia: [
      {key: '1', value: 'Shibin El Kom'},
      {key: '2', value: 'Ashmoun'},
      {key: '3', value: 'Tala'},
      // Add more areas in Monufia here
    ],
    'New Valley (Al Wadi Al Jadid)': [
      {key: '1', value: 'Kharga'},
      {key: '2', value: 'Dakhla'},
      {key: '3', value: 'Farafra'},
      // Add more areas in New Valley here
    ],
    'North Sinai (Shamal Sina)': [
      {key: '1', value: 'Arish'},
      {key: '2', value: 'Rafah'},
      {key: '3', value: 'Sheikh Zuweid'},
      // Add more areas in North Sinai here
    ],
    'Port Said': [
      {key: '1', value: 'Port Fouad'},
      {key: '2', value: 'Port Said City'},
      // Add more areas in Port Said here
    ],
    Qalyubia: [
      {key: '1', value: 'Banha'},
      {key: '2', value: 'Qalyub'},
      {key: '3', value: 'Shibin El Qanater'},
      // Add more areas in Qalyubia here
    ],
    Qena: [
      {key: '1', value: 'Qena City'},
      {key: '2', value: 'Luxor'},
      {key: '3', value: 'Nag Hammadi'},
      // Add more areas in Qena here
    ],
    'Red Sea (Al Bahr al Ahmar)': [
      {key: '1', value: 'Hurghada'},
      {key: '2', value: 'Marsa Alam'},
      {key: '3', value: 'El Gouna'},
      // Add more areas in Red Sea here
    ],
    Sharqia: [
      {key: '1', value: 'Zagazig'},
      {key: '2', value: 'Ibrahimia'},
      {key: '3', value: 'Husseiniya'},
      // Add more areas in Sharqia here
    ],
    Sohag: [
      {key: '1', value: 'Sohag City'},
      {key: '2', value: 'Akhmim'},
      {key: '3', value: 'Gerga'},
      // Add more areas in Sohag here
    ],
    'South Sinai (Janub Sina)': [
      {key: '1', value: 'Sharm El Sheikh'},
      {key: '2', value: 'Dahab'},
      {key: '3', value: 'Nuweiba'},
      // Add more areas in South Sinai here
    ],
    Suez: [
      {key: '1', value: 'Suez City'},
      {key: '2', value: 'Ataqah'},
      {key: '3', value: 'Ras Ghareb'},
      // Add more areas in Suez here
    ],
  };

  const handleGovernoratesSelection = values => {
    if (isNaN(values)) {
      const value = I18nManager.isRTL
        ? governorates.find(element => element.arabicValue === values).value
        : values;
      setpostedData(currentState => ({
        ...currentState,
        governorate: value,
        areas: [],
      }));
    }
  };

  const handleAreasSelection = values => {
    setpostedData(currentState => ({
      ...currentState,
      areas: values,
    }));
  };

  return (
    <View>
      <SelectList
        setSelected={handleGovernoratesSelection}
        data={I18nManager.isRTL ? arabicGovernorates : governorates || []}
        save="value"
        placeholder={strings.selectGov}
        boxStyles={styles.selectBox}
        inputStyles={styles.selectTextGover}
        dropdownStyles={styles.dropdown}
        dropdownItemStyles={styles.dropdownItem}
        dropdownTextStyles={styles.dropdownText}
        disabledItemStyles={styles.disabledItem}
        disabledTextStyles={styles.disabledText}
        defaultOption={governorates?.find(
          data => data?.value === postedData?.governorate,
        )}
        arrowicon={
          <FontAwesome
            style={{paddingRight: 10}}
            name="chevron-down"
            size={12}
            color={colors.textColor}
          />
        }
        searchicon={
          <FontAwesome
            style={{paddingRight: 10}}
            name="search"
            size={12}
            color={colors.textColor}
          />
        }
        closeicon={
          <FontAwesome
            style={{paddingRight: 10}}
            name="close"
            size={12}
            color={colors.textColor}
          />
        }
      />
      {/* <MultipleSelectList
        setSelected={handleAreasSelection}
        data={areas[postedData.governorate] || []}
        save="value"
        multiple={true}
        placeholder="Select areas"
        arrowicon={
          <FontAwesome
            style={{paddingRight: 10}}
            name="chevron-down"
            size={12}
            color={'white'}
          />
        }
        searchicon={
          <FontAwesome
            style={{paddingRight: 10}}
            name="search"
            size={12}
            color={'white'}
          />
        }
        closeicon={
          <FontAwesome
            style={{paddingRight: 10}}
            name="close"
            size={12}
            color={'white'}
          />
        }
        checkBoxStyles={{backgroundColor: colors.textColor}}
        boxStyles={styles.selectBox}
        inputStyles={styles.selectTextAreas}
        dropdownStyles={styles.dropdown}
        dropdownItemStyles={styles.dropdownItem}
        dropdownTextStyles={styles.dropdownText}
        disabledItemStyles={styles.disabledItem}
        disabledTextStyles={styles.disabledText}
      /> */}
    </View>
  );
};

const styles = StyleSheet.create(styles);

export default DropdownGovr;
