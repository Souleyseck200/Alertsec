import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE, Circle, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Siren, Layers } from 'lucide-react-native';
import { Colors } from '../constants/Theme';
import { uberBlackMapStyle } from '../constants/MapStyle';
import * as Haptics from 'expo-haptics';
import socketService from '../services/socket';
import api, { signalementService } from '../services/api';
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

interface TacticalMapProps {
  onSOSSelect?: (sos: any) => void;
  activeMissionId?: number | null;
  routePoints?: { latitude: number; longitude: number }[];
}

export default function TacticalMap({ onSOSSelect, activeMissionId, routePoints = [] }: TacticalMapProps) {
  const { user } = useAuth();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [activeSOS, setActiveSOS] = useState<any[]>([]);
  const [hotspots, setHotspots] = useState<any[]>([]);
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

      // Listen for new SOS alerts
      socketService.socket?.on('NOUVEAU_SIGNALEMENT', (data: any) => {
        setActiveSOS(prev => {
          if (prev.some(s => s.id === data.id)) return prev;
          return [data, ...prev];
        });
      });

      fetchOperationalData();
    })();

    return () => {
      socketService.socket?.off('AGENT_LOCATION_UPDATE');
      socketService.socket?.off('NOUVEAU_SIGNALEMENT');
    };
  }, []);

  const fetchOperationalData = async () => {
    try {
      if (user?.role === 'CITIZEN') {
        const heatmap = await signalementService.getHeatmap().catch(() => ({ data: [] }));
        setHotspots(heatmap.data || []);
        return;
      }

      const [agentsRes, zonesRes, sosRes, heatmapRes] = await Promise.all([
        api.get('/admin/agents').catch(() => ({ data: [] })), 
        api.get('/admin/zones').catch(() => ({ data: [] })),
        api.get('/signalements/all').catch(() => ({ data: [] })),
        signalementService.getHeatmap().catch(() => ({ data: [] }))
      ]);
      
      setAgents(agentsRes.data || []);
      setZones(zonesRes.data || []);
      setHotspots(heatmapRes.data || []);
      
      const allSOS = sosRes.data || [];
      const activeAlerts = allSOS.filter((s: any) => s.statut === 'NOUVEAU' || s.statut === 'EN_COURS');
      setActiveSOS(activeAlerts);
    } catch (e: any) {
      console.log('Error fetching operational data:', e.message);
    }
  };

  const handleMarkerPress = (sos: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onSOSSelect) onSOSSelect(sos);
  };

  const parseZone = (locStr: string) => {
    try {
      if (!locStr) return null;
      const parsed = JSON.parse(locStr);
      if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
        return (parsed as any[]).map(p => ({ latitude: Number(p[0]), longitude: Number(p[1]) }));
      }
      if (parsed && typeof parsed === 'object' && 'lat' in parsed) {
        return { isCircle: true, latitude: Number(parsed.lat), longitude: Number(parsed.lng) };
      }
    } catch {
      return null;
    }
  };

  const isAssignedZone = (zoneId: number) => user?.zoneId === zoneId;

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
        showsUserLocation={false}
      >
        {/* User Self Puck */}
        {location && (
          <Marker
            coordinate={{ 
              latitude: location.coords.latitude, 
              longitude: location.coords.longitude 
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
            rotation={location.coords.heading || 0}
          >
            <View style={styles.puckContainer}>
              <View style={styles.puckGlow} />
              <View style={styles.puckCenter}>
                <View style={styles.puckCone} />
              </View>
            </View>
          </Marker>
        )}

        {/* Hotspots */}
        {hotspots.map((h, i) => (
          h.latitude && h.longitude && (
            <Circle 
              key={`hotspot-${i}`}
              center={{ latitude: h.latitude, longitude: h.longitude }}
              radius={400}
              fillColor="rgba(239, 68, 68, 0.08)"
              strokeColor="rgba(239, 68, 68, 0.2)"
              strokeWidth={1}
            />
          )
        ))}

        {/* SOS Markers */}
        {activeSOS
          .filter(sos => !activeMissionId || sos.id === activeMissionId)
          .map((sos: any) => (
            sos.latitude && sos.longitude && (
              <Marker
                key={`sos-${sos.id}`}
                coordinate={{ latitude: Number(sos.latitude), longitude: Number(sos.longitude) }}
                onPress={() => handleMarkerPress(sos)}
              >
                <View style={[
                  styles.sosMarker, 
                  sos.gravite === 'VITAL' && styles.sosVital,
                  sos.statut === 'EN_COURS' && styles.sosInProgress
                ]}>
                  <Siren size={14} color="#fff" />
                </View>
              </Marker>
            )
          ))}

        {/* Route Polyline */}
        {routePoints.length > 1 && (
          <Polyline 
            coordinates={routePoints}
            strokeColor={Colors.accentBlue}
            strokeWidth={3}
          />
        )}

        {/* Patrol Zones */}
        {showZones && zones.map(zone => {
          const parsed = parseZone(zone.localisation);
          if (!parsed) return null;
          
          const isAgentZone = isAssignedZone(zone.id);
          let color = 'rgba(255, 255, 255, 0.05)';
          let strokeColor = 'rgba(255, 255, 255, 0.2)';
          
          if (isAgentZone) {
            color = 'rgba(59, 130, 246, 0.1)'; 
            strokeColor = '#3b82f6';
          }

          if ((parsed as any).isCircle) {
             return (
               <Circle 
                 key={`zone-${zone.id}`}
                 center={parsed as any}
                 radius={zone.rayon_action || 500}
                 fillColor={color}
                 strokeColor={strokeColor}
                 strokeWidth={2}
               />
             );
          }

          return (
            <Polygon
              key={`zone-${zone.id}`}
              coordinates={parsed as any[]}
              fillColor={color}
              strokeColor={strokeColor}
              strokeWidth={isAgentZone ? 3 : 1}
            />
          );
        })}
      </MapView>

      <TouchableOpacity 
        style={styles.layerToggle}
        onPress={() => setShowZones(!showZones)}
      >
        <Layers size={18} color={showZones ? Colors.accentBlue : '#71717a'} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject },
  map: { ...StyleSheet.absoluteFillObject },
  layerToggle: {
    position: 'absolute',
    top: 120,
    right: 20,
    backgroundColor: 'rgba(24, 24, 27, 0.9)',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 5,
    zIndex: 10,
  },
  sosMarker: {
    width: 32,
    height: 32,
    backgroundColor: '#ef4444',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  sosVital: { backgroundColor: '#7f1d1d', borderColor: '#ef4444' },
  sosInProgress: { backgroundColor: Colors.accentBlue, borderColor: '#fff' },
  puckContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puckGlow: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  puckCenter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.accentBlue,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 5,
    alignItems: 'center',
  },
  puckCone: {
    position: 'absolute',
    top: -6,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fff',
  },
});
