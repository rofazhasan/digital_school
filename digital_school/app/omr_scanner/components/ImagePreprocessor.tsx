"use client";

import React, { forwardRef, useImperativeHandle } from 'react';

interface PreprocessingSettings {
  denoise: boolean;
  sharpen: boolean;
  contrast: number;
  brightness: number;
  skewCorrection: boolean;
  perspectiveCorrection: boolean;
}

interface ImagePreprocessorRef {
  preprocess: (file: File, settings: PreprocessingSettings) => Promise<any>;
}

const ImagePreprocessor = forwardRef<ImagePreprocessorRef>((props, ref) => {
  useImperativeHandle(ref, () => ({
    preprocess: async (file: File, settings: PreprocessingSettings): Promise<any> => {
      try {
        // Convert file to canvas for processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        // Create image from file
        const img = new Image();
        const imageUrl = URL.createObjectURL(file);
        
        return new Promise((resolve, reject) => {
          img.onload = () => {
            try {
              // Set canvas size
              canvas.width = img.width;
              canvas.height = img.height;
              
              // Draw image
              ctx.drawImage(img, 0, 0);
              
              // Get image data
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const data = imageData.data;
              
              // Apply preprocessing
              let processedData = new Uint8ClampedArray(data);
              
              if (settings.denoise) {
                processedData = denoiseImage(processedData, canvas.width, canvas.height);
              }
              
              if (settings.sharpen) {
                processedData = sharpenImage(processedData, canvas.width, canvas.height);
              }
              
              // Adjust contrast and brightness
              processedData = adjustContrastBrightness(
                processedData, 
                settings.contrast, 
                settings.brightness
              );
              
              // Convert to grayscale
              processedData = convertToGrayscale(processedData);
              
              // Apply skew correction if enabled
              if (settings.skewCorrection) {
                processedData = correctSkew(processedData, canvas.width, canvas.height);
              }
              
              // Apply perspective correction if enabled
              if (settings.perspectiveCorrection) {
                processedData = correctPerspective(processedData, canvas.width, canvas.height);
              }
              
              // Create new image data
              const newImageData = new ImageData(processedData, canvas.width, canvas.height);
              
              // Put processed data back to canvas
              ctx.putImageData(newImageData, 0, 0);
              
              // Convert canvas to blob
              canvas.toBlob((blob) => {
                if (blob) {
                  resolve({
                    width: canvas.width,
                    height: canvas.height,
                    data: processedData,
                    blob: blob,
                    canvas: canvas
                  });
                } else {
                  reject(new Error('Failed to create blob'));
                }
              }, 'image/png');
              
              // Clean up
              URL.revokeObjectURL(imageUrl);
            } catch (error) {
              URL.revokeObjectURL(imageUrl);
              reject(error);
            }
          };
          
          img.onerror = () => {
            URL.revokeObjectURL(imageUrl);
            reject(new Error('Failed to load image'));
          };
          
          img.src = imageUrl;
        });
      } catch (error) {
        console.error('Image preprocessing error:', error);
        throw new Error(`Failed to preprocess image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }));

  // Denoise image using median filter
  const denoiseImage = (data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray => {
    const result = new Uint8ClampedArray(data.length);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const pixels: number[] = [];
        
        // Collect 3x3 neighborhood
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            pixels.push(data[nIdx]); // Red channel
          }
        }
        
        // Calculate median
        pixels.sort((a, b) => a - b);
        const median = pixels[4]; // 5th element (0-indexed)
        
        result[idx] = median;     // Red
        result[idx + 1] = median; // Green
        result[idx + 2] = median; // Blue
        result[idx + 3] = 255;    // Alpha
      }
    }
    
    return result;
  };

  // Sharpen image using unsharp mask
  const sharpenImage = (data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray => {
    const result = new Uint8ClampedArray(data.length);
    
    // Create blurred version
    const blurred = new Uint8ClampedArray(data.length);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        let sum = 0;
        let count = 0;
        
        // 3x3 blur
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            sum += data[nIdx];
            count++;
          }
        }
        
        const avg = sum / count;
        blurred[idx] = avg;
        blurred[idx + 1] = avg;
        blurred[idx + 2] = avg;
        blurred[idx + 3] = 255;
      }
    }
    
    // Apply unsharp mask
    for (let i = 0; i < data.length; i += 4) {
      const original = data[i];
      const blur = blurred[i];
      const sharp = Math.max(0, Math.min(255, original + (original - blur) * 0.5));
      
      result[i] = sharp;     // Red
      result[i + 1] = sharp; // Green
      result[i + 2] = sharp; // Blue
      result[i + 3] = 255;   // Alpha
    }
    
    return result;
  };

  // Adjust contrast and brightness
  const adjustContrastBrightness = (
    data: Uint8ClampedArray, 
    contrast: number, 
    brightness: number
  ): Uint8ClampedArray => {
    const result = new Uint8ClampedArray(data.length);
    
    for (let i = 0; i < data.length; i += 4) {
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const offset = 128 * (1 - factor);
      
      result[i] = Math.max(0, Math.min(255, factor * data[i] + offset + brightness));     // Red
      result[i + 1] = Math.max(0, Math.min(255, factor * data[i + 1] + offset + brightness)); // Green
      result[i + 2] = Math.max(0, Math.min(255, factor * data[i + 2] + offset + brightness)); // Blue
      result[i + 3] = 255; // Alpha
    }
    
    return result;
  };

  // Convert to grayscale
  const convertToGrayscale = (data: Uint8ClampedArray): Uint8ClampedArray => {
    const result = new Uint8ClampedArray(data.length);
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      result[i] = gray;     // Red
      result[i + 1] = gray; // Green
      result[i + 2] = gray; // Blue
      result[i + 3] = 255;  // Alpha
    }
    
    return result;
  };

  // Correct skew (simplified version)
  const correctSkew = (data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray => {
    // This is a simplified skew correction
    // In a real implementation, you would use Hough transform to detect lines
    // and calculate the skew angle
    return data;
  };

  // Correct perspective (simplified version)
  const correctPerspective = (data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray => {
    // This is a simplified perspective correction
    // In a real implementation, you would detect corners and apply
    // perspective transformation matrix
    return data;
  };

  return null; // This component doesn't render anything
});

ImagePreprocessor.displayName = 'ImagePreprocessor';

export default ImagePreprocessor; 