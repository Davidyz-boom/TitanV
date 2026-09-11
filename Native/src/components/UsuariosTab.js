import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';

export default function UsuariosTab({ data, refreshing, onRefresh, onSelectItem, onEdit, onDelete }) {
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('todos');

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        item.nombres.toLowerCase().includes(search.toLowerCase()) ||
        item.apellidos.toLowerCase().includes(search.toLowerCase()) ||
        item.correo_electronico.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (filtro === 'activos') return item.activo === true;
      if (filtro === 'certificados') return item.tiene_certificacion_maquinaria === true;
      return true;
    });
  }, [data, search, filtro]);

  const getRolName = (rol) => {
    switch (rol) {
      case 1:
        return 'Administrador';
      case 2:
        return 'Supervisor';
      case 3:
        return 'Operario';
      default:
        return 'Auxiliar';
    }
  };

  const handleDelete = (item) => {
    const msg = `¿Deseas eliminar a ${item.nombres} ${item.apellidos}?`;
    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(msg)) onDelete(item.id_usuario, 'usuario');
    } else {
      Alert.alert('Eliminar Usuario', msg, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(item.id_usuario, 'usuario') },
      ]);
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.card}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => onSelectItem(item, 'usuario')}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>
                {item.nombres} {item.apellidos}
              </Text>
              <Text style={styles.userEmail}>{item.correo_electronico}</Text>
            </View>
            <View style={[styles.statusBadge, item.activo ? styles.statusActive : styles.statusInactive]}>
              <Text style={[styles.statusText, item.activo ? styles.textActive : styles.textInactive]}>
                {item.activo ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Rol: <Text style={styles.infoValue}>{getRolName(item.rol)}</Text>
            </Text>
            <Text style={styles.infoLabel}>
              Certificación: <Text style={styles.infoValue}>{item.tiene_certificacion_maquinaria ? 'Sí' : 'No'}</Text>
            </Text>
            <Text style={styles.infoLabel}>
              Licencia: <Text style={styles.infoValue}>{item.fecha_vencimiento_licencia || 'N/A'}</Text>
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.cardFooter}>
          <Text style={styles.idText}>ID: #{item.id_usuario}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item, 'usuario')}>
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
          placeholder="Buscar por nombre o correo..."
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
          style={[styles.filterBtn, filtro === 'activos' && styles.filterBtnActive]}
          onPress={() => setFiltro('activos')}
        >
          <Text style={[styles.filterText, filtro === 'activos' && styles.filterTextActive]}>
            Activos ({data.filter((u) => u.activo).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filtro === 'certificados' && styles.filterBtnActive]}
          onPress={() => setFiltro('certificados')}
        >
          <Text style={[styles.filterText, filtro === 'certificados' && styles.filterTextActive]}>
            Certificados ({data.filter((u) => u.tiene_certificacion_maquinaria).length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => String(item.id_usuario)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay usuarios registrados.</Text>
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
  userEmail: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#dcfce7',
  },
  statusInactive: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  textActive: {
    color: '#16a34a',
  },
  textInactive: {
    color: '#dc2626',
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
    marginTop: 10,
    paddingTop: 8,
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
