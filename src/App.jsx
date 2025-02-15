import React, { useEffect, useRef, useState } from "react";
import * as handpose from "@tensorflow-models/handpose";
import "@tensorflow/tfjs-backend-webgl";

const App = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);

  useEffect(() => {
    const loadModel = async () => {
      const handposeModel = await handpose.load();
      setModel(handposeModel);
    };
    loadModel();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    });
  };

  const detectHands = async () => {
    if (model && videoRef.current.readyState === 4) {
      const video = videoRef.current;
      const predictions = await model.estimateHands(video);

      if (predictions.length > 0) {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        predictions.forEach((prediction) => {
          const landmarks = prediction.landmarks;

          for (let i = 0; i < landmarks.length; i++) {
            const [x, y] = landmarks[i];
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = "red";
            ctx.fill();
            console.log(x + " " + y)
          }
        });
      }
    }
    requestAnimationFrame(detectHands);
  };

  useEffect(() => {
    if (model) {
      startVideo();
      videoRef.current.onloadeddata = () => {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        detectHands();
      };
    }
  }, [model]);

  return (
    <>
    <div className="relative w-640px h-480px">
      <video ref={videoRef} className="size-full"/>
      <canvas ref={canvasRef} className="size-full absolute top-0 left-0" />
    </div>
    
  </>
  );
};

export default App;

