import { useEffect, useState } from 'react';
import { FaGavel, FaMoneyBillWave, FaInfoCircle } from 'react-icons/fa';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { formatCurrency, calculateGuaranteeAmount } from '../../utils/formatters';
import AuctionService from '../../services/auctionService';
import useAuth from '../../hooks/useAuth';

export default function AuctionSelector({ value, onChange, onNext, disabled = false }) {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const loadWonAuctions = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      setLoadError('');
      try {
        const res = await AuctionService.getUserWonAuctions(user.id);
        setAuctions(Array.isArray(res) ? res : []);
      } catch (e) {
        console.error('Error loading won auctions:', e);
        setLoadError('No se pudieron cargar tus subastas ganadas.');
      } finally {
        setIsLoading(false);
      }
    };
    loadWonAuctions();
  }, [user?.id]);

  const handleSelect = (auction) => {
    onChange?.(auction);
  };

  return (
    <div className="space-y-4">
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <FaGavel className="w-5 h-5 text-primary-600" />
            <Card.Title>Selecciona la subasta ganada</Card.Title>
          </div>
        </Card.Header>

        <div className="space-y-3">
          {isLoading && (
            <>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border border-border rounded-lg animate-pulse">
                  <div className="h-4 bg-border rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-border rounded w-1/2"></div>
                </div>
              ))}
            </>
          )}

          {!isLoading && loadError && (
            <div className="flex items-center gap-2 text-error text-sm">
              <FaInfoCircle className="w-4 h-4" />
              {loadError}
            </div>
          )}

          {!isLoading && !loadError && auctions.length === 0 && (
            <div className="text-sm text-text-secondary">
              No tienes subastas ganadas pendientes de pago.
            </div>
          )}

          {!isLoading && auctions.map((a) => {
            const montoOferta = a.monto_oferta ?? a.offer_amount ?? 0;
            const montoGarantia = a.monto_garantia ?? calculateGuaranteeAmount(montoOferta);
            return (
              <label
                key={a.id}
                className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                  value?.id === a.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-border hover:border-primary-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="auction"
                        className="mt-0.5"
                        checked={value?.id === a.id}
                        onChange={() => handleSelect(a)}
                        disabled={disabled}
                      />
                      <div className="font-semibold text-text-primary">
                        {a?.asset?.marca ? `${a.asset.marca} ${a.asset.modelo ?? ''}`.trim() : `Subasta ${a.id}`}
                      </div>
                    </div>
                    <div className="text-xs text-text-secondary mt-1">
                      Oferta ganadora:{' '}
                      <span className="font-medium text-text-primary">
                        {formatCurrency(montoOferta)}
                      </span>
                      {a?.asset?.placa && (
                        <> • Placa: <span className="font-medium">{a.asset.placa}</span></>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700">
                      <FaMoneyBillWave className="w-4 h-4" />
                      Garantía (8%): {formatCurrency(montoGarantia)}
                    </div>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={onNext}
          disabled={!value || disabled}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}