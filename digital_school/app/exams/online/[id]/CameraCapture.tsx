"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Camera, RotateCcw, Upload } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  questionId: string;
  examId: string;
}

export default function CameraCapture({ onCapture, onClose, questionId, examId }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera if available
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraOn(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("ক্যামেরা অ্যাক্সেস করতে সমস্যা হয়েছে। অনুগ্রহ করে ক্যামেরা অনুমতি দিন।");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOn(false);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and store both URL and blob
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        setCapturedBlob(blob);
        stopCamera();
      }
    }, "image/jpeg", 0.8);
  };

  const retakePhoto = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    }
    setCapturedBlob(null);
    startCamera();
  };

  const uploadImage = async () => {
    if (!capturedBlob) return;

    setIsUploading(true);
    try {
      // Create file from the stored blob
      const file = new File([capturedBlob], `answer_${questionId}_${Date.now()}.jpg`, {
        type: "image/jpeg"
      });

      // Return the file to parent component
      onCapture(file);
      
    } catch (error) {
      console.error("Image processing error:", error);
      alert("ছবি প্রক্রিয়া করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">ছবি তুলুন</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {!capturedImage ? (
            <div className="space-y-4">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 object-cover"
                />
                {!isCameraOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    <p className="text-gray-500">ক্যামেরা লোড হচ্ছে...</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={captureImage}
                  disabled={!isCameraOn}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  ছবি তুলুন
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-64 object-cover"
                />
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={retakePhoto}
                  variant="outline"
                  disabled={isUploading}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  আবার তুলুন
                </Button>
                
                <Button
                  onClick={uploadImage}
                  disabled={isUploading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? "প্রক্রিয়া হচ্ছে..." : "ছবি সংরক্ষণ করুন"}
                </Button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </CardContent>
      </Card>
    </div>
  );
} 