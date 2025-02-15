import React, { useEffect, useRef, useState } from "react";
import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

const App = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [handLandmarker, setHandLandmarker] = useState(null);
  const [runningMode, setRunningMode] = useState("IMAGE");
  const [webcamRunning, setWebcamRunning] = useState(false);

  useEffect(() => {
    const createHandLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU",
        },
        runningMode: runningMode,
        numHands: 2,
      });
      setHandLandmarker(landmarker);
    };
    createHandLandmarker();
  }, []);

  const handleClick = async (event) => {
    if (!handLandmarker) {
      console.log("Wait for handLandmarker to load before clicking!");
      return;
    }

    if (runningMode === "VIDEO") {
      setRunningMode("IMAGE");
      await handLandmarker.setOptions({ runningMode: "IMAGE" });
    }

    const handLandmarkerResult = handLandmarker.detect(event.target);
    console.log(handLandmarkerResult.handednesses?.[0]?.[0]);
  };

  const enableCam = () => {
    if (!handLandmarker) {
      console.log("Wait! HandLandmarker not loaded yet.");
      return;
    }

    setWebcamRunning(!webcamRunning);
  };

  useEffect(() => {
    if (!webcamRunning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");

    const constraints = { video: true };
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      video.srcObject = stream;
      video.addEventListener("loadeddata", predictWebcam);
    });

    let lastVideoTime = -1;

    const predictWebcam = async () => {
      canvasElement.width = video.videoWidth;
      canvasElement.height = video.videoHeight;
      
      if (runningMode === "IMAGE") {
        setRunningMode("VIDEO");
        await handLandmarker.setOptions({ runningMode: "VIDEO" });
      }

      let startTimeMs = performance.now();
      if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        const results = handLandmarker.detectForVideo(video, startTimeMs);
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        if (results.landmarks) {
          for (const landmarks of results.landmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
              color: "#00FF00",
              lineWidth: 5,
            });
            drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 2 });
          }
        }
      }
      if (webcamRunning) {
        requestAnimationFrame(predictWebcam);
      }
    };
  }, [webcamRunning, handLandmarker]);

  return (
    <div>
      <button onClick={enableCam}>{webcamRunning ? "DISABLE PREDICTIONS" : "ENABLE PREDICTIONS"}</button>
      <video ref={videoRef} id="webcam" autoPlay playsInline></video>
      <canvas ref={canvasRef} id="output_canvas"></canvas>
    </div>
  );
};

export default App;
