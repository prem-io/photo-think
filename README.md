# Image Uploader - Production-Ready Uppy Integration

A production-ready image uploader built with React 18+ and Uppy in headless mode, featuring a custom UI with Cloudinary direct uploads.

## Features

- ✅ **Headless Uppy Integration**: Uses `@uppy/core`, `@uppy/xhr-upload`, and `@uppy/thumbnail-generator` only
- ✅ **Custom UI**: Completely custom React components (no Uppy UI plugins)
- ✅ **Cloudinary Direct Upload**: Browser-to-cloud uploads without backend
- ✅ **Masonry Grid Layout**: Pinterest-style responsive image grid
- ✅ **Per-File Progress**: Individual progress tracking for each image
- ✅ **Overall Progress**: Aggregate progress with floating widget
- ✅ **Thumbnail Generation**: Client-side thumbnails with aspect ratio preservation
- ✅ **File Validation**: Image-only, 10MB max per file
- ✅ **Error Handling**: Retry failed uploads, clear completed files
- ✅ **Mobile Support**: Gallery selection on mobile devices

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Cloudinary Configuration

1. Create a free account at [https://cloudinary.com](https://cloudinary.com)
2. Go to Settings → Upload → Upload presets
3. Create a new unsigned upload preset (or use an existing one)
4. Copy your Cloud Name and Upload Preset name

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

**Important**: For unsigned uploads, ensure your upload preset is configured as "Unsigned" in Cloudinary settings.

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

### Core Components

- **`useUppy` Hook** (`hooks/use-uppy.ts`): Manages Uppy instance lifecycle, event subscriptions, and state management
- **`ImageUploader`**: Main container component orchestrating the upload flow
- **`UploadDropzone`**: Custom drag-and-drop zone with file picker
- **`ImageGrid`**: Masonry layout component for image previews
- **`ImageCard`**: Individual image card with progress and status indicators
- **`FloatingProgressWidget`**: Overall progress indicator

### State Management

- **Uppy as Single Source of Truth**: All file state comes from `uppy.getFiles()`
- **Derived UI State**: Lightweight React state for UI-specific concerns
- **Event-Driven Updates**: Subscribes to Uppy events for reactive updates

### File Flow

1. **File Addition**: Files added via drag-drop or file picker → `uppy.addFiles()`
2. **Validation**: Uppy validates file type and size
3. **Thumbnail Generation**: `@uppy/thumbnail-generator` creates client-side previews
4. **Upload Trigger**: User clicks "Upload All" → `uppy.upload()`
5. **Progress Tracking**: `upload-progress` events update per-file progress
6. **Completion**: `upload-success` events update file state with Cloudinary URL

## Technical Requirements Met

- ✅ React 18+ with functional components and hooks
- ✅ `@uppy/core` (headless only)
- ✅ `@uppy/xhr-upload` for Cloudinary
- ✅ `@uppy/thumbnail-generator` for previews
- ✅ Custom UI (no Uppy UI plugins)
- ✅ File validation (image/*, 10MB max)
- ✅ Per-file and overall progress
- ✅ Error handling with retry
- ✅ Memory management and cleanup

## Project Structure

```
├── app/
│   ├── page.tsx              # Main page
│   └── layout.tsx             # App layout
├── components/
│   ├── image-uploader.tsx    # Main uploader component
│   ├── upload-dropzone.tsx   # Drag-drop zone
│   ├── image-grid.tsx        # Masonry grid layout
│   ├── image-card.tsx        # Individual image card
│   └── floating-progress-widget.tsx  # Progress indicator
├── hooks/
│   └── use-uppy.ts           # Uppy integration hook
└── README.md                 # This file
```

## Usage

### Basic Upload Flow

1. Drag and drop images onto the dropzone, or click to browse
2. Images appear in the masonry grid with thumbnails
3. Click "Upload All" to start uploading
4. Monitor progress via per-file progress bars and overall progress widget
5. Retry failed uploads using the retry button on error cards
6. Clear completed files to remove them from the queue

### API

The `useUppy` hook provides:

```typescript
const {
  files,              // FileState[] - Current files with status
  overallProgress,    // UploadProgress - Aggregate progress
  isUploading,        // boolean - Upload in progress
  addFiles,           // (files: FileList | File[]) => void
  uploadAll,          // () => void
  cancelAll,          // () => void
  retryFailed,        // () => void
  retryFile,          // (id: string) => void
  clearCompleted,     // () => void
} = useUppy()
```

## Performance Considerations

- **Memory Management**: Uppy instance properly cleaned up on unmount
- **Thumbnail Optimization**: Lazy loading and aspect ratio preservation
- **Memoization**: Derived state memoized to prevent unnecessary re-renders
- **Event Cleanup**: All event listeners removed on unmount

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT

