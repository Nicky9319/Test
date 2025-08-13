# DonnaAI Desktop App - Frontend Structure

## Project Organization

This project follows a feature-based folder structure for better maintainability and scalability.

### Directory Structure

```
src/renderer/
├── components/           # Reusable UI components
│   ├── common/          # Common components (Sidebar, etc.)
│   ├── tasks/           # Task-related components
│   ├── chat/            # Chat-related components
│   └── settings/        # Settings-related components
├── features/            # Feature-based pages
│   ├── home/            # Home page feature
│   ├── tasks/           # Tasks management feature
│   └── chat/            # Chat/threads feature
├── utils/               # Utility functions and constants
├── assets/              # Static assets
└── Views/               # Main view components
```

## Color Palette

The application uses a consistent color palette defined in `utils/colors.js`:

### Primary Colors
- **Background**: `#0D1B2A` - Dark neutral background
- **Primary**: `#3A86FF` - Action buttons
- **Primary Hover**: `#265DF2` - Button hover state
- **Accent**: `#00D09C` - Success/projection blocks
- **Warning**: `#FDCB6E` - Warning/alert states

### Text Colors
- **Primary Text**: `#FFFFFF` - High contrast text
- **Secondary Text**: `#E0E0E0` - Body text
- **Muted Text**: `#9CA3AF` - Less important text

### Status Colors
- **Active**: `#00D09C` (Green)
- **Halted**: `#FDCB6E` (Yellow)
- **User Stopped**: `#FF6B6B` (Red)

## Components

### Common Components
- `Sidebar` - Main navigation sidebar
- `SidebarItem` - Individual sidebar navigation item

### Task Components
- `TaskCard` - Displays task information with status

### Chat Components
- `ChatMessage` - Individual chat message bubble
- `ChatThread` - Complete chat thread interface

### Settings Components
- `EnvVarsEditor` - Environment variables editor

## Features

### Home Page
- Hero section with welcome message
- Environment variables configuration
- Quick stats dashboard

### Active Tasks
- Task list with status indicators
- Task filtering options
- Task action buttons

### Task Threads
- Thread selection interface
- Chat message display
- Thread management

## Usage

### Importing Components
```javascript
// Import individual components
import { Sidebar, TaskCard, ChatMessage } from '../components';

// Import feature pages
import { HomePage, ActiveTasksPage } from '../features';
```

### Using Colors
```javascript
import { colors, getStatusConfig } from '../utils/colors';

// Use predefined colors
const backgroundColor = colors.background;

// Get status configuration
const statusConfig = getStatusConfig('active');
```

## Development Guidelines

1. **Component Structure**: Each component should be self-contained with its own folder
2. **Color Usage**: Always use colors from the `colors.js` utility
3. **Props**: Use TypeScript-like prop documentation in comments
4. **Styling**: Use Tailwind CSS with custom color classes
5. **State Management**: Keep state as close to where it's used as possible

## Adding New Features

1. Create a new folder in `features/`
2. Create the main page component
3. Add any new components to `components/`
4. Update the main navigation if needed
5. Add any new utilities to `utils/`
