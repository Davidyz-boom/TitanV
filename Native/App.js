import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

import { dbService } from './src/data/db';
import Header from './src/components/Header';
import UsuariosTab from './src/components/UsuariosTab';
import InventariosTab from './src/components/InventariosTab';
import TurnosTab from './src/components/TurnosTab';
import DetailModal from './src/components/DetailModal';
import EditModal from './src/components/EditModal';
import AddInventarioModal from './src/components/AddInventarioModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('inventarios');

  const [usuarios, setUsuarios] = useState([]);
  const [inventarios, setInventarios] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [materiales, setMateriales] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dbStatus, setDbStatus] = useState({ online: false });

  // Modales
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [selectedDetailType, setSelectedDetailType] = useState('usuario');

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingType, setEditingType] = useState('usuario');

  const [addInvModalVisible, setAddInvModalVisible] = useState(false);

  // Carga inicial y recarga
  const cargarDatos = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [status, uData, iData, tData, pData, mData] = await Promise.all([
        dbService.checkStatus(),
        dbService.getUsuarios(),
        dbService.getInventarios(),
        dbService.getTurnos(),
        dbService.getProyectos(),
        dbService.getMateriales(),
      ]);

      setDbStatus(status);
      setUsuarios(uData);
      setInventarios(iData);
      setTurnos(tData);
      setProyectos(pData);
      setMateriales(mData);
    } catch (err) {
      console.error('Error al sincronizar con PostgreSQL:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleSelectItem = (item, type) => {
    setSelectedDetailItem(item);
    setSelectedDetailType(type);
    setDetailModalVisible(true);
  };

  const handleOpenEdit = (item, type) => {
    setEditingItem(item);
    setEditingType(type);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async (payload) => {
    try {
      if (editingType === 'usuario') {
        await dbService.actualizarUsuario(editingItem.id_usuario, payload);
      } else if (editingType === 'inventario') {
        await dbService.actualizarInventario(editingItem.id, payload);
      } else if (editingType === 'turno') {
        await dbService.actualizarTurno(editingItem.id, payload);
      }
      await cargarDatos(true);
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async (id, type) => {
    try {
      setLoading(true);
      if (type === 'usuario') {
        await dbService.eliminarUsuario(id);
      } else if (type === 'inventario') {
        await dbService.eliminarInventario(id);
      } else if (type === 'turno') {
        await dbService.eliminarTurno(id);
      }
      await cargarDatos(true);
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
      setLoading(false);
    }
  };

  const handleAddInventario = async (payload) => {
    try {
      await dbService.crearInventario(payload);
      await cargarDatos(true);
    } catch (err) {
      throw err;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="dark" />

      {/* Cabecera */}
      <Header
        dbStatus={dbStatus}
        usuariosCount={usuarios.length}
        inventariosCount={inventarios.length}
        turnosCount={turnos.length}
        onRefresh={() => cargarDatos(true)}
      />

      {/* Pestañas estándar */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'inventarios' && styles.tabButtonActive]}
          onPress={() => setActiveTab('inventarios')}
        >
          <Text style={[styles.tabText, activeTab === 'inventarios' && styles.tabTextActive]}>
            Inventario ({inventarios.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'usuarios' && styles.tabButtonActive]}
          onPress={() => setActiveTab('usuarios')}
        >
          <Text style={[styles.tabText, activeTab === 'usuarios' && styles.tabTextActive]}>
            Usuarios ({usuarios.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'turnos' && styles.tabButtonActive]}
          onPress={() => setActiveTab('turnos')}
        >
          <Text style={[styles.tabText, activeTab === 'turnos' && styles.tabTextActive]}>
            Turnos ({turnos.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Vistas */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.loadingText}>Cargando datos de la base de datos...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'inventarios' && (
              <InventariosTab
                data={inventarios}
                refreshing={refreshing}
                onRefresh={() => cargarDatos(true)}
                onSelectItem={handleSelectItem}
                onOpenAddModal={() => setAddInvModalVisible(true)}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
              />
            )}

            {activeTab === 'usuarios' && (
              <UsuariosTab
                data={usuarios}
                refreshing={refreshing}
                onRefresh={() => cargarDatos(true)}
                onSelectItem={handleSelectItem}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
              />
            )}

            {activeTab === 'turnos' && (
              <TurnosTab
                data={turnos}
                refreshing={refreshing}
                onRefresh={() => cargarDatos(true)}
                onSelectItem={handleSelectItem}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
              />
            )}
          </>
        )}
      </View>

      {/* Modales */}
      <DetailModal
        visible={detailModalVisible}
        item={selectedDetailItem}
        type={selectedDetailType}
        onClose={() => setDetailModalVisible(false)}
      />

      <EditModal
        visible={editModalVisible}
        item={editingItem}
        type={editingType}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveEdit}
      />

      <AddInventarioModal
        visible={addInvModalVisible}
        proyectos={proyectos}
        materiales={materiales}
        onClose={() => setAddInvModalVisible(false)}
        onSave={handleAddInventario}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6b7280',
  },
});
