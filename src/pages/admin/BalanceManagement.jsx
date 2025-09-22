import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/states/LoadingState';
import ErrorState from '../../components/ui/states/ErrorState';
import EmptyState from '../../components/ui/states/EmptyState';
import { formatCurrency, formatDate } from '../../utils/formatters';
import BalanceService from '../../services/balanceService';

function normalizeItem(item) {
  // Según contrato actual de /balances/summary:
  // item: { user: { name, document }, balance: { saldo_* }, updated_at }
  const u = item?.user || {};
  const b = item?.balance || {};

  // Nombre: usar directamente user.name; fallback first_name + last_name si existiera
  const name = (typeof u.name === 'string' && u.name.trim())
    ? u.name.trim()
    : [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || '—';

  // Documento: usar exactamente user.document (e.g., "DNI 12345678")
  // Si no existiera, componer con tipo + número
  const document = (typeof u.document === 'string' && u.document.trim())
    ? u.document.trim()
    : [u.document_type, u.document_number].filter(Boolean).join(' ').trim() || '—';

  console.log(document)

  const saldo_total = Number(b?.saldo_total ?? 0);
  const saldo_retenido = Number(b?.saldo_retenido ?? 0);
  const saldo_aplicado = Number(b?.saldo_aplicado ?? 0);
  const saldo_disponible = Number(
    b?.saldo_disponible ?? (saldo_total - saldo_retenido - saldo_aplicado)
  );

  // updated_at viene a nivel raíz según el ejemplo
  const updated_at = item?.updated_at || null;

  return {
    name,
    document,
    saldo_total,
    saldo_retenido,
    saldo_aplicado,
    saldo_disponible,
    updated_at,
    _raw: item,
  };
}

export default function BalanceManagement() {
  const [filters, setFilters] = useState({
    search: '',
    page: 1,
    limit: 20,
  });

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['balances-summary', filters],
    queryFn: async () =>
      BalanceService.listSummary({
        search: filters.search || undefined,
        page: filters.page,
        limit: filters.limit,
      }),
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const balances = useMemo(() => {
    const arr = (data?.balances || []).map(normalizeItem);
    // Orden alfabético por nombre (CA-03)
    return arr.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [data]);

  const pagination = data?.pagination || { page: filters.page, total_pages: 1, limit: filters.limit, total: balances.length };
  const stats = data?.stats || {
    totalUsers: balances.length,
    totalAmount: balances.reduce((a, b) => a + b.saldo_total, 0),
    totalRetained: balances.reduce((a, b) => a + b.saldo_retenido, 0),
    totalApplied: balances.reduce((a, b) => a + b.saldo_aplicado, 0),
    totalAvailable: balances.reduce((a, b) => a + b.saldo_disponible, 0),
    averageBalance: 0,
  };

  const onSearch = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const onLimitChange = (e) => {
    const limit = Number(e.target.value) || 20;
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  };

  const goPrev = () => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }));
  const goNext = () =>
    setFilters((prev) => ({
      ...prev,
      page: Math.min(pagination.total_pages || 1, prev.page + 1),
    }));

  const badgeClassForAvailable = (value) => {
    if (value < 0) return 'text-error bg-error/10 border-error/20';
    if (value === 0) return 'text-text-secondary bg-bg-tertiary border-border';
    return 'text-success bg-success/10 border-success/20';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-text-primary">Gestión de Saldos</h1>
        <p className="text-text-secondary mt-1">
          Lista de clientes y sus saldos. Disponible = Total - Retenido - Aplicado.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card variant="outlined" padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary">{stats.totalUsers || 0}</div>
            <div className="text-sm text-text-secondary">Clientes</div>
          </div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary">
              {formatCurrency(stats.totalAmount || 0)}
            </div>
            <div className="text-sm text-text-secondary">Saldo Total</div>
          </div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">
              {formatCurrency(stats.totalRetained || 0)}
            </div>
            <div className="text-sm text-text-secondary">Retenido</div>
          </div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-info">
              {formatCurrency(stats.totalApplied || 0)}
            </div>
            <div className="text-sm text-text-secondary">Aplicado</div>
          </div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              {formatCurrency(stats.totalAvailable || 0)}
            </div>
            <div className="text-sm text-text-secondary">Disponible</div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <Card.Header>
          <Card.Title>Filtros</Card.Title>
        </Card.Header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Buscar por nombre o documento"
            placeholder="Ej. Juan, DNI 12345678..."
            value={filters.search}
            onChange={onSearch}
          />
          <Select
            label="Registros por página"
            value={String(filters.limit)}
            onChange={onLimitChange}
            options={[
              { value: '10', label: '10' },
              { value: '20', label: '20' },
              { value: '50', label: '50' },
            ]}
          />
          <div className="flex items-end">
            <Button variant="outline" onClick={() => setFilters({ search: '', page: 1, limit: 20 })}>
              Limpiar
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabla */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between w-full">
            <Card.Title className="!m-0">Clientes y Saldos</Card.Title>
            <Button size="sm" variant="outline" onClick={refetch}>
              Refrescar
            </Button>
          </div>
        </Card.Header>

        <div className="overflow-x-auto">
          {isLoading && (
            <LoadingState
              type="skeleton"
              count={5}
              message="Cargando balances de clientes..."
            />
          )}

          {!isLoading && isError && (
            <ErrorState
              type="general"
              title="Error al cargar balances"
              message={error?.message || 'No se pudieron obtener los datos de saldos'}
              error={error}
              onRetry={refetch}
              compact
            />
          )}

          {!isLoading && !isError && balances.length === 0 && (
            <EmptyState
              type="users"
              title="Sin clientes registrados"
              message="No hay clientes registrados o no se encontraron resultados para los filtros aplicados."
              actionText="Limpiar filtros"
              onAction={() => setFilters({ search: '', page: 1, limit: 20 })}
            />
          )}

          {!isLoading && !isError && balances.length > 0 && (
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-bg-tertiary">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Documento</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Saldo Total</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Retenido</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Aplicado</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Disponible</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Última Actualización</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {balances.map((row, idx) => (
                  <tr key={idx} className="hover:bg-bg-secondary/60">
                    <td className="px-4 py-2 text-sm text-text-primary">{row.name}</td>
                    <td className="px-4 py-2 text-sm text-text-secondary">{row.document}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium">{formatCurrency(row.saldo_total)}</td>
                    <td className="px-4 py-2 text-sm text-right">{formatCurrency(row.saldo_retenido)}</td>
                    <td className="px-4 py-2 text-sm text-right">{formatCurrency(row.saldo_aplicado)}</td>
                    <td className="px-4 py-2 text-sm text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${badgeClassForAvailable(row.saldo_disponible)}`}>
                        {formatCurrency(row.saldo_disponible)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-text-secondary">
                      {row.updated_at ? formatDate(row.updated_at, { includeTime: true }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {!isLoading && !isError && (pagination?.total_pages || 1) > 1 && (
          <div className="flex items-center justify-between p-4">
            <div className="text-sm text-text-secondary">
              Página {pagination.page} de {pagination.total_pages}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={filters.page <= 1} onClick={goPrev}>
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page >= (pagination.total_pages || 1)}
                onClick={goNext}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}