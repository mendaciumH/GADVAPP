import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Settings, Save, Hash, FileText, Sparkles, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { numerotationsService, Numerotation } from '../../services/admin.service';

const ParametresPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [numerotations, setNumerotations] = useState<Numerotation[]>([]);
    const [activeTab, setActiveTab] = useState<string>('FACTURE');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await numerotationsService.getAll();
            setNumerotations(data);
            if (data.length > 0) {
                setActiveTab(data[0].type);
            }
        } catch (error) {
            console.error('Error loading numerotations:', error);
            toast.error('Erreur lors du chargement des paramètres');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (id: number, field: keyof Numerotation, value: string | number) => {
        setNumerotations(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleSave = async (item: Numerotation) => {
        try {
            setSaving(true);
            await numerotationsService.update(item.id, {
                prefix: item.prefix,
                format: item.format,
                counter: item.counter,
                reset_interval: item.reset_interval
            });
            toast.success(`Paramètres pour ${item.type} mis à jour`);
        } catch (error) {
            console.error('Error updating numerotation:', error);
            toast.error('Erreur lors de la mise à jour');
        } finally {
            setSaving(false);
        }
    };

    const getTabConfig = (type: string) => {
        switch (type) {
            case 'FACTURE':
                return {
                    label: 'Factures',
                    icon: FileText,
                    gradient: 'from-blue-500 to-indigo-600',
                    bgGradient: 'from-blue-50 to-indigo-50',
                    accentColor: 'blue'
                };
            case 'BON_VERSEMENT':
                return {
                    label: 'Bons de Versement',
                    icon: Hash,
                    gradient: 'from-violet-500 to-purple-600',
                    bgGradient: 'from-violet-50 to-purple-50',
                    accentColor: 'violet'
                };
            default:
                return {
                    label: type,
                    icon: Settings,
                    gradient: 'from-indigo-500 to-blue-600',
                    bgGradient: 'from-indigo-50 to-blue-50',
                    accentColor: 'indigo'
                };
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
                    <p className="text-indigo-600 font-medium">Chargement...</p>
                </motion.div>
            </div>
        );
    }

    const activeItem = numerotations.find(item => item.type === activeTab);
    const tabConfig = activeItem ? getTabConfig(activeItem.type) : null;

    return (
        <div className="h-full px-4 py-3">
            {/* Compact Header */}
            <motion.div
                className="flex items-center justify-between mb-3"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="flex items-center">
                    <div className="p-2 bg-indigo-600 rounded-lg mr-2.5">
                        <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">
                            Paramètres de Numérotation
                        </h1>
                        <p className="text-xs text-gray-500">Configuration des séquences documentaires</p>
                    </div>
                </div>

                {/* Compact Tabs - Moved to Header */}
                <motion.div
                    className="flex gap-1.5 bg-white rounded-lg p-1 border border-gray-200"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    {numerotations.map((item) => {
                        const config = getTabConfig(item.type);
                        const Icon = config.icon;
                        const isActive = activeTab === item.type;

                        return (
                            <motion.button
                                key={item.id}
                                onClick={() => setActiveTab(item.type)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-xs transition-all ${isActive
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                whileHover={{ scale: isActive ? 1 : 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{config.label}</span>
                            </motion.button>
                        );
                    })}
                </motion.div>
            </motion.div>

            {/* Tab Content - Optimized Grid Layout */}
            <AnimatePresence mode="wait">
                {activeItem && tabConfig && (
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="bg-white rounded-xl border border-gray-200"
                    >
                        {/* Compact Header */}
                        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                <h3 className="text-sm font-semibold text-gray-900">
                                    Configuration {tabConfig.label}
                                </h3>
                            </div>
                            <motion.button
                                onClick={() => handleSave(activeItem)}
                                disabled={saving}
                                className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all text-xs font-medium disabled:opacity-50"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Save className="w-3 h-3" />
                                Enregistrer
                            </motion.button>
                        </div>

                        {/* Optimized 3-Column Grid */}
                        <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            {/* Préfixe */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                                    Préfixe
                                </label>
                                <input
                                    type="text"
                                    value={activeItem.prefix}
                                    onChange={(e) => handleChange(activeItem.id, 'prefix', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="Ex: FACT"
                                />
                                <p className="mt-0.5 text-xs text-gray-500">Début du numéro</p>
                            </div>

                            {/* Compteur */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                                    Compteur Actuel
                                </label>
                                <input
                                    type="number"
                                    value={activeItem.counter}
                                    onChange={(e) => handleChange(activeItem.id, 'counter', parseInt(e.target.value) || 0)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                />
                                <p className="mt-0.5 text-xs text-gray-500">Prochain: {activeItem.counter + 1}</p>
                            </div>

                            {/* Réinitialisation */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                                    Réinitialisation
                                </label>
                                <select
                                    value={activeItem.reset_interval}
                                    onChange={(e) => handleChange(activeItem.id, 'reset_interval', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                >
                                    <option value="NONE">Jamais</option>
                                    <option value="MONTHLY">Mensuelle</option>
                                    <option value="YEARLY">Annuelle</option>
                                </select>
                                <p className="mt-0.5 text-xs text-gray-500">Remise à zéro</p>
                            </div>

                            {/* Format - Full Width */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                                    Format de Numérotation
                                </label>
                                <input
                                    type="text"
                                    value={activeItem.format}
                                    onChange={(e) => handleChange(activeItem.id, 'format', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono"
                                    placeholder="{PREFIX}-{YYYY}{MM}-{SEQ}"
                                />
                                <div className="mt-1 flex flex-wrap gap-1">
                                    <span className="text-xs text-gray-500 font-medium">Variables:</span>
                                    {['{PREFIX}', '{YYYY}', '{MM}', '{SEQ}'].map(variable => (
                                        <span key={variable} className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono text-xs text-gray-700">
                                            {variable}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Preview - Same size as other inputs */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                                    Aperçu
                                </label>
                                <div className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md bg-gray-50 flex items-center">
                                    <p className="font-mono text-sm text-indigo-600 font-semibold truncate">
                                        {activeItem.format
                                            .replace('{PREFIX}', activeItem.prefix)
                                            .replace('{YYYY}', new Date().getFullYear().toString())
                                            .replace('{YY}', new Date().getFullYear().toString().substring(2))
                                            .replace('{MM}', (new Date().getMonth() + 1).toString().padStart(2, '0'))
                                            .replace('{DD}', new Date().getDate().toString().padStart(2, '0'))
                                            .replace('{SEQ}', (activeItem.counter + 1).toString().padStart(4, '0'))
                                        }
                                    </p>
                                </div>
                                <p className="mt-0.5 text-xs text-gray-500">Prochain numéro</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ParametresPage;
