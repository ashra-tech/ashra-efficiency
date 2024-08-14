import React, { Fragment, useEffect, useState } from "react";
import { BeatLoader } from "react-spinners";
import Swal from "sweetalert2";

const VideoProcessor = () => {
  const [fileName, setFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workEfficiency, setWorkEfficiency] = useState(0);
  const [logs, setLogs] = useState("");
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState(null);
  const [duration, setDuration] = useState(0);

  console.log("logs>>>>>", logs);

  const loadPyodideAndPackages = async () => {
    let pyodide = await window.loadPyodide({
      stdout: (message) => {
        console.log("Pyodide stdout:", message); // Redirect stdout to custom handler
      },
      stderr: (message) => {
        console.error("Pyodide stderr:", message); // Redirect stderr to custom handler
      },
    });
    await pyodide.loadPackage("numpy");
    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");
    await micropip.install("opencv-python");
    return pyodide;
  };

  const successAlert = () => {
    Swal.fire({
      icon: "success",
      title: "Video Processed Successfully!",
      confirmButtonText: "OK",
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.reload();
      }
    });
  };

  const warning = () => {
    Swal.fire({
      icon: "warning",
      title: " Please upload video to processing.",
      confirmButtonText: "OK",
    });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
    } else {
      setFileName("");
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

  //   const processVideoWithPyodide = async (videoBlob) => {
  //     try {
  //       const pyodide = await loadPyodideAndPackages();

  //       const fileReader = new FileReader();
  //       fileReader.onload = async function (event) {
  //         try {
  //           const arrayBuffer = event.target.result;
  //           pyodide.FS.writeFile("input_video.mp4", new Uint8Array(arrayBuffer));

  //         // Define the js_update_progress function to be used in Python
  //         pyodide.globals.set("js_update_progress", pyodide.toPy((progress) => {
  //           setProgress(progress);
  //         }));

  //           // Define the js_log function to capture log messages
  //           pyodide.globals.set("js_log", pyodide.toPy((message) => {
  //             setLogs((prevLogs) => [...prevLogs, message]);
  //           }));

  //           //       const pythonCode = `
  //           // import cv2
  //           // import numpy as np

  //           // process_fps = 1/60
  //           // video_path = 'input_video.mp4'

  //           // def work_efficiency(current_frame):
  //           //     current_frame = current_frame / 255.0
  //           //     global prev_frame
  //           //     if prev_frame is None:
  //           //         prev_frame = current_frame
  //           //         return 0

  //           //     diff = np.mean(np.abs(current_frame - prev_frame))
  //           //     efficiency = (diff > 0.01).astype(int)
  //           //     prev_frame = current_frame
  //           //     return efficiency

  //           // video = cv2.VideoCapture(video_path)
  //           // original_fps = video.get(cv2.CAP_PROP_FPS)
  //           // frame_interval = int(original_fps // process_fps)

  //           // global prev_frame
  //           // prev_frame = None
  //           // efficiencies = []

  //           // frame_count = 0
  //           // while True:
  //           //     success, frame = video.read()
  //           //     if not success:
  //           //         break

  //           //     if frame_count % frame_interval == 0:
  //           //         frame = cv2.resize(frame, (320, 180), interpolation=cv2.INTER_NEAREST)
  //           //         efficiency = work_efficiency(frame)
  //           //         efficiencies.append(efficiency)

  //           //     frame_count += 1

  //           // video.release()

  //           // average_efficiency = np.mean(efficiencies) if efficiencies else 0
  //           // average_efficiency
  //           //                 `;

  //           const pythonCode = `
  // import cv2
  // import numpy as np
  // import sys

  // # Redirect print to js_log
  // class JSLogger:
  //     def write(self, message):
  //         if message.strip():  # Avoid sending empty messages
  //             js_log(message)

  //     def flush(self):
  //         pass

  // sys.stdout = JSLogger()

  // process_fps = 1/60
  // video_path = 'input_video.mp4'

  // print("Starting video processing...")

  // def work_efficiency(current_frame):
  //     current_frame = current_frame / 255.0
  //     global prev_frame
  //     if prev_frame is None:
  //         prev_frame = current_frame
  //         return 0

  //     diff = np.mean(np.abs(current_frame - prev_frame))
  //     efficiency = (diff > 0.01).astype(int)
  //     prev_frame = current_frame
  //     return efficiency

  // print("Opening video file...")
  // video = cv2.VideoCapture(video_path)
  // original_fps = video.get(cv2.CAP_PROP_FPS)
  // frame_interval = int(original_fps // process_fps)
  // total_frames = int(video.get(cv2.CAP_PROP_FRAME_COUNT))  # Get total frame count

  // print(f"Video opened. Original FPS: {original_fps}, Total frames: {total_frames}")

  // global prev_frame
  // prev_frame = None
  // efficiencies = []

  // frame_count = 0

  // print("Processing frames...")
  // while True:
  //     success, frame = video.read()
  //     if not success:
  //         print("Finished reading all frames.")
  //         break

  //     if frame_count % frame_interval == 0:
  //         frame = cv2.resize(frame, (320, 180), interpolation=cv2.INTER_NEAREST)
  //         efficiency = work_efficiency(frame)
  //         efficiencies.append(efficiency)
  //         progress = int((frame_count / total_frames) * 100)  # Calculate progress
  //         js_update_progress(progress)  # Call the JS function to update progress
  //         print(f"Processed frame {frame_count}/{total_frames}, progress: {progress}%")

  //     frame_count += 1

  // video.release()

  // average_efficiency = np.mean(efficiencies) if efficiencies else 0
  // print(f"Final average efficiency: {average_efficiency}")
  // average_efficiency
  //         `;

  //           const efficiency = pyodide.runPython(pythonCode);
  //           console.log(
  //             "Processing executed successfully. Efficiency:",
  //             efficiency
  //           );
  //           localStorage.setItem("workEfficiency", efficiency);
  //           successAlert();
  //           setLoading(false);
  //         } catch (innerError) {
  //           console.error("Error during Python code execution:", innerError);
  //           throw innerError;
  //         }
  //       };
  //       fileReader.onerror = (error) => {
  //         console.error("Error reading file:", error);
  //         throw error;
  //       };
  //       fileReader.readAsArrayBuffer(videoBlob);
  //     } catch (error) {
  //       console.error("Error in processVideoWithPyodide:", error.message);
  //       console.error(error); // Log the full error object for more details
  //       setLoading(false);
  //       throw error; // Rethrow the error to be caught by the handleSubmit function
  //     }
  //   };

  const processVideoWithPyodide = async (videoBlob) => {
    try {
      const pyodide = await loadPyodideAndPackages();

      const fileReader = new FileReader();
      fileReader.onload = async function (event) {
        try {
          const arrayBuffer = event.target.result;
          pyodide.FS.writeFile("input_video.mp4", new Uint8Array(arrayBuffer));

          pyodide.globals.set(
            "js_update_progress",
            pyodide.toPy((progress) => {
              setProgress(progress);
            })
          );

          pyodide.globals.set(
            "js_log",
            pyodide.toPy((message) => {
              setLogs(message);
            })
          );

          pyodide.globals.set(
            "js_update_step",
            pyodide.toPy((currentStep, totalSteps) => {
              setSteps(`${currentStep}/${totalSteps}`);
            })
          );

          const pythonSetupCode = `
import cv2
import numpy as np
import sys

class JSLogger:
    def write(self, message):
        if message.strip():
            js_log(message)

    def flush(self):
        pass

sys.stdout = JSLogger()

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
total_frames = int(video.get(cv2.CAP_PROP_FRAME_COUNT))  # Get total frame count

# Calculate video duration in seconds
duration_seconds = total_frames / original_fps

# Convert seconds to hours, minutes, and seconds
hours = int(duration_seconds // 3600)
minutes = int((duration_seconds % 3600) // 60)
seconds = int(duration_seconds % 60)

# Format the duration as hours:minutes:seconds
duration_formatted = f"{hours:02}:{minutes:02}:{seconds:02}"
print(f"Video Duration: {duration_formatted}")



# Calculate the total number of steps
chunk_size = 100
total_steps = (total_frames + chunk_size - 1) // chunk_size  # Round up to ensure all frames are covered

print(f"Processing Started.Total frames: {total_frames}")

global prev_frame
prev_frame = None
efficiencies = []
frame_count = 0
current_step = 0

def process_frames_chunk():
    global frame_count, current_step
    finished = False
    current_step += 1
    js_update_step(current_step, total_steps)
    
    while frame_count < total_frames:
        success, frame = video.read()
        if not success:
            finished = True
            break

        if frame_count % frame_interval == 0:
            frame = cv2.resize(frame, (320, 180), interpolation=cv2.INTER_NEAREST)
            efficiency = work_efficiency(frame)
            efficiencies.append(efficiency)
            progress = int((frame_count / total_frames) * 100)  # Calculate progress
            js_update_progress(progress)  # Call the JS function to update progress
            print(f"{frame_count}/{total_frames}")

        frame_count += 1

        if frame_count % chunk_size == 0:  # Process in chunks
            break

    if frame_count >= total_frames:
        finished = True
    
    return 'true' if finished else 'false'

    # Return the formatted duration
duration_formatted
                `;

          // Run the setup code
          // await pyodide.runPythonAsync(pythonSetupCode);

          // Run the setup code and get the video duration
          const videoDuration = await pyodide.runPythonAsync(pythonSetupCode);
          localStorage.setItem("duration", videoDuration);

          // Process frames in chunks
          while (true) {
            const finished = await pyodide.runPythonAsync(
              "process_frames_chunk()"
            );

            if (finished === "true") break;

            await new Promise(requestAnimationFrame); // Yield to the UI thread
          }

          // Finalization Code
          const finalizationCode = `
video.release()
average_efficiency = np.mean(efficiencies) if efficiencies else 0
print(f"Processing completed. ")
average_efficiency
                `;

          const efficiency = await pyodide.runPythonAsync(finalizationCode);
          console.log(
            "Processing executed successfully. Efficiency:",
            efficiency
          );
          localStorage.setItem("workEfficiency", efficiency);
          successAlert();
          setLoading(false);
        } catch (innerError) {
          console.error("Error during Python code execution:", innerError);
          setLoading(false);
          throw innerError;
        }
      };
      fileReader.onerror = (error) => {
        console.error("Error reading file:", error);
        setLoading(false);
        throw error;
      };
      fileReader.readAsArrayBuffer(videoBlob);
    } catch (error) {
      console.error("Error in processVideoWithPyodide:", error.message);
      setLoading(false);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const videoInput = document.getElementById("video-file");
    if (videoInput && videoInput.files.length > 0) {
      const file = videoInput.files[0];
      const videoBlob = new Blob([file], { type: "video/mp4" });

      setLoading(true);

      try {
        // console.log("Starting processing...");
        await processVideoWithPyodide(videoBlob);
      } catch (error) {
        console.error("Error processing the video:", error);
        alert(
          "Failed to process the video. Please check the console for more details."
        );
      }
    } else {
      warning();
      console.log("No video file selected");
    }
  };

  useEffect(() => {
    const storedEfficiency = localStorage.getItem("workEfficiency");
    const videoDuration = localStorage.getItem("duration");
    if (videoDuration) {
      setDuration(videoDuration);
    }
    if (storedEfficiency) {
      setWorkEfficiency(parseFloat(storedEfficiency));
    }
  }, [loading == false]);

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
              className={`shadow-xl flex flex-col items-center justify-center lg:w-96 w-96 lg:h-96 h-96 border-2 border-dashed rounded-lg hover:border-ui-purple cursor-pointer backdrop-blur-2xl ${
                dragActive
                  ? "border-ui-purple backdrop-blur-2xl"
                  : "border-gray-300"
              }`}
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
                  <span className="text-gray-400">
                    {fileName ?? "Unknown file selected"}
                  </span>
                ) : (
                  <Fragment>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">
                        Click or drop file to upload
                      </span>
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
          <div className="w-full flex flex-col items-center gap-4 pt-4">
            {loading &&
              (logs ? (
                <p className="text-sm text-white">
                  Processed:{" "}
                  <span className="text-[#cc00cc] font-bold">{logs}</span> frame
                </p>
              ) : (
                <p className="text-sm text-white">Loading plugins</p>
              ))}
            <div className="flex items-center gap-4">
              <button
                className={`font-medium text-center inline-flex items-center text-white/90  border-ui-purple rounded-full focus:ring-4 focus:outline-none focus:ring-ui-purple overflow-hidden ${
                  loading ? "" : "bg-ui-purple py-2 px-3 hover:bg-ui-purple/80 "
                }`}
                type="submit"
              >
                {loading ? (
                  <div
                    className=" border-ui-purple focus:ring-ui-purple"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: `#cc00cc`,
                    }}
                  >
                    <p className="flex items-end p-2">
                      Processing
                      <BeatLoader size={8} color="white" />{" "}
                    </p>
                  </div>
                ) : (
                  "Submit"
                )}
              </button>
              {loading && (
                <p className="text-2xl text-white">
                  {progress}
                  <span className="text-[#cc00cc] font-bold">%</span>
                </p>
              )}
            </div>
            {loading &&
              (steps ? (
                <p className="text-sm text-white">
                  Completed:{" "}
                  <span className="text-[#cc00cc] font-bold">{steps}</span> step
                </p>
              ) : (
                <p className="text-white text-sm">
                  Completed:{" "}
                  <span className="text-[#cc00cc] font-bold">0/0</span> steps
                </p>
              ))}
          </div>
        </div>
      </form>
      <p className="text-2xl text-white py-8 flex items-center gap-2">
        Work Efficiency:{" "}
        {loading ? (
          <BeatLoader size={8} color="white" className="pt-2" />
        ) : (
          `${workEfficiency}`
        )}
      </p>
      <p className="text-2xl text-white py-8 flex items-center gap-2">
        Video Duration:{" "}
        {loading ? (
          <BeatLoader size={8} color="white" className="pt-2" />
        ) : (
          `${duration}`
        )}
      </p>
    </div>
  );
};

export default VideoProcessor;
