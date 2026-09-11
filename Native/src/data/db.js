// =========================================================
// Titan V - Capa de Datos Conectada a PostgreSQL (DB: native)
// Soporte CRUD completo: Create, Read, Update, Delete
// =========================================================

import { Platform } from 'react-native';

export const API_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';

export const ROLES_MAP = {
  1: 'Super Administrador',
  2: 'Supervisor de Obra',
  3: 'Operario de Maquinaria',
  4: 'Auxiliar de Construcción'
};

// Servicios CRUD conectados directamente con PostgreSQL vía API local
export const dbService = {
  checkStatus: async () => {
    try {
      const res = await fetch(`${API_HOST}/api/status`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) return await res.json();
      return { online: false };
    } catch {
      return { online: false };
    }
  },

  getProyectos: async () => {
    try {
      const res = await fetch(`${API_HOST}/api/proyectos`);
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  },

  getMateriales: async () => {
    try {
      const res = await fetch(`${API_HOST}/api/materiales`);
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  },

  // ==========================================
  // USUARIOS
  // ==========================================
  getUsuarios: async () => {
    try {
      const res = await fetch(`${API_HOST}/api/usuarios`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) return await res.json();
      return [];
    } catch (e) {
      console.warn('Error al leer usuarios de PostgreSQL:', e.message);
      return [];
    }
  },

  actualizarUsuario: async (id, datos) => {
    const res = await fetch(`${API_HOST}/api/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar usuario');
    return json;
  },

  eliminarUsuario: async (id) => {
    const res = await fetch(`${API_HOST}/api/usuarios/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al eliminar usuario');
    return json;
  },

  // ==========================================
  // INVENTARIOS
  // ==========================================
  getInventarios: async () => {
    try {
      const res = await fetch(`${API_HOST}/api/inventarios`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) return await res.json();
      return [];
    } catch (e) {
      console.warn('Error al leer inventarios de PostgreSQL:', e.message);
      return [];
    }
  },

  crearInventario: async (datos) => {
    const res = await fetch(`${API_HOST}/api/inventarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al agregar a inventario');
    return json;
  },

  actualizarInventario: async (id, cantidad_disponible) => {
    const res = await fetch(`${API_HOST}/api/inventarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cantidad_disponible }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar inventario');
    return json;
  },

  eliminarInventario: async (id) => {
    const res = await fetch(`${API_HOST}/api/inventarios/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al eliminar de inventario');
    return json;
  },

  // ==========================================
  // TURNOS
  // ==========================================
  getTurnos: async () => {
    try {
      const res = await fetch(`${API_HOST}/api/turnos`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) return await res.json();
      return [];
    } catch (e) {
      console.warn('Error al leer turnos de PostgreSQL:', e.message);
      return [];
    }
  },

  actualizarTurno: async (id, datos) => {
    const res = await fetch(`${API_HOST}/api/turnos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar turno');
    return json;
  },

  eliminarTurno: async (id) => {
    const res = await fetch(`${API_HOST}/api/turnos/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al eliminar turno');
    return json;
  }
};
