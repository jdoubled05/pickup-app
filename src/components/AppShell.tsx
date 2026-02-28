import React from "react";
import { StyleSheet, View, useColorScheme } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['left', 'right']} style={[styles.safeArea, { backgroundColor: isDark ? '#000' : '#fff' }]}>
        <View style={styles.container}>{children}</View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
