import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function Header({ dbStatus, usuariosCount, inventariosCount, turnosCount, onRefresh }) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.title}>Titan V</Text>
          <Text style={styles.subtitle}>Gestión de Obra - Panel Administrativo</Text>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Text style={styles.refreshText}>Actualizar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusCircle,
            { backgroundColor: dbStatus?.online ? '#16a34a' : '#dc2626' },
          ]}
        />
        <Text style={styles.statusLabel}>
          {dbStatus?.online
            ? `Conectado a PostgreSQL (${dbStatus.database} - puerto ${dbStatus.port})`
            : 'Sin conexión a base de datos'}
        </Text>
      </View>

      <View style={styles.countersRow}>
        <View style={styles.counterBox}>
          <Text style={styles.counterNum}>{usuariosCount}</Text>
          <Text style={styles.counterTxt}>Usuarios</Text>
        </View>
        <View style={styles.counterBox}>
          <Text style={styles.counterNum}>{inventariosCount}</Text>
          <Text style={styles.counterTxt}>Materiales</Text>
        </View>
        <View style={styles.counterBox}>
          <Text style={styles.counterNum}>{turnosCount}</Text>
          <Text style={styles.counterTxt}>Turnos</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  refreshButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  refreshText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 11,
    color: '#4b5563',
  },
  countersRow: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'space-around',
  },
  counterBox: {
    alignItems: 'center',
  },
  counterNum: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  counterTxt: {
    fontSize: 11,
    color: '#6b7280',
  },
});
