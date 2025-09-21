import { useState, useEffect } from 'react';
import { FaFilter, FaRedo, FaSearch, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import Button from '../Button';
import Select from '../Select';
import Input from '../Input';

const TIPO_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'pago_garantia', label: 'Pago de Garantía' },
  { value: 'reembolso', label: 'Reembolso' },
  { value: 'penalidad', label: 'Penalidad' },
  { value: 'ajuste_manual', label: 'Ajuste Manual' },
];

const ESTADO_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'validado', label: 'Validado' },
  { value: 'rechazado', label: 'Rechazado' },
];

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Fecha (reciente primero)' },
  { value: 'created_at:asc', label: 'Fecha (antigua primero)' },
  { value: 'monto:desc', label: 'Monto (mayor a menor)' },
  { value: 'monto:asc', label: 'Monto (menor a mayor)' },
];

const LIMIT_OPTIONS = [
  { value: 10, label: '10 por página' },
  { value: 20, label: '20 por página' },
  { value: 50, label: '50 por página' },
];

function TransactionFilters({ value, onChange, onReset, disabled = false, showType = true }) {
  const [local, setLocal] = useState({
    tipo_especifico: '',
    estado: '',
    fecha_desde: '',
    fecha_hasta: '',
    search: '',
    sort: 'created_at:desc',
    limit: 10,
  });

  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!value) return;
    setLocal((prev) => ({
      ...prev,
      ...value,
    }));
  }, [value]);

  const handleChange = (field, v) => {
    const next = { ...local, [field]: v };
    setLocal(next);
  };

  const applyFilters = () => {
    onChange?.({
      tipo_especifico: local.tipo_especifico,
      estado: local.estado,
      fecha_desde: local.fecha_desde,
      fecha_hasta: local.fecha_hasta,
      search: local.search?.trim(),
      sort: local.sort,
      limit: Number(local.limit) || 10,
    });
  };

  const resetFilters = () => {
    setLocal({
      tipo_especifico: '',
      estado: '',
      fecha_desde: '',
      fecha_hasta: '',
      search: '',
      sort: 'created_at:desc',
      limit: 10,
    });
    onReset?.();
  };

  return (
    <div className="bg-white border border-border rounded-lg">
      {/* Header compacto con toggle */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2 min-w-0">
          <FaFilter className="w-4 h-4 text-primary-600" />
          <h3 className="text-sm font-semibold text-text-primary">Filtros</h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            disabled={disabled}
          >
            {expanded ? (
              <>
                <FaChevronUp className="w-4 h-4 mr-2" />
                Ocultar
              </>
            ) : (
              <>
                <FaChevronDown className="w-4 h-4 mr-2" />
                Mostrar
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            disabled={disabled}
          >
            <FaRedo className="w-4 h-4 mr-2" />
            Limpiar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={applyFilters}
            disabled={disabled}
          >
            <FaSearch className="w-4 h-4 mr-2" />
            Aplicar
          </Button>
        </div>
      </div>

      {/* Contenido colapsable */}
      {expanded && (
        <div className="p-4 pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <Input
                label="Buscar"
                placeholder="Buscar por concepto o N° operación"
                value={local.search}
                onChange={(e) => handleChange('search', e.target.value)}
                disabled={disabled}
              />
            </div>

            {showType && (
              <Select
                label="Tipo"
                options={TIPO_OPTIONS}
                value={local.tipo_especifico}
                onChange={(e) => handleChange('tipo_especifico', e.target.value)}
                disabled={disabled}
              />
            )}

            <Select
              label="Estado"
              options={ESTADO_OPTIONS}
              value={local.estado}
              onChange={(e) => handleChange('estado', e.target.value)}
              disabled={disabled}
            />

            <Select
              label="Ordenar por"
              options={SORT_OPTIONS}
              value={local.sort}
              onChange={(e) => handleChange('sort', e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-text-primary">Fecha desde</label>
              <input
                type="date"
                className="mt-1 w-full px-3 py-2 border border-border rounded-md focus:ring-primary-500 focus:border-primary-500"
                value={local.fecha_desde}
                onChange={(e) => handleChange('fecha_desde', e.target.value)}
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary">Fecha hasta</label>
              <input
                type="date"
                className="mt-1 w-full px-3 py-2 border border-border rounded-md focus:ring-primary-500 focus:border-primary-500"
                value={local.fecha_hasta}
                onChange={(e) => handleChange('fecha_hasta', e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="lg:col-span-2">
              <Select
                label="Resultados"
                options={LIMIT_OPTIONS}
                value={local.limit}
                onChange={(e) => handleChange('limit', e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionFilters;