import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GOLD = '#D4AF37';
const BLACK = '#000000';

export default function RootLayout() {
  const router = useRouter();

  const BackButton = () => (
    <TouchableOpacity 
      onPress={() => router.back()}
      style={{ marginLeft: 16, padding: 8 }}
    >
      <Ionicons name="arrow-back" size={24} color={GOLD} />
    </TouchableOpacity>
  );

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: BLACK },
        headerTintColor: GOLD,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="property/[id]" 
        options={{ 
          headerShown: true,
          title: 'Property Details',
          headerBackTitle: 'Back',
          headerLeft: () => <BackButton />,
        }} 
      />
      <Stack.Screen 
        name="admin/properties" 
        options={{ 
          headerShown: true,
          title: 'Manage Properties',
          headerLeft: () => <BackButton />,
        }} 
      />
      <Stack.Screen 
        name="admin/add-property" 
        options={{ 
          headerShown: true,
          title: 'Add Property',
          headerLeft: () => <BackButton />,
        }} 
      />
      <Stack.Screen 
        name="admin/edit-property" 
        options={{ 
          headerShown: true,
          title: 'Edit Property',
          headerLeft: () => <BackButton />,
        }} 
      />
      <Stack.Screen 
        name="admin/leads" 
        options={{ 
          headerShown: true,
          title: 'Manage Leads',
          headerLeft: () => <BackButton />,
        }} 
      />
    </Stack>
  );
}
