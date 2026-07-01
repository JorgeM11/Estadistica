'use client';

import { useState, useEffect } from 'react';
import Tabs from '@/components/Tabs';
import Charts from '@/components/Charts';
import RecordList from '@/components/RecordList';
import {
  isSupabaseConfigured,
  getRecords,
  createRecord,
  updateRecord,
  deleteRecord
} from '@/lib/supabase';
import { Database, Sprout, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' o 'records'
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar registros al montar
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const data = await getRecords();
        setRecords(data);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('No se pudieron obtener los registros de la base de datos.');
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Función para refrescar manualmente
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const data = await getRecords();
      setRecords(data);
    } catch (err) {
      console.error('Error al recargar:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Crear nuevo registro
  const handleCreate = async (newRecord) => {
    try {
      setRefreshing(true);
      const created = await createRecord(newRecord);
      // Recargar para obtener la lista ordenada completa y limpia
      const data = await getRecords();
      setRecords(data);
      return true;
    } catch (err) {
      console.error('Error creando registro:', err);
      alert('Error al guardar el nuevo registro.');
      return false;
    } finally {
      setRefreshing(false);
    }
  };

  // Editar registro
  const handleUpdate = async (id, updatedFields) => {
    try {
      setRefreshing(true);
      await updateRecord(id, updatedFields);
      // Recargar datos
      const data = await getRecords();
      setRecords(data);
      return true;
    } catch (err) {
      console.error('Error editando registro:', err);
      alert('Error al actualizar el registro.');
      return false;
    } finally {
      setRefreshing(false);
    }
  };

  // Eliminar registro
  const handleDelete = async (id) => {
    try {
      setRefreshing(true);
      await deleteRecord(id);
      // Recargar datos
      const data = await getRecords();
      setRecords(data);
      return true;
    } catch (err) {
      console.error('Error eliminando registro:', err);
      alert('Error al borrar el registro.');
      return false;
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans flex flex-col antialiased">
      {/* Contenedor responsivo sin forzar ancho móvil en laptops */}
      <div className="w-full bg-zinc-50 dark:bg-zinc-950 min-h-screen flex flex-col">
        
        {/* Cabecera Principal */}
        <header className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white sticky top-0 z-30 shadow-md">
          <div className="max-w-5xl mx-auto w-full px-5 pt-6 pb-5 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                  <Sprout className="w-5 h-5 text-emerald-350 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-lg font-extrabold tracking-tight">Parchita Bomzai</h1>
                  <p className="text-[10px] font-semibold text-emerald-250 uppercase tracking-widest">Siembra & Cosecha</p>
                </div>
              </div>
              
              {/* Botón de Refrescar */}
              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="p-2 rounded-xl bg-white/5 active:bg-white/10 hover:bg-white/10 transition-colors flex items-center justify-center text-white/90 disabled:opacity-50 cursor-pointer"
                title="Refrescar datos"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-300' : ''}`} />
              </button>
            </div>
          </div>
        </header>

        {/* Sistema de Pestañas (Navegación) */}
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Área de Contenido Principal */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-5 py-6 overflow-y-auto">
          {loading ? (
            /* Loader Centrado */
            <div className="h-[50vh] flex flex-col items-center justify-center gap-3">
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-600 animate-spin" />
                <Sprout className="w-5 h-5 text-emerald-500 absolute animate-bounce" />
              </div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Analizando el campo de cultivo...</p>
            </div>
          ) : error ? (
            /* Mensaje de Error */
            <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 text-center flex flex-col items-center gap-3 mt-10">
              <ShieldAlert className="w-10 h-10 text-red-500" />
              <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Error en Base de Datos</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[240px] leading-relaxed">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : (
            /* Componente de la pestaña activa */
            <div className="animate-in fade-in duration-300">
              {activeTab === 'dashboard' ? (
                <Charts records={records} />
              ) : (
                <RecordList
                  records={records}
                  onCreate={handleCreate}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              )}
            </div>
          )}
        </main>

        {/* Footer Indicativo de la PWA */}
        <footer className="w-full py-6 text-center border-t border-zinc-200/50 dark:border-zinc-900/60 bg-white/70 dark:bg-zinc-950/70 text-[10px] text-zinc-400 dark:text-zinc-500 mt-auto font-medium">
          <div className="max-w-5xl mx-auto px-5">
            <p>© 2026 Parchita Bomzai</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
