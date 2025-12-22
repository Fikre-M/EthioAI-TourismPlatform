import { useState } from 'react'
import { 
  Button, 
  Card, 
  Input, 
  Alert, 
  Badge, 
  Dialog,
  LoadingState,
  ErrorState,
  EmptyState
} from '@/components/ui'
import { DataList } from '@/components/common/DataList'
import { PageLayout } from '@/components/layout/PageLayout'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/hooks/useToast'

// Mock data and API functions
const mockTours = [
  { id: 1, name: 'Lalibela Churches', price: 150, status: 'available' },
  { id: 2, name: 'Simien Mountains', price: 200, status: 'booked' },
  { id: 3, name: 'Danakil Depression', price: 300, status: 'available' },
]

const mockApiCall = (delay = 1000, shouldFail = false): Promise<typeof mockTours> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error('Failed to fetch tours'))
      } else {
        resolve(mockTours)
      }
    }, delay)
  })
}

export const ProductionReadyExample = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [simulateError, setSimulateError] = useState(false)
  const { success, error, info } = useToast()

  const {
    data: tours,
    loading,
    error: apiError,
    execute: refetchTours
  } = useAsync(() => mockApiCall(1500, simulateError), { immediate: true })

  const handleBookTour = (tourId: number) => {
    success(`Tour ${tourId} booked successfully!`)
  }

  const handleDeleteTour = (tourId: number) => {
    error(`Failed to delete tour ${tourId}`)
  }

  const handleShowInfo = () => {
    info('This is an informational message')
  }

  const filteredTours = tours?.filter(tour => 
    tour.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <PageLayout
      title="Production-Ready UI Components"
      description="Comprehensive example showcasing all UI states and components"
      maxWidth="2xl"
    >
      <div className="space-y-8">
        {/* Controls Section */}
        <Card>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Controls</h2>
            
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => setShowDialog(true)}>
                Open Dialog
              </Button>
              
              <Button 
                variant="secondary" 
                onClick={() => setSimulateError(!simulateError)}
              >
                Toggle Error Simulation: {simulateError ? 'ON' : 'OFF'}
              </Button>
              
              <Button variant="success" onClick={handleShowInfo}>
                Show Info Toast
              </Button>
              
              <Button variant="outline" onClick={refetchTours}>
                Refetch Data
              </Button>
            </div>

            <Input
              label="Search Tours"
              placeholder="Type to search..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              leftIcon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
        </Card>

        {/* Alerts Section */}
        <div className="space-y-4">
          <Alert variant="info" title="Information" description="This is an informational alert." />
          <Alert variant="success" title="Success" description="Operation completed successfully!" />
          <Alert variant="warning" title="Warning" description="Please review your settings." />
          <Alert variant="error" title="Error" description="Something went wrong." closable onClose={() => {}} />
        </div>

        {/* Data List Section */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Tours List</h2>
          
          <DataList
            data={filteredTours}
            loading={loading}
            error={apiError}
            onRetry={refetchTours}
            keyExtractor={(tour: any) => tour.id.toString()}
            emptyTitle="No tours found"
            emptyDescription={searchTerm ? `No tours match "${searchTerm}"` : "No tours available at the moment."}
            emptyAction={
              <Button onClick={() => setSearchTerm('')}>
                Clear Search
              </Button>
            }
            renderItem={(tour: any) => (
              <Card hover className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{tour.name}</h3>
                    <p className="text-gray-600">${tour.price}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={tour.status === 'available' ? 'success' : 'warning'}
                    >
                      {tour.status}
                    </Badge>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleBookTour(tour.id)}
                        disabled={tour.status !== 'available'}
                      >
                        Book
                      </Button>
                      <Button 
                        size="sm" 
                        variant="error" 
                        onClick={() => handleDeleteTour(tour.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          />
        </Card>

        {/* Loading States Examples */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Loading States</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded p-4">
              <h3 className="font-medium mb-2">Small Loading</h3>
              <LoadingState size="sm" text="Loading..." />
            </div>
            <div className="border rounded p-4">
              <h3 className="font-medium mb-2">Medium Loading</h3>
              <LoadingState size="md" text="Processing..." />
            </div>
            <div className="border rounded p-4">
              <h3 className="font-medium mb-2">Large Loading</h3>
              <LoadingState size="lg" text="Please wait..." />
            </div>
          </div>
        </Card>

        {/* Error and Empty States */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-xl font-semibold mb-4">Error State</h2>
            <ErrorState
              title="Connection Failed"
              description="Unable to connect to the server. Please check your internet connection."
              onRetry={() => alert('Retrying...')}
              showDetails={true}
              error={new Error('Network timeout after 30 seconds')}
            />
          </Card>

          <Card>
            <h2 className="text-xl font-semibold mb-4">Empty State</h2>
            <EmptyState
              title="No bookings yet"
              description="You haven't made any bookings. Start exploring our tours!"
              action={
                <Button variant="primary">
                  Browse Tours
                </Button>
              }
            />
          </Card>
        </div>

        {/* Dialog Example */}
        <Dialog
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          title="Confirm Action"
          description="Are you sure you want to proceed with this action?"
        >
          <div className="space-y-4">
            <p>This action cannot be undone. Please confirm that you want to continue.</p>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="error" 
                onClick={() => {
                  setShowDialog(false)
                  success('Action completed!')
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    </PageLayout>
  )
}