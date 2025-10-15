import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export function ResultCard({ title, imageUri, disease, treatment }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
      <Text style={styles.label}>Disease: <Text style={styles.value}>{disease}</Text></Text>
      <Text style={styles.label}>Treatment: <Text style={styles.value}>{treatment}</Text></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
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
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#2d3a33',
    marginTop: 6,
  },
  value: {
    fontWeight: '700',
  }
});
