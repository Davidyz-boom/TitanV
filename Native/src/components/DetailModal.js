import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function DetailModal({ visible, item, type, onClose }) {
  if (!item) return null;

  const renderField = (label, value) => {
    return (
      <View style={styles.fieldRow} key={label}>
        <Text style={styles.fieldLabel}>{label}:</Text>
        <Text style={styles.fieldValue}>
          {value === null || value === undefined ? '—' : String(value)}
        </Text>
      </View>
    );
  };

  const getTitle = () => {
    if (type === 'usuario') return `Usuario #${item.id_usuario}`;
    if (type === 'inventario') return `Inventario #${item.id}`;
    if (type === 'turno') return `Turno #${item.id}`;
    return 'Detalle';
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <Text style={styles.title}>{getTitle()}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            {type === 'usuario' && (
              <>
                {renderField('ID', item.id_usuario)}
                {renderField('Nombres', item.nombres)}
                {renderField('Apellidos', item.apellidos)}
                {renderField('Correo', item.correo_electronico)}
                {renderField('Rol', item.rol === 1 ? 'Admin' : item.rol === 2 ? 'Supervisor' : item.rol === 3 ? 'Operario' : 'Auxiliar')}
                {renderField('Activo', item.activo ? 'Sí' : 'No')}
                {renderField('Certificación de maquinaria', item.tiene_certificacion_maquinaria ? 'Sí' : 'No')}
                {renderField('Vencimiento de licencia', item.fecha_vencimiento_licencia || 'No registra')}
              </>
            )}

            {type === 'inventario' && (
              <>
                {renderField('ID Registro', item.id)}
                {renderField('Obra / Proyecto', `${item.proyecto_id} - ${item.nombre_proyecto}`)}
                {renderField('Material', `${item.material_id} - ${item.nombre_material}`)}
                {renderField('Cantidad disponible', `${item.cantidad_disponible} ${item.unidad || ''}`)}
                {renderField('Stock mínimo', `${item.stock_minimo || 20} ${item.unidad || ''}`)}
                {renderField('Estado', item.cantidad_disponible <= (item.stock_minimo || 20) ? 'Bajo' : 'Normal')}
              </>
            )}

            {type === 'turno' && (
              <>
                {renderField('ID Turno', item.id)}
                {renderField('Obra / Proyecto', `${item.proyecto_id} - ${item.nombre_proyecto}`)}
                {renderField('Colaborador', `${item.usuario_id} - ${item.usuario_nombre}`)}
                {renderField('Fecha', item.fecha_turno)}
                {renderField('Hora inicio', item.hora_inicio)}
                {renderField('Hora fin', item.hora_fin)}
                {renderField('Estado', item.estado_asistencia)}
              </>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.closeActionBtn} onPress={onClose}>
            <Text style={styles.closeActionText}>Cerrar</Text>
          </TouchableOpacity>
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
    maxHeight: '80%',
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
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  fieldLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  closeActionBtn: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center',
  },
  closeActionText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 13,
  },
});
