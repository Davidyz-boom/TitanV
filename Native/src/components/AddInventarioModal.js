import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

export default function AddInventarioModal({ visible, proyectos, materiales, onClose, onSave }) {
  const [loading, setLoading] = useState(false);

  const [proyectoId, setProyectoId] = useState(1);
  const [materialId, setMaterialId] = useState(101);
  const [modoNuevoMaterial, setModoNuevoMaterial] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaUnidad, setNuevaUnidad] = useState('');
  const [cantidad, setCantidad] = useState('50');

  useEffect(() => {
    if (proyectos?.length > 0 && !proyectoId) setProyectoId(proyectos[0].id);
    if (materiales?.length > 0 && !materialId) setMaterialId(materiales[0].id);
  }, [proyectos, materiales]);

  const handleSave = async () => {
    const cantNum = parseFloat(cantidad);
    if (isNaN(cantNum) || cantNum <= 0) {
      alert('Ingresa una cantidad mayor a cero');
      return;
    }

    if (modoNuevoMaterial && !nuevoNombre.trim()) {
      alert('Ingresa el nombre del material');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        proyecto_id: proyectoId,
        material_id: modoNuevoMaterial ? null : materialId,
        nuevo_material_nombre: modoNuevoMaterial ? nuevoNombre.trim() : null,
        unidad_medida: modoNuevoMaterial ? nuevaUnidad.trim() || 'Unidades' : null,
        cantidad_disponible: cantNum,
      });
      setNuevoNombre('');
      setNuevaUnidad('');
      setCantidad('50');
      setModoNuevoMaterial(false);
      onClose();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <Text style={styles.title}>Agregar Material a Inventario</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            <Text style={styles.label}>1. Obra o Proyecto:</Text>
            <View style={styles.chipColumn}>
              {proyectos.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.chip, proyectoId === p.id && styles.chipActive]}
                  onPress={() => setProyectoId(p.id)}
                >
                  <Text style={[styles.chipText, proyectoId === p.id && styles.chipTextActive]}>
                    {p.nombre_proyecto}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.label}>2. Material:</Text>
              <TouchableOpacity onPress={() => setModoNuevoMaterial(!modoNuevoMaterial)}>
                <Text style={styles.linkText}>
                  {modoNuevoMaterial ? '← Seleccionar existente' : '+ Crear nuevo'}
                </Text>
              </TouchableOpacity>
            </View>

            {!modoNuevoMaterial ? (
              <View style={styles.chipColumn}>
                {materiales.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.chip, materialId === m.id && styles.chipActive]}
                    onPress={() => setMaterialId(m.id)}
                  >
                    <Text style={[styles.chipText, materialId === m.id && styles.chipTextActive]}>
                      {m.nombre_material} ({m.unidad_medida})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.newBox}>
                <Text style={styles.subLabel}>Nombre:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Pintura blanca"
                  placeholderTextColor="#9ca3af"
                  value={nuevoNombre}
                  onChangeText={setNuevoNombre}
                />
                <Text style={[styles.subLabel, { marginTop: 6 }]}>Unidad de medida:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Galón, Kg, Metro"
                  placeholderTextColor="#9ca3af"
                  value={nuevaUnidad}
                  onChangeText={setNuevaUnidad}
                />
              </View>
            )}

            <Text style={[styles.label, { marginTop: 10 }]}>3. Cantidad Inicial:</Text>
            <TextInput
              style={[styles.input, { fontSize: 16, fontWeight: 'bold' }]}
              value={cantidad}
              onChangeText={setCantidad}
              keyboardType="numeric"
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Guardar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  dialog: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 16,
    color: '#6b7280',
  },
  body: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginTop: 6,
    marginBottom: 4,
  },
  subLabel: {
    fontSize: 11,
    color: '#4b5563',
    marginBottom: 2,
  },
  chipColumn: {
    gap: 4,
    marginBottom: 6,
  },
  chip: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 4,
  },
  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipText: {
    fontSize: 12,
    color: '#374151',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  linkText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
  newBox: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 13,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
});
