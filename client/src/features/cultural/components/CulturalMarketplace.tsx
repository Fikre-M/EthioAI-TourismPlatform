import React from 'react'
import { FaShoppingCart } from 'react-icons/fa'

interface CulturalMarketplaceProps {
  className?: string
}

export const CulturalMarketplace: React.FC<CulturalMarketplaceProps> = ({
  className = ''
}) => {

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <FaShoppingCart className="mr-3 text-green-600" />
          Cultural Marketplace
        </h2>
      </div>
      
      <div className="p-6">
        <div className="text-center py-12">
          <FaShoppingCart className="mx-auto text-4xl text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Marketplace Coming Soon</h3>
          <p className="text-gray-600">Discover authentic Ethiopian cultural items and crafts.</p>
        </div>
      </div>
    </div>
  )
}