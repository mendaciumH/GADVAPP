import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, DollarSign, Calendar, AlertCircle, CheckCircle, FileText, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import { Facture, facturesService, PaymentInfo, CaisseTransaction, BonDeVersement, FactureModeReglement } from '../../services/admin.service';

interface PaymentModalProps {
  facture: Facture;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ facture, isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [montant, setMontant] = useState<string>('');
  const [dateVersement, setDateVersement] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [modeReglement, setModeReglement] = useState<FactureModeReglement | ''>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && facture) {
      loadPaymentInfo();
    }
  }, [isOpen, facture]);

  const loadPaymentInfo = async () => {
    try {
      setLoading(true);
      const info = await facturesService.getPaymentInfo(facture.id);
      setPaymentInfo(info);
      // Pre-fill with remaining amount
      setMontant(info.montantRestant.toFixed(2));
      setError('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors du chargement');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const montantNum = parseFloat(montant);

    if (isNaN(montantNum) || montantNum <= 0) {
      setError('Le montant doit être supérieur à 0');
      return;
    }

    if (paymentInfo && montantNum > paymentInfo.montantRestant) {
      setError(`Le montant ne peut pas dépasser ${paymentInfo.montantRestant.toFixed(2)} DA`);
      return;
    }

    try {
      setSubmitting(true);
      await facturesService.payFacture(facture.id, {
        montant: montantNum,
        date_versement: dateVersement,
        mode_reglement: modeReglement || undefined,
      });

      toast.success('Paiement effectué avec succès');
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du paiement';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayFull = () => {
    if (paymentInfo) {
      setMontant(paymentInfo.montantRestant.toFixed(2));
    }
  };

  if (!isOpen) return null;

  const montantTTC = Number(facture.montant_ttc) || 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-hover px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Paiement</h2>
                  <p className="text-white/80 text-sm">{facture.numero_facture}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Montant total</span>
                    <span className="font-semibold text-gray-900">
                      {montantTTC.toFixed(2)} DA
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Déjà payé</span>
                    <span className="font-semibold text-green-600">
                      {paymentInfo?.montantPaye.toFixed(2)} DA
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-medium">Reste à payer</span>
                      <span className="font-bold text-lg text-primary">
                        {paymentInfo?.montantRestant.toFixed(2)} DA
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${montantTTC > 0 ? ((paymentInfo?.montantPaye || 0) / montantTTC) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {montantTTC > 0
                        ? `${(((paymentInfo?.montantPaye || 0) / montantTTC) * 100).toFixed(0)}% payé`
                        : '0% payé'
                      }
                    </p>
                  </div>
                </div>

                {/* Payment history */}
                {paymentInfo && ((paymentInfo.versements && paymentInfo.versements.length > 0) || (paymentInfo.transactions && paymentInfo.transactions.length > 0)) && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Historique des paiements
                    </h3>
                    <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-xl p-2">
                      {/* Show BonDeVersement payments (advance payments on commande) */}
                      {paymentInfo.versements && paymentInfo.versements
                        .filter((v) => !v.annule)
                        .map((v) => (
                          <motion.div
                            key={`bv-${v.id}`}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-blue-50 border border-blue-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-1.5">
                                {/* Bon de versement number */}
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-blue-100 rounded-lg">
                                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                                  </div>
                                  <div>
                                    <span className="text-xs text-blue-600 font-medium">Bon de versement (Avance)</span>
                                    <p className="text-sm font-semibold text-gray-900">{v.numero}</p>
                                  </div>
                                </div>

                                {/* Date */}
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>
                                    {v.date_versement
                                      ? new Date(v.date_versement).toLocaleDateString('fr-FR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                      : 'Date non disponible'}
                                  </span>
                                </div>
                              </div>

                              {/* Amount */}
                              <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 rounded-lg border border-blue-300">
                                  <CheckCircle className="w-3.5 h-3.5 text-blue-700" />
                                  <span className="font-bold text-blue-800 text-sm">
                                    +{Number(v.montant_verse).toFixed(2)} DA
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}

                      {/* Show CaisseTransaction payments (direct facture payments) */}
                      {paymentInfo.transactions && paymentInfo.transactions.map((t) => (
                        <motion.div
                          key={`ct-${t.id}`}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-1.5">
                              {/* Transaction info */}
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-primary/10 rounded-lg">
                                  <FileText className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500 font-medium">Paiement Facture</span>
                                  <p className="text-sm font-semibold text-gray-900">Transaction #{t.id}</p>
                                </div>
                              </div>

                              {/* Date */}
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Clock className="w-3.5 h-3.5" />
                                <span>
                                  {t.date_transaction
                                    ? new Date(t.date_transaction).toLocaleDateString('fr-FR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                    : 'Date non disponible'}
                                </span>
                              </div>

                              {/* User info if available */}
                              {t.user && (
                                <div className="text-xs text-gray-500">
                                  Par: {t.user.username}
                                </div>
                              )}
                            </div>

                            {/* Amount */}
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-lg border border-green-200">
                                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                <span className="font-bold text-green-700 text-sm">
                                  +{Number(t.montant).toFixed(2)} DA
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Montant à payer (DA)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={paymentInfo?.montantRestant || 0}
                        value={montant}
                        onChange={(e) => setMontant(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="flex justify-end mt-1">
                      <button
                        type="button"
                        onClick={handlePayFull}
                        className="text-sm text-primary hover:underline"
                      >
                        Payer le montant total
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date du versement
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={dateVersement}
                        onChange={(e) => setDateVersement(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mode de règlement
                    </label>
                    <select
                      value={modeReglement}
                      onChange={(e) => setModeReglement(e.target.value as FactureModeReglement)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                      required
                    >
                      <option value="">Sélectionner un mode</option>
                      <option value="espèce">Espèce</option>
                      <option value="chèque">Chèque</option>
                    </select>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                      disabled={submitting}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !montant || parseFloat(montant) <= 0}
                      className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Traitement...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>Payer</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence >
  );
};

export default PaymentModal;

