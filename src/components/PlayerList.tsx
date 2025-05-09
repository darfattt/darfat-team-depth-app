import React, { useState, useEffect, useRef } from 'react'
import { Player, ScoutRecommendation } from '../types'
import { ChevronDownIcon, ChevronUpIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { generateExcelFile } from '../utils/excelGenerator'
import StarRating from './StarRating'

// Add interfaces for the edit functionality
interface EditablePlayer {
  id: string | number;
  name: string;
  position: string;
  tags: string[];
  status: string[];
  scoutRecommendation?: number;
  recommendations?: ScoutRecommendation[];
  foot?: string;
  domisili?: string;
  jurusan?: string;
  age?: number;
  height?: number;
  weight?: number;
  experience?: number;
}

interface PlayerListProps {
  players: Player[]
  filters: {
    position: string;
    status: string;
    search: string;
    positionArray: string[];
    statusArray: string[];
    minRating: number;
    maxRating: number;
    footFilters?: string[];
    tagFilters?: string[];
  }
  onFilterChange: (filters: {
    position: string;
    status: string;
    search: string;
    positionArray: string[];
    statusArray: string[];
    minRating: number;
    maxRating: number;
    footFilters?: string[];
    tagFilters?: string[];
  }) => void
  // Optional callback for player updates
  onPlayerUpdate?: (updatedPlayer: Player) => void
  // Indicates if the app is currently saving player data
  isSaving?: boolean
}

const PlayerList: React.FC<PlayerListProps> = ({ 
  players, 
  filters,
  onFilterChange,
  onPlayerUpdate,
  isSaving = false
}) => {
  // Use initial values from props
  const [searchTerm, setSearchTerm] = useState(filters.search || '')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(filters.search || '')
  const [positionFilters, setPositionFilters] = useState<string[]>(filters.positionArray || [])
  const [footFilters, setFootFilters] = useState<string[]>(filters.footFilters || [])
  const [tagFilters, setTagFilters] = useState<string[]>(filters.tagFilters || [])
  const [statusFilter, setStatusFilter] = useState<string[]>(filters.statusArray || [])
  const [minRating, setMinRating] = useState<number>(filters.minRating || 0)
  const [maxRating, setMaxRating] = useState<number>(filters.maxRating || 5)
  
  // State for edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [playerToEdit, setPlayerToEdit] = useState<EditablePlayer | null>(null)
  const [tagsInput, setTagsInput] = useState('')
  const [isAdditionalInfoOpen, setIsAdditionalInfoOpen] = useState(false)
  
  const [sortField, setSortField] = useState<keyof Player>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // Ref to track if we're handling an update from props
  const isProcessingPropsUpdate = useRef(false);
  // Ref to track previous filter values
  const prevFilters = useRef({
    position: filters.position,
    status: filters.status,
    search: filters.search,
    positionArray: filters.positionArray,
    statusArray: filters.statusArray,
    minRating: filters.minRating,
    maxRating: filters.maxRating,
    footFilters: filters.footFilters || [],
    tagFilters: filters.tagFilters || []
  });
  
  // Debounce search term changes
  useEffect(() => {
    // Skip the effect if we're currently processing a props update
    if (isProcessingPropsUpdate.current) return;
    
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce time

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);
  
  // Update local state when props change
  // This effect should only respond to changes in the filters prop
  useEffect(() => {
    // Skip if our local state changes triggered the filter change
    if (
      filters.search === prevFilters.current.search &&
      JSON.stringify(filters.positionArray) === JSON.stringify(prevFilters.current.positionArray) &&
      JSON.stringify(filters.statusArray) === JSON.stringify(prevFilters.current.statusArray) &&
      filters.minRating === prevFilters.current.minRating &&
      filters.maxRating === prevFilters.current.maxRating &&
      JSON.stringify(filters.footFilters) === JSON.stringify(prevFilters.current.footFilters) &&
      JSON.stringify(filters.tagFilters) === JSON.stringify(prevFilters.current.tagFilters)
    ) {
      return;
    }
    
    // Set flag to prevent other effects from running
    isProcessingPropsUpdate.current = true;
    
    try {
      // Only update local state if the prop value has changed
      if (filters.search !== debouncedSearchTerm) {
        setSearchTerm(filters.search || '');
        setDebouncedSearchTerm(filters.search || '');
      }
      
      if (JSON.stringify(filters.positionArray) !== JSON.stringify(positionFilters)) {
        setPositionFilters(filters.positionArray || []);
      }
      
      if (JSON.stringify(filters.statusArray) !== JSON.stringify(statusFilter)) {
        setStatusFilter(filters.statusArray || []);
      }
      
      if (filters.minRating !== minRating) {
        setMinRating(filters.minRating || 0);
      }
      
      if (filters.maxRating !== maxRating) {
        setMaxRating(filters.maxRating || 5);
      }
      
      // Add handling for foot and tag filters
      if (JSON.stringify(filters.footFilters) !== JSON.stringify(footFilters)) {
        setFootFilters(filters.footFilters || []);
      }
      
      if (JSON.stringify(filters.tagFilters) !== JSON.stringify(tagFilters)) {
        setTagFilters(filters.tagFilters || []);
      }
      
      // Update previous filters
      prevFilters.current = {
        position: filters.position,
        status: filters.status,
        search: filters.search,
        positionArray: filters.positionArray,
        statusArray: filters.statusArray,
        minRating: filters.minRating,
        maxRating: filters.maxRating,
        footFilters: filters.footFilters || [],
        tagFilters: filters.tagFilters || []
      };
    } finally {
      // Reset the flag after all updates are queued
      isProcessingPropsUpdate.current = false;
    }
  }, [filters]);

  // Update parent component's filters when local filters change
  // This effect should only run when local state changes, not when props change
  useEffect(() => {
    // Skip if we're processing a props update
    if (isProcessingPropsUpdate.current) return;
    
    const updatedFilters = {
      position: positionFilters.length === 1 ? positionFilters[0] : '',
      status: statusFilter.length === 1 ? statusFilter[0] : '',
      search: debouncedSearchTerm.trim(),
      positionArray: positionFilters,
      statusArray: statusFilter,
      minRating: minRating,
      maxRating: maxRating,
      footFilters: footFilters,
      tagFilters: tagFilters
    };
    
    // Check if the filters are actually different before updating parent
    if (
      updatedFilters.search !== prevFilters.current.search ||
      JSON.stringify(updatedFilters.positionArray) !== JSON.stringify(prevFilters.current.positionArray) ||
      JSON.stringify(updatedFilters.statusArray) !== JSON.stringify(prevFilters.current.statusArray) ||
      updatedFilters.minRating !== prevFilters.current.minRating ||
      updatedFilters.maxRating !== prevFilters.current.maxRating ||
      JSON.stringify(updatedFilters.footFilters) !== JSON.stringify(prevFilters.current.footFilters) ||
      JSON.stringify(updatedFilters.tagFilters) !== JSON.stringify(prevFilters.current.tagFilters)
    ) {
      // Update our tracking ref first
      prevFilters.current = {
        position: updatedFilters.position,
        status: updatedFilters.status,
        search: updatedFilters.search,
        positionArray: updatedFilters.positionArray,
        statusArray: updatedFilters.statusArray,
        minRating: updatedFilters.minRating,
        maxRating: updatedFilters.maxRating,
        footFilters: updatedFilters.footFilters,
        tagFilters: updatedFilters.tagFilters
      };
      
      // Then update parent
      onFilterChange(updatedFilters);
    }
  }, [positionFilters, statusFilter, footFilters, tagFilters, debouncedSearchTerm, minRating, maxRating, onFilterChange]);
  
  // Helper function to ensure tags/status is always an array
  const ensureArrayField = (field: any): string[] => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      // Handle comma-separated string format from Excel or Supabase
      return field.split(',').map(item => item.trim()).filter(Boolean);
    }
    return [];
  };
  
  const handleSort = (field: keyof Player) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleExcelDownload = () => {
    generateExcelFile(players)
  }

  // Toggle filter selection
  const togglePositionFilter = (position: string) => {
    // Skip setting state if we're processing a props update
    if (isProcessingPropsUpdate.current) return;
    
    setPositionFilters(prev => 
      prev.includes(position) 
        ? prev.filter(p => p !== position) 
        : [...prev, position]
    );
  };

  const toggleFootFilter = (foot: string) => {
    // Skip setting state if we're processing a props update
    if (isProcessingPropsUpdate.current) return;
    
    setFootFilters(prev => 
      prev.includes(foot) 
        ? prev.filter(f => f !== foot) 
        : [...prev, foot]
    );
  };

  const toggleTagFilter = (tag: string) => {
    // Skip setting state if we're processing a props update
    if (isProcessingPropsUpdate.current) return;
    
    setTagFilters(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  // Update the toggle function for status filters
  const toggleStatusFilter = (status: string) => {
    // Skip setting state if we're processing a props update
    if (isProcessingPropsUpdate.current) return;
    
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Skip setting state if we're processing a props update
    if (isProcessingPropsUpdate.current) return;
    
    setSearchTerm(e.target.value);
  };

  // Function to clear search term
  const clearSearchTerm = () => {
    // Skip setting state if we're processing a props update
    if (isProcessingPropsUpdate.current) return;
    
    setSearchTerm('');
    setDebouncedSearchTerm('');
  };

  // Clear all filters
  const clearFilters = () => {
    // Skip setting state if we're processing a props update
    if (isProcessingPropsUpdate.current) return;
    
    setPositionFilters([]);
    setFootFilters([]);
    setTagFilters([]);
    setStatusFilter([]);
    clearSearchTerm();
    handleMinRatingChange(0);
    handleMaxRatingChange(5);
  };

  const sortedPlayers = [...players].sort((a, b) => {
    const fieldA = a[sortField]
    const fieldB = b[sortField]
    
    if (typeof fieldA === 'string' && typeof fieldB === 'string') {
      return sortDirection === 'asc' 
        ? fieldA.localeCompare(fieldB)
        : fieldB.localeCompare(fieldA)
    } else if (Array.isArray(fieldA) && Array.isArray(fieldB)) {
      return sortDirection === 'asc'
        ? fieldA.join(',').localeCompare(fieldB.join(','))
        : fieldB.join(',').localeCompare(fieldA.join(','))
    } else {
      return sortDirection === 'asc'
        ? Number(fieldA) - Number(fieldB)
        : Number(fieldB) - Number(fieldA)
    }
  })

  const filteredPlayers = sortedPlayers.filter(player => {
    const matchesSearch = searchTerm === '' || 
                         player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (player.domisili?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (player.jurusan?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Check position filters (any match)
    const matchesPosition = positionFilters.length === 0 || 
                           positionFilters.includes(player.position);
    
    // Check foot filters (any match)
    const matchesFoot = footFilters.length === 0 || 
                       footFilters.includes(player.foot);
    
    // Check tag filters (any match)
    const playerTags = ensureArrayField(player.tags);
    const matchesTag = tagFilters.length === 0 || 
                      tagFilters.some(filterTag => 
                        playerTags.some(playerTag => 
                          playerTag.toLowerCase().includes(filterTag.toLowerCase())
                        )
                      );
    
    // Status filter (multiple selection)
    const playerStatus = ensureArrayField(player.status);
    const matchesStatus = statusFilter.length === 0 || 
                        statusFilter.some(filterStatus => 
                          playerStatus.includes(filterStatus)
                        );
    
    // Rating filter
    const matchesRating = (player.scoutRecommendation || 0) >= minRating && (player.scoutRecommendation || 0) <= maxRating;
    
    return matchesSearch && matchesPosition && matchesFoot && matchesTag && matchesStatus && matchesRating;
  })

  const positions = Array.from(new Set(players.map(p => p.position))).filter(Boolean).sort()
  const footOptions = ['Kiri', 'Kanan', 'Keduanya']
  const allTags = Array.from(new Set(players.flatMap(p => ensureArrayField(p.tags)))).filter(Boolean).sort()
  const statusOptions = ['HG', 'Player To Watch', 'Unknown', 'Give a chance','Existing Player','Not Interested', 'Not Confirmed', 'Qualified']

  const renderSortIcon = (field: keyof Player) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="w-4 h-4 ml-1 inline" /> 
      : <ChevronDownIcon className="w-4 h-4 ml-1 inline" />
  }

  const SortableHeader = ({ field, label }: { field: keyof Player, label: string }) => (
    <th 
      className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        {label}
        {renderSortIcon(field)}
      </div>
    </th>
  )

  // Badge color mapping for status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HG':
        return 'bg-green-100 text-green-800';
      case 'Player To Watch':
        return 'bg-yellow-100 text-yellow-800';
      case 'Unknown':
        return 'bg-gray-100 text-gray-800';
      case 'Not Confirmed':
        return 'bg-orange-100 text-orange-800';
      case 'Qualified':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Get colors for status buttons
  const getStatusButtonColor = (status: string): string => {
    switch (status) {
      case 'HG':
        return 'bg-green-500 text-white';
      case 'Player To Watch':
        return 'bg-yellow-500 text-white';
      case 'Unknown':
        return 'bg-gray-500 text-white';
      case 'Not Confirmed':
        return 'bg-orange-500 text-white';
      case 'Qualified':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (openDropdown) {
        const dropdown = document.getElementById(`${openDropdown}-dropdown`);
        if (dropdown && !dropdown.contains(event.target as Node)) {
          dropdown.classList.add('hidden');
          setOpenDropdown(null);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  // Toggle dropdown visibility
  const toggleDropdown = (id: string) => {
    // Close any open dropdown
    if (openDropdown && openDropdown !== id) {
      const currentDropdown = document.getElementById(`${openDropdown}-dropdown`);
      if (currentDropdown) currentDropdown.classList.add('hidden');
    }
    
    const dropdown = document.getElementById(`${id}-dropdown`);
    if (dropdown) {
      dropdown.classList.toggle('hidden');
      setOpenDropdown(dropdown.classList.contains('hidden') ? null : id);
    }
  };

  // Function to handle minRating changes
  const handleMinRatingChange = (value: number) => {
    // Skip setting state if we're processing a props update
    if (isProcessingPropsUpdate.current) return;
    
    // Ensure minRating doesn't exceed maxRating
    const newValue = Math.min(value, maxRating);
    setMinRating(newValue);
  };

  const handleMaxRatingChange = (value: number) => {
    // Skip setting state if we're processing a props update
    if (isProcessingPropsUpdate.current) return;
    
    // Ensure maxRating isn't less than minRating
    const newValue = Math.max(value, minRating);
    setMaxRating(newValue);
  };

  // Function to convert Player to EditablePlayer
  const playerToEditable = (player: Player): EditablePlayer => {
    // Create default recommendations if they don't exist
    const defaultRecommendations: ScoutRecommendation[] = [
      { scoutName: "Darfat", recommendationValue: 0 },
      { scoutName: "Badru", recommendationValue: 0 },
      { scoutName: "Handrian", recommendationValue: 0 },
      { scoutName: "Hendrian", recommendationValue: 0 },
      { scoutName: "Fadzri", recommendationValue: 0 },
      { scoutName: "Hendra DP", recommendationValue: 0 },
      { scoutName: "Scout 7", recommendationValue: 0 },
      { scoutName: "Scout 8", recommendationValue: 0 }
    ];

    // Merge existing recommendations with default ones
    const mergedRecommendations = player.recommendations
      ? [...player.recommendations]
      : [];
    
    // Ensure all default scouts exist in the recommendations
    defaultRecommendations.forEach(defaultRec => {
      if (!mergedRecommendations.some(rec => rec.scoutName === defaultRec.scoutName)) {
        mergedRecommendations.push(defaultRec);
      }
    });

    return {
      ...player,
      // Ensure tags is always an array
      tags: ensureArrayField(player.tags),
      // Ensure status is always an array
      status: ensureArrayField(player.status),
      // Add recommendations
      recommendations: mergedRecommendations
    };
  };

  // Function to get color class based on rating value
  const getRatingColorClass = (rating: number): string => {
    if (rating >= 4) return 'bg-green-500'; // Excellent
    if (rating >= 3) return 'bg-blue-500';  // Good
    if (rating >= 2) return 'bg-yellow-500'; // Average
    if (rating >= 1) return 'bg-orange-500'; // Below average
    return 'bg-red-500'; // Poor
  };

  // Function to handle scout recommendation change
  const handleScoutRecommendationChange = (scoutName: string, value: number) => {
    if (playerToEdit) {
      // Round to nearest 0.5 if needed
      const roundedValue = Math.round(value * 2) / 2;
      
      const recommendations = playerToEdit.recommendations || [];
      const updatedRecommendations = [...recommendations];
      
      // Find existing recommendation or add new one
      const existingIndex = updatedRecommendations.findIndex(rec => rec.scoutName === scoutName);
      if (existingIndex >= 0) {
        updatedRecommendations[existingIndex].recommendationValue = roundedValue;
      } else {
        updatedRecommendations.push({ scoutName, recommendationValue: roundedValue });
      }
      
      // Update player with new recommendations
      setPlayerToEdit({
        ...playerToEdit,
        recommendations: updatedRecommendations
      });

      // Calculate average for the scout recommendation field
      if (updatedRecommendations.length > 0) {
        // Only include non-zero recommendations in the average
        const nonZeroRecs = updatedRecommendations.filter(rec => rec.recommendationValue > 0);
        if (nonZeroRecs.length > 0) {
          const sum = nonZeroRecs.reduce((total, rec) => total + rec.recommendationValue, 0);
          const average = sum / nonZeroRecs.length;
          // Round to nearest 0.5
          const roundedAverage = Math.round(average * 2) / 2;
          setPlayerToEdit(prev => ({
            ...prev!,
            scoutRecommendation: roundedAverage
          }));
        } else {
          // If no non-zero recommendations, set to 0
          setPlayerToEdit(prev => ({
            ...prev!,
            scoutRecommendation: 0
          }));
        }
      }
    }
  };

  // Function to convert EditablePlayer back to Player format
  const editableToPlayer = (editablePlayer: EditablePlayer): Player => {
    // For Supabase compatibility, convert arrays to comma-separated strings
    return {
      ...editablePlayer,
      tags: Array.isArray(editablePlayer.tags) ? editablePlayer.tags.join(', ') : editablePlayer.tags,
      status: Array.isArray(editablePlayer.status) ? editablePlayer.status.join(', ') : editablePlayer.status
    } as unknown as Player;
  };

  // Function to open edit dialog
  const openEditDialog = (player: Player) => {
    try {
      // Convert player to editable format
      const editablePlayer = playerToEditable(player);
      
      setPlayerToEdit(editablePlayer);
      setTagsInput(Array.isArray(editablePlayer.tags) ? editablePlayer.tags.join(', ') : '');
      setIsAdditionalInfoOpen(false); // Ensure additional info is collapsed when opening dialog
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error('Error opening edit dialog:', error);
      alert('There was an error opening the edit dialog. Please try again.');
    }
  };
  
  // Function to close edit dialog
  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setPlayerToEdit(null);
  };
  
  // Function to navigate to previous player
  const navigateToPrevPlayer = () => {
    if (!playerToEdit) return;
    
    const currentIndex = filteredPlayers.findIndex(p => p.id === playerToEdit.id);
    if (currentIndex > 0) {
      openEditDialog(filteredPlayers[currentIndex - 1]);
    }
  };
  
  // Function to navigate to next player
  const navigateToNextPlayer = () => {
    if (!playerToEdit) return;
    
    const currentIndex = filteredPlayers.findIndex(p => p.id === playerToEdit.id);
    if (currentIndex < filteredPlayers.length - 1) {
      openEditDialog(filteredPlayers[currentIndex + 1]);
    }
  };
  
  // Function to handle player property changes
  const handlePlayerChange = (property: keyof EditablePlayer, value: any) => {
    if (playerToEdit) {
      setPlayerToEdit({
        ...playerToEdit,
        [property]: value
      });
    }
  };
  
  // Function to handle tags input
  const handleTagsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsInput(e.target.value);
    if (playerToEdit) {
      const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
      setPlayerToEdit({
        ...playerToEdit,
        tags
      });
    }
  };
  
  // Function to save player changes
  const savePlayerChanges = () => {
    if (playerToEdit && onPlayerUpdate) {
      // Convert back to player format expected by parent
      const updatedPlayer = editableToPlayer(playerToEdit);
      onPlayerUpdate(updatedPlayer);
    }
    closeEditDialog();
  };

  return (
    <div className="space-y-4">
      {/* Search and dropdown filters */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search players, domisili, jurusan..."
            className="input w-full"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <button
              className="input flex items-center justify-between min-w-[120px]"
              onClick={() => toggleDropdown('tag')}
            >
              <span>{tagFilters.length ? `${tagFilters.length} tags` : 'Tags'}</span>
              <ChevronDownIcon className="w-4 h-4 ml-1" />
            </button>
            <div 
              id="tag-dropdown" 
              className="hidden multi-select-dropdown w-56 max-h-60 overflow-y-auto"
            >
              <div className="p-2">
                {allTags.map((tag) => (
                  <label key={tag} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={tagFilters.includes(tag)}
                      onChange={() => toggleTagFilter(tag)}
                    />
                    <span>{tag}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="relative">
            <button
              className="input flex items-center justify-between min-w-[120px]"
              onClick={() => toggleDropdown('foot')}
            >
              <span>{footFilters.length ? `${footFilters.length} feet` : 'Foot'}</span>
              <ChevronDownIcon className="w-4 h-4 ml-1" />
            </button>
            <div 
              id="foot-dropdown" 
              className="hidden multi-select-dropdown w-48"
            >
              <div className="p-2">
                {footOptions.map((foot) => (
                  <label key={foot} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={footFilters.includes(foot)}
                      onChange={() => toggleFootFilter(foot)}
                    />
                    <span className="capitalize">{foot}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter chips section */}
      <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Position</span>
            {positionFilters.length > 0 && (
              <button 
                onClick={() => clearFilters()}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {positions.map((position) => (
              <button
                key={position}
                onClick={() => togglePositionFilter(position)}
                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                  positionFilters.includes(position)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {position}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Status</span>
            {statusFilter.length > 0 && (
              <button 
                onClick={() => clearFilters()}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => toggleStatusFilter(status)}
                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                  statusFilter.includes(status)
                    ? getStatusButtonColor(status)
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Minimum Rating</span>
              {minRating > 0 && (
                <button 
                  onClick={() => handleMinRatingChange(0)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={minRating}
                onChange={(e) => handleMinRatingChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-600 min-w-[3rem]">{minRating.toFixed(1)}</span>
              <StarRating rating={minRating} size="sm" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Maximum Rating</span>
              {maxRating < 5 && (
                <button 
                  onClick={() => handleMaxRatingChange(5)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={maxRating}
                onChange={(e) => handleMaxRatingChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-600 min-w-[3rem]">{maxRating.toFixed(1)}</span>
              <StarRating rating={maxRating} size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Active tag, foot, and status filters display */}
      {(tagFilters.length > 0 || footFilters.length > 0 || statusFilter.length > 0 || minRating > 0 || maxRating < 5) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchTerm && (
            <span className="filter-badge filter-badge-search flex items-center">
              Search: {searchTerm}
              <button onClick={() => clearSearchTerm()} className="ml-1">
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {footFilters.map(foot => (
            <span key={`foot-${foot}`} className="filter-badge filter-badge-foot flex items-center">
              {foot}
              <button onClick={() => toggleFootFilter(foot)} className="ml-1">
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
          
          {tagFilters.map(tag => (
            <span key={`tag-${tag}`} className="filter-badge filter-badge-tag flex items-center">
              {tag}
              <button onClick={() => toggleTagFilter(tag)} className="ml-1">
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
          
          {statusFilter.map(status => (
            <span key={`status-${status}`} className={`filter-badge flex items-center ${getStatusColor(status)}`}>
              {status}
              <button onClick={() => toggleStatusFilter(status)} className="ml-1">
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
          
          {minRating > 0 && maxRating < 5 ? (
            <span className="filter-badge flex items-center bg-yellow-100 text-yellow-800">
              Rating: {minRating.toFixed(1)}-{maxRating.toFixed(1)}
              <button onClick={() => { handleMinRatingChange(0); handleMaxRatingChange(5); }} className="ml-1">
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ) : minRating > 0 ? (
            <span className="filter-badge flex items-center bg-yellow-100 text-yellow-800">
              Min Rating: {minRating.toFixed(1)}
              <button onClick={() => handleMinRatingChange(0)} className="ml-1">
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ) : maxRating < 5 && (
            <span className="filter-badge flex items-center bg-yellow-100 text-yellow-800">
              Max Rating: {maxRating.toFixed(1)}
              <button onClick={() => handleMaxRatingChange(5)} className="ml-1">
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {(tagFilters.length > 0 || footFilters.length > 0 || statusFilter.length > 0 || minRating > 0 || maxRating < 5) && (
            <button 
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-800 ml-2"
            >
              Clear all
            </button>
          )}
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div>
          <span className="text-sm text-gray-500">
            {filteredPlayers.length} players found
          </span>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
          <button
            className="btn btn-green flex items-center gap-2 hover:bg-green-600 transition-colors"
            onClick={handleExcelDownload}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export Excel
          </button>
        </div>
      </div>
      
      <table className="w-full divide-y divide-gray-200 border-separate border-spacing-0 table-fixed">
        <thead className="bg-gray-50">
          <tr>
            <SortableHeader field="name" label="Name" />
            <SortableHeader field="position" label="POS" />
            <SortableHeader field="foot" label="Foot" />
            <SortableHeader field="jurusan" label="Jurusan" />
            <SortableHeader field="domisili" label="Domisili" />
            <SortableHeader field="status" label="Status" />
            <SortableHeader field="tags" label="Tags" />
            <SortableHeader field="scoutRecommendation" label="Scout Rating" />
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredPlayers.map((player) => (
            <tr 
              key={player.id} 
              className="hover:bg-gray-50 cursor-pointer" 
              onDoubleClick={() => openEditDialog(player)}
            >
              <td className="px-2 py-2 w-[15%]">
                <div className="font-medium text-gray-900 break-words">{player.name}</div>
              </td>
              <td className="px-2 py-2 w-[5%]">
                <div className="text-sm text-gray-900">{player.position}</div>
              </td>
              <td className="px-2 py-2 w-[8%]">
                <div className="text-sm text-gray-900">{player.foot}</div>
              </td>
              <td className="px-2 py-2 w-[13%]">
                <div className="text-sm text-gray-900 truncate">{player.jurusan}</div>
              </td>
              <td className="px-2 py-2 w-[13%]">
                <div className="text-sm text-gray-900 truncate">{player.domisili}</div>
              </td>
              <td className="px-2 py-2 w-[15%]">
                <div className="flex flex-wrap gap-1">
                  {(() => {
                    const statuses = ensureArrayField(player.status);
                    const displayStatuses = statuses.slice(0, 2);
                    const extraCount = statuses.length - 2;
                    
                    return (
                      <>
                        {displayStatuses.map((status, index) => (
                          <span
                            key={`${player.id}-status-${index}`}
                            className={`px-1 py-0.5 rounded text-xs font-medium ${getStatusColor(status)}`}
                          >
                            {status}
                          </span>
                        ))}
                        {extraCount > 0 && (
                          <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            +{extraCount} more
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </td>
              <td className="px-2 py-2 w-[15%]">
                <div className="flex flex-wrap gap-1">
                  {(() => {
                    const tags = ensureArrayField(player.tags);
                    const displayTags = tags.slice(0, 3);
                    const extraCount = tags.length - 3;
                    
                    return (
                      <>
                        {displayTags.map((tag, index) => (
                          <span
                            key={`${player.id}-tag-${index}`}
                            className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {tag}
                          </span>
                        ))}
                        {extraCount > 0 && (
                          <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            +{extraCount} more
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </td>
              <td className="px-2 py-2 w-[16%]">
                <StarRating rating={player.scoutRecommendation || 0} size="sm" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Edit Player Dialog */}
      {isEditDialogOpen && playerToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white z-10 p-6 pb-2 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <h2 className="text-xl font-bold">Edit Player</h2>
                  <div className="ml-4 flex items-center gap-2">
                    <button 
                      onClick={navigateToPrevPlayer}
                      className="p-1 rounded hover:bg-gray-100"
                      disabled={isSaving || filteredPlayers.findIndex(p => p.id === playerToEdit.id) === 0}
                      title="Previous Player"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button 
                      onClick={navigateToNextPlayer}
                      className="p-1 rounded hover:bg-gray-100"
                      disabled={isSaving || filteredPlayers.findIndex(p => p.id === playerToEdit.id) === filteredPlayers.length - 1}
                      title="Next Player"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                <button 
                  onClick={closeEditDialog}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={isSaving}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 pt-4">
              <div className="space-y-4">
                {/* Main fields */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={playerToEdit.name}
                      onChange={(e) => handlePlayerChange('name', e.target.value)}
                      className="input w-full"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                      <select
                        value={playerToEdit.position}
                        onChange={(e) => handlePlayerChange('position', e.target.value)}
                        className="input w-full"
                      >
                        <option value="GK">GK</option>
                        <option value="LB">LB</option>
                        <option value="LCB">LCB</option>
                        <option value="RCB">RCB</option>
                        <option value="RB">RB</option>
                        <option value="CDM">CDM</option>
                        <option value="CM">CM</option>
                        <option value="LM">LM</option>
                        <option value="CAM">CAM</option>
                        <option value="RM">RM</option>
                        <option value="ST">ST</option>
                      </select>
                    </div>
                    
                    <div>
                    
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {statusOptions.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => {
                            // Toggle the status in the array
                            if (!playerToEdit) return;
                            const currentStatuses = [...playerToEdit.status];
                            const index = currentStatuses.indexOf(status);
                            
                            if (index >= 0) {
                              // Remove status if already selected
                              currentStatuses.splice(index, 1);
                            } else {
                              // Add status if not selected
                              currentStatuses.push(status);
                            }
                            
                            // Update player status
                            setPlayerToEdit({
                              ...playerToEdit,
                              status: currentStatuses
                            });
                          }}
                          className={`px-2 py-1 text-xs rounded-full transition-colors ${
                            playerToEdit.status.includes(status)
                              ? getStatusButtonColor(status)
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {playerToEdit.status.length > 0 ? (
                        playerToEdit.status.map((status) => (
                          <span
                            key={status}
                            className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status)}`}
                          >
                            {status}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">No status selected</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Scout Recommendations Section */}
                <div className="mt-6">
                  <h3 className="text-md font-semibold text-gray-700 mb-3">Scout Recommendations</h3>
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    {/* Summary of recommendations */}
                    <div className="border-b border-gray-200 pb-3 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-700">Scout Recommendation</span>
                        <div className="flex items-center">
                          <span className="text-lg font-bold text-blue-600 mr-2">
                            {playerToEdit.scoutRecommendation?.toFixed(1) || "0.0"}
                          </span>
                          <StarRating rating={playerToEdit.scoutRecommendation || 0} size="md" />
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getRatingColorClass(playerToEdit.scoutRecommendation || 0)}`}
                          style={{ width: `${((playerToEdit.scoutRecommendation || 0) / 5) * 100}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Poor</span>
                        <span>Average</span>
                        <span>Excellent</span>
                      </div>
                    </div>
                    
                    {/* Individual scout ratings */}
                    {(playerToEdit.recommendations || []).map((rec) => (
                      <div key={rec.scoutName} className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-sm font-medium text-gray-700">{rec.scoutName}</label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 min-w-[2rem] text-right">
                              {rec.recommendationValue.toFixed(1)}
                            </span>
                            <StarRating 
                              rating={rec.recommendationValue} 
                              size="sm" 
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.5"
                            value={rec.recommendationValue}
                            onChange={(e) => handleScoutRecommendationChange(rec.scoutName, parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-gray-500 w-24">
                            <span>0</span>
                            <span>2.5</span>
                            <span>5</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className={`h-1.5 rounded-full ${getRatingColorClass(rec.recommendationValue)}`}
                            style={{ width: `${(rec.recommendationValue / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Tags section moved below scout recommendations */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={handleTagsInputChange}
                    className="input w-full"
                    placeholder="E.g. Fast, Technical, Leader"
                  />
                </div>
                
                {/* Additional fields - Collapsible */}
                <div className="mt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAdditionalInfoOpen(!isAdditionalInfoOpen)}
                    className="flex w-full items-center justify-between text-md font-semibold mb-2 text-gray-700 hover:text-gray-900"
                  >
                    <span>Additional Information</span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-5 w-5 transform transition-transform ${isAdditionalInfoOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isAdditionalInfoOpen && (
                    <div className="grid grid-cols-2 gap-4 mt-2 p-4 bg-gray-50 rounded-md border border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                        <input
                          type="number"
                          value={playerToEdit.age || ''}
                          onChange={(e) => handlePlayerChange('age', e.target.value ? Number(e.target.value) : null)}
                          className="input w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                        <input
                          type="number"
                          value={playerToEdit.height || ''}
                          onChange={(e) => handlePlayerChange('height', e.target.value ? Number(e.target.value) : null)}
                          className="input w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                        <input
                          type="number"
                          value={playerToEdit.weight || ''}
                          onChange={(e) => handlePlayerChange('weight', e.target.value ? Number(e.target.value) : null)}
                          className="input w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                        <input
                          type="number"
                          value={playerToEdit.experience || ''}
                          onChange={(e) => handlePlayerChange('experience', e.target.value ? Number(e.target.value) : null)}
                          className="input w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Domisili</label>
                        <input
                          type="text"
                          value={playerToEdit.domisili || ''}
                          onChange={(e) => handlePlayerChange('domisili', e.target.value)}
                          className="input w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jurusan</label>
                        <input
                          type="text"
                          value={playerToEdit.jurusan || ''}
                          onChange={(e) => handlePlayerChange('jurusan', e.target.value)}
                          className="input w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Foot</label>
                        <select
                          value={playerToEdit.foot || ''}
                          onChange={(e) => handlePlayerChange('foot', e.target.value)}
                          className="input w-full"
                        >
                          <option value="">Select foot</option>
                          <option value="Kiri">Kiri</option>
                          <option value="Kanan">Kanan</option>
                          <option value="Keduanya">Keduanya</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white z-10 p-6 pt-2 border-t border-gray-200">
              <div className="flex justify-end gap-2">
                <button
                  onClick={closeEditDialog}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (playerToEdit && onPlayerUpdate) {
                      // Convert back to player format expected by parent
                      const updatedPlayer = editableToPlayer(playerToEdit);
                      onPlayerUpdate(updatedPlayer);
                    }
                  }}
                  className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2 ${
                    isSaving ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
                <button
                  onClick={savePlayerChanges}
                  className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2 ${
                    isSaving ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save & Close'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlayerList