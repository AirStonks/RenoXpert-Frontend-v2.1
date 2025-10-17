# Project Data Schema Documentation

## Overview
This document outlines the comprehensive data schema for the RenoXpert project management system, including the integration of historical data tracking through the ProjectStatusHistory table.

## Core Data Structures

### 1. ProjectStatusHistory Interface
The main interface for tracking historical project data:

```typescript
interface ProjectStatusHistory {
    id?: string;
    reno_progress_id?: string;
    property_id?: string;
    status?: string;
    payment_percentage?: number;
    snapshot_year?: number;
    snapshot_week?: number;
    snapshot_date?: string;
    snapshot_type?: 'weekly' | 'monthly' | 'yearly';
    reno_progress?: RenoProgress;
    property?: Property;
    created_at?: string;
    updated_at?: string;
}
```

### 2. ProjectStatusHistoryFilter Interface
For filtering historical data:

```typescript
interface ProjectStatusHistoryFilter {
    reno_progress_id?: string;
    property_id?: string;
    status?: string;
    snapshot_year?: number;
    snapshot_week?: number;
    snapshot_date_from?: string;
    snapshot_date_to?: string;
    snapshot_type?: 'weekly' | 'monthly' | 'yearly';
}
```

### 3. ProjectStatusHistoryResponse Interface
API response structure:

```typescript
interface ProjectStatusHistoryResponse {
    data: ProjectStatusHistory[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
}
```

## Updated Kanban Data Structures

### 1. Enhanced Project Interface
```typescript
interface Project {
    reno_progress_id: string;
    property: string;
    paymentPercentage: number;
    stage?: string;
    property_id?: string;
    status?: string;
    snapshot_date?: string;
    snapshot_type?: 'weekly' | 'monthly' | 'yearly';
}
```

### 2. Enhanced Week Interface
```typescript
interface Week {
    snapshot_year: number;
    snapshot_week: number;
    label: string;
    date: string;
    data: Project[][];
    snapshot_type?: 'weekly' | 'monthly' | 'yearly';
}
```

### 3. Historical Data Container
```typescript
interface HistoricalData {
    weekly: ProjectStatusHistory[];
    monthly: ProjectStatusHistory[];
    yearly: ProjectStatusHistory[];
}
```

## API Services

### ProjectStatusHistoryApi Service
Located at `src/services/projectStatusHistoryApi.ts`, provides the following functions:

1. **fetchProjectStatusHistory** - Main function for fetching historical data with pagination and filters
2. **fetchProjectStatusHistoryByType** - Fetch data by snapshot type (weekly/monthly/yearly)
3. **fetchProjectStatusHistoryByDateRange** - Fetch data within a date range
4. **fetchProjectStatusHistoryByProperty** - Fetch data for a specific property
5. **fetchProjectStatusHistoryByRenoProgress** - Fetch data for a specific renovation progress

## Data Flow

### 1. Current Week Data Integration
- The system fetches current week data from the RenoProgress table
- Data is converted to kanban format using `convertRenoProgressToKanban()`
- Real-time data is displayed in the "Current Week" row with live updates

### 2. Historical Data Integration
- The system fetches historical data from the ProjectStatusHistory table
- Data is converted to kanban format using `convertHistoricalDataToKanban()`
- Historical data takes precedence over static data when available

### 3. Snapshot Types
- **weekly**: Captures project status on a weekly basis
- **monthly**: Captures project status on a monthly basis  
- **yearly**: Captures project status on a yearly basis

### 4. Data Conversion Process

#### Current Week Data Conversion
```typescript
const convertRenoProgressToKanban = (renoProgressData: RenoProgress[]): Project[][] => {
    // Maps RenoProgress records to kanban stages
    // Uses status field to determine stage placement
    // Returns 2D array of projects organized by stage
}
```

#### Historical Data Conversion
```typescript
const convertHistoricalDataToKanban = (historicalData: ProjectStatusHistory[]): Week[] => {
    // Groups historical records by week
    // Maps project status to kanban stages
    // Sorts by year and week
    // Returns formatted Week objects
}
```

## Database Schema (Backend)

### ProjectStatusHistory Table
```sql
CREATE TABLE ProjectStatusHistory (
    id VARCHAR(255) PRIMARY KEY,
    reno_progress_id VARCHAR(255),
    property_id VARCHAR(255),
    status VARCHAR(255),
    payment_percentage DECIMAL(5,2),
    snapshot_year INT,
    snapshot_week INT,
    snapshot_date DATE,
    snapshot_type ENUM('weekly', 'monthly', 'yearly'),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (reno_progress_id) REFERENCES RenoProgress(id),
    FOREIGN KEY (property_id) REFERENCES Property(id)
);
```

## Usage Examples

### 1. Fetching Weekly Historical Data
```typescript
const weeklyData = await fetchProjectStatusHistoryByType('weekly');
```

### 2. Filtering by Date Range
```typescript
const dateRangeData = await fetchProjectStatusHistoryByDateRange(
    '2024-01-01',
    '2024-12-31',
    'weekly'
);
```

### 3. Getting Property-Specific History
```typescript
const propertyHistory = await fetchProjectStatusHistoryByProperty(
    'property-123',
    'monthly'
);
```

## Project Stages (Kanban Columns)
The project uses these predefined stages with both label and value:

| Label | Value | Description |
|-------|-------|-------------|
| Pre-purchase | pre-purchase | Initial stage |
| Pending-VP | pending-vp | Pending verification/approval |
| Under Defect | under-defect | Defect inspection stage |
| P1 | p1 | Phase 1 renovation |
| P2a | p2a | Phase 2a renovation |
| P2b | p2b | Phase 2b renovation |
| Scheduled Handover | scheduled-handover | Ready for handover |
| Successful Handover | successful-handover | Handover completed |
| Onboarding | onboarding | Owner onboarding |
| Onboarded | onboarded | Fully onboarded |

**Note**: The values are lowercase with hyphens and are used for API communication, while labels are used for display purposes.

### Status Mapping
The system maps RenoProgress status values to kanban stages:
- `pre-purchase` → Stage 0
- `pending-vp` → Stage 1  
- `under-defect` → Stage 2
- `p1` → Stage 3
- `p2a` → Stage 4
- `p2b` → Stage 5
- `scheduled-handover` → Stage 6
- `successful-handover` → Stage 7
- `onboarding` → Stage 8
- `onboarded` → Stage 9

## Integration Points

### 1. PMKanban Component
- Uses historical data to populate kanban board
- Supports filtering by time periods (2-weeks, 3-weeks, month, year)
- Converts historical data to visual kanban format

### 2. Data Persistence
- Historical snapshots are created automatically
- Supports multiple snapshot types for different reporting needs
- Maintains referential integrity with main project data

### 3. Performance Considerations
- Historical data is fetched on-demand
- Supports pagination for large datasets
- Caching can be implemented for frequently accessed data

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live data updates
2. **Advanced Analytics**: Trend analysis and predictive modeling
3. **Export Functionality**: Export historical data to various formats
4. **Custom Time Ranges**: Support for custom date range filtering
5. **Data Visualization**: Charts and graphs for historical trends
