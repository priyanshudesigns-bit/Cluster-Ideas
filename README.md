# Screenshot Organizer

A mobile-friendly web application that helps you organize screenshots into groups with AI-powered categorization and Figma export capabilities.

## Features

### Core Functionality
- **Group Management**: Create and organize multiple groups for different screenshot collections
- **Image Upload**: Upload multiple screenshots from your device or local storage
- **AI Categorization**: Automatically categorizes images into design categories:
  - Typography
  - UI Design
  - App Design
  - Visual Design
  - Illustration
  - Graphic Design
  - Motion Design
  - Branding
  - Icon Design
  - Web Design
  - Mobile Design
  - Dashboard Design
  - Landing Page
  - Color Palette
  - Layout
  - Photography
  - Other

### Smart Features
- **Category Filtering**: Filter images by category to quickly find what you need
- **Figma Export**: Export your organized screenshots to Figma in one click
- **Mobile-First Design**: Fully responsive interface optimized for mobile and desktop

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **AI**: OpenAI GPT-4 Vision (via Edge Function)
- **Icons**: Lucide React

## Project Structure

```
src/
├── components/
│   ├── CategoryFilter.tsx    # Category filtering component
│   ├── CreateGroupModal.tsx  # Modal for creating new groups
│   ├── FigmaExportModal.tsx  # Modal for Figma export
│   ├── GroupList.tsx         # List of all groups
│   ├── GroupView.tsx         # Individual group view with images
│   └── ImageGrid.tsx         # Grid display of images
├── lib/
│   ├── supabase.ts          # Supabase client configuration
│   └── database.types.ts    # TypeScript database types
├── App.tsx                  # Main application component
├── main.tsx                 # Application entry point
└── index.css                # Global styles

supabase/
└── functions/
    ├── categorize-images/   # AI categorization Edge Function
    └── export-to-figma/     # Figma export Edge Function
```

## Database Schema

### Groups Table
- `id`: UUID (Primary Key)
- `name`: Text - Group name
- `description`: Text (Optional) - Group description
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Images Table
- `id`: UUID (Primary Key)
- `group_id`: UUID (Foreign Key → groups.id)
- `file_path`: Text - Storage path
- `file_name`: Text - Original filename
- `category`: Text (Optional) - AI-assigned category
- `created_at`: Timestamp

## Edge Functions

### categorize-images
Automatically categorizes uploaded images using AI vision models. Falls back to filename-based categorization if AI is unavailable.

### export-to-figma
Exports organized screenshots to Figma, creating a new file with images grouped by category.

## Getting Started

The app is ready to use! Simply:
1. Create a new group
2. Upload screenshots to the group
3. Wait for AI to categorize them
4. Filter by category or export to Figma

## Figma Integration

To export to Figma:
1. Get your Figma access token from Figma Settings
2. Click "Export to Figma" in any group
3. Enter your access token
4. A new Figma file will be created with your screenshots

Note: You'll need a Figma plugin to import the images into the file.

## Mobile Usage

The app is optimized for mobile devices:
- Touch-friendly buttons and controls
- Responsive grid layouts
- Native file picker integration
- Sticky header for easy navigation

## Security

- Row Level Security (RLS) enabled on all tables
- Public access policies for demo purposes
- Secure file storage with Supabase Storage
- Environment variables for sensitive data
