import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import CitizenNavBar from '../../components/CitizenNavBar';

export default function CitizenLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Using custom Floating NavBar
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'CARTE' }} />
        <Tabs.Screen name="history" options={{ title: 'ALERTES' }} />
        <Tabs.Screen name="profile" options={{ title: 'PROFIL' }} />
        <Tabs.Screen name="map" options={{ href: null }} />
      </Tabs>
      <CitizenNavBar />
    </View>
  );
}
