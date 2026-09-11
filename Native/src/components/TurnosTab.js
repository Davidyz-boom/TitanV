import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';

export default function TurnosTab({ data, refreshing, onRefresh, onSelectItem, onEdit, onDelete }) {
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('todos');

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        (item.usuario_nombre || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.nombre_proyecto || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.fecha_turno || '').includes(search) ||
        (item.estado_asistencia || '').toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (filtro === 'en_curso') return (item.estado_asistencia || '').toLowerCase().includes('curso');
      if (filtro === 'finalizados') return (item.estado_asistencia || '').toLowerCase().includes('finalizado');
      return true;
    });
  }, [data, search, filtro]);

  const handleDelete = (item) => {
    const msg = `¿Eliminar el turno #${item.id} de ${item.usuario_nombre}?`;
    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(msg)) onDelete(item.id, 'turno');
    } else {
      Alert.alert('Eliminar Turno', msg, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(item.id, 'turno') },
      ]);
    }
  };

  const getStatusBadge = (estado = '') => {
    const est = estado.toLowerCase();
    if (est.includes('curso')) return { bg: '#e0f2fe', text: '#0369a1' };
    if (est.includes('presente') || est.includes('finalizado')) return { bg: '#dcfce7', text: '#15803d' };
    return { bg: '#fef3c7', text: '#b45309' };
  };

  const renderItem = ({ item }) => {
    const badgeStyle = getStatusBadge(item.estado_asistencia);

    return (
      <View style={styles.card}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => onSelectItem(item, 'turno')}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{item.usuario_nombre}</Text>
              <Text style={styles.projectName}>Obra: {item.nombre_proyecto}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: badgeStyle.bg }]}>
              <Text style={[styles.statusText, { color: badgeStyle.text }]}>
                {item.estado_asistencia}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Fecha: <Text style={styles.infoValue}>{item.fecha_turno}</Text>
            </Text>
            <Text style={styles.infoLabel}>
              Horario: <Text style={styles.infoValue}>{item.hora_inicio} - {item.hora_fin}</Text>
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.cardFooter}>
          <Text style={styles.idText}>Turno #{item.id}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item, 'turno')}>
              <Text style={styles.editBtnText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
              <Text style={styles.deleteBtnText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por colaborador, obra o fecha..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filtro === 'todos' && styles.filterBtnActive]}
          onPress={() => setFiltro('todos')}
        >
          <Text style={[styles.filterText, filtro === 'todos' && styles.filterTextActive]}>
            Todos ({data.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filtro === 'en_curso' && styles.filterBtnActive]}
          onPress={() => setFiltro('en_curso')}
        >
          <Text style={[styles.filterText, filtro === 'en_curso' && styles.filterTextActive]}>
            En Curso ({data.filter((t) => (t.estado_asistencia || '').toLowerCase().includes('curso')).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filtro === 'finalizados' && styles.filterBtnActive]}
          onPress={() => setFiltro('finalizados')}
        >
          <Text style={[styles.filterText, filtro === 'finalizados' && styles.filterTextActive]}>
            Finalizados ({data.filter((t) => (t.estado_asistencia || '').toLowerCase().includes('finalizado')).length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay turnos registrados.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 6,
  },
  filterBtn: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  filterBtnActive: {
    backgroundColor: '#2563eb',
  },
  filterText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  projectName: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  infoValue: {
    color: '#1f2937',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  idText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  editBtn: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  editBtnText: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  deleteBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deleteBtnText: {
    fontSize: 12,
    color: '#b91c1c',
    fontWeight: '500',
  },
  empty: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
  },
});
