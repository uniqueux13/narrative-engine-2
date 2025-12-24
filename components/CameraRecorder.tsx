import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, StopCircle, RefreshCw, CheckCircle, VideoOff, Mic } from 'lucide-react';

interface CameraRecorderProps {
  onCapture: (blob: Blob) => void;
  aspectRatio: '9:16' | '16:9';
  isActive: boolean;
}

const CameraRecorder: React.FC<CameraRecorderProps> = ({ onCapture, aspectRatio, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const chunksRef = useRef<Blob[]>([]);

  // Start Camera
  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Constraints for mobile-first vertical video usually
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'user', // Default to selfie mode for vlog style
          aspectRatio: aspectRatio === '9:16' ? 9/16 : 16/9,
          height: { ideal: 1080 } 
        },
        audio: true
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      setError(null);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error("Camera Error:", err);
      setError("Camera access denied or unavailable.");
    }
  }, [aspectRatio]);

  // Handle active state changes
  useEffect(() => {
    if (isActive && !recordedBlob) {
      startCamera();
    } else {
      // Cleanup if not active
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]); // removed startCamera from deps to avoid loop

  const handleStartRecording = () => {
    if (!stream) return;
    
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/mp4' });
      setRecordedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      setIsRecording(false);
      setRecordingTime(0);
    };

    recorder.start();
    setIsRecording(true);
    mediaRecorderRef.current = recorder;
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // Timer
  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setRecordedBlob(null);
    setPreviewUrl(null);
    startCamera();
  };

  const handleAccept = () => {
    if (recordedBlob) {
      onCapture(recordedBlob);
    }
  };

  // Formatting time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-900 rounded-2xl p-8 text-center border border-zinc-800">
        <VideoOff className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-zinc-400">{error}</p>
        <button 
          onClick={startCamera}
          className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm font-medium transition-colors"
        >
          Retry Access
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-zinc-800">
      {/* Viewfinder / Preview */}
      {previewUrl ? (
        <video 
          src={previewUrl} 
          className="w-full h-full object-cover" 
          autoPlay 
          loop 
          playsInline 
        />
      ) : (
        <video 
          ref={videoRef} 
          className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect for selfie
          autoPlay 
          playsInline 
          muted 
        />
      )}

      {/* Overlays */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
        {/* Top Status */}
        <div className="flex justify-between items-start">
          <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono text-white/80 border border-white/10 flex items-center gap-2">
            {isRecording ? (
              <span className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></span>
            ) : (
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            )}
            {isRecording ? formatTime(recordingTime) : "STANDBY"}
          </div>
          <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono text-white/80 border border-white/10">
            {aspectRatio}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="pointer-events-auto flex items-center justify-center gap-8 mb-4">
          {previewUrl ? (
            <>
              <button 
                onClick={handleRetake}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-600 group-hover:bg-zinc-700 transition-all">
                  <RefreshCw className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-white/80">RETAKE</span>
              </button>

              <button 
                onClick={handleAccept}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-900/50 group-hover:bg-emerald-400 transition-all transform hover:scale-105">
                  <CheckCircle className="w-8 h-8 text-black" />
                </div>
                <span className="text-xs font-medium text-white/80">ACCEPT</span>
              </button>
            </>
          ) : (
            <button 
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`relative group transition-transform active:scale-95 ${isRecording ? '' : 'hover:scale-105'}`}
            >
              {/* Record Button Ring */}
              <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-colors ${
                isRecording ? 'border-red-500/50 bg-red-900/20' : 'border-white/20 bg-white/10'
              }`}>
                {/* Inner Circle */}
                <div className={`transition-all duration-300 ${
                  isRecording 
                    ? 'w-8 h-8 rounded-md bg-red-500' 
                    : 'w-16 h-16 rounded-full bg-red-600 group-hover:bg-red-500'
                }`} />
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraRecorder;
