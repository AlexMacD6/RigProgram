# ADR-001: Consolidated Documents View

## Status
Accepted

## Context
The original application architecture included separate page routes for:
- Equipment-specific documents (`/equipment/[id]`)  
- Operations-specific documents (`/operations/[id]`)
- Category-specific documents (`/category/[category]`)

This approach led to code duplication, inconsistent filtering capabilities across different views, and a fragmented user experience.

## Decision
We will consolidate all document viewing and filtering capabilities into a single unified documents page (`/documents`) with advanced filtering capabilities, and remove the separate routes.

The documents page will:
- Support filtering by categories, equipment tags, operations tags, and text search
- Use URL parameters to allow direct linking to filtered views (e.g., `/documents?category=Procedures&equipment=rig`)
- Replace the separate navigation links with links to appropriately filtered views of the documents page
- Utilize tooltips to display detailed equipment and operations information

## Consequences

### Positive
- Reduced code duplication and maintenance burden
- Consistent user experience for viewing and filtering documents
- Simpler URL structure and routing
- Easier to enhance filtering capabilities in one place
- Better performance from not loading multiple similar page components

### Negative
- Migration effort to update existing bookmarks or links to the old routes
- Potential for a more complex UI if many filter options are displayed at once

## Implementation
1. Enhance the `/documents` page with comprehensive filtering capabilities
2. Update the Layout component navigation to link to the unified documents page with appropriate URL parameters
3. Remove the separate `/equipment/[id]`, `/operations/[id]`, and `/category/[category]` pages and routes 