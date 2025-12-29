import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#D4AF37';
const BLACK = '#000000';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function EditPropertyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [area, setArea] = useState('Beirut');
  const [locationDetail, setLocationDetail] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [propertyType, setPropertyType] = useState('Apartment');
  const [sizeSqm, setSizeSqm] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [floorLevel, setFloorLevel] = useState('');
  const [viewType, setViewType] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/properties/${id}`);
      const prop = response.data;
      
      setTitle(prop.title);
      setArea(prop.area);
      setLocationDetail(prop.location_detail);
      setPriceUsd(prop.price_usd.toString());
      setPropertyType(prop.property_type);
      setSizeSqm(prop.size_sqm.toString());
      setBedrooms(prop.bedrooms?.toString() || '');
      setBathrooms(prop.bathrooms?.toString() || '');
      setFloorLevel(prop.floor_level || '');
      setViewType(prop.view_type || '');
      setDescription(prop.description);
      setStatus(prop.status);
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to load property');
      router.back();
    }
  };

  const handleSave = async () => {
    if (!title || !area || !locationDetail || !priceUsd || !sizeSqm || !description) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('admin_token');
      
      const updateData: any = {
        title,
        area,
        location_detail: locationDetail,
        price_usd: Number(priceUsd),
        property_type: propertyType,
        size_sqm: Number(sizeSqm),
        description,
        status,
      };

      if (bedrooms) updateData.bedrooms = Number(bedrooms);
      if (bathrooms) updateData.bathrooms = Number(bathrooms);
      if (floorLevel) updateData.floor_level = floorLevel;
      if (viewType) updateData.view_type = viewType;

      await axios.put(`${BACKEND_URL}/api/properties/${id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('Success', 'Property updated successfully!');
      router.push('/admin/properties');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update property');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Property',
          headerStyle: { backgroundColor: BLACK },
          headerTintColor: GOLD,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.push('/admin/properties')}>
              <Ionicons name="arrow-back" size={24} color={GOLD} style={{ marginLeft: 16 }} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>Property Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Property title"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Area *</Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[styles.segment, area === 'Beirut' && styles.segmentActive]}
                onPress={() => setArea('Beirut')}
              >
                <Text style={[styles.segmentText, area === 'Beirut' && styles.segmentTextActive]}>
                  Beirut
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segment, area === 'Mount Lebanon' && styles.segmentActive]}
                onPress={() => setArea('Mount Lebanon')}
              >
                <Text style={[styles.segmentText, area === 'Mount Lebanon' && styles.segmentTextActive]}>
                  Mount Lebanon
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segment, area === 'North Lebanon' && styles.segmentActive]}
                onPress={() => setArea('North Lebanon')}
              >
                <Text style={[styles.segmentText, area === 'North Lebanon' && styles.segmentTextActive]}>
                  North Lebanon
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segment, area === 'Keserwan' && styles.segmentActive]}
                onPress={() => setArea('Keserwan')}
              >
                <Text style={[styles.segmentText, area === 'Keserwan' && styles.segmentTextActive]}>
                  Keserwan
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Location Detail *</Text>
            <TextInput
              style={styles.input}
              value={locationDetail}
              onChangeText={setLocationDetail}
              placeholder="e.g., Achrafieh, Sassine"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Price (USD) *</Text>
            <TextInput
              style={styles.input}
              value={priceUsd}
              onChangeText={setPriceUsd}
              placeholder="450000"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Property Type *</Text>
            <View style={styles.typeGrid}>
              {['Apartment', 'Villa', 'House', 'Chalet', 'Office', 'Land'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeButton, propertyType === type && styles.typeButtonActive]}
                  onPress={() => setPropertyType(type)}
                >
                  <Text style={[styles.typeButtonText, propertyType === type && styles.typeButtonTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Size (sqm) *</Text>
            <TextInput
              style={styles.input}
              value={sizeSqm}
              onChangeText={setSizeSqm}
              placeholder="250"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Bedrooms</Text>
            <TextInput
              style={styles.input}
              value={bedrooms}
              onChangeText={setBedrooms}
              placeholder="3"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Bathrooms</Text>
            <TextInput
              style={styles.input}
              value={bathrooms}
              onChangeText={setBathrooms}
              placeholder="2"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Floor Level</Text>
            <TextInput
              style={styles.input}
              value={floorLevel}
              onChangeText={setFloorLevel}
              placeholder="5th Floor"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>View Type</Text>
            <TextInput
              style={styles.input}
              value={viewType}
              onChangeText={setViewType}
              placeholder="Sea View, Mountain View"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Detailed description..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={6}
            />

            <Text style={styles.label}>Status *</Text>
            <View style={styles.statusButtons}>
              {['active', 'draft', 'sold'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusButton, status === s && styles.statusButtonActive]}
                  onPress={() => setStatus(s)}
                >
                  <Text style={[styles.statusButtonText, status === s && styles.statusButtonTextActive]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={BLACK} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color={BLACK} />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GOLD,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: GOLD,
  },
  segmentText: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: BLACK,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GOLD,
  },
  typeButtonActive: {
    backgroundColor: GOLD,
  },
  typeButtonText: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: BLACK,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GOLD,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: GOLD,
  },
  statusButtonText: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '600',
  },
  statusButtonTextActive: {
    color: BLACK,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD,
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 32,
    gap: 8,
  },
  saveButtonText: {
    color: BLACK,
    fontSize: 18,
    fontWeight: '600',
  },
});
