import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verificamos si las credenciales de Supabase están configuradas y no son marcadores de posición
export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseUrl !== 'TU_SUPABASE_URL' && 
  supabaseUrl !== '' &&
  supabaseAnonKey && 
  supabaseAnonKey !== 'TU_SUPABASE_ANON_KEY' &&
  supabaseAnonKey !== ''
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Datos semilla realistas para la siembra de parchita (maracuyá)
// Cubre unos 2 meses atrás para que los filtros de rango, mes y semana tengan sentido.
const MOCK_INITIAL_DATA = [
  // Flores polinizadas (hace 8-6 semanas)
  { id: '1', tipo_registro: 'flores_polinizadas', cantidad: 45, fecha: '2026-05-01', creado_en: '2026-05-01T10:00:00Z' },
  { id: '2', tipo_registro: 'flores_polinizadas', cantidad: 60, fecha: '2026-05-05', creado_en: '2026-05-05T10:00:00Z' },
  { id: '3', tipo_registro: 'flores_polinizadas', cantidad: 80, fecha: '2026-05-10', creado_en: '2026-05-10T10:00:00Z' },
  { id: '4', tipo_registro: 'flores_polinizadas', cantidad: 95, fecha: '2026-05-15', creado_en: '2026-05-15T10:00:00Z' },
  { id: '5', tipo_registro: 'flores_polinizadas', cantidad: 120, fecha: '2026-05-20', creado_en: '2026-05-20T10:00:00Z' },
  
  // Cosecha en Kg (empiezan a madurar las de inicios de mayo)
  { id: '6', tipo_registro: 'kg_cosechados', cantidad: 15.5, fecha: '2026-05-22', creado_en: '2026-05-22T11:00:00Z' },
  { id: '7', tipo_registro: 'flores_polinizadas', cantidad: 110, fecha: '2026-05-25', creado_en: '2026-05-25T10:00:00Z' },
  { id: '8', tipo_registro: 'kg_cosechados', cantidad: 22.3, fecha: '2026-05-28', creado_en: '2026-05-28T11:00:00Z' },
  
  // Pulpa cosechada (comienza el procesamiento de la pulpa)
  { id: '9', tipo_registro: 'pulpa_cosechada', cantidad: 6.8, fecha: '2026-05-29', creado_en: '2026-05-29T14:00:00Z' },
  
  // Junio - Alta producción
  { id: '10', tipo_registro: 'flores_polinizadas', cantidad: 150, fecha: '2026-06-02', creado_en: '2026-06-02T09:00:00Z' },
  { id: '11', tipo_registro: 'kg_cosechados', cantidad: 35.8, fecha: '2026-06-05', creado_en: '2026-06-05T11:30:00Z' },
  { id: '12', tipo_registro: 'pulpa_cosechada', cantidad: 15.2, fecha: '2026-06-07', creado_en: '2026-06-07T15:00:00Z' },
  
  { id: '13', tipo_registro: 'flores_polinizadas', cantidad: 130, fecha: '2026-06-10', creado_en: '2026-06-10T09:00:00Z' },
  { id: '14', tipo_registro: 'kg_cosechados', cantidad: 48.2, fecha: '2026-06-14', creado_en: '2026-06-14T12:00:00Z' },
  { id: '15', tipo_registro: 'pulpa_cosechada', cantidad: 21.5, fecha: '2026-06-16', creado_en: '2026-06-16T16:00:00Z' },
  
  { id: '16', tipo_registro: 'flores_polinizadas', cantidad: 175, fecha: '2026-06-18', creado_en: '2026-06-18T08:30:00Z' },
  { id: '17', tipo_registro: 'kg_cosechados', cantidad: 62.0, fecha: '2026-06-22', creado_en: '2026-06-22T11:00:00Z' },
  { id: '18', tipo_registro: 'pulpa_cosechada', cantidad: 28.4, fecha: '2026-06-24', creado_en: '2026-06-24T14:30:00Z' },
  
  // Hitos recientes (fines de Junio)
  { id: '19', tipo_registro: 'flores_polinizadas', cantidad: 90, fecha: '2026-06-28', creado_en: '2026-06-28T09:00:00Z' },
  { id: '20', tipo_registro: 'kg_cosechados', cantidad: 41.5, fecha: '2026-06-29', creado_en: '2026-06-29T10:00:00Z' },
  { id: '21', tipo_registro: 'pulpa_cosechada', cantidad: 18.0, fecha: '2026-06-30', creado_en: '2026-06-30T12:00:00Z' }
];

// Inicialización de LocalStorage
const getLocalStorageRecords = () => {
  if (typeof window === 'undefined') return MOCK_INITIAL_DATA;
  const stored = localStorage.getItem('harvest_records');
  if (!stored) {
    localStorage.setItem('harvest_records', JSON.stringify(MOCK_INITIAL_DATA));
    return MOCK_INITIAL_DATA;
  }
  return JSON.parse(stored);
};

const saveLocalStorageRecords = (records) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('harvest_records', JSON.stringify(records));
  }
};

