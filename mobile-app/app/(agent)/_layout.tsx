import React from 'react';
import { Tabs } from 'expo-router';
import { Map, List, User } from 'lucide-react-native';
import { Colors } from '../../constants/Theme';

export default function AgentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#09090b',
          borderTopColor: 'rgba(255,255,255,0.05)',
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.accentBlue,
        tabBarInactiveTintColor: '#52525b',
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '900',
          letterSpacing: 1,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'CARTE',
          tabBarIcon: ({ color }) => <Map size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          title: 'MISSIONS',
          tabBarIcon: ({ color }) => <List size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'DOSSIER',
          tabBarIcon: ({ color }) => <User size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
