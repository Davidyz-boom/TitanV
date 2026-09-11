import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';

export default function InventariosTab({
  data,
  refreshing,
  onRefresh,
  onSelectItem,
  onOpenAddModal,
  onEdit,
  onDelete,
}) {
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('todos');

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        (item.nombre_material || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.nombre_proyecto || '').toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      const bajoStock = item.cantidad_disponible <= (item.stock_minimo || 20);
      if (filtro === 'bajo') return bajoStock;
      if (filtro === 'normal') return !bajoStock;
      return true;
    });
  }, [data, search, filtro]);

  const handleDelete = (item) => {
    const msg = `¿Eliminar "${item.nombre_material}" de la obra "${item.nombre_proyecto}"?`;
    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(msg)) onDelete(item.id, 'inventario');
    } else {
      Alert.alert('Eliminar de Inventario', msg, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(item.id, 'inventario') },
      ]);
    }
  };

  const renderItem = ({ item }) => {
    const bajoStock = item.cantidad_disponible <= (item.stock_minimo || 20);

    return (
      <View style={styles.card}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => onSelectItem(item, 'inventario')}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.materialName}>{item.nombre_material}</Text>
              <Text style={styles.projectName}>Obra: {item.nombre_proyecto}</Text>
            </View>
            <View style={[styles.stockBadge, bajoStock ? styles.badgeBajo : styles.badgeNormal]}>
              <Text style={[styles.stockBadgeText, bajoStock ? styles.textBajo : styles.textNormal]}>
                {bajoStock ? 'Stock Bajo' : 'Disponible'}
              </Text>
            </View>
          </View>

          <View style={styles.stockRow}>
            <Text style={styles.stockValue}>
              {item.cantidad_disponible} <Text style={styles.unitText}>{item.unidad}</Text>
            </Text>
            <Text style={styles.stockMin}>Mínimo: {item.stock_minimo || 20} {item.unidad}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.cardFooter}>
          <Text style={styles.idText}>Registro #{item.id}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item, 'inventario')}>
              <Text style={styles.editBtnText}>Editar Stock</Text>
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
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.addBtn} onPress={onOpenAddModal}>
          <Text style={styles.addBtnText}>+ Agregar Material a Obra</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por material u obra..."
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
          style={[styles.filterBtn, filtro === 'normal' && styles.filterBtnActive]}
          onPress={() => setFiltro('normal')}
        >
          <Text style={[styles.filterText, filtro === 'normal' && styles.filterTextActive]}>
            Normal ({data.filter((i) => i.cantidad_disponible > (i.stock_minimo || 20)).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filtro === 'bajo' && styles.filterBtnActive]}
          onPress={() => setFiltro('bajo')}
        >
          <Text style={[styles.filterText, filtro === 'bajo' && styles.filterTextActive]}>
            Bajo ({data.filter((i) => i.cantidad_disponible <= (i.stock_minimo || 20)).length})
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
            <Text style={styles.emptyText}>No hay materiales registrados.</Text>
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
  topRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  addBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 6,
    paddingVertical: 9,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 6,
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
  materialName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  projectName: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeNormal: {
    backgroundColor: '#dcfce7',
  },
  badgeBajo: {
    backgroundColor: '#fee2e2',
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  textNormal: {
    color: '#16a34a',
  },
  textBajo: {
    color: '#dc2626',
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  stockValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  unitText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 'normal',
  },
  stockMin: {
    fontSize: 11,
    color: '#9ca3af',
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
