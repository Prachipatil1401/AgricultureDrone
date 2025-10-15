import { StatusBar } from 'expo-status-bar';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Plant Leaf{"\n"}Disease</Text>

          <Image
            source={{
              uri:
                'https://images.unsplash.com/photo-1597098779361-56597364e5b6?q=80&w=1200&auto=format&fit=crop',
            }}
            resizeMode="cover"
            style={styles.image}
            accessible
            accessibilityLabel="Leaf showing disease symptoms"
          />

          <View style={styles.textBlock}>
            <Text style={styles.label}>Disease:</Text>
            <Text style={styles.value}> Bacterial Spot</Text>
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.label}>Treatment:</Text>
            <Text style={styles.value}> Use fungicide</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7F6',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2E5C3F',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 34,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 14,
    marginBottom: 16,
  },
  textBlock: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3A2F',
  },
  value: {
    fontSize: 16,
    fontWeight: '400',
    color: '#2D3A2F',
  },
});
