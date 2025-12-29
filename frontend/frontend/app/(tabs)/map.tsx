import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';

const GOLD = '#D4AF37';
const BLACK = '#000000';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// Conditionally import MapView only for native platforms
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
}

// Default coordinates for Beirut
const DEFAULT_REGION = {
  latitude: 33.8938,
  longitude: 35.5018,
  latitudeDelta: 0.3,
  longitudeDelta: 0.3,
};

interface Property {
  id: string;
  title: string;
  price_usd: number;
  latitude?: number;
  longitude?: number;
}

export default function MapScreen() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [region, setRegion] = useState(DEFAULT_REGION);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/properties?status=active`);
      const propertiesWithLocation = response.data.filter(
        (prop: Property) => prop.latitude && prop.longitude
      );
      setProperties(propertiesWithLocation);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleMarkerPress = (propertyId: string) => {
    router.push(`/property/${propertyId}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {Platform.OS === 'web' ? (
        <View style={styles.webFallback}>
          <Ionicons name="map" size={64} color={GOLD} />
          <Text style={styles.webFallbackTitle}>Map View</Text>
          <Text style={styles.webFallbackText}>
            Interactive map with property pins is available on mobile devices.
          </Text>
          <Text style={styles.webFallbackText}>
            Download the Expo Go app to view properties on the map.
          </Text>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={region}
            onRegionChangeComplete={setRegion}
            customMapStyle={mapDarkStyle}
          >
            {properties.map((property) => (
              <Marker
                key={property.id}
                coordinate={{
                  latitude: property.latitude!,
                  longitude: property.longitude!,
                }}
                onPress={() => handleMarkerPress(property.id)}
              >
                <View style={styles.markerContainer}>
                  <Ionicons name="location" size={40} color={GOLD} />
                </View>
              </Marker>
            ))}
          </MapView>
          
          {properties.length === 0 && (
            <View style={styles.noPropertiesOverlay}>
              <Text style={styles.noPropertiesText}>
                No properties with location data available
              </Text>
              <Text style={styles.noPropertiesSubtext}>
                Properties will appear here once coordinates are added
              </Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

// Dark map style for Google Maps
const mapDarkStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#242f3e' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#242f3e' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  webFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  webFallbackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: GOLD,
    marginTop: 24,
    marginBottom: 16,
  },
  webFallbackText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPropertiesOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noPropertiesText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  noPropertiesSubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
});
