'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  Leaf,
  Scale,
  Percent,
  X,
  AlertTriangle,
  Info,
  ChevronDown,
  Sprout,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import CustomSelect from './CustomSelect';

export default function RecordList({ records, onCreate, onUpdate, onDelete }) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Estados para filtrar y ordenar el historial
  const [filterCat, setFilterCat] = useState('todos');
  const [filterDate, setFilterDate] = useState('');
  const [sortOption, setSortOption] = useState('reciente'); // 'reciente', 'antiguo', 'max_unidades', 'min_unidades'

  // Estados de trazabilidad de ciclo de 60 días
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [selectedPivotRecord, setSelectedPivotRecord] = useState(null);

  // Estados de control de Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null); // Si es null, estamos creando
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Calcular fechas del ciclo de 60 días
  const cycleDates = useMemo(() => {
    if (!selectedPivotRecord) return { DA: '', DB: '', friendlyDA: '', friendlyDB: '' };
    
    const pivotDate = selectedPivotRecord.fecha;
    const addDays = (dateStr, days) => {
      const d = new Date(dateStr + 'T12:00:00');
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    let DA, DB;
    if (selectedPivotRecord.tipo_registro === 'flores_polinizadas') {
      DA = pivotDate;
      DB = addDays(pivotDate, 60);
    } else {
      DA = addDays(pivotDate, -60);
      DB = pivotDate;
    }

    const formatFriendly = (dateStr) => {
      try {
        const dateObj = new Date(dateStr + 'T12:00:00');
        return dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
      } catch (e) {
        return dateStr;
      }
    };

    return {
      DA,
      DB,
      friendlyDA: formatFriendly(DA),
      friendlyDB: formatFriendly(DB)
    };
  }, [selectedPivotRecord]);

  // Obtener los valores del ciclo de 60 días
  const cycleValues = useMemo(() => {
    if (!selectedPivotRecord) return { flores: 0, cosecha: 0, pulpa: 0 };
    
    const getQtyOnDate = (dateStr, type) => {
      const record = records.find(r => r.fecha === dateStr && r.tipo_registro === type);
      return record ? Number(record.cantidad) : 0;
    };

    return {
      flores: getQtyOnDate(cycleDates.DA, 'flores_polinizadas'),
      cosecha: getQtyOnDate(cycleDates.DB, 'kg_cosechados'),
      pulpa: getQtyOnDate(cycleDates.DB, 'pulpa_cosechada')
    };
  }, [records, selectedPivotRecord, cycleDates]);

  // Obtener datos para la gráfica del ciclo (solo Día 0 vs Día 60)
  const cycleChartData = useMemo(() => {
    if (!selectedPivotRecord) return [];
    return [
      {
        name: 'Día 0 (Polinización)',
        'Flores (uds)': cycleValues.flores,
        'Cosecha (kg)': 0,
        'Pulpa (kg)': 0,
      },
      {
        name: 'Día 60 (Cosecha/Procesado)',
        'Flores (uds)': 0,
        'Cosecha (kg)': cycleValues.cosecha,
        'Pulpa (kg)': cycleValues.pulpa,
      }
    ];
  }, [selectedPivotRecord, cycleValues]);

  // Abrir modal de trazabilidad de ciclo
  const handleOpenCycleModal = (record) => {
    setSelectedPivotRecord(record);
    setIsCycleModalOpen(true);
  };

  // Formato para fechas en el eje X de trazabilidad
  const formatAxisDate = (tickItem) => {
    if (!tickItem) return '';
    try {
      const parts = tickItem.split('-');
      return `${parts[2]}/${parts[1]}`;
    } catch (e) {
      return tickItem;
    }
  };

  // Filtrado y ordenamiento de registros en el historial
  const filteredRecords = useMemo(() => {
    const filtered = records.filter((r) => {
      const matchCat = filterCat === 'todos' || r.tipo_registro === filterCat;
      const matchDate = !filterDate || r.fecha === filterDate;
      return matchCat && matchDate;
    });

    return [...filtered].sort((a, b) => {
      if (sortOption === 'reciente') {
        return new Date(b.fecha + 'T12:00:00') - new Date(a.fecha + 'T12:00:00');
      } else if (sortOption === 'antiguo') {
        return new Date(a.fecha + 'T12:00:00') - new Date(b.fecha + 'T12:00:00');
      } else if (sortOption === 'max_unidades') {
        return Number(b.cantidad) - Number(a.cantidad);
      } else if (sortOption === 'min_unidades') {
        return Number(a.cantidad) - Number(b.cantidad);
      }
      return 0;
    });
  }, [records, filterCat, filterDate, sortOption]);

  // Paginación de registros de 20 en 20
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;

  // Resetear a la página 1 cuando cambian los filtros o el ordenamiento
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCat, filterDate, sortOption]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredRecords.length / recordsPerPage);
  }, [filteredRecords]);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    return filteredRecords.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredRecords, currentPage]);

  // Estados del Formulario
  const [tipoRegistro, setTipoRegistro] = useState('flores_polinizadas');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState({});

  // Nombres y Unidades
  const tipoDetalles = {
    flores_polinizadas: { label: 'Flores', unit: 'uds', color: 'emerald', icon: <Leaf className="w-5 h-5 text-emerald-500" /> },
    kg_cosechados: { label: 'Kg Cosechados', unit: 'kg', color: 'amber', icon: <Scale className="w-5 h-5 text-amber-500" /> },
    pulpa_cosechada: { label: 'Pulpa Cosechada', unit: 'kg', color: 'blue', icon: <Percent className="w-5 h-5 text-blue-500" /> },
  };

  // Abrir modal para crear
  const handleOpenCreate = () => {
    setEditingRecord(null);
    setTipoRegistro('flores_polinizadas');
    setCantidad('');
    setFecha(new Date().toISOString().split('T')[0]);
    setErrors({});
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleOpenEdit = (record) => {
    setEditingRecord(record);
    setTipoRegistro(record.tipo_registro);
    setCantidad(record.cantidad.toString());
    setFecha(record.fecha);
    setErrors({});
    setIsModalOpen(true);
  };

  // Guardar registro (Crear o Editar)
  const handleSave = (e) => {
    e.preventDefault();
    
    // Validación
    const tempErrors = {};
    if (!cantidad || isNaN(cantidad) || parseFloat(cantidad) <= 0) {
      tempErrors.cantidad = 'Ingresa una cantidad numérica mayor a 0.';
    }
    if (!fecha) {
      tempErrors.fecha = 'La fecha es obligatoria.';
    }
    if (!tipoRegistro) {
      tempErrors.tipo_registro = 'Selecciona un tipo de registro.';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    const payload = {
      tipo_registro: tipoRegistro,
      cantidad: parseFloat(cantidad),
      fecha: fecha
    };

    if (editingRecord) {
      onUpdate(editingRecord.id, payload);
    } else {
      onCreate(payload);
    }

    setIsModalOpen(false);
  };

  // Abrir confirmación de eliminación
  const handleOpenDelete = (record) => {
    setRecordToDelete(record);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (recordToDelete) {
      onDelete(recordToDelete.id);
      setIsDeleteConfirmOpen(false);
      setRecordToDelete(null);
    }
  };

  // Formato legible de fecha
  const formatReadableDate = (dateStr) => {
    try {
      const dateObj = new Date(dateStr + 'T12:00:00');
      return dateObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (!isMounted) {
    return (
      <div className="h-[40vh] flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-500/20 border-t-emerald-600 animate-spin" />
        <p className="text-xs text-zinc-400 dark:text-zinc-500">Cargando historial...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-24">
      {/* Cabecera / Totalizador */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Historial de Hitos</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {filterCat !== 'todos' || filterDate || sortOption !== 'reciente' ? `${filteredRecords.length} de ${records.length} hitos` : `${records.length} hitos registrados`}
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuevo Hito
        </button>
      </div>

      {/* Lista de Registros */}
      {records.length === 0 ? (
        <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[250px]">
          <Info className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-2" />
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No hay hitos registrados</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-[250px]">
            Agrega tu primer registro pulsando el botón flotante en la esquina inferior.
          </p>
        </div>
      ) : (
        <>
          {/* Filtros de historial */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row gap-3 items-end">
            {/* Selector Categoría */}
            <div className="flex-1 w-full flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Categoría</label>
              <CustomSelect
                value={filterCat}
                onChange={setFilterCat}
                options={[
                  { value: 'todos', label: 'Todas las categorías' },
                  { value: 'flores_polinizadas', label: 'Flores', icon: <Leaf className="w-3 h-3 text-emerald-500" /> },
                  { value: 'kg_cosechados', label: 'Kg Cosechados', icon: <Scale className="w-3 h-3 text-amber-500" /> },
                  { value: 'pulpa_cosechada', label: 'Pulpa Cosechada', icon: <Percent className="w-3 h-3 text-blue-500" /> }
                ]}
              />
            </div>

            {/* Buscador de Fecha */}
            <div className="flex-1 w-full flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Filtrar por Fecha</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-800 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            {/* Selector Ordenamiento */}
            <div className="flex-1 w-full flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Ordenar Por</label>
              <CustomSelect
                value={sortOption}
                onChange={setSortOption}
                options={[
                  { value: 'reciente', label: 'Más reciente' },
                  { value: 'antiguo', label: 'Más antiguo' },
                  { value: 'max_unidades', label: 'Día con más unidades' },
                  { value: 'min_unidades', label: 'Día con menos unidades' }
                ]}
              />
            </div>

            {/* Botón de limpiar filtros */}
            {(filterCat !== 'todos' || filterDate || sortOption !== 'reciente') && (
              <button
                type="button"
                onClick={() => {
                  setFilterCat('todos');
                  setFilterDate('');
                  setSortOption('reciente');
                }}
                className="w-full sm:w-auto px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Limpiar
              </button>
            )}
          </div>

          {/* Lista de Registros Filtrados */}
          {filteredRecords.length === 0 ? (
            <div className="bg-zinc-50/30 dark:bg-zinc-950/10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[180px]">
              <Info className="w-6 h-6 text-zinc-300 dark:text-zinc-700 mb-2" />
              <p className="text-sm font-semibold text-zinc-650 dark:text-zinc-400">No se encontraron resultados</p>
              <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-1">
                Ningún hito coincide con los filtros aplicados en el historial.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                {paginatedRecords.map((record) => {
              const detalles = tipoDetalles[record.tipo_registro] || {
                label: record.tipo_registro,
                unit: '',
                color: 'zinc',
                icon: <Layers className="w-5 h-5 text-zinc-400" />
              };

              const colors = {
                emerald: 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/5',
                amber: 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/5',
                blue: 'border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/5',
                zinc: 'border-zinc-500/30 bg-zinc-500/5 dark:bg-zinc-500/5'
              }[detalles.color];

              return (
                <div
                  key={record.id}
                  onClick={() => handleOpenCycleModal(record)}
                  className="flex items-center justify-between p-4 rounded-2xl border bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 shadow-sm transition-all hover:scale-[1.005] cursor-pointer hover:border-emerald-500/40 dark:hover:border-emerald-500/30"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-xl shadow-sm flex-shrink-0">
                      {detalles.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{detalles.label}</p>
                      <h4 className="text-lg font-extrabold text-zinc-950 dark:text-zinc-50 mt-0.5">
                        {Number(record.cantidad).toLocaleString('es-ES')} <span className="text-sm font-normal text-zinc-500">{detalles.unit}</span>
                      </h4>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 flex items-center gap-1 capitalize">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatReadableDate(record.fecha)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(record);
                      }}
                      className="p-2.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                      title="Editar registro"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDelete(record);
                      }}
                      className="p-2.5 rounded-xl border border-red-200/30 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controles de Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 px-1 select-none">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-950 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none shadow-sm flex items-center gap-1 cursor-pointer"
              >
                Anterior
              </button>

              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                Página {currentPage} de {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-950 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none shadow-sm flex items-center gap-1 cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )}

      {/* Botón Flotante para Mobile (FAB) */}
      <button
        onClick={handleOpenCreate}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 active:bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 z-40 cursor-pointer"
        aria-label="Nuevo registro"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modal de Crear / Editar (Slide up en mobile, centrado en desktop) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[auto] animate-in slide-in-from-bottom duration-300">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-850">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {editingRecord ? 'Editar Registro' : 'Registrar Nuevo Hito'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSave} className="p-5 flex flex-col gap-4 overflow-y-auto">
              {/* Tipo de Registro */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Tipo de Hito</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'flores_polinizadas', label: 'Flores', color: 'emerald' },
                    { id: 'kg_cosechados', label: 'Cosecha (Kg)', color: 'amber' },
                    { id: 'pulpa_cosechada', label: 'Pulpa (Kg)', color: 'blue' }
                  ].map((btn) => {
                    const isSelected = tipoRegistro === btn.id;
                    const styleMap = {
                      emerald: isSelected ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'border-zinc-200 dark:border-zinc-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-zinc-600 dark:text-zinc-300',
                      amber: isSelected ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'border-zinc-200 dark:border-zinc-800 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-zinc-600 dark:text-zinc-300',
                      blue: isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'border-zinc-200 dark:border-zinc-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-zinc-600 dark:text-zinc-300'
                    };
                    return (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => setTipoRegistro(btn.id)}
                        className={`py-2 px-1 border text-xs font-bold rounded-xl transition-all cursor-pointer ${styleMap[btn.color]}`}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>
                {errors.tipo_registro && <span className="text-xs text-red-500 font-medium">{errors.tipo_registro}</span>}
              </div>

              {/* Cantidad */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Cantidad ({tipoDetalles[tipoRegistro]?.unit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder={`Ej. ${tipoRegistro === 'flores_polinizadas' ? '50' : '15.5'}`}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {errors.cantidad && <span className="text-xs text-red-500 font-medium">{errors.cantidad}</span>}
              </div>

              {/* Fecha */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Fecha del Registro</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {errors.fecha && <span className="text-xs text-red-500 font-medium">{errors.fecha}</span>}
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 font-semibold text-sm rounded-xl transition-all cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all cursor-pointer text-center"
                >
                  {editingRecord ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diálogo de Confirmación de Eliminación */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-2 bg-red-500/10 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">¿Eliminar Registro?</h3>
            </div>
            
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Esta acción no se puede deshacer. Se eliminará el registro de{' '}
              <strong className="text-zinc-700 dark:text-zinc-300">
                {Number(recordToDelete?.cantidad).toLocaleString('es-ES')}{' '}
                {tipoDetalles[recordToDelete?.tipo_registro]?.unit}
              </strong>{' '}
              del {recordToDelete && formatReadableDate(recordToDelete.fecha)}.
            </p>

            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setRecordToDelete(null);
                }}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Trazabilidad de Ciclo (60 Días) */}
      {isCycleModalOpen && selectedPivotRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/20">
              <div className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                  Trazabilidad de Cultivo (Ciclo 60 Días)
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCycleModalOpen(false);
                  setSelectedPivotRecord(null);
                }}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-5 overflow-y-auto flex flex-col gap-5">
              {/* Nota explicativa del pivote */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-850 rounded-2xl text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed shadow-inner">
                {selectedPivotRecord.tipo_registro === 'flores_polinizadas' ? (
                  <p className="flex items-start gap-2">
                    <span>📌</span>
                    <span>
                      Seleccionaste un hito de <strong className="text-emerald-600 dark:text-emerald-450">Flores ({Number(selectedPivotRecord.cantidad).toLocaleString('es-ES')} uds)</strong> del <strong>{formatReadableDate(selectedPivotRecord.fecha)}</strong>. La cosecha de frutos y pulpa de estas flores se estima <strong>60 días después</strong>, en torno al <strong>{formatReadableDate(cycleDates.DB)}</strong>.
                    </span>
                  </p>
                ) : (
                  <p className="flex items-start gap-2">
                    <span>📌</span>
                    <span>
                      Seleccionaste un hito de <strong className={selectedPivotRecord.tipo_registro === 'kg_cosechados' ? 'text-amber-600 dark:text-amber-450' : 'text-blue-600 dark:text-blue-450'}>{selectedPivotRecord.tipo_registro === 'kg_cosechados' ? 'Cosecha' : 'Pulpa'} ({Number(selectedPivotRecord.cantidad).toLocaleString('es-ES')} kg)</strong> del <strong>{formatReadableDate(selectedPivotRecord.fecha)}</strong>. Rastreamos la polinización original de las flores de este lote de frutos <strong>60 días antes</strong>, en torno al <strong>{formatReadableDate(cycleDates.DA)}</strong>.
                    </span>
                  </p>
                )}
              </div>

              {/* Fila de Tarjetas (Inicio y Fin del Ciclo) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Flores (Día 0) */}
                <div className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/0 dark:from-emerald-950/20 dark:to-transparent p-4 rounded-2xl border border-emerald-500/25 relative flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Polinización (Día 0)</span>
                    <Leaf className="w-4.5 h-4.5 text-emerald-500" />
                  </div>
                  <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-50 mt-1">
                    {cycleValues.flores.toLocaleString('es-ES')} <span className="text-xs font-normal text-zinc-400">uds</span>
                  </h4>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium truncate mt-0.5" title={cycleDates.friendlyDA}>
                    Fecha: {cycleDates.friendlyDA}
                  </p>
                </div>

                {/* Cosecha (Día 60) */}
                <div className="bg-gradient-to-br from-amber-500/5 to-amber-500/0 dark:from-amber-950/20 dark:to-transparent p-4 rounded-2xl border border-amber-500/25 relative flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Cosecha (Día 60)</span>
                    <Scale className="w-4.5 h-4.5 text-amber-500" />
                  </div>
                  <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-50 mt-1">
                    {cycleValues.cosecha.toLocaleString('es-ES')} <span className="text-xs font-normal text-zinc-400">kg</span>
                  </h4>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium truncate mt-0.5" title={cycleDates.friendlyDB}>
                    Fecha: {cycleDates.friendlyDB}
                  </p>
                </div>

                {/* Pulpa (Día 60) */}
                <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/0 dark:from-blue-950/20 dark:to-transparent p-4 rounded-2xl border border-blue-500/25 relative flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Procesado (Día 60)</span>
                    <Percent className="w-4.5 h-4.5 text-blue-500" />
                  </div>
                  <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-50 mt-1">
                    {cycleValues.pulpa.toLocaleString('es-ES')} <span className="text-xs font-normal text-zinc-400">kg</span>
                  </h4>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium truncate mt-0.5" title={cycleDates.friendlyDB}>
                    Fecha: {cycleDates.friendlyDB}
                  </p>
                </div>
              </div>

              {/* Gráfica de comparación del ciclo */}
              <div className="bg-zinc-50/50 dark:bg-zinc-950/30 p-4 border border-zinc-200/50 dark:border-zinc-850 rounded-2xl flex flex-col gap-3">
                <div>
                  <h4 className="text-xs font-bold text-zinc-850 dark:text-zinc-200">
                    Comparativa del Ciclo (Día 0 vs Día 60)
                  </h4>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                    Contrasta las flores polinizadas iniciales contra la cosecha final.
                  </p>
                </div>

                <div className="w-full h-48 mt-1 select-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cycleChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                      <XAxis
                        dataKey="name"
                        stroke="#a1a1aa"
                        fontSize={9}
                        fontWeight={550}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#a1a1aa"
                        fontSize={8}
                        fontWeight={550}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e4e4e7',
                          borderRadius: '12px',
                          fontSize: '11px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={28} 
                        iconType="circle" 
                        iconSize={4} 
                        wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }}
                        formatter={(value) => (
                          <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 ml-1">
                            {value}
                          </span>
                        )}
                      />
                      <Bar dataKey="Flores (uds)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25} />
                      <Bar dataKey="Cosecha (kg)" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={25} />
                      <Bar dataKey="Pulpa (kg)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={25} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-zinc-50 dark:bg-zinc-950 p-4 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsCycleModalOpen(false);
                  setSelectedPivotRecord(null);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Cerrar Ciclo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
