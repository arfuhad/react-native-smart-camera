import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { useSmartCamera } from 'react-native-smart-camera';

export default function HomeScreen() {
  const { hasPermission, requestPermission } = useSmartCamera();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>🎥 SmartCamera</Text>
        <Text style={styles.subtitle}>
          Face detection, blink detection, and WebRTC streaming
        </Text>
      </View>

      {!hasPermission && (
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Examples</Text>

        <Link href="/face-detection" asChild>
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardIcon}>👤</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Face Detection</Text>
              <Text style={styles.cardDescription}>
                Detect faces with landmarks, contours, and classification
              </Text>
            </View>
          </TouchableOpacity>
        </Link>

        <Link href="/blink-detection" asChild>
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardIcon}>👁️</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Blink Detection</Text>
              <Text style={styles.cardDescription}>
                Detect eye blinks in real-time
              </Text>
            </View>
          </TouchableOpacity>
        </Link>

        <Link href="/static-image" asChild>
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardIcon}>🖼️</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Static Image</Text>
              <Text style={styles.cardDescription}>
                Detect faces in static images
              </Text>
            </View>
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        
        <View style={styles.featureList}>
          <FeatureItem icon="✓" text="VisionCamera integration" />
          <FeatureItem icon="✓" text="Google ML Kit face detection" />
          <FeatureItem icon="✓" text="Real-time blink detection" />
          <FeatureItem icon="✓" text="Facial landmarks & contours" />
          <FeatureItem icon="✓" text="Face tracking" />
          <FeatureItem icon="✓" text="Static image detection" />
          <FeatureItem icon="✓" text="WebRTC video streaming" />
          <FeatureItem icon="✓" text="Expo config plugin" />
        </View>
      </View>
    </ScrollView>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  permissionButton: {
    backgroundColor: '#4a9eff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#888',
  },
  featureList: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureIcon: {
    color: '#4a9eff',
    fontSize: 16,
    marginRight: 12,
  },
  featureText: {
    color: '#fff',
    fontSize: 14,
  },
});

