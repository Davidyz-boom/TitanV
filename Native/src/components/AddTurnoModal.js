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

export default function AddTurnoModal({ visible, proyectos, usuarios, onClose, onSave }) {
  const [loading, setLoading] = useState(false);

  const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [proyectoId, setProyectoId] = useState(1);
  const [usuarioId, setUsuarioId] = useState(1);
  const [fechaTurno, setFechaTurno] = useState(getTodayDate());
  const [horaInicio, setHoraInicio] = useState('07:00:00');
  const [horaFin, setHoraFin] = useState('15:00:00');
  const [estadoAsistencia, setEstadoAsistencia] = useState('Programado');

  useEffect(() => {
    if (proyectos?.length > 0 && !proyectoId) setProyectoId(proyectos[0].id);
    if (usuarios?.length > 0 && !usuarioId) setUsuarioId(usuarios[0].id_usuario);
    setFechaTurno(getTodayDate());
  }, [proyectos, usuarios]);

  const handleSave = async () => {
    if (!proyectoId || !usuarioId) {
      alert('Por favor selecciona una obra y un colaborador');
      return;
    }

    if (!fechaTurno.trim() || !horaInicio.trim() || !horaFin.trim()) {
      alert('Por favor completa la fecha y las horas del turno');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        proyecto_id: proyectoId,
        usuario_id: usuarioId,
        fecha_turno: fechaTurno.trim(),
        hora_inicio: horaInicio.trim(),
        hora_fin: horaFin.trim(),
        estado_asistencia: estadoAsistencia,
      });
      // Restablecer valores
      setHoraInicio('07:00:00');
      setHoraFin('15:00:00');
      setEstadoAsistencia('Programado');
      onClose();
    } catch (err) {
      alert('Error al registrar turno: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <Text style={styles.title}>Crear Turno de Trabajo</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* 1. Seleccionar Obra */}
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

            {/* 2. Seleccionar Colaborador */}
            <Text style={[styles.label, { marginTop: 10 }]}>2. Colaborador asignado:</Text>
            <View style={styles.chipColumn}>
              {usuarios.map((u) => (
                <TouchableOpacity
                  key={u.id_usuario}
                  style={[styles.chip, usuarioId === u.id_usuario && styles.chipActive]}
                  onPress={() => setUsuarioId(u.id_usuario)}
                >
                  <Text style={[styles.chipText, usuarioId === u.id_usuario && styles.chipTextActive]}>
                    {u.nombres} {u.apellidos} ({u.rol === 1 ? 'Admin' : u.rol === 2 ? 'Supervisor' : u.rol === 3 ? 'Operario' : 'Auxiliar'})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 3. Fecha */}
            <Text style={[styles.label, { marginTop: 10 }]}>3. Fecha del Turno (YYYY-MM-DD):</Text>
            <TextInput
              style={styles.input}
              value={fechaTurno}
              onChangeText={setFechaTurno}
              placeholder="Ej: 2026-09-16"
              placeholderTextColor="#9ca3af"
            />

            {/* 4. Horarios */}
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Text style={styles.label}>Hora Inicio:</Text>
                <TextInput
                  style={styles.input}
                  value={horaInicio}
                  onChangeText={setHoraInicio}
                  placeholder="07:00:00"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={styles.label}>Hora Fin:</Text>
                <TextInput
                  style={styles.input}
                  value={horaFin}
                  onChangeText={setHoraFin}
                  placeholder="15:00:00"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {/* 5. Estado de Asistencia */}
            <Text style={[styles.label, { marginTop: 10 }]}>5. Estado:</Text>
            <View style={styles.statusRow}>
              {['Programado', 'En Curso', 'Presente', 'Finalizado'].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.statusChip, estadoAsistencia === st && styles.statusChipActive]}
                  onPress={() => setEstadoAsistencia(st)}
                >
                  <Text style={[styles.statusChipText, estadoAsistencia === st && styles.statusChipTextActive]}>
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Guardar Turno</Text>
              )}
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
    maxHeight: '88%',
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
  chipColumn: {
    gap: 4,
    marginBottom: 4,
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
  row: {
    flexDirection: 'row',
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  statusChip: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  statusChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  statusChipText: {
    fontSize: 12,
    color: '#374151',
  },
  statusChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
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
