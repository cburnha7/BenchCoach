import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '../src/lib/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.surface },
            headerTintColor: theme.text,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: theme.bg },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: 'Bench Coach',
              // Transparent so the stadium photo runs behind it. The backdrop
              // already puts a dark scrim under this area for legibility.
              headerTransparent: true,
              headerStyle: { backgroundColor: 'transparent' },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen name="team/[id]" options={{ title: '' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
