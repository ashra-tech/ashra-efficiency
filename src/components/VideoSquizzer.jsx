import React, { useState, useRef } from 'react';

const VideoSquizzer = () => {
    const [efficiency, setEfficiency] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [prevFrame, setPrevFrame] = useState(null);

    const handleVideoUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            videoRef.current.src = url;
        }
    };

    const processFrame = () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Draw the current video frame onto the canvas
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const currentFrame = context.getImageData(0, 0, canvas.width, canvas.height).data;

        if (prevFrame) {
            const diff = calculateFrameDifference(prevFrame, currentFrame);
            setPrevFrame(currentFrame);
            return diff > 0.01;  // Returns true if the difference is greater than 1%
        } else {
            setPrevFrame(currentFrame);
            return null;
        }
    };

    const calculateFrameDifference = (prev, current) => {
        let sum = 0;
        for (let i = 0; i < prev.length; i += 4) {
            sum += Math.abs(prev[i] - current[i]);
            sum += Math.abs(prev[i + 1] - current[i + 1]);
            sum += Math.abs(prev[i + 2] - current[i + 2]);
        }
        return sum / (prev.length / 4) / 255.0;
    };

    const handleVideoPlay = () => {
        const video = videoRef.current;
        const frameInterval = 60;  // Processing 1 frame per second (assuming 60 FPS video)
        let efficiencies = [];

        const process = () => {
            if (video.paused || video.ended) return;

            const efficiency = processFrame();
            if (efficiency !== null) {
                efficiencies.push(efficiency);
            }

            setTimeout(process, 1000 / frameInterval);  // Process the next frame
        };

        process();

        video.addEventListener('ended', () => {
            if (efficiencies.length > 0) {
                const avgEfficiency = efficiencies.reduce((a, b) => a + b) / efficiencies.length;
                setEfficiency(avgEfficiency);
console.log("efficiency", avgEfficiency);
            } else {
                setEfficiency(null);
            }
        });
    };

    return (
        <div>
            <h1>Upload and Process Video</h1>
            <input type="file" accept="video/*" onChange={handleVideoUpload} />
            <div >
                <video ref={videoRef} onPlay={handleVideoPlay} width="320" height="180" crossOrigin="anonymous" controls />
                <canvas ref={canvasRef} width="320" height="180"></canvas>
            </div>
            {efficiency !== null && (
                <div>
                    <h2>Average Efficiency: {efficiency.toFixed(2)}</h2>
                </div>
            )}
        </div>
    );
};

export default VideoSquizzer;
