import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
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
  size_sqm: number;
  bedrooms?: number;
  bathrooms?: number;
  images: string[];
}

export default function ListingsScreen() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
  }, [selectedArea]);

  const fetchProperties = async () => {
    try {
      let url = `${BACKEND_URL}/api/properties?status=active`;
      if (selectedArea) {
        url += `&area=${selectedArea}`;
      }
      const response = await axios.get(url);
      setProperties(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('en-US')}`;
  };

  const filteredProperties = properties.filter((property) =>
    property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.location_detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.property_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProperty = ({ item }: { item: Property }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => router.push(`/property/${item.id}`)}
    >
      {item.images && item.images.length > 0 ? (
        <Image
          source={{ uri: item.images[0] }}
          style={styles.propertyImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.propertyImage, styles.noImage]}>
          <Ionicons name="home" size={48} color={GOLD} />
        </View>
      )}
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyTitle}>{item.title}</Text>
        <View style={styles.propertyMeta}>
          <Text style={styles.propertyLocation}>
            <Ionicons name="location" size={14} color={GOLD} />
            {' '}{item.area} - {item.location_detail}
          </Text>
        </View>
        <View style={styles.propertySpecs}>
          {item.bedrooms && (
            <View style={styles.spec}>
              <Ionicons name="bed" size={16} color={GOLD} />
              <Text style={styles.specText}>{item.bedrooms} Bed</Text>
            </View>
          )}
          {item.bathrooms && (
            <View style={styles.spec}>
              <Ionicons name="water" size={16} color={GOLD} />
              <Text style={styles.specText}>{item.bathrooms} Bath</Text>
            </View>
          )}
          <View style={styles.spec}>
            <Ionicons name="expand" size={16} color={GOLD} />
            <Text style={styles.specText}>{item.size_sqm} sqm</Text>
          </View>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.propertyPrice}>{formatPrice(item.price_usd)}</Text>
          <View style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Details</Text>
            <Ionicons name="arrow-forward" size={16} color={BLACK} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={GOLD} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search properties..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Area Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        <TouchableOpacity
          style={[styles.filterButton, !selectedArea && styles.filterButtonActive]}
          onPress={() => setSelectedArea(null)}
        >
          <Text style={[styles.filterButtonText, !selectedArea && styles.filterButtonTextActive]}>
            All Areas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedArea === 'Beirut' && styles.filterButtonActive]}
          onPress={() => setSelectedArea('Beirut')}
        >
          <Text style={[styles.filterButtonText, selectedArea === 'Beirut' && styles.filterButtonTextActive]}>
            Beirut
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedArea === 'Mount Lebanon' && styles.filterButtonActive]}
          onPress={() => setSelectedArea('Mount Lebanon')}
        >
          <Text style={[styles.filterButtonText, selectedArea === 'Mount Lebanon' && styles.filterButtonTextActive]}>
            Mount Lebanon
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedArea === 'North Lebanon' && styles.filterButtonActive]}
          onPress={() => setSelectedArea('North Lebanon')}
        >
          <Text style={[styles.filterButtonText, selectedArea === 'North Lebanon' && styles.filterButtonTextActive]}>
            North Lebanon
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedArea === 'Keserwan' && styles.filterButtonActive]}
          onPress={() => setSelectedArea('Keserwan')}
        >
          <Text style={[styles.filterButtonText, selectedArea === 'Keserwan' && styles.filterButtonTextActive]}>
            Keserwan
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Properties List */}
      {loading ? (
        <ActivityIndicator size="large" color={GOLD} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredProperties}
          renderItem={renderProperty}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="home-outline" size={64} color="#666" />
              <Text style={styles.emptyText}>No properties found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
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
  filterContainer: {
    flexDirection: 'row',
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  filterButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: GOLD,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: GOLD,
  },
  filterButtonText: {
    color: GOLD,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  filterButtonTextActive: {
    color: BLACK,
  },
  listContent: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  propertyCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GOLD,
  },
  propertyImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#0a0a0a',
  },
  noImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyInfo: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  propertyMeta: {
    marginBottom: 12,
  },
  propertyLocation: {
    fontSize: 14,
    color: '#999',
  },
  propertySpecs: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  spec: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    color: '#fff',
    fontSize: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: GOLD,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GOLD,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 4,
  },
  viewButtonText: {
    color: BLACK,
    fontSize: 14,
    fontWeight: '600',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
  },
});
