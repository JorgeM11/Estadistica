'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Calendar,
  Filter,
  TrendingUp,
  Award,
  ArrowUpDown,
  ChevronDown,
  Layers,
  Leaf,
  Scale,
  Percent,
  Clock,
  Activity,
} from 'lucide-react';
import CustomSelect from './CustomSelect';

export default function Charts({ records }) {
  const [isMounted, setIsMounted] = useState(false);
  
  // Estados para los filtros y agrupación
  const [categoriaFilter, setCategoriaFilter] = useState('todos'); // 'todos', 'flores_polinizadas', 'kg_cosechados', 'pulpa_cosechada'
  const [granularity, setGranularity] = useState('dia'); // 'dia' (Día a día), 'semana' (Agrupado por semanas), 'mes' (Agrupado por meses), 'ano' (Agrupado por años)
  const [filterType, setFilterType] = useState('todos'); // 'todos' (Sin filtrar - Histórico), 'especifico' (Período específico), 'rango' (Rango personalizado)
  
  // Fechas de selección
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [ordenChart, setOrdenChart] = useState('asc'); // 'asc' o 'desc' para la gráfica (cronológica)
  const [chartType, setChartType] = useState('area'); // 'area' o 'bar'
  
  // Período del widget de resumen temporal inferior (con respecto a hoy)
  const [resumenPeriodo, setResumenPeriodo] = useState('mensual'); 

  // Evitar problemas de hidratación en Next.js con Recharts
  useEffect(() => {
    setIsMounted(true);
    
    // Inicializar fechas con el registro más reciente si existe, o la fecha actual
    if (records && records.length > 0) {
      const latestDate = records[0].fecha;
      setSelectedDate(latestDate);
      setSelectedMonth(latestDate.substring(0, 7));
      setStartDate(latestDate);
      setEndDate(latestDate);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
      setSelectedMonth(today.substring(0, 7));
      setStartDate(today);
      setEndDate(today);
    }
  }, [records]);

  // Nombres de categorías amigables
  const categoriaLabels = {
    flores_polinizadas: 'Flores',
    kg_cosechados: 'Kg Cosechados',
    pulpa_cosechada: 'Pulpa Cosechada',
  };

  const categoriaColores = {
    flores_polinizadas: { stroke: '#10b981', fill: '#d1fae5', text: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    kg_cosechados: { stroke: '#f59e0b', fill: '#fef3c7', text: 'text-amber-500', bg: 'bg-amber-500/10' },
    pulpa_cosechada: { stroke: '#3b82f6', fill: '#dbeafe', text: 'text-blue-500', bg: 'bg-blue-500/10' },
  };

  // Helper para verificar si una fecha está en la misma semana
  const isSameWeek = (dateStr1, dateStr2) => {
    if (!dateStr1 || !dateStr2) return false;
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    
    const getMonday = (d) => {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff));
    };

    const monday1 = getMonday(new Date(d1.setHours(0,0,0,0)));
    const monday2 = getMonday(new Date(d2.setHours(0,0,0,0)));
    
    const timeDiff = Math.abs(monday1.getTime() - monday2.getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return diffDays < 2;
  };

  // Helper para obtener el lunes de una semana como string YYYY-MM-DD
  const getMondayDateStr = (dateStr) => {
    try {
      const d = new Date(dateStr + 'T12:00:00');
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      return monday.toISOString().split('T')[0];
    } catch (e) {
      return dateStr;
    }
  };

  // 1. Obtener el total acumulado por categoría global / histórico (sin importar filtros)
  const metricasDestacadas = useMemo(() => {
    const totals = {
      flores_polinizadas: 0,
      kg_cosechados: 0,
      pulpa_cosechada: 0,
    };

    records.forEach((r) => {
      const cant = Number(r.cantidad);
      if (totals[r.tipo_registro] !== undefined) {
        totals[r.tipo_registro] += cant;
      }
    });

    return totals;
  }, [records]);

  // 2. Filtrar registros en base a filtros de fecha únicamente (independiente de la categoría)
  const recordsFilteredByTime = useMemo(() => {
    return records.filter((r) => {
      if (filterType === 'todos') {
        return true;
      }

      if (filterType === 'especifico') {
        if (granularity === 'dia') {
          return r.fecha === selectedDate;
        } else if (granularity === 'semana') {
          return isSameWeek(r.fecha, selectedDate);
        } else if (granularity === 'mes') {
          return r.fecha.substring(0, 7) === selectedMonth;
        } else if (granularity === 'ano') {
          return r.fecha.substring(0, 4) === selectedYear;
        }
      }

      if (filterType === 'rango') {
        if (!startDate || !endDate) return true;
        return r.fecha >= startDate && r.fecha <= endDate;
      }

      return true;
    });
  }, [records, filterType, granularity, selectedDate, selectedMonth, selectedYear, startDate, endDate]);

  // 2.5 Calcular resumen (diario, semanal o mensual) con respecto al día actual (30 de junio de 2026)
  const resumenDatos = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    const totals = {
      flores_polinizadas: 0,
      kg_cosechados: 0,
      pulpa_cosechada: 0,
      count: 0
    };

    records.forEach((r) => {
      let match = false;
      if (resumenPeriodo === 'diario') {
        match = r.fecha === today;
      } else if (resumenPeriodo === 'semanal') {
        match = isSameWeek(r.fecha, today);
      } else if (resumenPeriodo === 'mensual') {
        match = r.fecha.substring(0, 7) === today.substring(0, 7);
      }

      if (match) {
        const cant = Number(r.cantidad);
        if (totals[r.tipo_registro] !== undefined) {
          totals[r.tipo_registro] += cant;
        }
        totals.count++;
      }
    });

    return { totals, today };
  }, [records, resumenPeriodo]);

  const getFriendlyPeriodLabel = () => {
    const today = resumenDatos.today;
    try {
      const dateObj = new Date(today + 'T12:00:00');
      if (resumenPeriodo === 'diario') {
        return dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      } else if (resumenPeriodo === 'semanal') {
        const day = dateObj.getDay();
        const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(new Date(dateObj).setDate(diff));
        const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6));
        return `Semana del ${monday.getDate()} de ${monday.toLocaleDateString('es-ES', { month: 'short' })} al ${sunday.getDate()} de ${sunday.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`;
      } else if (resumenPeriodo === 'mensual') {
        return dateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      }
    } catch (e) {
      return today;
    }
  };

  // 3. Filtrar registros por fecha Y categoría (para la gráfica)
  const filteredRecords = useMemo(() => {
    return recordsFilteredByTime.filter((r) => {
      if (categoriaFilter !== 'todos' && r.tipo_registro !== categoriaFilter) {
        return false;
      }
      return true;
    });
  }, [recordsFilteredByTime, categoriaFilter]);

  // 4. Procesar y agrupar los datos para la gráfica (agrupando por la granularidad activa)
  const chartData = useMemo(() => {
    const grupos = {};

    filteredRecords.forEach((r) => {
      let key = r.fecha;
      if (granularity === 'semana') {
        key = getMondayDateStr(r.fecha);
      } else if (granularity === 'mes') {
        key = r.fecha.substring(0, 7);
      } else if (granularity === 'ano') {
        key = r.fecha.substring(0, 4);
      }

      if (!grupos[key]) {
        grupos[key] = {
          fecha: key, // Usamos 'fecha' como dataKey en XAxis
          flores_polinizadas: 0,
          kg_cosechados: 0,
          pulpa_cosechada: 0,
        };
      }

      const cant = Number(r.cantidad);
      if (r.tipo_registro === 'flores_polinizadas') {
        grupos[key].flores_polinizadas += cant;
      } else if (r.tipo_registro === 'kg_cosechados') {
        grupos[key].kg_cosechados += cant;
      } else if (r.tipo_registro === 'pulpa_cosechada') {
        grupos[key].pulpa_cosechada += cant;
      }
    });

    // Convertir a array y ordenar cronológicamente
    const result = Object.values(grupos).sort((a, b) => {
      const dateA = new Date(a.fecha.length === 4 ? `${a.fecha}-01-01T12:00:00` : a.fecha.length === 7 ? `${a.fecha}-01T12:00:00` : `${a.fecha}T12:00:00`);
      const dateB = new Date(b.fecha.length === 4 ? `${b.fecha}-01-01T12:00:00` : b.fecha.length === 7 ? `${b.fecha}-01T12:00:00` : `${b.fecha}T12:00:00`);
      return ordenChart === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [filteredRecords, granularity, ordenChart]);

  // Determinar ancho dinámico para la gráfica horizontal deslizable
  const chartWidth = useMemo(() => {
    if (chartData.length <= 8) return '100%';
    // Multiplicamos por 80px para dar espacio al scrollbar táctil
    return `${chartData.length * 80}px`;
  }, [chartData]);

  // Formato para fechas en el eje X según la granularidad
  const formatXAxis = (tickItem) => {
    if (!tickItem) return '';
    try {
      if (granularity === 'dia') {
        const parts = tickItem.split('-');
        return `${parts[2]}/${parts[1]}`;
      } else if (granularity === 'semana') {
        const parts = tickItem.split('-');
        return `Sem ${parts[2]}/${parts[1]}`;
      } else if (granularity === 'mes') {
        const parts = tickItem.split('-');
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const mIdx = parseInt(parts[1], 10) - 1;
        return `${months[mIdx]} ${parts[0].substring(2)}`;
      } else if (granularity === 'ano') {
        return tickItem;
      }
      return tickItem;
    } catch (e) {
      return tickItem;
    }
  };

  // Formateador personalizado para el Tooltip de la gráfica
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      let labelFormateado = label;
      try {
        if (granularity === 'dia') {
          const dateObj = new Date(label + 'T12:00:00');
          labelFormateado = dateObj.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
        } else if (granularity === 'semana') {
          const dateObj = new Date(label + 'T12:00:00');
          const sunday = new Date(new Date(dateObj).setDate(dateObj.getDate() + 6));
          labelFormateado = `Semana del ${dateObj.getDate()}/${dateObj.getMonth()+1} al ${sunday.getDate()}/${sunday.getMonth()+1}`;
        } else if (granularity === 'mes') {
          const parts = label.split('-');
          const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
          const mIdx = parseInt(parts[1], 10) - 1;
          labelFormateado = `${months[mIdx]} ${parts[0]}`;
        } else if (granularity === 'ano') {
          labelFormateado = `Año ${label}`;
        }
      } catch (e) {}

      return (
        <div className="bg-white/95 dark:bg-zinc-900/95 p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg backdrop-blur-md">
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold mb-2">{labelFormateado}</p>
          <div className="space-y-1.5">
            {payload.map((p, i) => {
              let unit = 'uds';
              if (p.name === 'kg_cosechados') unit = 'kg';
              if (p.name === 'pulpa_cosechada') unit = 'kg (pulpa)';
              
              const labelName = categoriaLabels[p.name] || p.name;
              const color = categoriaColores[p.name]?.stroke || '#10b981';

              return (
                <div key={i} className="flex items-center justify-between gap-6 text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-zinc-600 dark:text-zinc-300 font-medium">{labelName}:</span>
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-50">
                    {p.value.toLocaleString('es-ES')} {unit}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-20">

      {/* 1. Métricas destacadas: Totales Históricos */}
      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
        <h2 className="text-sm font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase mb-3 flex items-center gap-1.5 px-1">
          <Award className="w-4 h-4 text-emerald-500" />
          Totales Registrados en la Base de Datos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card Flores */}
          <div className="bg-gradient-to-br from-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-900/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 flex-shrink-0">
              <Leaf className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase truncate">Flores</p>
              <h3 className="text-xl font-bold text-zinc-950 dark:text-zinc-50 mt-0.5">
                {metricasDestacadas.flores_polinizadas.toLocaleString('es-ES')} <span className="text-xs font-normal text-zinc-500">uds</span>
              </h3>
              <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5">
                Total histórico acumulado
              </p>
            </div>
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full translate-x-4 -translate-y-4" />
          </div>

          {/* Card Kg */}
          <div className="bg-gradient-to-br from-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-900/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 flex-shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase truncate">Kilos Cosechados</p>
              <h3 className="text-xl font-bold text-zinc-950 dark:text-zinc-50 mt-0.5">
                {metricasDestacadas.kg_cosechados.toLocaleString('es-ES')} <span className="text-xs font-normal text-zinc-500">kg</span>
              </h3>
              <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5">
                Total histórico acumulado
              </p>
            </div>
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full translate-x-4 -translate-y-4" />
          </div>

          {/* Card Pulpa */}
          <div className="bg-gradient-to-br from-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-900/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 flex-shrink-0">
              <Percent className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase truncate">Pulpa Cosechada</p>
              <h3 className="text-xl font-bold text-zinc-950 dark:text-zinc-50 mt-0.5">
                {metricasDestacadas.pulpa_cosechada.toLocaleString('es-ES')} <span className="text-xs font-normal text-zinc-500">kg</span>
              </h3>
              <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5">
                Total histórico acumulado
              </p>
            </div>
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full translate-x-4 -translate-y-4" />
          </div>
        </div>
      </div>

      {/* 2. Panel de Filtros */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-500" />
            Filtros del Dashboard
          </h3>
          <div className="flex items-center gap-2">
            {/* Botón tipo de gráfica */}
            <button
              onClick={() => setChartType(chartType === 'area' ? 'bar' : 'area')}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{chartType === 'area' ? 'Área' : 'Barras'}</span>
            </button>
            
            {/* Botón ordenamiento */}
            <button
              onClick={() => setOrdenChart(ordenChart === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
              title="Invertir dirección del tiempo en gráfica"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="uppercase">{ordenChart}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Categoría */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Categoría</label>
            <CustomSelect
              value={categoriaFilter}
              onChange={setCategoriaFilter}
              options={[
                { value: 'todos', label: 'Todas las categorías' },
                { value: 'flores_polinizadas', label: 'Flores (uds)', icon: <Leaf className="w-3 h-3 text-emerald-500" /> },
                { value: 'kg_cosechados', label: 'Kg Cosechados (kg)', icon: <Scale className="w-3 h-3 text-amber-500" /> },
                { value: 'pulpa_cosechada', label: 'Pulpa Cosechada (kg)', icon: <Percent className="w-3 h-3 text-blue-500" /> }
              ]}
            />
          </div>

          {/* Granularidad */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Agrupar Gráfico Por</label>
            <CustomSelect
              value={granularity}
              onChange={setGranularity}
              options={[
                { value: 'dia', label: 'Días (Diario)' },
                { value: 'semana', label: 'Semanas' },
                { value: 'mes', label: 'Meses' },
                { value: 'ano', label: 'Años' }
              ]}
            />
          </div>

          {/* Tipo de Filtro de Fechas */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Filtro de Fecha</label>
            <CustomSelect
              value={filterType}
              onChange={setFilterType}
              options={[
                { value: 'todos', label: 'Ver todo el historial (Sin filtro)' },
                { value: 'especifico', label: 'Filtrar período específico' },
                { value: 'rango', label: 'Filtrar rango personalizado' }
              ]}
            />
          </div>
        </div>

        {/* Controles condicionales de fecha */}
        {filterType !== 'todos' && (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/40 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            {filterType === 'especifico' && (
              <>
                {(granularity === 'dia' || granularity === 'semana') && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Selecciona el Día
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full"
                    />
                    {granularity === 'semana' && (
                      <span className="text-[11px] text-zinc-400 mt-1 block">
                        Se filtrarán los hitos registrados en la misma semana del día seleccionado (Lunes a Domingo).
                      </span>
                    )}
                  </div>
                )}

                {granularity === 'mes' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Selecciona el Mes
                    </label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full"
                    />
                  </div>
                )}

                {granularity === 'ano' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Año
                    </label>
                    <input
                      type="number"
                      min="2020"
                      max="2035"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full"
                    />
                  </div>
                )}
              </>
            )}

            {filterType === 'rango' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Inicio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Gráfica Principal con Scroll Horizontal */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
        <div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-base">Evolución de la Siembra</h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 font-medium">
            Desplaza el gráfico horizontalmente para navegar por la escala cronológica ({chartData.length} puntos)
          </p>
        </div>

        {/* Contenedor de la gráfica */}
        <div className="w-full mt-2 select-none">
          {!isMounted ? (
            <div className="w-full h-72 bg-zinc-50 dark:bg-zinc-950 animate-pulse rounded-2xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
              <span className="text-xs text-zinc-400 font-medium">Cargando visualización...</span>
            </div>
          ) : chartData.length === 0 ? (
            <div className="w-full h-72 bg-zinc-50/50 dark:bg-zinc-950/30 rounded-2xl flex flex-col items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center">
              <Leaf className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-2 animate-bounce" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No hay datos en este intervalo</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-[240px]">
                Prueba cambiando los filtros o agrega un hito en la sección de "Registros".
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              <div style={{ width: chartWidth, height: '280px' }} className="min-w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'area' ? (
                    <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorFlores" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorKg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorPulpa" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800/60" />
                      <XAxis
                        dataKey="fecha"
                        tickFormatter={formatXAxis}
                        stroke="#a1a1aa"
                        fontSize={10}
                        fontFamily="inherit"
                        fontWeight={500}
                        dy={8}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#a1a1aa"
                        fontSize={10}
                        fontFamily="inherit"
                        fontWeight={500}
                        dx={-8}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => (
                          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                            {categoriaLabels[value]}
                          </span>
                        )}
                      />
                      {(categoriaFilter === 'todos' || categoriaFilter === 'flores_polinizadas') && (
                        <Area
                          type="monotone"
                          dataKey="flores_polinizadas"
                          stroke="#10b981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorFlores)"
                          activeDot={{ r: 5 }}
                        />
                      )}
                      {(categoriaFilter === 'todos' || categoriaFilter === 'kg_cosechados') && (
                        <Area
                          type="monotone"
                          dataKey="kg_cosechados"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorKg)"
                          activeDot={{ r: 5 }}
                        />
                      )}
                      {(categoriaFilter === 'todos' || categoriaFilter === 'pulpa_cosechada') && (
                        <Area
                          type="monotone"
                          dataKey="pulpa_cosechada"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorPulpa)"
                          activeDot={{ r: 5 }}
                        />
                      )}
                    </AreaChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800/60" />
                      <XAxis
                        dataKey="fecha"
                        tickFormatter={formatXAxis}
                        stroke="#a1a1aa"
                        fontSize={10}
                        fontFamily="inherit"
                        fontWeight={500}
                        dy={8}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#a1a1aa"
                        fontSize={10}
                        fontFamily="inherit"
                        fontWeight={500}
                        dx={-8}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => (
                          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                            {categoriaLabels[value]}
                          </span>
                        )}
                      />
                      {(categoriaFilter === 'todos' || categoriaFilter === 'flores_polinizadas') && (
                        <Bar dataKey="flores_polinizadas" fill="#10b981" radius={[4, 4, 0, 0]} />
                      )}
                      {(categoriaFilter === 'todos' || categoriaFilter === 'kg_cosechados') && (
                        <Bar dataKey="kg_cosechados" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      )}
                      {(categoriaFilter === 'todos' || categoriaFilter === 'pulpa_cosechada') && (
                        <Bar dataKey="pulpa_cosechada" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      )}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Apartado de Resumen con respecto al Día Actual */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 text-base">
              <Activity className="w-5 h-5 text-emerald-500" />
              Resumen del Cultivo (Día Actual)
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 capitalize font-medium">
              Período: {getFriendlyPeriodLabel()}
            </p>
          </div>
          
          {/* Toggle de Periodo (Diario, Semanal, Mensual) */}
          <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl self-start sm:self-center">
            {[
              { id: 'diario', label: 'Diario' },
              { id: 'semanal', label: 'Semanal' },
              { id: 'mensual', label: 'Mensual' }
            ].map((btn) => {
              const isSel = resumenPeriodo === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setResumenPeriodo(btn.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSel 
                      ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-450 shadow-sm font-extrabold' 
                      : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200'
                  }`}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cifras de Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Flores */}
          <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-950/45 rounded-xl border border-zinc-200/50 dark:border-zinc-850">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <Leaf className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Flores</span>
              <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                {resumenDatos.totals.flores_polinizadas.toLocaleString('es-ES')} <span className="text-[11px] font-normal text-zinc-400">uds</span>
              </span>
            </div>
          </div>

          {/* Kilos */}
          <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-950/45 rounded-xl border border-zinc-200/50 dark:border-zinc-850">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
              <Scale className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Cosecha</span>
              <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                {resumenDatos.totals.kg_cosechados.toLocaleString('es-ES')} <span className="text-[11px] font-normal text-zinc-400">kg</span>
              </span>
            </div>
          </div>

          {/* Pulpa */}
          <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-950/45 rounded-xl border border-zinc-200/50 dark:border-zinc-850">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <Percent className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Pulpa</span>
              <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                {resumenDatos.totals.pulpa_cosechada.toLocaleString('es-ES')} <span className="text-[11px] font-normal text-zinc-400">kg</span>
              </span>
            </div>
          </div>
        </div>

        {resumenDatos.totals.count === 0 && (
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center font-medium italic mt-1">
            * No hay hitos registrados en este período con respecto a la fecha actual ({resumenDatos.today}).
          </p>
        )}
      </div>
    </div>
  );
}
