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

export default function EditModal({ visible, item, type, onClose, onSave }) {
  const [loading, setLoading] = useState(false);

  // Form states
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState(1);
  const [activo, setActivo] = useState(true);
  const [certMaq, setCertMaq] = useState(false);

  // Inventario
  const [cantidad, setCantidad] = useState('');

  // Turnos
  const [estadoTurno, setEstadoTurno] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');

  useEffect(() => {
    if (!item) return;

    if (type === 'usuario') {
      setNombres(item.nombres || '');
      setApellidos(item.apellidos || '');
      setEmail(item.correo_electronico || '');
      setRol(item.rol || 1);
      setActivo(item.activo ?? true);
      setCertMaq(item.tiene_certificacion_maquinaria ?? false);
    } else if (type === 'inventario') {
      setCantidad(String(item.cantidad_disponible || '0'));
    } else if (type === 'turno') {
      setEstadoTurno(item.estado_asistencia || 'Presente');
      setHoraInicio(item.hora_inicio || '07:00:00');
      setHoraFin(item.hora_fin || '15:00:00');
    }
  }, [item, type]);

  if (!item) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (type === 'usuario') {
        await onSave({
          nombres,
          apellidos,
          correo_electronico: email,
          rol,
          activo,
          tiene_certificacion_maquinaria: certMaq,
        });
      } else if (type === 'inventario') {
        const num = parseFloat(cantidad);
        if (isNaN(num) || num < 0) {
          alert('Ingresa una cantidad válida mayor o igual a 0');
          setLoading(false);
          return;
        }
        await onSave(num);
      } else if (type === 'turno') {
        await onSave({
          estado_asistencia: estadoTurno,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
        });
      }
      onClose();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <Text style={styles.title}>
              Editar {type === 'usuario' ? `Usuario #${item.id_usuario}` : type === 'inventario' ? `Stock #${item.id}` : `Turno #${item.id}`}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            {type === 'usuario' && (
              <>
                <Text style={styles.label}>Nombres</Text>
                <TextInput style={styles.input} value={nombres} onChangeText={setNombres} />

                <Text style={styles.label}>Apellidos</Text>
                <TextInput style={styles.input} value={apellidos} onChangeText={setApellidos} />

                <Text style={styles.label}>Correo Electrónico</Text>
                <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />

                <Text style={styles.label}>Rol</Text>
                <View style={styles.chipRow}>
                  {[
                    { id: 1, name: 'Admin' },
                    { id: 2, name: 'Supervisor' },
                    { id: 3, name: 'Operario' },
                    { id: 4, name: 'Auxiliar' },
                  ].map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.chip, rol === r.id && styles.chipActive]}
                      onPress={() => setRol(r.id)}
                    >
                      <Text style={[styles.chipText, rol === r.id && styles.chipTextActive]}>
                        {r.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Estado:</Text>
                  <TouchableOpacity
                    style={[styles.toggleBtn, activo ? styles.toggleOn : styles.toggleOff]}
                    onPress={() => setActivo(!activo)}
                  >
                    <Text style={styles.toggleBtnText}>{activo ? 'Activo' : 'Inactivo'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Certificación de Maquinaria:</Text>
                  <TouchableOpacity
                    style={[styles.toggleBtn, certMaq ? styles.toggleOn : styles.toggleOff]}
                    onPress={() => setCertMaq(!certMaq)}
                  >
                    <Text style={styles.toggleBtnText}>{certMaq ? 'Sí' : 'No'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {type === 'inventario' && (
              <>
                <View style={styles.infoBox}>
                  <Text style={styles.infoTitle}>Material: {item.nombre_material}</Text>
                  <Text style={styles.infoSub}>Obra: {item.nombre_proyecto}</Text>
                </View>

                <Text style={styles.label}>Cantidad Disponible ({item.unidad})</Text>
                <TextInput
                  style={[styles.input, { fontSize: 18, fontWeight: 'bold' }]}
                  value={cantidad}
                  onChangeText={setCantidad}
                  keyboardType="numeric"
                />
              </>
            )}

            {type === 'turno' && (
              <>
                <View style={styles.infoBox}>
                  <Text style={styles.infoTitle}>Colaborador: {item.usuario_nombre}</Text>
                  <Text style={styles.infoSub}>Obra: {item.nombre_proyecto}</Text>
                </View>

                <Text style={styles.label}>Estado de Asistencia</Text>
                <View style={styles.chipRow}>
                  {['En Curso', 'Presente', 'Finalizado', 'Ausente Justificado'].map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.chip, estadoTurno === st && styles.chipActive]}
                      onPress={() => setEstadoTurno(st)}
                    >
                      <Text style={[styles.chipText, estadoTurno === st && styles.chipTextActive]}>
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Hora Inicio</Text>
                <TextInput style={styles.input} value={horaInicio} onChangeText={setHoraInicio} />

                <Text style={styles.label}>Hora Fin</Text>
                <TextInput style={styles.input} value={horaFin} onChangeText={setHoraFin} />
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={loading}>
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
    marginTop: 8,
    marginBottom: 4,
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  chip: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    marginTop: 10,
    paddingVertical: 4,
  },
  toggleLabel: {
    fontSize: 13,
    color: '#374151',
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 4,
  },
  toggleOn: {
    backgroundColor: '#16a34a',
  },
  toggleOff: {
    backgroundColor: '#dc2626',
  },
  toggleBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  infoSub: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
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
    backgroundColor: '#2563eb',
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
