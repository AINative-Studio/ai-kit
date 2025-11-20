# UsageDashboard Component

A comprehensive, pre-built React component for displaying AI usage statistics and analytics from the UsageTracker.

## Features

- **Real-time Usage Statistics**: Display up-to-date metrics including total requests, costs, tokens, and duration
- **Cost Breakdown**: Visualize costs by model and over time
- **Token Usage Visualization**: Track prompt and completion tokens across models
- **Request Count Metrics**: Monitor successful and failed requests
- **Time-series Charts**: View daily/weekly/monthly trends
- **Export Functionality**: Export data in CSV, JSON, or JSONL formats
- **Advanced Filtering**: Filter by date range, model, provider, user, and status
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Theme Support**: Light and dark theme variants
- **Accessibility**: Full keyboard navigation and ARIA labels

## Installation

The UsageDashboard component is included in the `@ainative/ai-kit` package:

```bash
npm install @ainative/ai-kit
```

## Basic Usage

```tsx
import { UsageDashboard } from '@ainative/ai-kit/react';
import { UsageTracker } from '@ainative/ai-kit-core';

function MyApp() {
  const [records, setRecords] = useState([]);
  const tracker = new UsageTracker();

  useEffect(() => {
    // Fetch usage records
    tracker.getRecords().then(setRecords);
  }, []);

  return (
    <UsageDashboard
      records={records}
      onExport={async (format, filter) => {
        return await tracker.export(format, filter);
      }}
    />
  );
}
```

## Advanced Usage

### With Full Features

```tsx
import { UsageDashboard } from '@ainative/ai-kit/react';
import { UsageTracker } from '@ainative/ai-kit-core';

function AnalyticsDashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tracker = new UsageTracker();

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await tracker.getRecords();
      setRecords(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleExport = async (format, filter) => {
    return await tracker.export(format, filter);
  };

  const handleFilterChange = (filter) => {
    console.log('Filter changed:', filter);
  };

  return (
    <UsageDashboard
      records={records}
      loading={loading}
      error={error}
      onExport={handleExport}
      onRefresh={loadRecords}
      onFilterChange={handleFilterChange}
      enableFiltering={true}
      enableExport={true}
      enableCharts={true}
      showCostBreakdown={true}
      showTokenUsage={true}
      showRequestMetrics={true}
      theme="light"
      defaultDateRange="week"
    />
  );
}
```

### With Custom Styling

```tsx
import { UsageDashboard } from '@ainative/ai-kit/react';

function StyledDashboard({ records }) {
  return (
    <UsageDashboard
      records={records}
      className="my-custom-dashboard"
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
      theme="dark"
    />
  );
}
```

### Minimal Configuration

```tsx
import { UsageDashboard } from '@ainative/ai-kit/react';

function MinimalDashboard({ records }) {
  return (
    <UsageDashboard
      records={records}
      enableFiltering={false}
      enableExport={false}
      enableCharts={false}
    />
  );
}
```

## Props

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `records` | `UsageRecord[]` | Array of usage records to display |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `aggregatedData` | `AggregatedUsage` | `undefined` | Pre-calculated aggregated statistics (calculated automatically if not provided) |
| `onExport` | `(format: ExportFormat, filter?: UsageFilter) => Promise<string>` | `undefined` | Callback to export data |
| `enableFiltering` | `boolean` | `true` | Enable filtering controls |
| `enableExport` | `boolean` | `true` | Enable export functionality |
| `enableCharts` | `boolean` | `true` | Enable time series charts |
| `showCostBreakdown` | `boolean` | `true` | Show cost breakdown charts |
| `showTokenUsage` | `boolean` | `true` | Show token usage charts |
| `showRequestMetrics` | `boolean` | `true` | Show request metrics |
| `theme` | `'light' \| 'dark'` | `'light'` | Theme variant |
| `className` | `string` | `''` | Custom CSS class name |
| `style` | `React.CSSProperties` | `undefined` | Custom inline styles |
| `loading` | `boolean` | `false` | Loading state |
| `error` | `string` | `undefined` | Error message |
| `testId` | `string` | `'usage-dashboard'` | Test ID for testing |
| `onFilterChange` | `(filter: UsageFilter) => void` | `undefined` | Callback when filter changes |
| `defaultDateRange` | `DateRangePreset` | `'week'` | Initial date range preset |
| `onRefresh` | `() => void` | `undefined` | Refresh callback |

