import { Client, Storage, ID } from 'appwrite';

// Appwrite configuration
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '68aa7b51002070dd9a73';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const APPWRITE_BUCKET_ID = 'exam-images'; // We'll create this bucket

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

// Set API key for server-side operations
if (APPWRITE_API_KEY) {
  client.setJWT(APPWRITE_API_KEY);
}

const storage = new Storage(client);

export interface UploadedImage {
  fileId: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface ExamImageMetadata {
  examId: string;
  studentId: string;
  questionId: string;
  questionType: 'cq' | 'sq';
  timestamp: string;
  originalFilename?: string;
  studentName?: string;
  questionText?: string;
}

export class AppwriteService {
  private static instance: AppwriteService;
  private bucketId: string;

  private constructor() {
    this.bucketId = APPWRITE_BUCKET_ID;
  }

  public static getInstance(): AppwriteService {
    if (!AppwriteService.instance) {
      AppwriteService.instance = new AppwriteService();
    }
    return AppwriteService.instance;
  }

  /**
   * Upload an image file to Appwrite storage
   */
  async uploadExamImage(
    file: File | Buffer,
    metadata: ExamImageMetadata
  ): Promise<UploadedImage> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = metadata.originalFilename?.split('.').pop() || 'jpg';
      const filename = `${metadata.examId}_${metadata.studentId}_${metadata.questionId}_${timestamp}.${fileExtension}`;

      // Handle different file types for server vs client
      let fileData: any;
      let mimeType = 'image/jpeg';

      if (typeof File !== 'undefined' && file instanceof File) {
        // Browser environment - File object
        fileData = file;
        mimeType = file.type;
      } else if (Buffer.isBuffer(file)) {
        // Node.js environment - Buffer
        fileData = file;
        mimeType = 'image/jpeg';
      } else {
        throw new Error('Unsupported file type. Expected File or Buffer.');
      }

      console.log('📤 Uploading to Appwrite:', {
        bucketId: this.bucketId,
        filename,
        mimeType,
        fileType: typeof fileData,
        isBuffer: Buffer.isBuffer(fileData),
        size: Buffer.isBuffer(fileData) ? fileData.length : 'N/A'
      });

      // Upload file to Appwrite
      const uploadedFile = await storage.createFile(
        this.bucketId,
        ID.unique(),
        fileData
      );

      // Get file details
      const fileDetails = await storage.getFile(this.bucketId, uploadedFile.$id);

      // Generate public URL
      const url = storage.getFileView(this.bucketId, uploadedFile.$id);

      return {
        fileId: uploadedFile.$id,
        url: url.toString(),
        filename: filename,
        size: typeof file === 'object' && 'size' in file ? file.size : (Buffer.isBuffer(fileData) ? fileData.length : 0),
        mimeType: fileDetails.mimeType || mimeType,
        uploadedAt: new Date(uploadedFile.$createdAt)
      };
    } catch (error) {
      console.error('Error uploading image to Appwrite:', error);
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete an image file from Appwrite storage
   */
  async deleteExamImage(fileId: string): Promise<void> {
    try {
      await storage.deleteFile(this.bucketId, fileId);
    } catch (error) {
      console.error('Error deleting image from Appwrite:', error);
      throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(fileId: string): Promise<any> {
    try {
      return await storage.getFile(this.bucketId, fileId);
    } catch (error) {
      console.error('Error getting file info from Appwrite:', error);
      throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List files for a specific exam/student
   */
  async listExamImages(examId: string, studentId?: string): Promise<any[]> {
    try {
      // Note: Appwrite doesn't support complex queries on file metadata
      // We'll need to implement this differently or store metadata in a separate collection
      const files = await storage.listFiles(this.bucketId);
      return files.files.filter((file: any) => 
        file.name.includes(examId) && (!studentId || file.name.includes(studentId))
      );
    } catch (error) {
      console.error('Error listing exam images from Appwrite:', error);
      throw new Error(`Failed to list exam images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


}

// Export singleton instance
export const appwriteService = AppwriteService.getInstance();

// Helper function to create bucket if it doesn't exist
export async function ensureBucketExists(): Promise<void> {
  try {
    // This would typically be done during app initialization
    // For now, we'll assume the bucket exists
    console.log('Appwrite bucket check: exam-images bucket should exist');
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
  }
} 