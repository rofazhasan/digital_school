# Appwrite Integration for Digital School Exam System

This document explains how the Digital School Exam System has been integrated with Appwrite for storing CQ and SQ exam images.

## Overview

The system now uses Appwrite cloud storage instead of local file storage for exam images, providing:
- **Scalability**: No local storage limitations
- **Reliability**: Cloud-based storage with redundancy
- **Performance**: Fast image loading and delivery
- **Security**: Secure file access and permissions

## Prerequisites

1. **Appwrite Account**: You need an Appwrite account and project
2. **Environment Variables**: Set the following in your `.env.local` file:

```bash
NEXT_PUBLIC_APPWRITE_PROJECT_ID=68aa7b51002070dd9a73
NEXT_PUBLIC_APPWRITE_PROJECT_NAME=digitalsch
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_API_KEY=your_server_api_key_here
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install appwrite
```

### 2. Run Setup Script

```bash
# Set your Appwrite API key first
export APPWRITE_API_KEY=your_server_api_key_here

# Run the setup script
node scripts/setup-appwrite.js
```

This script will:
- Create a storage bucket called `exam-images`
- Create a database for image metadata
- Set up proper permissions and attributes

### 3. Manual Setup (Alternative)

If you prefer to set up manually through the Appwrite console:

#### Storage Bucket
- **Name**: `exam-images`
- **Permissions**: Public read, authenticated write
- **File Size Limit**: 10MB
- **Allowed File Types**: `image/jpeg`, `image/png`, `image/gif`, `image/webp`

#### Database (Optional)
- **Name**: `exam_images_db`
- **Collection**: `exam_images`
- **Attributes**: See the setup script for details

## How It Works

### 1. Image Capture
When a student takes a photo or uploads an image for a CQ or SQ question:

1. Image is captured via camera or file upload
2. Temporary preview is shown immediately
3. Image is uploaded to Appwrite storage
4. Appwrite file ID and URL are stored with the answer

### 2. Storage Structure
Images are stored with the following naming convention:
```
{examId}_{studentId}_{questionId}_{timestamp}.{extension}
```

### 3. Database Storage
Image metadata is stored in the exam submission:
```json
{
  "answers": {
    "question_123": "Student's written answer",
    "question_123_images": [
      {
        "appwriteFileId": "unique_file_id",
        "appwriteUrl": "https://...",
        "appwriteFilename": "exam_123_student_456_question_123_1234567890.jpg",
        "timestamp": "2024-01-01T12:00:00Z",
        "uploadedAt": "2024-01-01T12:00:00Z"
      }
    ]
  },
  "_appwriteImages": [
    {
      "questionId": "question_123",
      "fileId": "unique_file_id",
      "url": "https://...",
      "filename": "exam_123_student_456_question_123_1234567890.jpg",
      "questionType": "cq",
      "timestamp": "2024-01-01T12:00:00Z",
      "uploadedAt": "2024-01-01T12:00:00Z"
    }
  ]
}
```

## API Endpoints

### Upload Image
```
POST /api/exams/[id]/upload-appwrite-image
```

**Form Data:**
- `image`: Image file
- `questionId`: Question identifier
- `studentId`: Student identifier
- `studentName`: Student name
- `questionText`: Question text
- `questionType`: Question type (cq/sq)
- `timestamp`: Upload timestamp

**Response:**
```json
{
  "success": true,
  "fileId": "unique_file_id",
  "url": "https://...",
  "filename": "filename.jpg",
  "size": 12345,
  "mimeType": "image/jpeg",
  "uploadedAt": "2024-01-01T12:00:00Z"
}
```

### Submit Exam with Appwrite Images
```
POST /api/exams/[id]/submit-with-appwrite
```

This endpoint processes the exam submission and stores Appwrite image metadata.

## Components Updated

### 1. QuestionCard.tsx
- **Image Capture**: Now uploads directly to Appwrite
- **Upload Status**: Shows loading state during upload
- **Fallback Handling**: Falls back to preview if Appwrite URL fails

### 2. ExamContext.tsx
- **Image Processing**: Extracts Appwrite metadata before saving
- **Enhanced Saving**: Handles both text and image answers

### 3. ExamLayout.tsx
- **Submission**: Uses new Appwrite submission endpoint

## Error Handling

The system includes comprehensive error handling:

1. **Upload Failures**: Failed uploads are removed from answers
2. **Network Issues**: Offline support with pending saves
3. **Fallback URLs**: Preview images as backup if Appwrite fails
4. **User Feedback**: Clear error messages and loading states

## Performance Optimizations

1. **Immediate Preview**: Images shown instantly while uploading
2. **Background Upload**: Upload happens in background
3. **Debounced Saving**: Reduces server load
4. **Offline Support**: Queues saves for when online

## Security Considerations

1. **Authentication**: All uploads require valid user session
2. **File Validation**: Type and size restrictions
3. **Permission Checks**: Users can only upload to their own exams
4. **Secure URLs**: Appwrite handles file access permissions

## Monitoring and Maintenance

### Storage Usage
Monitor your Appwrite storage usage through the console:
- Track file counts and sizes
- Set up alerts for storage limits
- Review upload patterns

### Performance Monitoring
- Monitor upload success rates
- Track response times
- Watch for failed uploads

### Cleanup
Consider implementing cleanup strategies:
- Delete old exam images after a certain period
- Archive completed exams
- Monitor for orphaned files

## Troubleshooting

### Common Issues

1. **Upload Fails**
   - Check Appwrite API key permissions
   - Verify bucket exists and is accessible
   - Check file size and type restrictions

2. **Images Don't Load**
   - Verify Appwrite bucket is public
   - Check file permissions
   - Verify URLs are correct

3. **Setup Script Fails**
   - Ensure API key has write permissions
   - Check project ID and endpoint
   - Verify Appwrite instance is running

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=appwrite:*
```

## Migration from Local Storage

If you're migrating from the old local storage system:

1. **Backup**: Ensure all local images are backed up
2. **Gradual Migration**: New uploads go to Appwrite
3. **Legacy Support**: Old local images continue to work
4. **Cleanup**: Remove local storage after migration

## Future Enhancements

1. **Image Compression**: Automatic image optimization
2. **CDN Integration**: Faster global delivery
3. **Advanced Metadata**: More detailed image information
4. **Batch Operations**: Bulk image processing
5. **Analytics**: Upload and usage statistics

## Support

For issues related to:
- **Appwrite Setup**: Check Appwrite documentation
- **Integration Issues**: Review this documentation
- **Performance Problems**: Check network and storage metrics
- **Security Concerns**: Review permissions and access logs 