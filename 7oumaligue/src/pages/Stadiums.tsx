import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { usePermissions } from '../hooks/usePermissions';
import { useNavigate, Navigate } from 'react-router-dom';
import { Plus, Edit, Trash2, MapPin, Users, Calendar, Star } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import ReadOnlyBanner from '../components/ReadOnlyBanner';

interface Stadium {
  id: number;
  name: string;
  address: string;
  city: string;
  region: string;
  capacity: number;
  fieldCount: number;
  fieldTypes: string[];
  amenities: string[];
  images: string[];
  contactInfo: any;
  pricing: any;
  description?: string;
  isPartner: boolean;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

const Stadiums: React.FC = () => {
  const { user } = useAuth();
  const { canEdit, canDelete, canCreate } = usePermissions();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStadium, setEditingStadium] = useState<Stadium | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'capacity' | 'city'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [newStadium, setNewStadium] = useState<Omit<Stadium, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    address: '',
    city: '',
    region: '',
    capacity: 0,
    fieldCount: 1,
    fieldTypes: ['11v11'],
    amenities: [],
    images: [],
    contactInfo: {},
    pricing: {},
    description: '',
    isPartner: false,
    ownerId: 1
  });

  const fieldTypeOptions = [
    '5v5',
    '7v7',
    '11v11'
  ];

  const amenityOptions = [
    'Parking',
    'Douches',
    'Café',
    'Vestiaires',
    'Éclairage',
    'Tribunes',
    'Boutique'
  ];

  useEffect(() => {
    if (!showCreateModal) {
      setNewStadium({
        name: '',
        address: '',
        city: '',
        region: '',
        capacity: 0,
        fieldCount: 1,
        fieldTypes: ['11v11'],
        amenities: [],
        images: [],
        contactInfo: {},
        pricing: {},
        description: '',
        isPartner: false,
        ownerId: 1
      });
    }
  }, [showCreateModal]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleCreateStadium = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStadium.name || !newStadium.city || newStadium.capacity <= 0) {
      alert("Veuillez remplir tous les champs requis (nom, ville, capacité)");
      return;
    }

    try {
      const { axiosInstance } = await import('../services/api');
      
      const response = await axiosInstance.post('/stadiums', {
        ...newStadium,
        capacity: parseInt(newStadium.capacity.toString()),
        fieldCount: parseInt(newStadium.fieldCount.toString())
      });

      if (response.data.success) {
        setStadiums(prev => [...prev, response.data.data]);
        setShowCreateModal(false);
        alert('Stade créé avec succès!');
      }
    } catch (error: any) {
      console.error('Erreur lors de la création du stade:', error);
      alert(`Erreur lors de la création du stade: ${error.response?.data?.message || 'Erreur inconnue'}`);
    }
  };

  const handleUpdateStadium = async (stadium: Stadium) => {
    try {
      const { axiosInstance } = await import('../services/api');
      
      const response = await axiosInstance.put(`/stadiums/${stadium.id}`, {
        ...stadium,
        capacity: parseInt(stadium.capacity.toString()),
        fieldCount: parseInt(stadium.fieldCount.toString())
      });

      if (response.data.success) {
        setStadiums(prev => prev.map(s => s.id === stadium.id ? response.data.data : s));
        setEditingStadium(null);
        alert('Stade mis à jour avec succès!');
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du stade:', error);
      alert(`Erreur lors de la mise à jour du stade: ${error.response?.data?.message || 'Erreur inconnue'}`);
    }
  };

  const handleDeleteStadium = async (stadiumId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce stade ?')) {
      return;
    }

    try {
      const { axiosInstance } = await import('../services/api');
      
      const response = await axiosInstance.delete(`/stadiums/${stadiumId}`);

      if (response.data.success) {
        setStadiums(prev => prev.filter(s => s.id !== stadiumId));
        alert('Stade supprimé avec succès!');
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression du stade:', error);
      alert(`Erreur lors de la suppression du stade: ${error.response?.data?.message || 'Erreur inconnue'}`);
    }
  };

  const loadStadiums = async () => {
    try {
      const { axiosInstance } = await import('../services/api');
      const response = await axiosInstance.get('/stadiums');
      
      if (response.data.success) {
        setStadiums(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stades:', error);
    }
  };

  useEffect(() => {
    loadStadiums();
  }, []);

  // Filtrer et trier les stades
  const filteredAndSortedStadiums = stadiums
    .filter(stadium => 
      stadium.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterCity === '' || stadium.city.toLowerCase().includes(filterCity.toLowerCase()))
    )
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'capacity') {
        aValue = a.capacity;
        bValue = b.capacity;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const cities = [...new Set(stadiums.map(s => s.city))];

  return (
    <div className="min-h-screen bg-gray-50">
      <ReadOnlyBanner />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <MapPin className="mr-3 text-blue-600" size={32} />
              Gestion des Stades
            </h1>
            <p className="text-gray-600 mt-2">
              Gérez les stades disponibles pour vos tournois
            </p>
          </div>
          
          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 mt-4 sm:mt-0"
            >
              <Plus size={20} />
              <span>Ajouter un stade</span>
            </button>
          )}
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher
              </label>
              <input
                type="text"
                placeholder="Nom du stade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville
              </label>
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Toutes les villes</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trier par
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'capacity' | 'city')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Nom</option>
                <option value="capacity">Capacité</option>
                <option value="city">Ville</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordre
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="asc">Croissant</option>
                <option value="desc">Décroissant</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des stades */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedStadiums.map((stadium) => (
            <div key={stadium.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              {/* Image du stade */}
              <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                {stadium.images && stadium.images.length > 0 ? (
                  <img
                    src={stadium.images[0]}
                    alt={stadium.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-white text-center">
                    <MapPin size={48} className="mx-auto mb-2 opacity-80" />
                    <p className="text-lg font-semibold">{stadium.name}</p>
                  </div>
                )}
                {stadium.isPartner && (
                  <div className="absolute top-4 right-4">
                    <Star className="text-yellow-400 fill-current" size={24} />
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{stadium.name}</h3>
                    <p className="text-gray-600 flex items-center">
                      <MapPin size={16} className="mr-1" />
                      {stadium.city}, {stadium.region}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    {canEdit && (
                      <button
                        onClick={() => setEditingStadium(stadium)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteStadium(stadium.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Capacité:</span>
                    <span className="font-semibold text-gray-900">{stadium.capacity.toLocaleString()} places</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Terrains:</span>
                    <span className="font-semibold text-gray-900">{stadium.fieldCount} terrain(s)</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Types:</span>
                    <span className="font-semibold text-gray-900">{stadium.fieldTypes.join(', ')}</span>
                  </div>
                  
                  {stadium.amenities && stadium.amenities.length > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">Équipements:</p>
                      <div className="flex flex-wrap gap-1">
                        {stadium.amenities.slice(0, 3).map((amenity, index) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {amenity}
                          </span>
                        ))}
                        {stadium.amenities.length > 3 && (
                          <span className="text-xs text-gray-500">+{stadium.amenities.length - 3} autres</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {stadium.description && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">{stadium.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAndSortedStadiums.length === 0 && (
          <div className="text-center py-12">
            <MapPin size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchTerm || filterCity ? 'Aucun stade trouvé' : 'Aucun stade disponible'}
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterCity 
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par ajouter votre premier stade'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Ajouter un stade</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleCreateStadium} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du stade *
                  </label>
                  <input
                    type="text"
                    value={newStadium.name}
                    onChange={(e) => setNewStadium({...newStadium, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={newStadium.address}
                    onChange={(e) => setNewStadium({...newStadium, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ville *
                    </label>
                    <input
                      type="text"
                      value={newStadium.city}
                      onChange={(e) => setNewStadium({...newStadium, city: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Région
                    </label>
                    <input
                      type="text"
                      value={newStadium.region}
                      onChange={(e) => setNewStadium({...newStadium, region: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacité *
                    </label>
                    <input
                      type="number"
                      value={newStadium.capacity}
                      onChange={(e) => setNewStadium({...newStadium, capacity: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de terrains
                    </label>
                    <input
                      type="number"
                      value={newStadium.fieldCount}
                      onChange={(e) => setNewStadium({...newStadium, fieldCount: parseInt(e.target.value) || 1})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      min="1"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Types de terrains
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {fieldTypeOptions.map(option => (
                      <label key={option} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={newStadium.fieldTypes.includes(option)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewStadium({
                                ...newStadium,
                                fieldTypes: [...newStadium.fieldTypes, option]
                              });
                            } else {
                              setNewStadium({
                                ...newStadium,
                                fieldTypes: newStadium.fieldTypes.filter(t => t !== option)
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Équipements disponibles
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {amenityOptions.map(option => (
                      <label key={option} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={newStadium.amenities.includes(option)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewStadium({
                                ...newStadium,
                                amenities: [...newStadium.amenities, option]
                              });
                            } else {
                              setNewStadium({
                                ...newStadium,
                                amenities: newStadium.amenities.filter(a => a !== option)
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newStadium.description}
                    onChange={(e) => setNewStadium({...newStadium, description: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPartner"
                    checked={newStadium.isPartner}
                    onChange={(e) => setNewStadium({...newStadium, isPartner: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="isPartner" className="text-sm text-gray-700">
                    Stade partenaire
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {editingStadium && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Modifier le stade</h2>
                <button
                  onClick={() => setEditingStadium(null)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateStadium(editingStadium); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du stade *
                  </label>
                  <input
                    type="text"
                    value={editingStadium.name}
                    onChange={(e) => setEditingStadium({...editingStadium, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={editingStadium.address}
                    onChange={(e) => setEditingStadium({...editingStadium, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ville *
                    </label>
                    <input
                      type="text"
                      value={editingStadium.city}
                      onChange={(e) => setEditingStadium({...editingStadium, city: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Région
                    </label>
                    <input
                      type="text"
                      value={editingStadium.region}
                      onChange={(e) => setEditingStadium({...editingStadium, region: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacité *
                    </label>
                    <input
                      type="number"
                      value={editingStadium.capacity}
                      onChange={(e) => setEditingStadium({...editingStadium, capacity: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de terrains
                    </label>
                    <input
                      type="number"
                      value={editingStadium.fieldCount}
                      onChange={(e) => setEditingStadium({...editingStadium, fieldCount: parseInt(e.target.value) || 1})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      min="1"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Types de terrains
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {fieldTypeOptions.map(option => (
                      <label key={option} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={editingStadium.fieldTypes.includes(option)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingStadium({
                                ...editingStadium,
                                fieldTypes: [...editingStadium.fieldTypes, option]
                              });
                            } else {
                              setEditingStadium({
                                ...editingStadium,
                                fieldTypes: editingStadium.fieldTypes.filter(t => t !== option)
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Équipements disponibles
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {amenityOptions.map(option => (
                      <label key={option} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={editingStadium.amenities.includes(option)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingStadium({
                                ...editingStadium,
                                amenities: [...editingStadium.amenities, option]
                              });
                            } else {
                              setEditingStadium({
                                ...editingStadium,
                                amenities: editingStadium.amenities.filter(a => a !== option)
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingStadium.description}
                    onChange={(e) => setEditingStadium({...editingStadium, description: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editIsPartner"
                    checked={editingStadium.isPartner}
                    onChange={(e) => setEditingStadium({...editingStadium, isPartner: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="editIsPartner" className="text-sm text-gray-700">
                    Stade partenaire
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setEditingStadium(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Mettre à jour
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stadiums; 