## Filtering

The dashboard supports multiple filter dimensions:

### Date Range Presets

- `'today'`: Show today's data
- `'week'`: Last 7 days
- `'month'`: Last 30 days
- `'all'`: All time
- `'custom'`: Custom date range

### Filter Options

```tsx
interface UsageFilter {
  userId?: string;
  conversationId?: string;
  provider?: 'openai' | 'anthropic' | 'unknown';
  model?: string;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
}
```

### Example: Custom Filtering

```tsx
function FilteredDashboard({ records }) {
  const [filter, setFilter] = useState({
    provider: 'openai',
    success: true,
  });

  return (
    <UsageDashboard
      records={records}
      onFilterChange={setFilter}
    />
  );
}
```

## Export Functionality

The dashboard supports exporting usage data in multiple formats:

### Supported Formats

- `'json'`: JSON format
- `'csv'`: CSV format for spreadsheets
- `'jsonl'`: JSON Lines format (one record per line)

### Example: Export Implementation

```tsx
function DashboardWithExport({ records }) {
  const tracker = new UsageTracker();

  const handleExport = async (format, filter) => {
    try {
      const exportData = await tracker.export(format, filter);

      // Optional: Add custom processing
      console.log(`Exported ${records.length} records in ${format} format`);

      return exportData;
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  };

  return (
    <UsageDashboard
      records={records}
      onExport={handleExport}
    />
  );
}
```

## Charts and Visualizations

The dashboard includes several built-in charts:

### 1. Cost Over Time (Line Chart)

Shows cost trends over time, grouped by date.

```tsx
<UsageDashboard
  records={records}
  showCostBreakdown={true}
  enableCharts={true}
/>
```

### 2. Requests by Model (Bar Chart)

Displays request counts for each model, color-coded by provider.

```tsx
<UsageDashboard
  records={records}
  enableCharts={true}
/>
```

### 3. Token Usage by Model (Bar Chart)

Shows token consumption across different models.

```tsx
<UsageDashboard
  records={records}
  showTokenUsage={true}
  enableCharts={true}
/>
```

## Metrics Display

The dashboard shows four key metrics by default:

1. **Total Requests**: Total number of API requests with success count
2. **Total Cost**: Total spending with average cost per request
3. **Total Tokens**: Combined prompt and completion tokens
4. **Average Duration**: Mean request duration with failure count

### Example: Custom Metrics

You can hide metrics using props:

```tsx
<UsageDashboard
  records={records}
  showRequestMetrics={false}
/>
```

## Theming

The dashboard supports light and dark themes:

### Light Theme (Default)

```tsx
<UsageDashboard records={records} theme="light" />
```

### Dark Theme

```tsx
<UsageDashboard records={records} theme="dark" />
```

### Custom Theme via CSS

```css
.my-custom-dashboard {
  --primary-color: #4f46e5;
  --background-color: #ffffff;
  --text-color: #111827;
  --border-color: #e5e7eb;
}

.my-custom-dashboard.usage-dashboard-dark {
  --background-color: #1f2937;
  --text-color: #f9fafb;
  --border-color: #4b5563;
}
```

```tsx
<UsageDashboard
  records={records}
  className="my-custom-dashboard"
/>
```

## Responsive Design

The dashboard automatically adapts to different screen sizes:

