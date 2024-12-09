import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Filter, X } from 'lucide-react';
import '../../styles/VolunteerHistoryFilter.css';

const FilterOptions = ({ onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    eventNameSort: 'none',
    urgency: [],
    eventDateSort: 'none',
    status: []
  });

  const urgencyOptions = [
    { value: 'Low', className: 'filter-urgency-low' },
    { value: 'Medium', className: 'filter-urgency-medium' },
    { value: 'High', className: 'filter-urgency-high' }
  ];

  const statusOptions = [
    { value: 'Not Attended', className: 'filter-status-not-attended' },
    { value: 'Matched - Pending Attendance', className: 'filter-status-matched' },
    { value: 'Attended', className: 'filter-status-attended' },
    { value: 'Cancelled', className: 'filter-status-cancelled' }
  ];

  const handleFilterChange = (type, value) => {
    const newFilters = { ...selectedFilters };

    switch (type) {
      case 'eventNameSort':
      case 'eventDateSort':
        newFilters[type] = value === newFilters[type] ? 'none' : value;
        break;
      case 'urgency':
      case 'status':
        if (newFilters[type].includes(value)) {
          newFilters[type] = newFilters[type].filter(item => item !== value);
        } else {
          newFilters[type] = [...newFilters[type], value];
        }
        break;
      default:
        break;
    }

    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const resetFilters = {
      eventNameSort: 'none',
      urgency: [],
      eventDateSort: 'none',
      status: []
    };
    setSelectedFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const hasActiveFilters = () => {
    return selectedFilters.eventNameSort !== 'none' || 
           selectedFilters.eventDateSort !== 'none' || 
           selectedFilters.urgency.length > 0 || 
           selectedFilters.status.length > 0;
  };

  return (
    <div className="relative mb-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="filter-button filter-main-button"
        >
          <Filter className="h-4 w-4 text-gray-500" />
          <span>Filters</span>
          {hasActiveFilters() && (
            <span className="filter-active-badge">
              Active
            </span>
          )}
        </button>

        {hasActiveFilters() && (
          <button
            type="button"
            onClick={clearFilters}
            className="filter-button filter-clear-button"
          >
            <X className="h-4 w-4" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="filter-dropdown">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Sort Options */}
            <div className="filter-section">
              <h3 className="filter-section-header">Sort By</h3>
              
              {/* Event Name Sort */}
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Event Name</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleFilterChange('eventNameSort', 'asc')}
                    className={`filter-sort-button ${
                      selectedFilters.eventNameSort === 'asc' ? 'selected' : ''
                    }`}
                  >
                    <ChevronUp className="h-4 w-4" /> A-Z
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterChange('eventNameSort', 'desc')}
                    className={`filter-sort-button ${
                      selectedFilters.eventNameSort === 'desc' ? 'selected' : ''
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" /> Z-A
                  </button>
                </div>
              </div>

              {/* Event Date Sort */}
              <div className="space-y-2 mt-4">
                <label className="text-sm text-gray-600">Event Date</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleFilterChange('eventDateSort', 'asc')}
                    className={`filter-sort-button ${
                      selectedFilters.eventDateSort === 'asc' ? 'selected' : ''
                    }`}
                  >
                    <ChevronUp className="h-4 w-4" /> Oldest
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterChange('eventDateSort', 'desc')}
                    className={`filter-sort-button ${
                      selectedFilters.eventDateSort === 'desc' ? 'selected' : ''
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" /> Newest
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Options */}
            <div className="filter-section">
              <h3 className="filter-section-header">Filter By</h3>
              
              {/* Urgency Filter */}
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Urgency</label>
                <div className="flex flex-wrap gap-2">
                  {urgencyOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleFilterChange('urgency', option.value)}
                      className={`filter-option-button ${option.className} ${
                        selectedFilters.urgency.includes(option.value) ? 'selected' : ''
                      }`}
                    >
                      {option.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2 mt-4">
                <label className="text-sm text-gray-600">Status</label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleFilterChange('status', option.value)}
                      className={`filter-option-button ${option.className} ${
                        selectedFilters.status.includes(option.value) ? 'selected' : ''
                      }`}
                    >
                      {option.value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterOptions;