import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const GOLD = '#D4AF37';
const BLACK = '#000000';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Property {
  id: string;
  title: string;
  area: string;
  location_detail: string;
  price_usd: number;
  property_type: string;
  images: string[];
}

export default function HomeScreen() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/properties?status=active`);
      setProperties(response.data.slice(0, 6)); // Show only first 6 on home
      setLoading(false);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('en-US')}`;
  };

  // Filter properties based on search query
  const filteredProperties = properties.filter((property) =>
    searchQuery === '' ||
    property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.location_detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.property_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AIMLINK PROPERTY</Text>
          <Text style={styles.headerSlogan}>Real Estate, Real Direction</Text>
          <Text style={styles.headerTagline}>Connecting You to The Right Address</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={GOLD} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by location or property type..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/listings')}
          >
            <Ionicons name="list" size={24} color={BLACK} />
            <Text style={styles.actionButtonText}>View All Listings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/map')}
          >
            <Ionicons name="map" size={24} color={BLACK} />
            <Text style={styles.actionButtonText}>View on Map</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Properties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? 'Search Results' : 'Featured Properties'}
          </Text>
          {loading ? (
            <ActivityIndicator size="large" color={GOLD} style={styles.loader} />
          ) : filteredProperties.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color="#666" />
              <Text style={styles.emptyText}>No properties found</Text>
              <Text style={styles.emptySubtext}>Try different search terms</Text>
            </View>
          ) : (
            <View style={styles.propertiesGrid}>
              {filteredProperties.map((property) => (
                <TouchableOpacity
                  key={property.id}
                  style={styles.propertyCard}
                  onPress={() => router.push(`/property/${property.id}`)}
                >
                  {property.images && property.images.length > 0 ? (
                    <Image
                      source={{ uri: property.images[0] }}
                      style={styles.propertyImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.propertyImage, styles.noImage]}>
                      <Ionicons name="home" size={40} color={GOLD} />
                    </View>
                  )}
                  <View style={styles.propertyInfo}>
                    <Text style={styles.propertyTitle} numberOfLines={1}>
                      {property.title}
                    </Text>
                    <Text style={styles.propertyLocation} numberOfLines={1}>
                      <Ionicons name="location" size={14} color={GOLD} />
                      {' '}{property.area}
                    </Text>
                    <Text style={styles.propertyPrice}>{formatPrice(property.price_usd)}</Text>
                    <View style={styles.viewDetailsButton}>
                      <Text style={styles.viewDetailsText}>View Details</Text>
                      <Ionicons name="arrow-forward" size={16} color={BLACK} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* WhatsApp Contact */}
        <TouchableOpacity
          style={styles.whatsappButton}
          onPress={async () => {
            const phoneNumber = '9613384869';
            const message = 'Hello, I am interested in your properties';
            
            try {
              // Try mobile WhatsApp first
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
                // For web, use wa.me
                const webUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
                await Linking.openURL(webUrl);
              }
            } catch (error) {
              console.error('Error opening WhatsApp:', error);
              Alert.alert('Error', 'Could not open WhatsApp. Please make sure WhatsApp is installed.');
            }
          }}
        >
          <Ionicons name="logo-whatsapp" size={24} color="#fff" />
          <Text style={styles.whatsappButtonText}>Contact on WhatsApp</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© aimlinkproperty.com</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  headerLogo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: GOLD,
    letterSpacing: 2,
    marginBottom: 8,
  },
  headerSlogan: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  headerTagline: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GOLD,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: BLACK,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GOLD,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  loader: {
    marginVertical: 32,
  },
  propertiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  propertyCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GOLD,
    overflow: 'hidden',
  },
  propertyImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#0a0a0a',
  },
  noImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyInfo: {
    padding: 12,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GOLD,
    marginBottom: 8,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD,
    paddingVertical: 8,
    borderRadius: 4,
    gap: 4,
  },
  viewDetailsText: {
    color: BLACK,
    fontSize: 12,
    fontWeight: '600',
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
    marginBottom: 24,
  },
  whatsappButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    color: '#666',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
});