- **Mobile** (< 768px): Single column layout, stacked filters
- **Tablet** (768px - 1024px): Two-column metrics grid
- **Desktop** (> 1024px): Full multi-column layout

No additional configuration needed - it just works!

## Accessibility

The UsageDashboard follows accessibility best practices:

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **ARIA Labels**: Proper labeling for screen readers
- **Role Attributes**: Semantic HTML and ARIA roles
- **Error Announcements**: Errors are announced via `role="alert"`
- **Focus Management**: Logical tab order and visible focus indicators

### Example: Screen Reader Support

```tsx
<UsageDashboard
  records={records}
  testId="analytics-dashboard"
  aria-label="Usage analytics dashboard"
/>
```

## Integration with UsageTracker

The UsageDashboard works seamlessly with the UsageTracker from `@ainative/ai-kit-core`:

```tsx
import { UsageTracker } from '@ainative/ai-kit-core';
import { UsageDashboard } from '@ainative/ai-kit/react';

// Initialize tracker
const tracker = new UsageTracker({
  enabled: true,
  storage: 'memory',
});

// Track usage
await tracker.trackSuccess({
  model: 'gpt-4',
  promptTokens: 100,
  completionTokens: 50,
  durationMs: 1000,
});

// Display in dashboard
function App() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    tracker.getRecords().then(setRecords);
  }, []);

  return (
    <UsageDashboard
      records={records}
      onExport={(format, filter) => tracker.export(format, filter)}
      onRefresh={() => tracker.getRecords().then(setRecords)}
    />
  );
}
```

## Real-time Updates

For real-time updates, you can poll the tracker or use a custom update mechanism:

```tsx
function LiveDashboard() {
  const [records, setRecords] = useState([]);
  const tracker = new UsageTracker();

  useEffect(() => {
    // Initial load
    tracker.getRecords().then(setRecords);

    // Poll every 5 seconds
    const interval = setInterval(() => {
      tracker.getRecords().then(setRecords);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <UsageDashboard
      records={records}
      onRefresh={() => tracker.getRecords().then(setRecords)}
    />
  );
}
```

## Performance Optimization

For large datasets, consider these optimization strategies:

### 1. Pagination

```tsx
function PaginatedDashboard() {
  const [page, setPage] = useState(1);
  const pageSize = 100;

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return allRecords.slice(start, start + pageSize);
  }, [allRecords, page]);

  return (
    <UsageDashboard records={paginatedRecords} />
  );
}
```

### 2. Memoization

```tsx
function OptimizedDashboard({ records }) {
  const aggregatedData = useMemo(() => {
    // Pre-calculate aggregated data
    return calculateAggregatedUsage(records);
  }, [records]);

  return (
    <UsageDashboard
      records={records}
      aggregatedData={aggregatedData}
    />
  );
}
```

### 3. Lazy Loading

```tsx
function LazyDashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadMoreRecords = useCallback(async () => {
    setLoading(true);
    const newRecords = await fetchMoreRecords();
    setRecords(prev => [...prev, ...newRecords]);
    setLoading(false);
  }, []);

  return (
    <UsageDashboard
      records={records}
      loading={loading}
      onRefresh={loadMoreRecords}
    />
  );
}
```

## Testing

The UsageDashboard is fully tested and includes test utilities:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UsageDashboard } from '@ainative/ai-kit/react';

