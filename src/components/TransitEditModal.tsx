import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { fontFamily, responsiveWidth } from '../constant/theme';

const NAVY = '#1A3673';
const GOLD = '#C5A370';
const GOOGLE_MAPS_API_KEY = 'AIzaSyCRiOhv-8F7NUHE22gm9zres6rVFwlkXEE';

export type TransitEditPayload = {
  day: number;
  month: number;
  year: number;
  hour: number;
  min: number;
  birthplace: string;
  lat: number;
  lon: number;
  tzone: number;
};

type PlaceItem = {
  label: string;
  place_id: string;
};

type TransitEditModalProps = {
  visible: boolean;
  saving?: boolean;
  initialDay: number;
  initialMonth: number;
  initialYear: number;
  initialHour: number;
  initialMin: number;
  initialPlace: string;
  initialLat: number;
  initialLon: number;
  initialTzone: number;
  onClose: () => void;
  onSave: (payload: TransitEditPayload) => void;
};

const parseNumber = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const TransitEditModal = ({
  visible,
  saving = false,
  initialDay,
  initialMonth,
  initialYear,
  initialHour,
  initialMin,
  initialPlace,
  initialLat,
  initialLon,
  initialTzone,
  onClose,
  onSave,
}: TransitEditModalProps) => {
  const [day, setDay] = useState(String(initialDay));
  const [month, setMonth] = useState(String(initialMonth));
  const [year, setYear] = useState(String(initialYear));
  const [hour, setHour] = useState(String(initialHour));
  const [minute, setMinute] = useState(String(initialMin));
  const [place, setPlace] = useState(initialPlace);
  const [lat, setLat] = useState(initialLat);
  const [lon, setLon] = useState(initialLon);
  const [tzone, setTzone] = useState(initialTzone);
  const [placeQuery, setPlaceQuery] = useState('');
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [showPlaceList, setShowPlaceList] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setDay(String(initialDay));
    setMonth(String(initialMonth));
    setYear(String(initialYear));
    setHour(String(initialHour));
    setMinute(String(initialMin));
    setPlace(initialPlace);
    setLat(initialLat);
    setLon(initialLon);
    setTzone(initialTzone);
    setPlaceQuery('');
    setPlaces([]);
    setShowPlaceList(false);
  }, [
    visible,
    initialDay,
    initialMonth,
    initialYear,
    initialHour,
    initialMin,
    initialPlace,
    initialLat,
    initialLon,
    initialTzone,
  ]);

  useEffect(() => {
    if (!visible || !placeQuery.trim()) {
      setPlaces([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            placeQuery,
          )}&key=${GOOGLE_MAPS_API_KEY}&types=geocode`,
        );
        const data = await response.json();
        if (data.status === 'OK') {
          setPlaces(
            data.predictions.map((item: { description: string; place_id: string }) => ({
              label: item.description,
              place_id: item.place_id,
            })),
          );
          setShowPlaceList(true);
        } else {
          setPlaces([]);
        }
      } catch {
        setPlaces([]);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [placeQuery, visible]);

  const handlePlaceSelect = async (item: PlaceItem) => {
    try {
      const detailsRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.place_id}&key=${GOOGLE_MAPS_API_KEY}`,
      );
      const detailsData = await detailsRes.json();
      const location = detailsData.result?.geometry?.location;

      if (!location) {
        return;
      }

      setPlace(item.label);
      setLat(location.lat);
      setLon(location.lng);
      setPlaceQuery('');
      setPlaces([]);
      setShowPlaceList(false);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Unable to fetch place details.',
      });
    }
  };

  const handleSave = () => {
    const trimmedPlace = place.trim();
    if (!trimmedPlace) {
      Toast.show({
        type: 'error',
        text1: 'Place required',
        text2: 'Please enter a valid place.',
      });
      return;
    }

    onSave({
      day: parseNumber(day, initialDay),
      month: parseNumber(month, initialMonth),
      year: parseNumber(year, initialYear),
      hour: parseNumber(hour, initialHour),
      min: parseNumber(minute, initialMin),
      birthplace: trimmedPlace,
      lat,
      lon,
      tzone,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Update Details</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>Transit Details</Text>

            <View style={styles.fieldFull}>
              <Text style={styles.label}>Date</Text>
              <View style={styles.row}>
                <View style={styles.fieldSmall}>
                  <TextInput
                    style={styles.input}
                    value={day}
                    onChangeText={setDay}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="DD"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.fieldSmall}>
                  <TextInput
                    style={styles.input}
                    value={month}
                    onChangeText={setMonth}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="MM"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.fieldYear}>
                  <TextInput
                    style={styles.input}
                    value={year}
                    onChangeText={setYear}
                    keyboardType="number-pad"
                    maxLength={4}
                    placeholder="YYYY"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>

            <View style={styles.fieldFull}>
              <Text style={styles.label}>Time</Text>
              <View style={styles.row}>
                <View style={styles.fieldHalf}>
                  <TextInput
                    style={styles.input}
                    value={hour}
                    onChangeText={setHour}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="HH"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <TextInput
                    style={styles.input}
                    value={minute}
                    onChangeText={setMinute}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="MM"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>

            <View style={styles.fieldFull}>
              <Text style={styles.label}>Place</Text>
              <TextInput
                style={styles.input}
                value={showPlaceList ? placeQuery : place}
                onChangeText={text => {
                  setPlaceQuery(text);
                  setPlace(text);
                  setShowPlaceList(true);
                }}
                onFocus={() => {
                  setPlaceQuery(place);
                  setShowPlaceList(true);
                }}
                placeholder="Search place..."
                placeholderTextColor="#9CA3AF"
              />
              {showPlaceList && places.length > 0 ? (
                <View style={styles.placeList}>
                  {places.map(item => (
                    <TouchableOpacity
                      key={item.place_id}
                      style={styles.placeItem}
                      onPress={() => handlePlaceSelect(item)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.placeItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color={NAVY} />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: responsiveWidth('5'),
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    maxHeight: '82%',
  },
  header: {
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: responsiveWidth('4'),
    paddingVertical: responsiveWidth('3.5'),
    position: 'relative',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: responsiveWidth('3'),
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 20,
  },
  body: {
    maxHeight: responsiveWidth('95'),
  },
  bodyContent: {
    padding: responsiveWidth('4'),
    gap: responsiveWidth('3'),
  },
  sectionTitle: {
    color: NAVY,
    fontSize: 15,
    fontFamily: fontFamily.semiBold,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldSmall: {
    flex: 1,
  },
  fieldYear: {
    flex: 1.4,
  },
  fieldHalf: {
    flex: 1,
  },
  fieldFull: {
    width: '100%',
  },
  label: {
    color: NAVY,
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: NAVY,
    backgroundColor: '#FFFFFF',
  },
  placeList: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
    maxHeight: 160,
  },
  placeItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  placeItemText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: NAVY,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: responsiveWidth('4'),
    paddingVertical: responsiveWidth('4'),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelBtn: {
    minWidth: 110,
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: NAVY,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: NAVY,
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
  },
  saveBtn: {
    minWidth: 130,
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: NAVY,
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
  },
});

export default TransitEditModal;
