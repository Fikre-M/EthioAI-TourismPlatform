# Production-Ready UI Components

This directory contains a comprehensive set of production-ready UI components designed for scalability, accessibility, and maintainability.

## Features

- ✅ **Accessibility First**: All components follow WCAG 2.1 guidelines
- ✅ **TypeScript Support**: Full type safety with comprehensive interfaces
- ✅ **Loading States**: Built-in loading, error, and empty states
- ✅ **Responsive Design**: Mobile-first responsive components
- ✅ **Dark Mode Support**: Automatic dark mode compatibility
- ✅ **Performance Optimized**: Lazy loading and efficient rendering
- ✅ **Keyboard Navigation**: Full keyboard accessibility
- ✅ **Screen Reader Support**: Proper ARIA labels and roles

## Components

### Core Components

#### Button
Enhanced button component with loading states, variants, and accessibility features.

```tsx
import { Button } from '@/components/ui'

<Button 
  variant="primary" 
  size="md" 
  isLoading={loading}
  loadingText="Saving..."
  leftIcon={<SaveIcon />}
  onClick={handleSave}
>
  Save Changes
</Button>
```

#### Input
Comprehensive input component with validation, icons, and accessibility.

```tsx
import { Input } from '@/components/ui'

<Input
  label="Email Address"
  type="email"
  error={errors.email}
  helperText="We'll never share your email"
  leftIcon={<EmailIcon />}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

#### Card
Flexible card component with multiple variants and hover effects.

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

<Card variant="elevated" hover>
  <CardHeader>
    <CardTitle>Tour Package</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Explore the beautiful landscapes...</p>
  </CardContent>
</Card>
```

### State Components

#### LoadingState
Consistent loading indicators for different contexts.

```tsx
import { LoadingState } from '@/components/ui'

<LoadingState 
  text="Loading tours..." 
  size="lg" 
/>
```

#### ErrorState
User-friendly error displays with retry functionality.

```tsx
import { ErrorState } from '@/components/ui'

<ErrorState
  title="Failed to load data"
  description="Please check your connection and try again"
  error={error}
  onRetry={handleRetry}
  showDetails={isDevelopment}
/>
```

#### EmptyState
Engaging empty states with call-to-action buttons.

```tsx
import { EmptyState } from '@/components/ui'

<EmptyState
  title="No tours found"
  description="Start exploring our amazing destinations"
  action={<Button onClick={handleBrowse}>Browse Tours</Button>}
/>
```

### Feedback Components

#### Alert
Contextual alerts for different message types.

```tsx
import { Alert } from '@/components/ui'

<Alert 
  variant="success" 
  title="Booking Confirmed"
  description="Your tour has been successfully booked"
  closable
  onClose={handleClose}
/>
```

#### Toast
Non-intrusive notifications with auto-dismiss.

```tsx
import { useToast } from '@/hooks/useToast'

const { success, error, info } = useToast()

// Usage
success('Tour booked successfully!')
error('Failed to process payment')
info('New features available')
```

#### Badge
Status indicators and labels.

```tsx
import { Badge } from '@/components/ui'

<Badge variant="success" size="sm">
  Available
</Badge>
```

### Layout Components

#### Dialog
Accessible modal dialogs with focus management.

```tsx
import { Dialog } from '@/components/ui'

<Dialog
  isOpen={showDialog}
  onClose={handleClose}
  title="Confirm Deletion"
  description="This action cannot be undone"
>
  <div className="flex justify-end gap-3">
    <Button variant="outline" onClick={handleClose}>Cancel</Button>
    <Button variant="error" onClick={handleDelete}>Delete</Button>
  </div>
</Dialog>
```

#### Tooltip
Contextual help and information.

```tsx
import { Tooltip } from '@/components/ui'

<Tooltip content="This field is required" position="top">
  <Button>Hover me</Button>
</Tooltip>
```

### Data Components

#### DataList
Comprehensive list component with all states handled.

```tsx
import { DataList } from '@/components/common'

<DataList
  data={tours}
  loading={loading}
  error={error}
  onRetry={refetch}
  keyExtractor={(tour) => tour.id}
  renderItem={(tour) => <TourCard tour={tour} />}
  emptyTitle="No tours available"
  emptyAction={<Button>Add Tour</Button>}
/>
```

#### Skeleton
Loading placeholders for better perceived performance.

```tsx
import { Skeleton, SkeletonText, SkeletonCard } from '@/components/ui'

<SkeletonCard />
<SkeletonText lines={3} />
<Skeleton variant="circular" width={40} height={40} />
```

## Hooks

### useAsync
Handle async operations with loading and error states.

```tsx
import { useAsync } from '@/hooks/useAsync'

const { data, loading, error, execute } = useAsync(
  () => fetchTours(),
  { immediate: true }
)
```

### useQuery
Advanced data fetching with caching and background updates.

```tsx
import { useQuery } from '@/hooks/useQuery'

const { data, loading, error, refetch } = useQuery(
  'tours',
  () => api.getTours(),
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true
  }
)
```

### useToast
Toast notification management.

```tsx
import { useToast } from '@/hooks/useToast'

const { toast, success, error, warning, info } = useToast()
```

## Utilities

### Accessibility
Comprehensive accessibility utilities for better user experience.

```tsx
import { 
  FocusTrap, 
  announceToScreenReader, 
  prefersReducedMotion 
} from '@/utils/accessibility'

// Focus management
const focusTrap = new FocusTrap(dialogElement)
focusTrap.activate()

// Screen reader announcements
announceToScreenReader('Form submitted successfully', 'polite')

// Respect user preferences
if (!prefersReducedMotion()) {
  // Add animations
}
```

### Performance
Performance optimization utilities.

```tsx
import { 
  debounce, 
  throttle, 
  LazyLoader,
  PerformanceTimer 
} from '@/utils/performance'

// Debounced search
const debouncedSearch = debounce(handleSearch, 300)

// Lazy loading
const lazyLoader = new LazyLoader()
lazyLoader.observe(element, () => loadContent())

// Performance monitoring
const timer = new PerformanceTimer()
timer.mark('start')
// ... operations
timer.measure('operation-time', 'start')
```

### Form Management
Advanced form handling with validation.

```tsx
import { FormManager, validators, composeValidators } from '@/utils/form'

const form = new FormManager({ email: '', password: '' })

form.setValidator('email', composeValidators(
  validators.required,
  validators.email
))

form.setValidator('password', composeValidators(
  validators.required,
  validators.minLength(8)
))
```

## Best Practices

### Component Usage

1. **Always provide meaningful labels and descriptions**
2. **Use appropriate ARIA attributes**
3. **Handle loading and error states consistently**
4. **Provide keyboard navigation support**
5. **Test with screen readers**

### Performance

1. **Use lazy loading for large lists**
2. **Implement proper memoization**
3. **Optimize bundle size with tree shaking**
4. **Monitor Core Web Vitals**

### Accessibility

1. **Maintain proper heading hierarchy**
2. **Ensure sufficient color contrast**
3. **Provide alternative text for images**
4. **Support keyboard-only navigation**
5. **Test with assistive technologies**

## Examples

See `src/components/examples/ProductionReadyExample.tsx` for comprehensive usage examples of all components and patterns.

## Contributing

When adding new components:

1. Follow the established patterns and interfaces
2. Include comprehensive TypeScript types
3. Add proper accessibility attributes
4. Handle all states (loading, error, empty)
5. Write tests for critical functionality
6. Update this documentation