describe('UsageDashboard', () => {
  it('should render usage data', () => {
    const records = [
      // ... mock records
    ];

    render(<UsageDashboard records={records} />);

    expect(screen.getByTestId('usage-dashboard')).toBeInTheDocument();
  });

  it('should handle export', async () => {
    const onExport = vi.fn().mockResolvedValue('{"data": "test"}');
    render(<UsageDashboard records={records} onExport={onExport} />);

    const exportButton = screen.getByTestId('usage-dashboard-export-button');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(onExport).toHaveBeenCalled();
    });
  });
});
```

## Error Handling

The dashboard handles errors gracefully:

```tsx
function RobustDashboard() {
  const [error, setError] = useState(null);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetchRecords()
      .then(setRecords)
      .catch(err => setError(err.message));
  }, []);

  return (
    <UsageDashboard
      records={records}
      error={error}
      onRefresh={() => {
        setError(null);
        fetchRecords().then(setRecords).catch(err => setError(err.message));
      }}
    />
  );
}
```

## Common Use Cases

### 1. Admin Dashboard

```tsx
function AdminDashboard() {
  const [records, setRecords] = useState([]);
  const tracker = new UsageTracker();

  return (
    <div className="admin-panel">
      <h1>AI Usage Analytics</h1>
      <UsageDashboard
        records={records}
        enableFiltering={true}
        enableExport={true}
        enableCharts={true}
        theme="light"
        onExport={(format, filter) => tracker.export(format, filter)}
      />
    </div>
  );
}
```

### 2. User Personal Dashboard

```tsx
function UserDashboard({ userId }) {
  const [records, setRecords] = useState([]);
  const tracker = new UsageTracker();

  useEffect(() => {
    tracker.getRecords({ userId }).then(setRecords);
  }, [userId]);

  return (
    <UsageDashboard
      records={records}
      enableFiltering={false}
      enableExport={true}
      showCostBreakdown={true}
    />
  );
}
```

### 3. Embedded Analytics

```tsx
function EmbeddedAnalytics({ conversationId }) {
  const [records, setRecords] = useState([]);

  return (
    <div className="conversation-analytics">
      <UsageDashboard
        records={records}
        enableFiltering={false}
        enableExport={false}
        enableCharts={true}
        showRequestMetrics={false}
        className="compact-dashboard"
        style={{ maxHeight: '400px', overflow: 'auto' }}
      />
    </div>
  );
}
```

## API Reference

### UsageDashboard

The main dashboard component.

#### Props

See [Props](#props) section above for detailed prop documentation.

#### Types

```typescript
export interface UsageDashboardProps {
  records: UsageRecord[];
  aggregatedData?: AggregatedUsage;
  onExport?: (format: ExportFormat, filter?: UsageFilter) => Promise<string>;
  enableFiltering?: boolean;
  enableExport?: boolean;
  enableCharts?: boolean;
  showCostBreakdown?: boolean;
  showTokenUsage?: boolean;
  showRequestMetrics?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
  style?: React.CSSProperties;
  loading?: boolean;
  error?: string;
  testId?: string;
  onFilterChange?: (filter: UsageFilter) => void;
  defaultDateRange?: DateRangePreset;
  onRefresh?: () => void;
}

export type DateRangePreset = 'today' | 'week' | 'month' | 'all' | 'custom';
export type TimeSeriesGranularity = 'daily' | 'weekly' | 'monthly';
```

## Browser Support

The UsageDashboard supports all modern browsers:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## Best Practices

1. **Always provide records**: The `records` prop is required
2. **Use aggregatedData for performance**: Pre-calculate for large datasets
3. **Handle errors**: Provide user-friendly error messages
4. **Implement refresh**: Let users manually update data
5. **Enable filtering**: Help users find relevant data
6. **Test thoroughly**: Use the provided test utilities
7. **Optimize for mobile**: Test on various screen sizes
8. **Use semantic HTML**: Maintain accessibility standards

## Troubleshooting

### Dashboard not rendering

- Ensure `records` prop is an array
- Check for console errors
- Verify all dependencies are installed

### Charts not showing

- Set `enableCharts={true}`
- Ensure records have valid date fields
- Check that records array is not empty

### Export not working

- Provide `onExport` callback
- Set `enableExport={true}`
- Ensure export function returns a string

### Filters not updating

- Provide `onFilterChange` callback
- Check filter state management
- Verify date ranges are valid

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: https://github.com/AINative-Studio/ai-kit/issues
- Documentation: https://docs.ainative.studio/ai-kit
