import { useState } from 'react'
import { Player } from '../types'
import * as XLSX from 'xlsx'
import { ChevronDownIcon, ChevronUpIcon, ArrowUpTrayIcon, MagnifyingGlassIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import { generateSampleExcelFile, parseExcelData } from '../utils/excelGenerator'

interface PlayerListProps {
  players: Player[]
  onPlayersUpdate: (players: Player[]) => void
}

const PlayerList = ({ players, onPlayersUpdate }: PlayerListProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [positionFilter, setPositionFilter] = useState('')
  const [footFilter, setFootFilter] = useState<'left' | 'right' | 'both' | ''>('')
  const [tagFilter, setTagFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortField, setSortField] = useState<keyof Player>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [isLoading, setIsLoading] = useState(false)
  
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        
        // Use our utility function to safely parse the Excel data
        const transformedPlayers = parseExcelData(jsonData)
        
        onPlayersUpdate(transformedPlayers)
        setIsLoading(false)
      } catch (error) {
        console.error('Error parsing Excel file:', error)
        setIsLoading(false)
        alert('Error parsing Excel file. Please check the format and try again.')
      }
    }
    reader.onerror = () => {
      setIsLoading(false)
      alert('Error reading the file. Please try again.')
    }
    reader.readAsArrayBuffer(file)
  }

  const handleDownloadSample = async () => {
    try {
      await generateSampleExcelFile()
    } catch (error) {
      console.error('Failed to download sample file:', error)
      alert('Failed to download sample file. Please try again.')
    }
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
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.domisili.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.jurusan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = !positionFilter || player.position === positionFilter;
    const matchesFoot = !footFilter || player.foot === footFilter;
    const playerTags = ensureArrayField(player.tags);
    const matchesTag = !tagFilter || playerTags.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase()));
    const playerStatus = ensureArrayField(player.status);
    const matchesStatus = !statusFilter || playerStatus.includes(statusFilter);
    
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

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="file-upload" className="relative cursor-pointer bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center">
              <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
              <span>Upload Excel File</span>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>
            <button
              onClick={handleDownloadSample}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md flex items-center"
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              <span>Download Sample</span>
            </button>
            {isLoading && (
              <div className="text-sm text-gray-500">
                Loading players...
              </div>
            )}
            {players.length > 0 && (
              <div className="text-sm text-gray-600">
                {players.length} players loaded
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5 mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search players, domisili, jurusan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="block w-full border border-gray-300 rounded-md py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Positions</option>
              {positions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={footFilter}
              onChange={(e) => setFootFilter(e.target.value as any)}
              className="block w-full border border-gray-300 rounded-md py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Foot Preferences</option>
              {footOptions.map((foot) => (
                <option key={foot} value={foot}>
                  {foot.charAt(0).toUpperCase() + foot.slice(1)} Foot
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="block w-full border border-gray-300 rounded-md py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full border border-gray-300 rounded-md py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto bg-white rounded-md shadow">
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
              {filteredPlayers.length > 0 ? (
                filteredPlayers.map((player) => (
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
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                    {players.length === 0 
                      ? "No players loaded. Please upload an Excel file." 
                      : "No players match your filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PlayerList 