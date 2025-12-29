import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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

interface Lead {
  id: string;
  property_id: string;
  name: string;
  phone: string;
  message?: string;
  status: string;
  created_at: string;
}

export default function AdminLeadsScreen() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, [selectedStatus]);

  const fetchLeads = async () => {
    try {
      const token = await AsyncStorage.getItem('admin_token');
      if (!token) {
        Alert.alert('Error', 'Not authenticated');
        router.back();
        return;
      }

      let url = `${BACKEND_URL}/api/leads`;
      if (selectedStatus) {
        url += `?status=${selectedStatus}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeads(response.data);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        router.back();
      }
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const token = await AsyncStorage.getItem('admin_token');
      await axios.put(
        `${BACKEND_URL}/api/leads/${leadId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchLeads();
      Alert.alert('Success', 'Lead status updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update lead status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'contacted':
        return '#4169E1';
      case 'completed':
        return '#32CD32';
      default:
        return GOLD;
    }
  };

  const renderLead = ({ item }: { item: Lead }) => (
    <View style={styles.leadCard}>
      <View style={styles.leadHeader}>
        <View>
          <Text style={styles.leadName}>{item.name}</Text>
          <Text style={styles.leadPhone}>
            <Ionicons name="call" size={12} color={GOLD} /> {item.phone}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      {item.message && (
        <Text style={styles.leadMessage}>{item.message}</Text>
      )}
      
      <Text style={styles.leadDate}>
        {new Date(item.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>

      <View style={styles.actionButtons}>
        {item.status !== 'contacted' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#4169E1' }]}
            onPress={() => updateLeadStatus(item.id, 'contacted')}
          >
            <Text style={styles.actionButtonText}>Mark Contacted</Text>
          </TouchableOpacity>
        )}
        {item.status !== 'completed' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#32CD32' }]}
            onPress={() => updateLeadStatus(item.id, 'completed')}
          >
            <Text style={styles.actionButtonText}>Mark Completed</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Manage Leads',
          headerStyle: { backgroundColor: BLACK },
          headerTintColor: GOLD,
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, !selectedStatus && styles.filterButtonActive]}
            onPress={() => setSelectedStatus(null)}
          >
            <Text style={[styles.filterButtonText, !selectedStatus && styles.filterButtonTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === 'pending' && styles.filterButtonActive]}
            onPress={() => setSelectedStatus('pending')}
          >
            <Text style={[styles.filterButtonText, selectedStatus === 'pending' && styles.filterButtonTextActive]}>
              Pending
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === 'contacted' && styles.filterButtonActive]}
            onPress={() => setSelectedStatus('contacted')}
          >
            <Text style={[styles.filterButtonText, selectedStatus === 'contacted' && styles.filterButtonTextActive]}>
              Contacted
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === 'completed' && styles.filterButtonActive]}
            onPress={() => setSelectedStatus('completed')}
          >
            <Text style={[styles.filterButtonText, selectedStatus === 'completed' && styles.filterButtonTextActive]}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>

        {/* Leads List */}
        {loading ? (
          <ActivityIndicator size="large" color={GOLD} style={styles.loader} />
        ) : (
          <FlatList
            data={leads}
            renderItem={renderLead}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color="#666" />
                <Text style={styles.emptyText}>No leads found</Text>
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD,
  },
  filterButtonActive: {
    backgroundColor: GOLD,
  },
  filterButtonText: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: BLACK,
  },
  listContent: {
    padding: 16,
  },
  leadCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: GOLD,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leadName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  leadPhone: {
    fontSize: 14,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  leadMessage: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
  },
  leadDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
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
  },
});
