import React, { useState } from 'react';
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
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#D4AF37';
const BLACK = '#000000';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AddPropertyScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Basic Info
  const [title, setTitle] = useState('');
  const [area, setArea] = useState('Beirut');
  const [locationDetail, setLocationDetail] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [propertyType, setPropertyType] = useState('Apartment');

  // Step 2: Specs
  const [sizeSqm, setSizeSqm] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [floorLevel, setFloorLevel] = useState('');
  const [viewType, setViewType] = useState('');
  const [description, setDescription] = useState('');

  // Step 3: Images
  const [images, setImages] = useState<string[]>([]);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImages([...images, base64Image]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const validateStep1 = () => {
    if (!title || !area || !locationDetail || !priceUsd || !propertyType) {
      Alert.alert('Error', 'Please fill all required fields');
      return false;
    }
    if (isNaN(Number(priceUsd)) || Number(priceUsd) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!sizeSqm || !description) {
      Alert.alert('Error', 'Please fill size and description');
      return false;
    }
    if (isNaN(Number(sizeSqm)) || Number(sizeSqm) <= 0) {
      Alert.alert('Error', 'Please enter a valid size');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePublish = async () => {
    if (images.length === 0) {
      Alert.alert('Warning', 'Are you sure you want to publish without images?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Publish', onPress: submitProperty },
      ]);
    } else {
      submitProperty();
    }
  };

  const submitProperty = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('admin_token');
      if (!token) {
        Alert.alert('Error', 'Not authenticated');
        return;
      }

      const propertyData = {
        title,
        area,
        location_detail: locationDetail,
        price_usd: Number(priceUsd),
        property_type: propertyType,
        size_sqm: Number(sizeSqm),
        bedrooms: bedrooms ? Number(bedrooms) : null,
        bathrooms: bathrooms ? Number(bathrooms) : null,
        floor_level: floorLevel || null,
        view_type: viewType || null,
        description,
        images,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        status: 'active',
      };

      await axios.post(`${BACKEND_URL}/api/properties`, propertyData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('Success', 'Property published successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error creating property:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to publish property');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Step 1: Basic Information</Text>

      <Text style={styles.label}>Property Title *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Luxury Apartment in Achrafieh"
        placeholderTextColor="#666"
        value={title}
        onChangeText={setTitle}
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
        placeholder="e.g., Achrafieh, Sassine Square"
        placeholderTextColor="#666"
        value={locationDetail}
        onChangeText={setLocationDetail}
      />

      <Text style={styles.label}>Price (USD) *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 450000"
        placeholderTextColor="#666"
        keyboardType="numeric"
        value={priceUsd}
        onChangeText={setPriceUsd}
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
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Step 2: Specifications</Text>

      <Text style={styles.label}>Size (sqm) *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 250"
        placeholderTextColor="#666"
        keyboardType="numeric"
        value={sizeSqm}
        onChangeText={setSizeSqm}
      />

      <Text style={styles.label}>Bedrooms</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 3"
        placeholderTextColor="#666"
        keyboardType="numeric"
        value={bedrooms}
        onChangeText={setBedrooms}
      />

      <Text style={styles.label}>Bathrooms</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 2"
        placeholderTextColor="#666"
        keyboardType="numeric"
        value={bathrooms}
        onChangeText={setBathrooms}
      />

      <Text style={styles.label}>Floor Level</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 5th Floor"
        placeholderTextColor="#666"
        value={floorLevel}
        onChangeText={setFloorLevel}
      />

      <Text style={styles.label}>View Type</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Sea View, Mountain View"
        placeholderTextColor="#666"
        value={viewType}
        onChangeText={setViewType}
      />

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Detailed description of the property..."
        placeholderTextColor="#666"
        multiline
        numberOfLines={6}
        value={description}
        onChangeText={setDescription}
      />
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Step 3: Images & Location</Text>

      <Text style={styles.label}>Property Images (Optional)</Text>
      <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
        <Ionicons name="camera" size={24} color={BLACK} />
        <Text style={styles.addImageText}>Add Image ({images.length}/10)</Text>
      </TouchableOpacity>

      <View style={styles.imagesGrid}>
        {images.map((image, index) => (
          <View key={index} style={styles.imagePreview}>
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close-circle" size={24} color="#ff4444" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Text style={styles.label}>Latitude (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 33.8938"
        placeholderTextColor="#666"
        keyboardType="numeric"
        value={latitude}
        onChangeText={setLatitude}
      />

      <Text style={styles.label}>Longitude (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 35.5018"
        placeholderTextColor="#666"
        keyboardType="numeric"
        value={longitude}
        onChangeText={setLongitude}
      />
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Add Property',
          headerStyle: { backgroundColor: BLACK },
          headerTintColor: GOLD,
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
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              {[1, 2, 3].map((s) => (
                <View
                  key={s}
                  style={[
                    styles.progressDot,
                    s <= step && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>

            {/* Step Content */}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            {/* Navigation Buttons */}
            <View style={styles.navigationButtons}>
              {step > 1 && (
                <TouchableOpacity
                  style={[styles.navButton, styles.backButton]}
                  onPress={() => setStep(step - 1)}
                >
                  <Ionicons name="arrow-back" size={20} color={GOLD} />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}
              {step < 3 ? (
                <TouchableOpacity
                  style={[styles.navButton, styles.nextButton]}
                  onPress={handleNext}
                >
                  <Text style={styles.nextButtonText}>Next</Text>
                  <Ionicons name="arrow-forward" size={20} color={BLACK} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.navButton, styles.publishButton]}
                  onPress={handlePublish}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={BLACK} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color={BLACK} />
                      <Text style={styles.publishButtonText}>Publish</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  progressDotActive: {
    backgroundColor: GOLD,
  },
  stepContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: GOLD,
    marginBottom: 24,
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
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  addImageText: {
    color: BLACK,
    fontSize: 16,
    fontWeight: '600',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  imagePreview: {
    width: 100,
    height: 100,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GOLD,
    position: 'relative',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  backButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: GOLD,
  },
  backButtonText: {
    color: GOLD,
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: GOLD,
  },
  nextButtonText: {
    color: BLACK,
    fontSize: 16,
    fontWeight: '600',
  },
  publishButton: {
    backgroundColor: GOLD,
  },
  publishButtonText: {
    color: BLACK,
    fontSize: 16,
    fontWeight: '600',
  },
});
