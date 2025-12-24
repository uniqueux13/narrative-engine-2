import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, VideoOff, Captions } from 'lucide-react';
import { LiveTranscriber } from '../services/geminiService';

interface CameraRecorderProps {
  onCapture: (blob: Blob, transcript: string) => void;
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
  const [liveTranscript, setLiveTranscript] = useState('');

  const chunksRef = useRef<Blob[]>([]);
  
  // Real-time Transcription Refs
  const transcriberRef = useRef<LiveTranscriber | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Start Camera
  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const isPortrait = aspectRatio === '9:16';

      // Enhanced constraints for mobile/desktop compatibility
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'user', 
          // Prefer strict dimensions to force quality/orientation where possible
          // On mobile, browser usually handles orientation, but we request 
          // 720p minimum.
          width: { ideal: isPortrait ? 720 : 1280 },
          height: { ideal: isPortrait ? 1280 : 720 },
          // frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
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
      stopTranscription();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]); 

  const startTranscription = async (mediaStream: MediaStream) => {
    try {
      const transcriber = new LiveTranscriber();
      transcriberRef.current = transcriber;
      setLiveTranscript('');

      await transcriber.connect((text) => {
        setLiveTranscript(prev => prev + text);
      });

      // Setup Audio Context for 16kHz sampling
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass({ sampleRate: 16000 });
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(mediaStream);
      // Buffer size 4096, 1 input channel, 1 output channel
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        transcriber.sendAudio(inputData);
      };

      source.connect(processor);
      processor.connect(ctx.destination); // Mute loopback if needed, but script processor needs destination to fire

    } catch (err) {
      console.error("Failed to start transcription", err);
    }
  };

  const stopTranscription = () => {
    if (transcriberRef.current) {
      transcriberRef.current.close();
      transcriberRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const handleStartRecording = () => {
    if (!stream) return;
    
    // Start Video Recording
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
      stopTranscription();
    };

    recorder.start();
    setIsRecording(true);
    mediaRecorderRef.current = recorder;

    // Start Live Transcription
    startTranscription(stream);
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
    setLiveTranscript('');
    startCamera();
  };

  const handleAccept = () => {
    if (recordedBlob) {
      onCapture(recordedBlob, liveTranscript);
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
    <div className="relative h-full w-full bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-zinc-800 isolate">
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

      {/* Real-time Transcription Overlay */}
      {(isRecording || previewUrl) && liveTranscript && (
        <div className="absolute bottom-24 left-4 right-4 pointer-events-none z-20">
          <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 animate-in slide-in-from-bottom-5">
             <div className="flex items-center gap-2 mb-1">
               <Captions className="w-3 h-3 text-amber-500" />
               <span className="text-[10px] uppercase font-bold text-zinc-400">Live Transcription</span>
             </div>
             <p className="text-white font-medium text-lg leading-snug drop-shadow-md">
               {liveTranscript}
               {isRecording && <span className="inline-block w-1.5 h-4 ml-1 bg-amber-500 animate-pulse align-middle" />}
             </p>
          </div>
        </div>
      )}

      {/* Overlays */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
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