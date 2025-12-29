import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#D4AF37';
const BLACK = '#000000';
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Property {
  id: string;
  title: string;
  area: string;
  price_usd: number;
  property_type: string;
  status: string;
  images: string[];
}

export default function AdminPropertiesScreen() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const token = await AsyncStorage.getItem('admin_token');
      if (!token) {
        Alert.alert('Error', 'Not authenticated');
        router.back();
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/api/properties`);
      setProperties(response.data);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      setLoading(false);
    }
  };

  const deleteProperty = async (id: string) => {
    Alert.alert(
      'Delete Property',
      'Are you sure you want to delete this property?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(id);
            try {
              const token = await AsyncStorage.getItem('admin_token');
              
              if (!token) {
                Alert.alert('Error', 'Not authenticated. Please login again.');
                router.push('/(tabs)/admin');
                setDeleting(null);
                return;
              }

              console.log('Deleting property:', id);
              const response = await axios.delete(`${BACKEND_URL}/api/properties/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              console.log('Delete response:', response.status);
              
              setDeleting(null);
              fetchProperties();
              Alert.alert('Success', 'Property deleted successfully');
            } catch (error: any) {
              console.error('Delete error:', error.response?.data || error.message);
              setDeleting(null);
              Alert.alert(
                'Error', 
                error.response?.data?.detail || 'Failed to delete property. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#32CD32';
      case 'draft':
        return '#FFA500';
      case 'sold':
        return '#ff4444';
      default:
        return GOLD;
    }
  };

  const renderProperty = ({ item }: { item: Property }) => (
    <View style={styles.propertyCard}>
      {item.images && item.images.length > 0 ? (
        <Image
          source={{ uri: item.images[0] }}
          style={styles.propertyImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.propertyImage, styles.noImage]}>
          <Ionicons name="home" size={32} color={GOLD} />
        </View>
      )}
      <View style={styles.propertyInfo}>
        <View style={styles.propertyHeader}>
          <Text style={styles.propertyTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.propertyMeta}>{item.area} • {item.property_type}</Text>
        <Text style={styles.propertyPrice}>${item.price_usd.toLocaleString('en-US')}</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#4169E1' }]}
            onPress={() => router.push(`/admin/edit-property?id=${item.id}`)}
            disabled={deleting === item.id}
          >
            <Ionicons name="create" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#ff4444' }]}
            onPress={() => deleteProperty(item.id)}
            disabled={deleting === item.id}
          >
            {deleting === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="trash" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Delete</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Manage Properties',
          headerStyle: { backgroundColor: BLACK },
          headerTintColor: GOLD,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/admin/add-property')}>
              <Ionicons name="add-circle" size={32} color={GOLD} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {loading ? (
          <ActivityIndicator size="large" color={GOLD} style={styles.loader} />
        ) : (
          <FlatList
            data={properties}
            renderItem={renderProperty}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="home-outline" size={64} color="#666" />
                <Text style={styles.emptyText}>No properties yet</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => router.push('/admin/add-property')}
                >
                  <Ionicons name="add" size={20} color={BLACK} />
                  <Text style={styles.addButtonText}>Add First Property</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  listContent: {
    padding: 16,
  },
  propertyCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GOLD,
  },
  propertyImage: {
    width: 120,
    height: 140,
    backgroundColor: '#0a0a0a',
  },
  noImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyInfo: {
    flex: 1,
    padding: 12,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  propertyTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  propertyMeta: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GOLD,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  loader: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GOLD,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: BLACK,
    fontSize: 14,
    fontWeight: '600',
  },
});
