import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Navigate } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Trophy, 
  Clock, 
  Calendar,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Target,
  Award,
  ArrowRight,
  Move
} from 'lucide-react';

interface Group {
  id: string;
  name: string;
  tournamentId: string;
  groupTeams: Array<{
    id: string;
    teamId: string;
    team: {
      id: string;
      name: string;
      logo: string | null;
    };
  }>;
}

interface Team {
  id: string;
  name: string;
  logo: string | null;
  coachName?: string;
}

const Groups: React.FC = () => {
  const { user } = useAuth();
  const { tournaments, teams, matches, loadData } = useData();
  const { t, isRTL } = useLanguage();
  
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [matchTime, setMatchTime] = useState('15:00');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [movingTeam, setMovingTeam] = useState<{teamId: string, teamName: string, fromGroupId: string} | null>(null);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Obtenir le tournoi sélectionné
  const currentTournament = (tournaments || []).find(t => t.id === selectedTournament) || (tournaments || [])[0];
  const tournamentGroups = currentTournament?.groups || [];

  // Obtenir toutes les équipes disponibles
  const availableTeams = teams.filter(team => {
    // Équipes qui ne sont dans aucun groupe du tournoi actuel
    const teamsInGroups = (tournamentGroups || []).flatMap(group => 
      group.groupTeams?.map(gt => gt.teamId) || []
    );
    return !teamsInGroups.includes(team.id);
  });

  // Toggle l'expansion d'un groupe
  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  // Ajouter une équipe à un groupe
  const addTeamToGroup = async (groupId: string, teamId: string) => {
    try {
      const { addTeamToGroup } = await import('../services/api');
      await addTeamToGroup(groupId, teamId);
      await loadData();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'équipe au groupe:', error);
      console.error('Détails de l\'erreur:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      alert(`Erreur lors de l'ajout de l'équipe: ${error.response?.data?.message || error.message}`);
    }
  };

  // Retirer une équipe d'un groupe
  const removeTeamFromGroup = async (groupId: string, teamId: string) => {
    try {
      const { removeTeamFromGroup } = await import('../services/api');
      await removeTeamFromGroup(groupId, teamId);
      await loadData();
    } catch (error) {
      console.error('Erreur lors du retrait de l\'équipe du groupe:', error);
      console.error('Détails de l\'erreur:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      alert(`Erreur lors du retrait de l'équipe: ${error.response?.data?.message || error.message}`);
    }
  };

  // Déplacer une équipe d'un groupe à un autre
  const moveTeamToGroup = async (teamId: string, fromGroupId: string, toGroupId: string) => {
    try {
      // D'abord retirer l'équipe de son groupe actuel
      await removeTeamFromGroup(fromGroupId, teamId);
      
      // Ensuite l'ajouter au nouveau groupe
      await addTeamToGroup(toGroupId, teamId);
      
      setMovingTeam(null);
    } catch (error) {
      console.error('Erreur lors du déplacement de l\'équipe:', error);
    }
  };

  // Créer un nouveau groupe
  const createGroup = async (groupName: string) => {
    if (!currentTournament) return;
    
    try {
      const { createGroup } = await import('../services/api');
      await createGroup({
        name: groupName,
        tournamentId: currentTournament.id
      });
      await loadData();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Erreur lors de la création du groupe:', error);
    }
  };

  // Modifier un groupe
  const updateGroup = async (groupId: string, newName: string) => {
    try {
      const { updateGroup } = await import('../services/api');
      await updateGroup(groupId, { name: newName });
      await loadData();
      setShowEditModal(false);
      setEditingGroup(null);
    } catch (error) {
      console.error('Erreur lors de la modification du groupe:', error);
    }
  };

  // Supprimer un groupe
  const deleteGroup = async (groupId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) return;
    
    try {
      const { deleteGroup } = await import('../services/api');
      await deleteGroup(groupId);
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la suppression du groupe:', error);
    }
  };

  // Générer les matchs pour tous les groupes
  const generateMatches = async () => {
    if (!currentTournament) return;
    
    try {
      const { generateMatches } = await import('../services/api');
      const result = await generateMatches(currentTournament.id, matchTime);
      await loadData();
      
      const message = `Matchs générés avec succès !\n\n📊 Résumé:\n- ${result.totalMatches} matchs au total\n- ${result.totalDays} jours de compétition\n- ${result.groupMatches} matchs de groupes\n- ${result.finalMatches} matchs de phase finale`;
      alert(message);
    } catch (error) {
      console.error('Erreur lors de la génération des matchs:', error);
      alert(`Erreur lors de la génération des matchs: ${error.response?.data?.message || error.message}`);
    }
  };

  const updateFinalPhase = async () => {
    if (!currentTournament) return;
    
    try {
      const { updateFinalPhaseMatches } = await import('../services/api');
      const result = await updateFinalPhaseMatches(currentTournament.id);
      await loadData();
      alert(`Équipes qualifiées assignées avec succès !\n\n🏆 ${result.qualifiedTeams.length} équipes qualifiées`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des équipes qualifiées:', error);
      alert(`Erreur: ${error.response?.data?.message || error.message}`);
    }
  };

  const generateFinalMatches = async () => {
    if (!currentTournament) return;
    
    try {
      const { generateFinalPhaseMatches } = await import('../services/api');
      const result = await generateFinalPhaseMatches(currentTournament.id, matchTime);
      await loadData();
      alert(`Matchs de la phase finale générés avec succès !\n\n🏆 ${result.totalMatches} matchs créés\n- ${result.quarters} quarts de finale\n- ${result.semis} demi-finales\n- ${result.final} finale`);
    } catch (error) {
      console.error('Erreur lors de la génération des matchs de la phase finale:', error);
      alert(`Erreur: ${error.response?.data?.message || error.message}`);
    }
  };

  // Calculer les statistiques d'un groupe
  const getGroupStats = (group: Group) => {
    const groupMatches = matches.filter(m => m.groupId === group.id);
    const completedMatches = groupMatches.filter(m => m.status === 'completed');
    const totalMatches = groupMatches.length;
    
    return {
      totalMatches,
      completedMatches: completedMatches.length,
      pendingMatches: totalMatches - completedMatches.length,
      teams: group.groupTeams?.length || 0
    };
  };

  // Obtenir le classement d'un groupe
  const getGroupStandings = (group: Group) => {
    const groupMatches = matches.filter(m => m.groupId === group.id && m.status === 'completed');
    
    // Calculer les points pour chaque équipe
    const teamStats = group.groupTeams?.map(gt => {
      const teamMatches = groupMatches.filter(m => 
        m.homeTeam === gt.teamId || m.awayTeam === gt.teamId
      );
      
      let points = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;
      let wins = 0;
      let draws = 0;
      let losses = 0;
      
      teamMatches.forEach(match => {
        const isHome = match.homeTeam === gt.teamId;
        const goalsScored = isHome ? match.homeScore : match.awayScore;
        const goalsConceded = isHome ? match.awayScore : match.homeScore;
        
        goalsFor += goalsScored;
        goalsAgainst += goalsConceded;
        
        if (goalsScored > goalsConceded) {
          points += 3;
          wins++;
        } else if (goalsScored === goalsConceded) {
          points += 1;
          draws++;
        } else {
          losses++;
        }
      });
      
      return {
        teamId: gt.teamId,
        teamName: gt.team.name,
        points,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        wins,
        draws,
        losses,
        matchesPlayed: teamMatches.length
      };
    });
    
    // Trier par points, puis différence de buts, puis buts marqués
    return (teamStats || []).sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Groupes du tournoi</h1>
          <p className="text-gray-600 mt-1 md:mt-2">
            Gérez les groupes et les équipes du tournoi
          </p>
        </div>
        
        {/* Sélecteur de tournoi */}
        <div className="flex items-center space-x-4">
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {(tournaments || []).map(tournament => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.name}
              </option>
            ))}
          </select>
          
          {user.role === 'admin' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Nouveau Groupe</span>
            </button>
          )}
        </div>
      </div>

             {/* Contrôles de génération de matchs */}
       {user.role === 'admin' && (tournamentGroups || []).length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Génération des matchs</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock size={16} className="text-gray-600" />
                <label className="text-sm text-gray-600">Heure des matchs:</label>
                <input
                  type="time"
                  value={matchTime}
                  onChange={(e) => setMatchTime(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <button
                onClick={generateMatches}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Calendar size={16} />
                <span>Générer les matchs</span>
              </button>
              <button
                onClick={updateFinalPhase}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Trophy size={16} />
                <span>Assigner équipes qualifiées</span>
              </button>
              <button
                onClick={generateFinalMatches}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
              >
                <Award size={16} />
                <span>Générer phase finale</span>
              </button>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>📅 Structure FIFA officielle :</strong> 1 match par jour, répartition équilibrée, repos optimal
            </p>
            <div className="mt-2 text-xs text-blue-700">
              <p>• 18 jours de phase de groupes (6 matchs par groupe)</p>
              <p>• Chaque équipe joue tous les 4-5 jours</p>
              <p>• Structure identique à la Coupe du Monde FIFA</p>
            </div>
          </div>
        </div>
      )}

      {/* Affichage des groupes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {(tournamentGroups || []).map((group) => {
          const stats = getGroupStats(group);
          const standings = getGroupStandings(group);
          const isExpanded = expandedGroups.has(group.id);
          
          return (
            <div key={group.id} className="bg-white rounded-lg shadow-md border border-gray-200">
              {/* Header du groupe */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Users size={20} className="text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                    {user.role === 'admin' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingGroup(group);
                            setShowEditModal(true);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteGroup(group.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => toggleGroupExpansion(group.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
                
                {/* Statistiques du groupe */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{stats.teams}</div>
                    <div className="text-xs text-gray-600">Équipes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{stats.totalMatches}</div>
                    <div className="text-xs text-gray-600">Matchs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{stats.completedMatches}</div>
                    <div className="text-xs text-gray-600">Terminés</div>
                  </div>
                </div>
              </div>

              {/* Contenu détaillé du groupe */}
              {isExpanded && (
                <div className="p-6">
                  {/* Équipes du groupe */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Équipes dans ce groupe:</h4>
                    <div className="space-y-2">
                      {group.groupTeams?.map((groupTeam) => (
                        <div key={groupTeam.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold">
                              {groupTeam.team.logo || '⚽'}
                            </div>
                            <span className="font-medium text-gray-900">{groupTeam.team.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {/* Bouton pour déplacer l'équipe */}
                            {user.role === 'admin' && (tournamentGroups || []).length > 1 && (
                              <button
                                onClick={() => setMovingTeam({
                                  teamId: groupTeam.teamId,
                                  teamName: groupTeam.team.name,
                                  fromGroupId: group.id
                                })}
                                className="p-1 text-blue-400 hover:text-blue-600 transition-colors"
                                title="Déplacer l'équipe"
                              >
                                <Move size={14} />
                              </button>
                            )}
                            {/* Bouton pour retirer l'équipe */}
                            {user.role === 'admin' && (
                              <button
                                onClick={() => removeTeamFromGroup(group.id, groupTeam.teamId)}
                                className="p-1 text-red-400 hover:text-red-600 transition-colors"
                                title="Retirer l'équipe"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Ajouter une équipe */}
                    {user.role === 'admin' && availableTeams.length > 0 && (
                      <div className="mt-4">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              addTeamToGroup(group.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">Ajouter une équipe...</option>
                                                     {(availableTeams || []).map(team => (
                             <option key={team.id} value={team.id}>
                               {team.name}
                             </option>
                           ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Classement du groupe */}
                  {standings.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Classement:</h4>
                      <div className="space-y-2">
                                                 {(standings || []).map((team, index) => (
                          <div key={team.teamId} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                            <div className="flex items-center space-x-3">
                              <span className="font-bold text-gray-600">#{index + 1}</span>
                              <span className="font-medium">{team.teamName}</span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs">
                              <span className="font-bold text-blue-600">{team.points}pts</span>
                              <span className="text-gray-600">{team.goalsFor}-{team.goalsAgainst}</span>
                              <span className="text-gray-500">{team.matchesPlayed}J</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

             {/* Message si aucun groupe */}
       {(tournamentGroups || []).length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-900">Aucun groupe créé</p>
          <p className="text-sm text-gray-600">Créez votre premier groupe pour commencer</p>
        </div>
      )}

      {/* Modal de déplacement d'équipe */}
      {movingTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Déplacer l'équipe</h3>
            <p className="text-gray-600 mb-4">
              Déplacer <strong>{movingTeam.teamName}</strong> vers :
            </p>
            <select
              onChange={(e) => {
                if (e.target.value && e.target.value !== movingTeam.fromGroupId) {
                  moveTeamToGroup(movingTeam.teamId, movingTeam.fromGroupId, e.target.value);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
            >
              <option value="">Sélectionner un groupe...</option>
              {(tournamentGroups || [])
                .filter(g => g.id !== movingTeam.fromGroupId)
                .map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))
              }
            </select>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setMovingTeam(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création de groupe */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Créer un nouveau groupe</h3>
            <input
              type="text"
              placeholder="Nom du groupe (ex: Groupe A)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  if (input.value.trim()) {
                    createGroup(input.value.trim());
                  }
                }
              }}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder*="Nom du groupe"]') as HTMLInputElement;
                  if (input?.value.trim()) {
                    createGroup(input.value.trim());
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification de groupe */}
      {showEditModal && editingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Modifier le groupe</h3>
            <input
              type="text"
              defaultValue={editingGroup.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  if (input.value.trim()) {
                    updateGroup(editingGroup.id, input.value.trim());
                  }
                }
              }}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingGroup(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  const input = document.querySelector('input[defaultValue*="Groupe"]') as HTMLInputElement;
                  if (input?.value.trim()) {
                    updateGroup(editingGroup.id, input.value.trim());
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups; 