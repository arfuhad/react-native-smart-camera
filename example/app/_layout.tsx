import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a1a2e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'SmartCamera',
          }}
        />
        <Stack.Screen
          name="face-detection"
          options={{
            title: 'Face Detection',
          }}
        />
        <Stack.Screen
          name="blink-detection"
          options={{
            title: 'Blink Detection',
          }}
        />
        <Stack.Screen
          name="static-image"
          options={{
            title: 'Static Image',
          }}
        />
      </Stack>
    </>
  );
}

