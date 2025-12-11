import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@components/common/Button/Button'
import {
  FaCar, FaArrowLeft, FaSearch, FaFilter, FaCalendarAlt,
  FaMapMarkerAlt, FaUsers, FaCog, FaShieldAlt, FaGasPump,
  FaRoad, FaStar, FaDollarSign
} from 'react-icons/fa'

interface CarSearchForm {
  location: string
  pickupDate: string
  returnDate: string
  pickupTime: string
  returnTime: string
  driverAge: number
}

interface CarType {
  id: string
  name: string
  category: 'economy' | 'compact' | 'suv' | 'luxury' | 'van'
  image: string
  features: string[]
  pricePerDay: number
  passengers: number
  luggage: number
  transmission: 'manual' | 'automatic'
  fuelType: 'petrol' | 'diesel' | 'hybrid'
}

const CarRentalPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchForm, setSearchForm] = useState<CarSearchForm>({
    location: '',
    pickupDate: '',
    returnDate: '',
    pickupTime: '10:00',
    returnTime: '10:00',
    driverAge: 25
  })
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const popularLocations = [
    'Addis Ababa - Bole Airport',
    'Addis Ababa - City Center',
    'Bahir Dar',
    'Gondar',
    'Lalibela',
    'Hawassa',
    'Arba Minch',
    'Axum'
  ]

  const carTypes: CarType[] = [
    {
      id: 'economy',
      name: 'Economy Car',
      category: 'economy',
      image: '/images/cars/economy.jpg',
      features: ['Air Conditioning', 'Radio', 'Manual Transmission'],
      pricePerDay: 35,
      passengers: 4,
      luggage: 2,
      transmission: 'manual',
      fuelType: 'petrol'
    },
    {
      id: 'suv',
      name: '4WD SUV',
      category: 'suv',
      image: '/images/cars/suv.jpg',
      features: ['4WD', 'Air Conditioning', 'GPS', 'Automatic'],
      pricePerDay: 65,
      passengers: 5,
      luggage: 4,
      transmission: 'automatic',
      fuelType: 'diesel'
    },
    {
      id: 'van',
      name: 'Minivan',
      category: 'van',
      image: '/images/cars/van.jpg',
      features: ['8 Seats', 'Air Conditioning', 'GPS', 'Large Storage'],
      pricePerDay: 85,
      passengers: 8,
      luggage: 6,
      transmission: 'manual',
      fuelType: 'diesel'
    }
  ]

  const handleSearch = async () => {
    setIsSearching(true)
    // Simulate API call
    setTimeout(() => {
      setIsSearching(false)
      setShowResults(true)
    }, 2000)
  }

  const handleInputChange = (field: keyof CarSearchForm, value: any) => {
    setSearchForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
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
            <h1 className="text-3xl font-bold text-gray-900">Car Rental</h1>
            <p className="text-gray-600">Rent a car for your Ethiopian adventure</p>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Location */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Location</label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter city or airport"
                  value={searchForm.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Pickup Date & Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Date & Time</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="date"
                    value={searchForm.pickupDate}
                    onChange={(e) => handleInputChange('pickupDate', e.target.value)}
                    className="w-full pl-10 pr-2 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <input
                  type="time"
                  value={searchForm.pickupTime}
                  onChange={(e) => handleInputChange('pickupTime', e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Return Date & Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Return Date & Time</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="date"
                    value={searchForm.returnDate}
                    onChange={(e) => handleInputChange('returnDate', e.target.value)}
                    className="w-full pl-10 pr-2 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <input
                  type="time"
                  value={searchForm.returnTime}
                  onChange={(e) => handleInputChange('returnTime', e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Driver Age and Search */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Driver Age</label>
              <select
                value={searchForm.driverAge}
                onChange={(e) => handleInputChange('driverAge', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {Array.from({ length: 56 }, (_, i) => i + 18).map(age => (
                  <option key={age} value={age}>{age} years old</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2 flex items-end">
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchForm.location || !searchForm.pickupDate || !searchForm.returnDate}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <FaSearch className="mr-2" />
                    Search Cars
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Popular Locations */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Pickup Locations</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {popularLocations.map((location) => (
              <button
                key={location}
                onClick={() => handleInputChange('location', location)}
                className="p-3 text-left border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
              >
                <FaMapMarkerAlt className="text-green-600 mb-1" />
                <div className="text-sm font-medium">{location}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Car Types */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Car Types</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {carTypes.map((car) => (
              <div key={car.id} className="border border-gray-200 rounded-xl p-6 hover:border-green-500 hover:shadow-lg transition-all">
                <div className="text-center mb-4">
                  <FaCar className="text-4xl text-green-600 mx-auto mb-2" />
                  <h3 className="text-xl font-semibold">{car.name}</h3>
                  <p className="text-2xl font-bold text-green-600">${car.pricePerDay}/day</p>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <FaUsers className="mr-2 text-gray-400" />
                      Passengers
                    </span>
                    <span className="font-medium">{car.passengers}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <FaCog className="mr-2 text-gray-400" />
                      Transmission
                    </span>
                    <span className="font-medium capitalize">{car.transmission}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <FaGasPump className="mr-2 text-gray-400" />
                      Fuel Type
                    </span>
                    <span className="font-medium capitalize">{car.fuelType}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Features</h4>
                  <div className="flex flex-wrap gap-1">
                    {car.features.map((feature, index) => (
                      <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Select This Car
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Search Results Placeholder */}
        {showResults && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Available Cars</h2>
              <Button variant="outline">
                <FaFilter className="mr-2" />
                Filters
              </Button>
            </div>
            
            <div className="text-center py-12">
              <FaCar className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Car search results will appear here</h3>
              <p className="text-gray-500">This will be implemented in the next phase with actual car inventory and booking functionality.</p>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-4 gap-6 mt-8">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaShieldAlt className="text-green-600" />
            </div>
            <h3 className="font-semibold mb-1">Full Insurance</h3>
            <p className="text-sm text-gray-600">Comprehensive coverage included</p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaRoad className="text-blue-600" />
            </div>
            <h3 className="font-semibold mb-1">GPS Navigation</h3>
            <p className="text-sm text-gray-600">Free GPS with all rentals</p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaStar className="text-purple-600" />
            </div>
            <h3 className="font-semibold mb-1">24/7 Support</h3>
            <p className="text-sm text-gray-600">Round-the-clock assistance</p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaDollarSign className="text-orange-600" />
            </div>
            <h3 className="font-semibold mb-1">Best Rates</h3>
            <p className="text-sm text-gray-600">Competitive pricing guaranteed</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CarRentalPage