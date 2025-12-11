import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@components/common/Button/Button'
import {
  FaPlane, FaArrowLeft, FaSearch, FaFilter, FaCalendarAlt,
  FaUsers, FaMapMarkerAlt, FaClock, FaDollarSign,
  FaStar, FaWifi
} from 'react-icons/fa'

interface FlightSearchForm {
  from: string
  to: string
  departDate: string
  returnDate?: string
  passengers: number
  tripType: 'oneWay' | 'roundTrip'
  class: 'economy' | 'business' | 'first'
}

const FlightsPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchForm, setSearchForm] = useState<FlightSearchForm>({
    from: '',
    to: '',
    departDate: '',
    returnDate: '',
    passengers: 1,
    tripType: 'roundTrip',
    class: 'economy'
  })
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const popularDestinations = [
    { code: 'ADD', city: 'Addis Ababa', country: 'Ethiopia' },
    { code: 'LLI', city: 'Lalibela', country: 'Ethiopia' },
    { code: 'BJR', city: 'Bahir Dar', country: 'Ethiopia' },
    { code: 'AXU', city: 'Axum', country: 'Ethiopia' },
    { code: 'DIR', city: 'Dire Dawa', country: 'Ethiopia' },
    { code: 'JIJ', city: 'Jijiga', country: 'Ethiopia' }
  ]

  const handleSearch = async () => {
    setIsSearching(true)
    // Simulate API call
    setTimeout(() => {
      setIsSearching(false)
      setShowResults(true)
    }, 2000)
  }

  const handleInputChange = (field: keyof FlightSearchForm, value: any) => {
    setSearchForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            onClick={() => navigate('/transport')}
            variant="outline"
            className="mr-4"
          >
            <FaArrowLeft className="mr-2" />
            Back to Transport
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Flight Search</h1>
            <p className="text-gray-600">Find the best flights for your Ethiopian journey</p>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          {/* Trip Type Selection */}
          <div className="flex gap-4 mb-6">
            <label className="flex items-center">
              <input
                type="radio"
                name="tripType"
                value="roundTrip"
                checked={searchForm.tripType === 'roundTrip'}
                onChange={(e) => handleInputChange('tripType', e.target.value)}
                className="mr-2"
              />
              Round Trip
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="tripType"
                value="oneWay"
                checked={searchForm.tripType === 'oneWay'}
                onChange={(e) => handleInputChange('tripType', e.target.value)}
                className="mr-2"
              />
              One Way
            </label>
          </div>

          {/* Search Fields */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* From */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Departure city"
                  value={searchForm.from}
                  onChange={(e) => handleInputChange('from', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* To */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Destination city"
                  value={searchForm.to}
                  onChange={(e) => handleInputChange('to', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Departure Date */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Departure</label>
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="date"
                  value={searchForm.departDate}
                  onChange={(e) => handleInputChange('departDate', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Return Date */}
            {searchForm.tripType === 'roundTrip' && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Return</label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="date"
                    value={searchForm.returnDate}
                    onChange={(e) => handleInputChange('returnDate', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Additional Options */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {/* Passengers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Passengers</label>
              <div className="relative">
                <FaUsers className="absolute left-3 top-3 text-gray-400" />
                <select
                  value={searchForm.passengers}
                  onChange={(e) => handleInputChange('passengers', parseInt(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Class */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
              <select
                value={searchForm.class}
                onChange={(e) => handleInputChange('class', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="economy">Economy</option>
                <option value="business">Business</option>
                <option value="first">First Class</option>
              </select>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchForm.from || !searchForm.to || !searchForm.departDate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <FaSearch className="mr-2" />
                    Search Flights
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Popular Destinations */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Destinations in Ethiopia</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {popularDestinations.map((dest) => (
              <button
                key={dest.code}
                onClick={() => {
                  if (!searchForm.from) {
                    handleInputChange('from', `${dest.city} (${dest.code})`)
                  } else {
                    handleInputChange('to', `${dest.city} (${dest.code})`)
                  }
                }}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
              >
                <FaPlane className="text-blue-600 mx-auto mb-2" />
                <div className="font-semibold text-sm">{dest.city}</div>
                <div className="text-xs text-gray-500">{dest.code}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Search Results Placeholder */}
        {showResults && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Flight Results</h2>
              <Button variant="outline">
                <FaFilter className="mr-2" />
                Filters
              </Button>
            </div>
            
            <div className="text-center py-12">
              <FaPlane className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Flight search results will appear here</h3>
              <p className="text-gray-500">This will be implemented in the next phase with actual flight data and booking functionality.</p>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-4 gap-6 mt-8">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaDollarSign className="text-blue-600" />
            </div>
            <h3 className="font-semibold mb-1">Best Prices</h3>
            <p className="text-sm text-gray-600">Compare prices from multiple airlines</p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaClock className="text-green-600" />
            </div>
            <h3 className="font-semibold mb-1">Flexible Dates</h3>
            <p className="text-sm text-gray-600">Find cheaper flights on nearby dates</p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaStar className="text-purple-600" />
            </div>
            <h3 className="font-semibold mb-1">Top Airlines</h3>
            <p className="text-sm text-gray-600">Ethiopian Airlines and partners</p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaWifi className="text-orange-600" />
            </div>
            <h3 className="font-semibold mb-1">Modern Fleet</h3>
            <p className="text-sm text-gray-600">WiFi, entertainment, and comfort</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FlightsPage