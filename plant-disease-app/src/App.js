import React, { useState } from 'react';
import { SafeAreaView, View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { FileSystemUploadType } from 'expo-file-system';
import { StatusBar } from 'expo-status-bar';

const ROBOFLOW_MODEL = process.env.EXPO_PUBLIC_ROBOFLOW_MODEL || 'your-workspace/your-model';
const ROBOFLOW_VERSION = process.env.EXPO_PUBLIC_ROBOFLOW_VERSION || '1';
const ROBOFLOW_API_KEY = process.env.EXPO_PUBLIC_ROBOFLOW_API_KEY || '';

export default function App() {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const askPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission to access media library is required');
    }
  };

  const pickImage = async () => {
    try {
      setError(null);
      await askPermissions();
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (!res.canceled) {
        const uri = res.assets?.[0]?.uri;
        setImageUri(uri || null);
        setResult(null);
        if (uri) classifyWithRoboflow(uri);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const classifyWithRoboflow = async (uri) => {
    if (!ROBOFLOW_API_KEY) {
      setError('Missing ROBOFLOW API KEY. Add EXPO_PUBLIC_ROBOFLOW_API_KEY');
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const endpoint = `https://classify.roboflow.com/${ROBOFLOW_MODEL}/${ROBOFLOW_VERSION}?api_key=${ROBOFLOW_API_KEY}`;
      const uploadResult = await FileSystem.uploadAsync(endpoint, uri, {
        httpMethod: 'POST',
        // Prefer named export; fallback to object property if present
        uploadType: (FileSystem.FileSystemUploadType || FileSystemUploadType).BINARY_CONTENT,
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });

      if (uploadResult.status !== 200) {
        throw new Error(`Roboflow error: ${uploadResult.status}`);
      }
      const json = JSON.parse(uploadResult.body);
      // Roboflow classification response typically includes "top" prediction
      const top = json.top || json.predictions?.[0];
      setResult(top || json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.card}>
        <Text style={styles.title}>Plant Leaf{"\n"}Disease</Text>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderText}>Select a leaf photo</Text>
          </View>
        )}

        {loading && (
          <View style={styles.row}>
            <ActivityIndicator size="small" color="#2f6f3e" />
            <Text style={styles.loadingText}>Analyzing...</Text>
          </View>
        )}

        {error && <Text style={styles.error}>Error: {error}</Text>}

        {result && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.subtitle}>
              Disease: {result?.class || result?.label || 'Unknown'}
            </Text>
            <Text style={styles.treatment}>
              Treatment: {getTreatmentAdvice(result?.class || result?.label)}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>{imageUri ? 'Choose Another Photo' : 'Choose Photo'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function getTreatmentAdvice(label) {
  if (!label) return 'Consult an agronomist';
  const key = String(label).toLowerCase();
  if (key.includes('bacterial')) return 'Use copper-based bactericide; remove infected leaves';
  if (key.includes('blight')) return 'Apply appropriate fungicide; improve airflow';
  if (key.includes('rust')) return 'Use fungicide; prune and destroy infected leaves';
  if (key.includes('mildew')) return 'Use sulfur-based fungicide; avoid overhead watering';
  return 'Use fungicide; monitor plant health';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7f6',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 32 : 0,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#245b35',
    textAlign: 'center',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#e3efe7',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#6b8f7c',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3a33',
  },
  treatment: {
    marginTop: 6,
    fontSize: 14,
    color: '#3d5148',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  loadingText: {
    marginLeft: 8,
    color: '#2f6f3e',
  },
  error: {
    color: '#b00020',
    marginTop: 8,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#2f6f3e',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
