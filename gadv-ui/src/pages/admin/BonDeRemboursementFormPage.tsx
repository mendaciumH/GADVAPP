import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormPageLayout from '../../components/admin/FormPageLayout';
import FormField from '../../components/admin/FormField';
import { bonDeRemboursementService, bonDeVersementService, commandesService, clientsService, numerotationsServiceExtended, BonDeRemboursement, BonDeVersement, Commande, Client } from '../../services/admin.service';

interface PaymentSummary {
    commandePrice: number;
    totalPaid: number;
    refundableAmount: number;
    versements: BonDeVersement[];
}

const BonDeRemboursementFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditing = !!id;

    const [commandes, setCommandes] = useState<Commande[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [filteredCommandes, setFilteredCommandes] = useState<Commande[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewNumero, setPreviewNumero] = useState<string>('');
    const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [formData, setFormData] = useState<Partial<BonDeRemboursement>>({
        client_id: undefined,
        commande_id: undefined,
        numero: '',
        date_remboursement: new Date().toISOString().split('T')[0],
        montant: undefined,
        motif: '',
    });

    useEffect(() => {
        loadData();
        if (!isEditing) {
            loadPreviewNumero();
        }
    }, [id]);

    useEffect(() => {
        // Filter commandes when client changes
        if (formData.client_id) {
            const filtered = commandes.filter(c => Number(c.client_id) === Number(formData.client_id));
            setFilteredCommandes(filtered);
            // Reset commande_id if it doesn't belong to selected client
            if (formData.commande_id && !filtered.find(c => Number(c.id) === Number(formData.commande_id))) {
                setFormData(prev => ({ ...prev, commande_id: undefined }));
            }
        } else {
            setFilteredCommandes([]);
        }
    }, [formData.client_id, commandes]);

    useEffect(() => {
        // Load payment summary when commande changes
        if (formData.commande_id && !isEditing) {
            loadPaymentSummary(formData.commande_id);
        } else {
            setPaymentSummary(null);
        }
    }, [formData.commande_id, isEditing]);

    const loadPaymentSummary = async (commandeId: number) => {
        try {
            setLoadingSummary(true);
            const versements = await bonDeVersementService.findByCommandeId(commandeId);
            const selectedCommande = commandes.find(c => Number(c.id) === Number(commandeId));

            if (selectedCommande) {
                const commandePrice = Number(selectedCommande.prix) || 0;
                // Filter out cancelled versements
                const activeVersements = versements.filter(v => !v.annule);
                const totalPaid = activeVersements.reduce((sum, v) => sum + Number(v.montant_verse || 0), 0);
                const refundableAmount = totalPaid; // The refundable amount is the total paid

                setPaymentSummary({
                    commandePrice,
                    totalPaid,
                    refundableAmount,
                    versements: activeVersements,
                });

                // Automatically set the montant to the refundable amount
                setFormData(prev => ({ ...prev, montant: refundableAmount }));
            }
        } catch (error) {
            console.error('Error loading payment summary:', error);
            setPaymentSummary(null);
        } finally {
            setLoadingSummary(false);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);

            const commandesData = await commandesService.getAll().catch((error: any) => {
                if (error.response?.status === 403) {
                    console.warn('User does not have permission to view commandes');
                    return [] as Commande[];
                }
                throw error;
            });

            const clientsData = await clientsService.getAll().catch((error: any) => {
                if (error.response?.status === 403) {
                    console.warn('User does not have permission to view clients');
                    return [] as Client[];
                }
                throw error;
            });

            setCommandes(commandesData || []);
            setClients(clientsData || []);

            if (isEditing && id) {
                const bonDeRemboursement = await bonDeRemboursementService.getById(parseInt(id));
                const formatDate = (dateStr: string | Date | undefined): string => {
                    if (!dateStr) return '';
                    if (typeof dateStr === 'string') {
                        try {
                            return new Date(dateStr).toISOString().split('T')[0];
                        } catch {
                            return '';
                        }
                    }
                    if (dateStr instanceof Date) {
                        return dateStr.toISOString().split('T')[0];
                    }
                    return '';
                };
                const updatedFormData = {
                    ...bonDeRemboursement,
                    date_remboursement: formatDate(bonDeRemboursement.date_remboursement) || new Date().toISOString().split('T')[0],
                };
                setFormData(updatedFormData);
                // Trigger filtering for the loaded client_id
                if (updatedFormData.client_id) {
                    const filtered = (commandesData || []).filter(c => Number(c.client_id) === Number(updatedFormData.client_id));
                    setFilteredCommandes(filtered);
                }
            }
        } catch (error: any) {
            if (error.response?.status !== 403) {
                toast.error(error.response?.data?.message || 'Erreur lors du chargement');
            }
            if (error.response?.status === 403 && error.config?.url?.includes('/admin/bon-de-remboursement')) {
                navigate('/admin/dashboard');
            } else if (error.response?.status !== 403) {
                navigate('/admin/bon-de-remboursement');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadPreviewNumero = async () => {
        try {
            const preview = await numerotationsServiceExtended.getPreview('BON_REMBOURSEMENT');
            setPreviewNumero(preview);
        } catch (error) {
            console.error('Error loading preview numero:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate that commande belongs to selected client
        if (formData.commande_id && formData.client_id) {
            const selectedCommande = commandes.find(c => Number(c.id) === Number(formData.commande_id));
            if (selectedCommande && Number(selectedCommande.client_id) !== Number(formData.client_id)) {
                toast.error('La commande sélectionnée n\'appartient pas au client sélectionné');
                return;
            }
        }

        // Validate montant is positive
        if (formData.montant && Number(formData.montant) <= 0) {
            toast.error('Le montant doit être supérieur à 0');
            return;
        }

        // Validate montant doesn't exceed refundable amount
        if (paymentSummary && formData.montant && Number(formData.montant) > paymentSummary.refundableAmount) {
            toast.error(`Le montant de remboursement (${Number(formData.montant).toFixed(2)} DA) ne peut pas dépasser le montant payé (${paymentSummary.refundableAmount.toFixed(2)} DA)`);
            return;
        }

        // Ensure client_id matches commande's client_id if commande is selected
        if (formData.commande_id && !formData.client_id) {
            const selectedCommande = commandes.find(c => Number(c.id) === Number(formData.commande_id));
            if (selectedCommande && selectedCommande.client_id) {
                formData.client_id = selectedCommande.client_id;
            }
        }

        try {
            setIsSubmitting(true);
            if (isEditing && id) {
                await bonDeRemboursementService.update(parseInt(id), formData);
                toast.success('Bon de remboursement mis à jour avec succès');
            } else {
                await bonDeRemboursementService.create(formData);
                toast.success('Bon de remboursement créé avec succès');
            }
            navigate('/admin/bon-de-remboursement');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur lors de l\'opération');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <FormPageLayout
            title={isEditing ? 'Modifier le bon de remboursement' : 'Nouveau bon de remboursement'}
            subtitle={isEditing ? 'Modifiez les informations du bon de remboursement' : 'Créez un nouveau bon de remboursement'}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            backPath="/admin/bon-de-remboursement"
        >
            <FormField label="Client" required>
                <select
                    value={formData.client_id ? String(formData.client_id) : ''}
                    onChange={(e) => {
                        const clientId = e.target.value ? parseInt(e.target.value, 10) : undefined;
                        setFormData({ ...formData, client_id: clientId, commande_id: undefined });
                    }}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    required
                    disabled={!!isEditing}
                >
                    <option value="">Sélectionner un client</option>
                    {clients.map(client => (
                        <option key={client.id} value={String(client.id)}>
                            {client.type_client === 'Entreprise'
                                ? `${client.nom_entreprise || 'N/A'} (Entreprise)`
                                : `${client.nom_complet || 'N/A'} (Particulier)`}
                        </option>
                    ))}
                </select>
            </FormField>

            <FormField label="Commande" required>
                <select
                    value={formData.commande_id ? String(formData.commande_id) : ''}
                    onChange={(e) => {
                        const commandeId = e.target.value ? parseInt(e.target.value, 10) : undefined;
                        if (commandeId) {
                            const selectedCommande = commandes.find(c => Number(c.id) === Number(commandeId));
                            if (selectedCommande && selectedCommande.client_id) {
                                setFormData({
                                    ...formData,
                                    commande_id: commandeId,
                                    client_id: Number(selectedCommande.client_id)
                                });
                            } else {
                                setFormData({ ...formData, commande_id: commandeId });
                            }
                        } else {
                            setFormData({ ...formData, commande_id: undefined });
                        }
                    }}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    required
                    disabled={!!isEditing || !formData.client_id}
                >
                    <option value="">
                        {!formData.client_id
                            ? 'Sélectionnez d\'abord un client'
                            : filteredCommandes.length === 0
                                ? 'Aucune commande disponible pour ce client'
                                : 'Sélectionner une commande'}
                    </option>
                    {filteredCommandes.map(commande => (
                        <option key={commande.id} value={String(commande.id)}>
                            Commande #{commande.id} - {commande.article?.label || 'N/A'} - {commande.prix ? `${Number(commande.prix).toFixed(2)} DA` : 'N/A'}
                        </option>
                    ))}
                </select>
                {formData.client_id && filteredCommandes.length === 0 && (
                    <p className="mt-1 text-sm text-amber-600">
                        Aucune commande trouvée pour ce client
                    </p>
                )}
            </FormField>

            {/* Payment Summary Card */}
            {!isEditing && paymentSummary && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-orange-900">Résumé des paiements</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-white rounded-md p-3 border border-orange-100">
                            <p className="text-xs text-gray-600 mb-1">Prix de la commande</p>
                            <p className="text-lg font-bold text-gray-900">{paymentSummary.commandePrice.toFixed(2)} DA</p>
                        </div>

                        <div className="bg-white rounded-md p-3 border border-orange-100">
                            <p className="text-xs text-gray-600 mb-1">Total payé</p>
                            <p className="text-lg font-bold text-blue-600">{paymentSummary.totalPaid.toFixed(2)} DA</p>
                        </div>

                        <div className="bg-white rounded-md p-3 border border-orange-100">
                            <p className="text-xs text-gray-600 mb-1">Montant remboursable</p>
                            <p className="text-lg font-bold text-orange-600">{paymentSummary.refundableAmount.toFixed(2)} DA</p>
                        </div>
                    </div>

                    {paymentSummary.versements.length > 0 && (
                        <div className="mt-3">
                            <p className="text-xs font-medium text-gray-700 mb-2">Historique des versements ({paymentSummary.versements.length})</p>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {paymentSummary.versements.map((versement) => (
                                    <div key={versement.id} className="flex justify-between items-center bg-white rounded px-3 py-2 text-xs border border-gray-100">
                                        <span className="text-gray-600">
                                            {versement.numero} - {new Date(versement.date_versement).toLocaleDateString('fr-FR')}
                                        </span>
                                        <span className="font-semibold text-blue-700">{Number(versement.montant_verse).toFixed(2)} DA</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {paymentSummary.totalPaid === 0 && (
                        <div className="bg-amber-100 border border-amber-300 rounded-md p-2 mt-2">
                            <p className="text-xs text-amber-800 font-medium text-center">⚠ Aucun paiement n'a été effectué pour cette commande</p>
                        </div>
                    )}
                </div>
            )}

            {loadingSummary && !isEditing && formData.commande_id && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                        <p className="text-sm text-gray-600">Chargement du résumé des paiements...</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Numéro">
                    <input
                        type="text"
                        value={isEditing ? (formData.numero || '') : previewNumero}
                        onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-mono bg-gray-100 text-gray-500 cursor-not-allowed"
                        placeholder="Chargement..."
                        disabled={true}
                    />
                </FormField>

                <FormField label="Date de remboursement" required>
                    <input
                        type="date"
                        value={
                            typeof formData.date_remboursement === 'string'
                                ? formData.date_remboursement
                                : formData.date_remboursement instanceof Date
                                    ? formData.date_remboursement.toISOString().split('T')[0]
                                    : ''
                        }
                        onChange={(e) => setFormData({ ...formData, date_remboursement: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        required
                    />
                </FormField>
            </div>

            <FormField label="Montant (DA)" required>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={paymentSummary ? paymentSummary.refundableAmount : undefined}
                    value={formData.montant || ''}
                    onChange={(e) => {
                        const value = e.target.value ? parseFloat(e.target.value) : undefined;
                        setFormData({ ...formData, montant: value });
                    }}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    required
                    placeholder="0.00"
                    disabled={paymentSummary?.totalPaid === 0}
                />
                {paymentSummary && paymentSummary.refundableAmount > 0 && (
                    <p className="mt-1 text-xs text-gray-600">
                        Maximum remboursable: {paymentSummary.refundableAmount.toFixed(2)} DA
                    </p>
                )}
                {paymentSummary && formData.montant && Number(formData.montant) > paymentSummary.refundableAmount && (
                    <p className="mt-1 text-xs text-red-600">
                        ⚠ Le montant dépasse le montant remboursable ({paymentSummary.refundableAmount.toFixed(2)} DA)
                    </p>
                )}
            </FormField>

            <FormField label="Motif">
                <textarea
                    value={formData.motif || ''}
                    onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    rows={3}
                    placeholder="Raison du remboursement (optionnel)"
                />
            </FormField>
        </FormPageLayout>
    );
};

export default BonDeRemboursementFormPage;
