import React, { useState, useRef, useEffect } from 'react'
import { Player } from '../types'
import * as XLSX from 'xlsx'
import { ChevronDownIcon, ChevronUpIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { generateSampleExcelFile, parseExcelData, generateExcelFile } from '../utils/excelGenerator'

interface PlayerListProps {
  players: Player[]
  filters: {
    position: string;
    status: string;
    search: string;
    positionArray: string[];
    statusArray: string[];
  }
  onFilterChange: (filters: {
    position: string;
    status: string;
    search: string;
    positionArray: string[];
    statusArray: string[];
  }) => void
}

const PlayerList: React.FC<PlayerListProps> = ({ 
  players, 
  filters,
  onFilterChange
}) => {
  // Use initial values from props
  const [searchTerm, setSearchTerm] = useState(filters.search || '')
  const [positionFilters, setPositionFilters] = useState<string[]>(filters.positionArray || [])
  const [footFilters, setFootFilters] = useState<string[]>([])
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>(filters.statusArray || [])
  
  const [sortField, setSortField] = useState<keyof Player>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // Update parent component's filters when local filters change
  useEffect(() => {
    // Pass both string format and array format to parent
    onFilterChange({
      position: positionFilters.length === 1 ? positionFilters[0] : '',
      status: statusFilter.length === 1 ? statusFilter[0] : '',
      search: searchTerm,
      positionArray: positionFilters,
      statusArray: statusFilter
    });
  }, [positionFilters, statusFilter, searchTerm, onFilterChange]);
  
  // Update local state when props change
  useEffect(() => {
    setSearchTerm(filters.search || '');
    
    // Use array filters directly from props
    if (filters.positionArray && JSON.stringify(positionFilters) !== JSON.stringify(filters.positionArray)) {
      setPositionFilters(filters.positionArray);
    }
    
    if (filters.statusArray && JSON.stringify(statusFilter) !== JSON.stringify(filters.statusArray)) {
      setStatusFilter(filters.statusArray);
    }
  }, [filters]);

  // Helper function to ensure tags/status is always an array
  const ensureArrayField = (field: any): string[] => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      // Handle comma-separated string format from Excel
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

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const excelData = XLSX.utils.sheet_to_json(worksheet)
        
        const parsedPlayers = parseExcelData(excelData)
        // Replace setPlayers with a local variable since we don't need to update parent players
        console.log('Parsed players from Excel:', parsedPlayers.length)
        setIsLoading(false)
      } catch (error) {
        console.error('Error parsing Excel file:', error)
        setIsLoading(false)
        alert('Error parsing Excel file. Please check the format.')
      }
    }
    reader.readAsArrayBuffer(file)
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleExcelDownload = () => {
    generateExcelFile(players)
  }

  const handleDownloadSample = async () => {
    try {
      await generateSampleExcelFile()
    } catch (error) {
      console.error('Failed to download sample file:', error)
      alert('Failed to download sample file. Please try again.')
    }
  }

  // Toggle filter selection
  const togglePositionFilter = (position: string) => {
    setPositionFilters(prev => 
      prev.includes(position) 
        ? prev.filter(p => p !== position) 
        : [...prev, position]
    )
  }

  const toggleFootFilter = (foot: string) => {
    setFootFilters(prev => 
      prev.includes(foot) 
        ? prev.filter(f => f !== foot) 
        : [...prev, foot]
    )
  }

  const toggleTagFilter = (tag: string) => {
    setTagFilters(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    )
  }

  // Update the toggle function for status filters
  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    )
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Clear all filters
  const clearFilters = () => {
    setPositionFilters([]);
    setFootFilters([]);
    setTagFilters([]);
    setStatusFilter([]);
    setSearchTerm('');
  }

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
    
    return matchesSearch && matchesPosition && matchesFoot && matchesTag && matchesStatus;
  })

  const positions = Array.from(new Set(players.map(p => p.position))).filter(Boolean).sort()
  const footOptions = ['left', 'right', 'both']
  const allTags = Array.from(new Set(players.flatMap(p => ensureArrayField(p.tags)))).filter(Boolean).sort()
  const statusOptions = ['HG', 'Player To Watch', 'Unknown']

  const renderSortIcon = (field: keyof Player) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="w-4 h-4 ml-1 inline" /> 
      : <ChevronDownIcon className="w-4 h-4 ml-1 inline" />
  }

  const SortableHeader = ({ field, label }: { field: keyof Player, label: string }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
      default:
        return 'bg-blue-500 text-white';
    }
  };

  // Check if any filters are active
  const hasActiveFilters = positionFilters.length > 0 || statusFilter.length > 0 || searchTerm !== '';

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

        <div>
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
      </div>

      {/* Active tag, foot, and status filters display */}
      {(tagFilters.length > 0 || footFilters.length > 0 || statusFilter.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchTerm && (
            <span className="filter-badge filter-badge-search flex items-center">
              Search: {searchTerm}
              <button onClick={() => setSearchTerm('')} className="ml-1">
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
          
          {(tagFilters.length > 0 || footFilters.length > 0 || statusFilter.length > 0) && (
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
        <div className="flex space-x-2">
          <input
            type="file"
            accept=".xlsx, .xls"
            className="hidden"
            onChange={handleExcelUpload}
            ref={fileInputRef}
          />
          <button
            className="btn btn-blue"
            onClick={() => fileInputRef.current?.click()}
          >
            Import Excel
          </button>
          <button
            className="btn btn-green"
            onClick={handleExcelDownload}
          >
            Export Excel
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader field="name" label="Name" />
              <SortableHeader field="position" label="Position" />
              <SortableHeader field="age" label="Age" />
              <SortableHeader field="experience" label="Experience" />
              <SortableHeader field="domisili" label="Domisili" />
              <SortableHeader field="jurusan" label="Jurusan" />
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foot</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPlayers.map((player) => (
              <tr key={player.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{player.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.position}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.age}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.experience} years</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.domisili}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.jurusan}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{player.foot}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="flex flex-wrap gap-1">
                    {ensureArrayField(player.tags).map((tag, index) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="flex flex-wrap gap-1">
                    {ensureArrayField(player.status).map((status, index) => (
                      <span 
                        key={index} 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}
                      >
                        {status}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PlayerList 