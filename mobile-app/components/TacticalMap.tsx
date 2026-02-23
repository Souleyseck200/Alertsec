import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';

const TypedMapView = MapView as any;
const TypedMarker = Marker as any;
const TypedPolygon = Polygon as any;
import * as Location from 'expo-location';
import { Siren, Layers } from 'lucide-react-native';
import { Colors } from '../constants/Theme';
import { uberBlackMapStyle } from '../constants/MapStyle';
import socketService from '../services/socket';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Agent {
  id: number;
  nom: string;
  prenom: string;
  latitude: number;
  longitude: number;
  isOccupied: boolean;
}

interface Zone {
  id: number;
  nom: string;
  localisation: string;
  rayon_action: number;
  niveau_priorite: number;
}

export default function TacticalMap() {
  const { user } = useAuth();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [showZones, setShowZones] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);

      // Listen for agent updates
      socketService.socket?.on('AGENT_LOCATION_UPDATE', (data: any) => {
        setAgents(prev => {
          const index = prev.findIndex(a => a.id === data.agentId);
          if (index !== -1) {
            const next = [...prev];
            next[index] = { ...next[index], latitude: data.latitude, longitude: data.longitude };
            return next;
          }
          return prev;
        });
      });

      // Initial fetch
      fetchOperationalData();
    })();

    return () => {
      socketService.socket?.off('AGENT_LOCATION_UPDATE');
    };
  }, []);

  const fetchOperationalData = async () => {
    try {
      // Pour les citoyens, on ne récupère pas les données admin qui causent des 401/403
      if (user?.role === 'CITIZEN') {
        const heatmapRes = await api.get('/signalements/heatmap');
        // On pourrait traiter la heatmap ici si on avait des marqueurs spécifiques
        return;
      }

      const [agentsRes, zonesRes] = await Promise.all([
        api.get('/admin/agents').catch(() => ({ data: [] })), 
        api.get('/admin/zones').catch(() => ({ data: [] }))
      ]);
      setAgents(agentsRes.data);
      setZones(zonesRes.data);
    } catch (e: any) {
      console.log('Error fetching operational data (silent fail for safety):', e.message);
    }
  };

  const parseZone = (locStr: string) => {
    try {
      const parsed = JSON.parse(locStr);
      if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
        return (parsed as any[]).map(p => ({ latitude: p[0], longitude: p[1] }));
      }
      return null;
    } catch {
      return null;
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={uberBlackMapStyle}
        initialRegion={{
          latitude: 14.7167,
          longitude: -17.4677,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation
      >
        {/* Agents */}
        {agents.map(agent => (
          <Marker
            key={`agent-${agent.id}`}
            coordinate={{ latitude: agent.latitude, longitude: agent.longitude }}
          >
            <View style={[styles.agentMarker, agent.isOccupied && styles.occupied]}>
              <Siren size={14} color="#fff" />
            </View>
          </Marker>
        ))}

        {/* Danger Zones */}
        {showZones && zones.map(zone => {
          const coords = parseZone(zone.localisation);
          if (!coords) return null;
          const color = zone.niveau_priorite >= 3 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)';
          return (
            <Polygon
              key={`zone-${zone.id}`}
              coordinates={coords}
              fillColor={color}
              strokeColor={color.replace('0.4', '1')}
              strokeWidth={2}
            />
          );
        })}
      </MapView>

      <TouchableOpacity 
        style={styles.layerToggle}
        onPress={() => setShowZones(!showZones)}
      >
        <Layers size={20} color={showZones ? Colors.accentBlue : '#71717a'} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  layerToggle: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(24, 24, 27, 0.9)',
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  agentMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accentBlue,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  occupied: {
    backgroundColor: Colors.accentOrange,
  },
  agentInitials: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
});