// API Unificada de CRUD para la aplicación
export async function getRecords() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('registros_cosecha')
        .select('*')
        .order('fecha', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Error fetching from Supabase, falling back to localStorage:', e);
      return getLocalStorageRecords();
    }
  } else {
    return getLocalStorageRecords().sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }
}

export async function createRecord(record) {
  const newRecord = {
    tipo_registro: record.tipo_registro,
    cantidad: parseFloat(record.cantidad),
    fecha: record.fecha,
  };

  if (isSupabaseConfigured) {
    try {
      // Buscar si ya existe un registro con la misma fecha y tipo
      const { data: existing, error: selectError } = await supabase
        .from('registros_cosecha')
        .select('*')
        .eq('fecha', record.fecha)
        .eq('tipo_registro', record.tipo_registro);

      if (selectError) throw selectError;

      if (existing && existing.length > 0) {
        // Sumar cantidades y hacer update
        const updatedQty = Number(existing[0].cantidad) + parseFloat(record.cantidad);
        const { data: updated, error: updateError } = await supabase
          .from('registros_cosecha')
          .update({ cantidad: updatedQty })
          .eq('id', existing[0].id)
          .select();

        if (updateError) throw updateError;
        return updated[0];
      } else {
        // Insertar registro nuevo
        const { data, error } = await supabase
          .from('registros_cosecha')
          .insert([newRecord])
          .select();
        
        if (error) throw error;
        return data[0];
      }
    } catch (e) {
      console.error('Error en createRecord con Supabase, intentando con LocalStorage:', e);
      return createRecordLocal(newRecord);
    }
  } else {
    return createRecordLocal(newRecord);
  }
}

// Helper para crear localmente con agregación
function createRecordLocal(newRecord) {
  const records = getLocalStorageRecords();
  const existing = records.find(r => r.fecha === newRecord.fecha && r.tipo_registro === newRecord.tipo_registro);
  
  if (existing) {
    existing.cantidad = Number(existing.cantidad) + parseFloat(newRecord.cantidad);
    saveLocalStorageRecords(records);
    return existing;
  } else {
    const createdRecord = {
      ...newRecord,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      creado_en: new Date().toISOString()
    };
    records.push(createdRecord);
    saveLocalStorageRecords(records);
    return createdRecord;
  }
}

export async function updateRecord(id, updatedFields) {
  const fieldsToUpdate = {
    tipo_registro: updatedFields.tipo_registro,
    cantidad: parseFloat(updatedFields.cantidad),
    fecha: updatedFields.fecha,
  };

  if (isSupabaseConfigured) {
    try {
      // Buscar si existe OTRO registro con la misma fecha y tipo para evitar duplicados
      const { data: existing, error: selectError } = await supabase
        .from('registros_cosecha')
        .select('*')
        .eq('fecha', updatedFields.fecha)
        .eq('tipo_registro', updatedFields.tipo_registro)
        .neq('id', id);

      if (selectError) throw selectError;

      if (existing && existing.length > 0) {
        // Sumar cantidades y actualizar el existente
        const updatedQty = Number(existing[0].cantidad) + parseFloat(updatedFields.cantidad);
        const { data: updated, error: updateError } = await supabase
          .from('registros_cosecha')
          .update({ cantidad: updatedQty })
          .eq('id', existing[0].id)
          .select();

        if (updateError) throw updateError;

        // Borrar el registro original que se editaba (para evitar duplicados)
        const { error: deleteError } = await supabase
          .from('registros_cosecha')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;
        return updated[0];
      } else {
        // Modificación clásica
        const { data, error } = await supabase
          .from('registros_cosecha')
          .update(fieldsToUpdate)
          .eq('id', id)
          .select();
        
        if (error) throw error;
        return data[0];
      }
    } catch (e) {
      console.error('Error en updateRecord con Supabase, intentando con LocalStorage:', e);
      return updateRecordLocal(id, fieldsToUpdate);
    }
  } else {
    return updateRecordLocal(id, fieldsToUpdate);
  }
}

// Helper para modificar localmente con agregación
function updateRecordLocal(id, fieldsToUpdate) {
  const records = getLocalStorageRecords();
  const idx = records.findIndex(r => r.id === id);
  if (idx !== -1) {
    const collisionIdx = records.findIndex(r => r.id !== id && r.fecha === fieldsToUpdate.fecha && r.tipo_registro === fieldsToUpdate.tipo_registro);
    if (collisionIdx !== -1) {
      records[collisionIdx].cantidad = Number(records[collisionIdx].cantidad) + parseFloat(fieldsToUpdate.cantidad);
      records.splice(idx, 1); // Remover duplicado
      saveLocalStorageRecords(records);
      return records[collisionIdx];
    } else {
      records[idx] = {
        ...records[idx],
        ...fieldsToUpdate
      };
      saveLocalStorageRecords(records);
      return records[idx];
    }
  }
  throw new Error('Registro no encontrado');
}

export async function deleteRecord(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('registros_cosecha')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } else {
    const records = getLocalStorageRecords();
    const filtered = records.filter(r => r.id !== id);
    saveLocalStorageRecords(filtered);
    return true;
  }
}
