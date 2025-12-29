import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Linking,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const GOLD = '#D4AF37';
const BLACK = '#000000';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const WINDOW_WIDTH = Dimensions.get('window').width;

interface Property {
  id: string;
  title: string;
  area: string;
  location_detail: string;
  price_usd: number;
  property_type: string;
  size_sqm: number;
  bedrooms?: number;
  bathrooms?: number;
  floor_level?: string;
  view_type?: string;
  description: string;
  images: string[];
  latitude?: number;
  longitude?: number;
}

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [visitModalVisible, setVisitModalVisible] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [submittingVisit, setSubmittingVisit] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProperty();
    }
  }, [id]);

  const fetchProperty = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/properties/${id}`);
      setProperty(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching property:', error);
      Alert.alert('Error', 'Failed to load property details');
      setLoading(false);
    }
  };

  const handleWhatsAppContact = async () => {
    const phoneNumber = '9613384869';
    const message = `Hello, I'm interested in the property: ${property?.title}`;
    
    try {
      // For mobile, try WhatsApp app first
      if (Platform.OS !== 'web') {
        const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
        const canOpen = await Linking.canOpenURL(whatsappUrl);
        
        if (canOpen) {
          await Linking.openURL(whatsappUrl);
        } else {
          // Fallback to web WhatsApp
          const webUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
          await Linking.openURL(webUrl);
        }
      } else {
        // For web, use wa.me directly
        const webUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      Alert.alert(
        'Contact Us',
        `Please contact us on WhatsApp:\n\n+961 3 384 869\n\nOr call us directly.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleRequestVisit = async () => {
    setVisitModalVisible(true);
  };

  const submitVisitRequest = async () => {
    if (!visitorName.trim() || !visitorPhone.trim()) {
      Alert.alert('Error', 'Please enter your name and phone number');
      return;
    }

    setSubmittingVisit(true);
    try {
      await axios.post(`${BACKEND_URL}/api/leads`, {
        property_id: id,
        name: visitorName.trim(),
        phone: visitorPhone.trim(),
        message: 'Visit request from mobile app',
      });
      setVisitModalVisible(false);
      setVisitorName('');
      setVisitorPhone('');
      Alert.alert('Success', 'Your visit request has been submitted!');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit visit request');
    } finally {
      setSubmittingVisit(false);
    }
  };

  const handleViewOnMap = async () => {
    if (property?.latitude && property?.longitude) {
      try {
        // For iOS/Android, try native maps first
        if (Platform.OS === 'ios') {
          const mapsUrl = `maps://maps.google.com/maps?q=${property.latitude},${property.longitude}`;
          const canOpen = await Linking.canOpenURL(mapsUrl);
          if (canOpen) {
            await Linking.openURL(mapsUrl);
            return;
          }
        } else if (Platform.OS === 'android') {
          const mapsUrl = `geo:${property.latitude},${property.longitude}?q=${property.latitude},${property.longitude}`;
          const canOpen = await Linking.canOpenURL(mapsUrl);
          if (canOpen) {
            await Linking.openURL(mapsUrl);
            return;
          }
        }
        
        // Fallback to web URL (works on all platforms)
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`;
        await Linking.openURL(webUrl);
      } catch (error) {
        console.error('Error opening maps:', error);
        Alert.alert('Error', 'Failed to open map. Please try again.');
      }
    } else {
      Alert.alert('Info', 'Location coordinates not available for this property');
    }
  };

  const handleShare = async () => {
    if (!property) {
      Alert.alert('Error', 'Property data not loaded');
      return;
    }

    const message = `🏠 ${property.title}\n\n` +
      `💰 Price: $${property.price_usd.toLocaleString('en-US')}\n` +
      `📍 Location: ${property.area} - ${property.location_detail}\n` +
      `🏢 Type: ${property.property_type}\n` +
      `📐 Size: ${property.size_sqm} sqm\n` +
      `${property.bedrooms ? `🛏️ Bedrooms: ${property.bedrooms}\n` : ''}` +
      `${property.bathrooms ? `🚿 Bathrooms: ${property.bathrooms}\n` : ''}` +
      `\n${property.description}\n\n` +
      `📞 Contact: +961 3 384 869\n` +
      `🏢 Aimlink Property - Real Estate, Real Direction`;

    // Always show options dialog - this is the most reliable approach
    Alert.alert(
      'Share Property',
      'Choose how to share this property:',
      [
        {
          text: 'WhatsApp',
          onPress: async () => {
            try {
              const whatsappMessage = encodeURIComponent(message);
              const phoneNumber = '9613384869';
              
              // Try mobile WhatsApp first
              if (Platform.OS !== 'web') {
                const mobileUrl = `whatsapp://send?text=${whatsappMessage}`;
                const canOpen = await Linking.canOpenURL(mobileUrl);
                
                if (canOpen) {
                  await Linking.openURL(mobileUrl);
                } else {
                  // Fallback to web WhatsApp
                  await Linking.openURL(`https://wa.me/?text=${whatsappMessage}`);
                }
              } else {
                // For web, use wa.me directly
                await Linking.openURL(`https://wa.me/?text=${whatsappMessage}`);
              }
            } catch (error) {
              Alert.alert('Error', 'Could not open WhatsApp. Please try again.');
            }
          },
        },
        {
          text: 'Email',
          onPress: () => {
            const subject = encodeURIComponent(`Property: ${property.title}`);
            const body = encodeURIComponent(message);
            Linking.openURL(`mailto:?subject=${subject}&body=${body}`).catch(() => {
              Alert.alert('Error', 'Could not open email app');
            });
          },
        },
        {
          text: 'SMS',
          onPress: () => {
            const smsMessage = encodeURIComponent(message);
            Linking.openURL(`sms:?body=${smsMessage}`).catch(() => {
              Alert.alert('Error', 'Could not open SMS app');
            });
          },
        },
        {
          text: 'View Details',
          onPress: () => {
            Alert.alert('Property Details', message, [
              { text: 'Close' }
            ]);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Property not found</Text>
      </View>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Image Gallery */}
          <View style={styles.imageSection}>
            {property.images && property.images.length > 0 ? (
              <>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(event) => {
                    const index = Math.round(
                      event.nativeEvent.contentOffset.x / WINDOW_WIDTH
                    );
                    setSelectedImageIndex(index);
                  }}
                >
                  {property.images.map((image, index) => (
                    <Image
                      key={index}
                      source={{ uri: image }}
                      style={styles.propertyImage}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
                <View style={styles.imageIndicator}>
                  <Text style={styles.imageIndicatorText}>
                    {selectedImageIndex + 1} / {property.images.length}
                  </Text>
                </View>
              </>
            ) : (
              <View style={[styles.propertyImage, styles.noImage]}>
                <Ionicons name="home" size={64} color={GOLD} />
              </View>
            )}
          </View>

          {/* Price and Title */}
          <View style={styles.section}>
            <Text style={styles.price}>${property.price_usd.toLocaleString('en-US')}</Text>
            <Text style={styles.title}>{property.title}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color={GOLD} />
              <Text style={styles.location}>
                {property.area} - {property.location_detail}
              </Text>
            </View>
          </View>

          {/* About the Property */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About the Property</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>

          {/* Specs */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specifications</Text>
            <View style={styles.specsGrid}>
              <View style={styles.specItem}>
                <Ionicons name="home" size={24} color={GOLD} />
                <Text style={styles.specLabel}>Type</Text>
                <Text style={styles.specValue}>{property.property_type}</Text>
              </View>
              <View style={styles.specItem}>
                <Ionicons name="expand" size={24} color={GOLD} />
                <Text style={styles.specLabel}>Size</Text>
                <Text style={styles.specValue}>{property.size_sqm} sqm</Text>
              </View>
              {property.bedrooms && (
                <View style={styles.specItem}>
                  <Ionicons name="bed" size={24} color={GOLD} />
                  <Text style={styles.specLabel}>Bedrooms</Text>
                  <Text style={styles.specValue}>{property.bedrooms}</Text>
                </View>
              )}
              {property.bathrooms && (
                <View style={styles.specItem}>
                  <Ionicons name="water" size={24} color={GOLD} />
                  <Text style={styles.specLabel}>Bathrooms</Text>
                  <Text style={styles.specValue}>{property.bathrooms}</Text>
                </View>
              )}
              {property.floor_level && (
                <View style={styles.specItem}>
                  <Ionicons name="layers" size={24} color={GOLD} />
                  <Text style={styles.specLabel}>Floor</Text>
                  <Text style={styles.specValue}>{property.floor_level}</Text>
                </View>
              )}
              {property.view_type && (
                <View style={styles.specItem}>
                  <Ionicons name="eye" size={24} color={GOLD} />
                  <Text style={styles.specLabel}>View</Text>
                  <Text style={styles.specValue}>{property.view_type}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Location */}
          {property.latitude && property.longitude && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <TouchableOpacity style={styles.mapButton} onPress={handleViewOnMap}>
                <Ionicons name="map" size={20} color={BLACK} />
                <Text style={styles.mapButtonText}>View on Google Maps</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Contact & Visit */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact & Visit</Text>
            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={handleWhatsAppContact}
            >
              <Ionicons name="logo-whatsapp" size={24} color="#fff" />
              <Text style={styles.whatsappButtonText}>Contact on WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.visitButton}
              onPress={handleRequestVisit}
            >
              <Ionicons name="calendar" size={24} color={BLACK} />
              <Text style={styles.visitButtonText}>Request Visit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Ionicons name="share-social" size={24} color={GOLD} />
              <Text style={styles.shareButtonText}>Share Property</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Visit Request Modal */}
        <Modal
          visible={visitModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setVisitModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setVisitModalVisible(false)}
            >
              <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Request Visit</Text>
                    <TouchableOpacity onPress={() => setVisitModalVisible(false)}>
                      <Ionicons name="close" size={28} color={GOLD} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.modalSubtitle}>
                    Please provide your details and we'll contact you shortly.
                  </Text>

                  <View style={styles.inputContainer}>
                    <Ionicons name="person" size={20} color={GOLD} style={styles.inputIcon} />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Your Name"
                      placeholderTextColor="#666"
                      value={visitorName}
                      onChangeText={setVisitorName}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons name="call" size={20} color={GOLD} style={styles.inputIcon} />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Your Phone Number"
                      placeholderTextColor="#666"
                      keyboardType="phone-pad"
                      value={visitorPhone}
                      onChangeText={setVisitorPhone}
                    />
                  </View>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setVisitModalVisible(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.submitButton]}
                      onPress={submitVisitRequest}
                      disabled={submittingVisit}
                    >
                      {submittingVisit ? (
                        <ActivityIndicator color={BLACK} />
                      ) : (
                        <Text style={styles.submitButtonText}>Submit Request</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>

        {/* Floating WhatsApp Button */}
        <TouchableOpacity
          style={styles.floatingWhatsApp}
          onPress={handleWhatsAppContact}
        >
          <Ionicons name="logo-whatsapp" size={32} color="#fff" />
        </TouchableOpacity>
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
  scrollContent: {
    paddingBottom: 100,
  },
  imageSection: {
    position: 'relative',
  },
  propertyImage: {
    width: WINDOW_WIDTH,
    height: 300,
    backgroundColor: '#0a0a0a',
  },
  noImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageIndicatorText: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: GOLD,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 16,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GOLD,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  specItem: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GOLD,
  },
  specLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  mapButtonText: {
    color: BLACK,
    fontSize: 16,
    fontWeight: '600',
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  whatsappButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  visitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  visitButtonText: {
    color: BLACK,
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: GOLD,
  },
  shareButtonText: {
    color: GOLD,
    fontSize: 16,
    fontWeight: '600',
  },
  floatingWhatsApp: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: GOLD,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: GOLD,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GOLD,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  modalInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: GOLD,
  },
  submitButtonText: {
    color: BLACK,
    fontSize: 16,
    fontWeight: '600',
  },
});
