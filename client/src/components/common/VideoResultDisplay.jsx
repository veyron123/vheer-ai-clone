import React, { useState } from 'react';
import { 
  Play, 
  Download, 
  Share, 
  Copy, 
  CheckCircle, 
  ExternalLink, 
  RefreshCw,
  Clock,
  AlertCircle,
  Video
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const VideoResultDisplay = ({ 
  video, 
  taskId,
  onRetry, 
  onClear,
  isLoading = false,
  generationParams = {},
  creditsUsed = 0 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  if (!video && !taskId && !isLoading) {
    return null;
  }

  const handleCopyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URL copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy URL:', error);
      toast.error('Failed to copy URL');
    }
  };

  const handleDownload = async (url, filename = 'ai-generated-video.mp4') => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Download started!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed. You can right-click the video to save.');
    }
  };

  const handleShare = async (url) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Generated Video',
          text: 'Check out this AI-generated video!',
          url: url
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          handleCopyUrl(url);
        }
      }
    } else {
      handleCopyUrl(url);
    }
  };

  // Loading state
  if (isLoading || (!video && taskId)) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6 mt-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Generating Your Video
          </h3>
          <p className="text-gray-600 mb-4">
            AI is creating your video. This usually takes 2-4 minutes.
          </p>
          {taskId && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-500 mb-1">Task ID:</p>
              <code className="text-sm font-mono text-gray-800">{taskId}</code>
            </div>
          )}
          <div className="flex items-center justify-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-2" />
            <span>Estimated time: 2-4 minutes</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (video && video.error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6 mt-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Generation Failed
          </h3>
          <p className="text-gray-600 mb-4">
            {video.error || 'Something went wrong during video generation.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
            <button
              onClick={onClear}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state with video
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Video Generated Successfully!
            </h3>
            <p className="text-sm text-gray-500">
              {creditsUsed} credits used
            </p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ×
        </button>
      </div>

      {/* Video Player */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4 group">
        {video.url ? (
          <video
            className="w-full h-auto max-h-96 object-contain"
            controls
            preload="metadata"
            onLoadedData={() => setVideoLoaded(true)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            poster={video.thumbnail}
          >
            <source src={video.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="aspect-video flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Video processing...</p>
            </div>
          </div>
        )}

        {/* Play Overlay */}
        {!isPlaying && videoLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-gray-800 ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Generation Parameters */}
      {generationParams && Object.keys(generationParams).length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Generation Parameters</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {generationParams.duration && (
              <div>
                <span className="text-gray-500">Duration:</span>
                <span className="ml-1 font-medium">{generationParams.duration}s</span>
              </div>
            )}
            {generationParams.quality && (
              <div>
                <span className="text-gray-500">Quality:</span>
                <span className="ml-1 font-medium">{generationParams.quality}</span>
              </div>
            )}
            {generationParams.aspectRatio && (
              <div>
                <span className="text-gray-500">Aspect Ratio:</span>
                <span className="ml-1 font-medium">{generationParams.aspectRatio}</span>
              </div>
            )}
            {generationParams.hasImageUrl && (
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-1 font-medium">Image-to-Video</span>
              </div>
            )}
          </div>
          {generationParams.prompt && (
            <div className="mt-3">
              <span className="text-gray-500 text-sm">Prompt:</span>
              <p className="mt-1 text-gray-800 text-sm leading-relaxed">
                {generationParams.prompt}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {video.url && (
          <>
            <button
              onClick={() => handleDownload(video.url)}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
            <button
              onClick={() => handleShare(video.url)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Share className="w-4 h-4 mr-2" />
              Share
            </button>
            <button
              onClick={() => handleCopyUrl(video.url)}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy URL
            </button>
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </a>
          </>
        )}
        
        <button
          onClick={onRetry}
          className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Generate Another
        </button>
      </div>

      {/* Task ID for reference */}
      {taskId && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
              Technical Details
            </summary>
            <div className="mt-2 bg-gray-50 rounded p-2">
              <p className="text-gray-600">
                <strong>Task ID:</strong> 
                <code className="ml-1 font-mono text-xs">{taskId}</code>
              </p>
              {video.processingTime && (
                <p className="text-gray-600 mt-1">
                  <strong>Processing Time:</strong> {video.processingTime}
                </p>
              )}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default VideoResultDisplay;