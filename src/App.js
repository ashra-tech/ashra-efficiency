import { BeatLoader } from 'react-spinners';
import './App.css';
import { Fragment, useEffect, useState } from 'react';

function App() {

  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false)
  const [videoSrc, setVideoSrc] = useState(null)
  const [loading, setLoading] = useState(false)
  const[processedVideoUrl,setProcessedVideoUrl] = useState(null)
  const [videoStored, setVideoStored] = useState(false);

  useEffect(()=>{
    console.log("videoSrc", videoSrc);

  },[videoSrc])


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
      setFileName(file?.name)
    }
    setDragActive(false);
  }

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  }

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  }

  // Utility function to open IndexedDB 
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

  // Utility function to store a file in IndexedDB
  const storeVideo = async (blob) => {
    const db = await openDatabase();
    const transaction = db.transaction(['videos'], 'readwrite');
    const store = transaction.objectStore('videos');
  
    return new Promise((resolve, reject) => {
      const request = store.put({ id: 'videoFile', file: blob });
  
      request.onsuccess = () => {
        console.log('Downsampled video stored in IndexedDB successfully.');
        setVideoStored(true);
        resolve();
      };
  
      request.onerror = (event) => {
        console.error('Error storing video:', event.target.errorCode);
        reject('Error storing video:', event.target.errorCode);
      };
    });
  };

  // Utility function to retrieve a file from IndexedDB
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

  // Utility function to remove a file from IndexedDB
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

  // const downsampleVideo = (video) => {
  //   return new Promise((resolve, reject) => {
  //     console.log("Starting video downsampling...");

  //     const canvas = document.createElement('canvas');
  //     const context = canvas.getContext('2d');

  //     const width = 640;
  //     const height = 360;
  //     canvas.width = width;
  //     canvas.height = height;

  //     const outputChunks = [];
  //     const mediaRecorder = new MediaRecorder(canvas.captureStream(), {
  //       mimeType: 'video/webm; codecs=vp8',
  //     });

  //     mediaRecorder.ondataavailable = (event) => {
  //       if (event.data.size > 0) {
  //         outputChunks.push(event.data);
  //         console.log("Captured a chunk of data: ", event.data.size, "bytes");
  //       }
  //     };

  //     mediaRecorder.onstop = () => {
  //       console.log("MediaRecorder stopped.")
  //       const outputBlob = new Blob(outputChunks, { type: 'video/webm' });
  //       const outputUrl = URL.createObjectURL(outputBlob);
  //       console.log("Downsampling complete. Generated video URL: ", outputUrl);
  //       resolve(outputUrl);
  //     };

  //     let currentTime = 0;

  //     const captureFrame = () => {
  //       if (currentTime >= video.duration) {
  //         console.log("Reached the end of the video. Stopping recording.");
  //         mediaRecorder.stop();
  //         return;
  //       }

  //       console.log("Setting current time to: ", currentTime, "seconds");

  //       video.currentTime = currentTime;

  //       video.onseeked = () => {
  //         try {
  //         console.log("Seeking complete, capturing frame at time: ", currentTime);
  //         context.drawImage(video, 0, 0, width, height);
  //         currentTime += 30; // Move 30 seconds forward
  //         captureFrame();
  //       } catch (error) {
  //         console.error("Error capturing frame: ", error);
  //         reject(error);
  //       }
  //       };
  //     };

  //     video.onloadeddata = () => {
  //       mediaRecorder.start();
  //       captureFrame();
  //     };

  //     video.onerror = (e) => reject(e);
  //   });
  // };

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
      });
  
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          outputChunks.push(event.data);
          console.log("Captured a chunk of data: ", event.data.size, "bytes");
        }
      };
  
      mediaRecorder.onstop = () => {
        console.log("MediaRecorder stopped.");
        const outputBlob = new Blob(outputChunks, { type: 'video/webm' });
        const outputUrl = URL.createObjectURL(outputBlob);
        console.log("Downsampling complete. Generated video URL: ", outputUrl);
        resolve(outputUrl);
      };
  
      let currentTime = 0;
  
      const captureFrame = () => {
        if (currentTime >= video.duration) {
          console.log("Reached the end of the video. Stopping recording.");
          mediaRecorder.stop();
          return;
        }
  
        console.log("Setting current time to: ", currentTime, "seconds");
  
        video.currentTime = currentTime;
  
        video.onseeked = () => {
          try {
            console.log("Seeking complete, capturing frame at time: ", currentTime);
            context.drawImage(video, 0, 0, width, height);
            currentTime += 30; // Move 30 seconds forward
            captureFrame();
          } catch (error) {
            console.error("Error capturing frame: ", error);
            reject(error);
          }
        };
  
        video.onerror = (e) => {
          console.error("Video error: ", e);
          reject(e);
        };
      };
  
      video.onloadeddata = () => {
        console.log("Video data loaded, starting the MediaRecorder.");
        mediaRecorder.start();
        captureFrame();
      };
  
      video.onerror = (e) => {
        console.error("Error loading video data: ", e);
        reject(e);
      };
    });
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const videoInput = document.getElementById('video-file');
  
    if (videoInput && videoInput.files.length > 0) {
      const file = videoInput.files[0];
      const uploadedUrl = URL.createObjectURL(file);
  
      setLoading(true);
  
      try {
        await removeVideo();  // Remove any previously stored video
        const video = document.createElement('video');
        video.src = uploadedUrl;
  
        const processedUrl = await downsampleVideo(video);
  
        // Fetch the Blob data from the processed URL for storing in IndexedDB
        const response = await fetch(processedUrl);
        const videoBlob = await response.blob();
  
        await storeVideo(videoBlob);  // Store the downsampled video Blob in IndexedDB
  
        setProcessedVideoUrl(processedUrl);  // Set the processed video URL to display
  
        setLoading(false);
      } catch (error) {
        console.error('Error processing the video:', error);
        alert('Failed to process the video. Please try again.');
        setLoading(false);
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
  
   
      fetchVideoFromIndexedDB();
    
  }, []);


  return (
    <div className="flex flex-col items-center  bg-black h-screen">
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
          <div className=" w-full  pt-2 lg:pt-4">
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
                {
                  fileName ? (
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
              {loading ? ('Processing', <BeatLoader size={8} color="white" />) : "Submit"}
            </button>
          </div>

        </div>
      </form>
      {
        videoSrc && <video width="640" height="360" controls>
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      }
    </div>
  );
}

export default App;
