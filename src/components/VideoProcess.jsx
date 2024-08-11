import React, { Fragment, useEffect, useState } from 'react';
import { BeatLoader } from 'react-spinners';

const VideoProcess = () => {
    const [fileName, setFileName] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [videoSrc, setVideoSrc] = useState(null);
    const [loading, setLoading] = useState(false);
    const [workEfficiency, setWorkEfficiency] = useState(0);

    useEffect(() => {
        console.log("videoSrc", videoSrc);
    }, [videoSrc]);

    const loadPyodideAndPackages = async () => {
        if (!window.pyodide) {
            console.log("Loading Pyodide...");
            window.pyodide = await window.loadPyodide({
                indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/",
            });
            console.log("Pyodide loaded.");
        }
        console.log("Installing OpenCV...");
        await window.pyodide.loadPackage("micropip");
        await window.pyodide.runPythonAsync(`
            import micropip
            await micropip.install('opencv-python-headless')
        `);
        console.log("OpenCV installed.");
        return window.pyodide;
    };



    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setFileName(file.name);
        } else {
            setFileName('');
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const file = event.dataTransfer.files[0];
        if (file) {
            setFileName(file?.name);
        }
        setDragActive(false);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(false);
    };

    const openDatabase = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('videoDB', 1);
            request.onerror = (event) => {
                reject('Error opening IndexedDB:', event.target.errorCode);
            };
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                db.createObjectStore('videos', { keyPath: 'id' });
            };
        });
    };

    const storeVideo = async (blob) => {
        const db = await openDatabase();
        const transaction = db.transaction(['videos'], 'readwrite');
        const store = transaction.objectStore('videos');
        return new Promise((resolve, reject) => {
            const request = store.put({ id: 'videoFile', file: blob });
            request.onsuccess = () => {
                console.log('Downsampled video stored in IndexedDB successfully.');
                resolve();
            };
            request.onerror = (event) => {
                console.error('Error storing video:', event.target.errorCode);
                reject('Error storing video:', event.target.errorCode);
            };
        });
    };

    const getStoredVideo = async () => {
        const db = await openDatabase();
        const transaction = db.transaction(['videos'], 'readonly');
        const store = transaction.objectStore('videos');
        return new Promise((resolve, reject) => {
            const request = store.get('videoFile');
            request.onsuccess = (event) => {
                resolve(event.target.result?.file);
            };
            request.onerror = (event) => {
                reject('Error retrieving video:', event.target.errorCode);
            };
        });
    };

    const removeVideo = async () => {
        const db = await openDatabase();
        const transaction = db.transaction(['videos'], 'readwrite');
        const store = transaction.objectStore('videos');
        return new Promise((resolve, reject) => {
            const request = store.delete('videoFile');
            request.onsuccess = () => {
                resolve();
            };
            request.onerror = (event) => {
                reject('Error removing video:', event.target.errorCode);
            };
        });
    };

    const downsampleVideo = (video) => {
        return new Promise((resolve, reject) => {
            console.log("Starting video downsampling...");

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            const width = 640;  // Target width for downsampling
            const height = 360; // Target height for downsampling
            canvas.width = width;
            canvas.height = height;

            const outputChunks = [];
            const mediaRecorder = new MediaRecorder(canvas.captureStream(), {
                mimeType: 'video/webm; codecs=vp8',
                videoBitsPerSecond: 1000000, // Adjust bitrate as needed
            });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    outputChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const outputBlob = new Blob(outputChunks, { type: 'video/webm' });
                resolve(outputBlob); // Resolve the promise with the downsampled video Blob
            };

            let currentTime = 0;
            const interval = 60; // Capture a frame every 60 seconds

            const captureFrame = () => {
                if (currentTime >= video.duration || outputChunks.length >= 1000) {
                    mediaRecorder.stop();
                    return;
                }

                video.currentTime = currentTime;

                video.onseeked = () => {
                    context.drawImage(video, 0, 0, width, height);
                    currentTime += interval;
                    captureFrame();
                };

                video.onerror = (e) => {
                    reject(e);
                };
            };

            video.onloadeddata = () => {
                mediaRecorder.start();
                captureFrame();
            };

            video.onerror = (e) => {
                reject(e);
            };
        });
    };

    const processVideoWithPyodide = async (videoBlob) => {
        try {
            const pyodide = await loadPyodideAndPackages();  // Ensure Pyodide is loaded
            console.log("Pyodide loaded successfully.");

            const fileReader = new FileReader();
            fileReader.onload = async function (event) {
                try {
                    const arrayBuffer = event.target.result;
                    console.log("File read successfully, writing to Pyodide FS...");
                    pyodide.FS.writeFile('input_video.mp4', new Uint8Array(arrayBuffer));

                    console.log("Executing Python code...");
                    const pythonCode = `
    import cv2
    import numpy as np
    
    process_fps = 1/60
    video_path = 'input_video.mp4'
    
    def work_efficiency(current_frame):
        current_frame = current_frame / 255.0
        global prev_frame
        if prev_frame is None:
            prev_frame = current_frame
            return 0
    
        diff = np.mean(np.abs(current_frame - prev_frame))
        efficiency = (diff > 0.01).astype(int)
        prev_frame = current_frame
        return efficiency
    
    video = cv2.VideoCapture(video_path)
    original_fps = video.get(cv2.CAP_PROP_FPS)
    frame_interval = int(original_fps // process_fps)
    
    global prev_frame
    prev_frame = None
    efficiencies = []
    
    frame_count = 0
    while True:
        success, frame = video.read()
        if not success:
            break
    
        if frame_count % frame_interval == 0:
            frame = cv2.resize(frame, (320, 180), interpolation=cv2.INTER_NEAREST)
            efficiency = work_efficiency(frame)
            efficiencies.append(efficiency)
    
        frame_count += 1
    
    video.release()
    
    average_efficiency = np.mean(efficiencies) if efficiencies else 0
    average_efficiency
                    `;

                    const efficiency = pyodide.runPython(pythonCode);
                    console.log("Python code executed successfully. Efficiency:", efficiency);
                    setWorkEfficiency(efficiency);
                    localStorage.setItem('workEfficiency', efficiency);
                } catch (innerError) {
                    console.error("Error during Python code execution:", innerError);
                    throw innerError;
                }
            };
            fileReader.onerror = (error) => {
                console.error("Error reading file:", error);
                throw error;
            };
            fileReader.readAsArrayBuffer(videoBlob);
        } catch (error) {
            console.error("Error in processVideoWithPyodide:", error.message);
            console.error(error);  // Log the full error object for more details
            throw error;  // Rethrow the error to be caught by the handleSubmit function
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        const videoInput = document.getElementById('video-file');
        if (videoInput && videoInput.files.length > 0) {
            const file = videoInput.files[0];
            const uploadedUrl = URL.createObjectURL(file);
            setLoading(true);
            setVideoSrc(null);
            setWorkEfficiency(0);

            try {
                await removeVideo();
                const video = document.createElement('video');
                video.src = uploadedUrl;

                const downsampledBlob = await downsampleVideo(video);
                console.log("Video downsampled successfully.");
                await storeVideo(downsampledBlob);

                console.log("Starting Pyodide processing...");
                await processVideoWithPyodide(downsampledBlob);  // Process video with Pyodide

                setLoading(false);
            } catch (error) {
                console.error('Error processing the video:', error);
                alert('Failed to process the video. Please check the console for more details.');
                setLoading(false);
                window.location.reload();
            }
        } else {
            console.log('No video file selected');
        }
    };


    useEffect(() => {
        const fetchVideoFromIndexedDB = async () => {
            try {
                const file = await getStoredVideo();
                if (file) {
                    const videoBlobUrl = URL.createObjectURL(file);
                    setVideoSrc(videoBlobUrl);
                    console.log('Video loaded from IndexedDB: ', videoBlobUrl);
                } else {
                    console.log('No file found in IndexedDB.');
                }
            } catch (error) {
                console.error('Error fetching from IndexedDB:', error);
            }
        };

        const storedEfficiency = localStorage.getItem('workEfficiency');
        if (storedEfficiency) {
            setWorkEfficiency(parseFloat(storedEfficiency));
        }

        fetchVideoFromIndexedDB();
    }, []);

    return (
        <div className="flex flex-col items-center bg-black min-h-screen py-8">
            <form
                onSubmit={handleSubmit}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="py-4"
            >
                <div className="space-y-2">
                    <h2 className="text-[22px] text-center text-gray-300 py-6">
                        Please upload your video here!
                    </h2>
                    <div className="w-full pt-2 lg:pt-4">
                        <label
                            htmlFor="video-file"
                            className={`shadow-xl flex flex-col items-center justify-center lg:w-96 w-96 lg:h-96 h-96 border-2 border-dashed rounded-lg hover:border-ui-purple cursor-pointer backdrop-blur-2xl ${dragActive ? 'border-ui-purple backdrop-blur-2xl' : 'border-gray-300'}`}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg
                                    className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 20 16"
                                >
                                    <path
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                                    />
                                </svg>
                                {fileName ? (
                                    <span className='text-gray-400'>
                                        {fileName ?? "Unknown file selected"}
                                    </span>
                                ) : (
                                    <Fragment>
                                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                            <span className="font-semibold">Click or drop file to upload</span>
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Video only
                                        </p>
                                    </Fragment>
                                )}
                            </div>
                            <input
                                id="video-file"
                                noValidate
                                accept="video/mp4,video/webm,video/x-matroska,video/x-msvideo"
                                type="file"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>
                    <div className="w-full flex justify-center pt-4">
                        <button className='px-3 py-2 font-medium text-center inline-flex items-center text-white/90 bg-ui-purple hover:bg-ui-purple/80 border-ui-purple rounded-full focus:ring-4 focus:outline-none focus:ring-ui-purple' type="submit">
                            {loading ? <BeatLoader size={8} color="white" /> : "Submit"}
                        </button>
                    </div>
                </div>
            </form>
            <p className='text-2xl text-white py-8'>Work Efficiency: {workEfficiency}</p>
            <h3 className='text-2xl text-white py-8'>Downsampled Video -</h3>
            {videoSrc && <video width="640" height="360" controls>
                <source src={videoSrc} type="video/webm" />
                Your browser does not support the video tag.
            </video>}
        </div>
    );
};

export default VideoProcess;
