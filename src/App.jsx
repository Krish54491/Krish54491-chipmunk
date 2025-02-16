import React, { useEffect, useRef, useState } from "react";
import * as handpose from "@tensorflow-models/handpose";
import "@tensorflow/tfjs-backend-webgl";

const App = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [pdfLoaded, setPdfLoaded] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      const handposeModel = await handpose.load();
      setModel(handposeModel);
    };
    loadModel();
  }, []);

  useEffect(() => {
    const handlePdfLoaded = (event) => {
      setPdfLoaded(event.detail);
    };

    window.addEventListener('pdfLoaded', handlePdfLoaded);

    return () => {
      window.removeEventListener('pdfLoaded', handlePdfLoaded);
    };
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

          const changeInX = [];
          const changeInY = [];

          for (let i = 0; i < landmarks.length; i++) {
            const [x, y] = landmarks[i];
            if(i === 0){
              changeInX.push(x);
              changeInY.push(y);
            } else if(i === landmarks.length - 1){
              changeInX.push(x);
              changeInY.push(y);
            }
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = "white";
            ctx.fill();
          }
          //if(Math.abs(changeInX[0] - changeInX[1]) < 20 && Math.abs(changeInY[0] - changeInY[1]) <= 100){
            //console.log("Closed");
          //} else {
            //console.log("Open");
          //}
        });
      }
    }
    requestAnimationFrame(detectHands);
  };

  const resizeCanvas = () => {
    if (videoRef.current && canvasRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
    }
  };

  useEffect(() => {
    if (model && pdfLoaded) {
      startVideo();
      videoRef.current.onloadeddata = () => {
        resizeCanvas();
        detectHands();
      };
      window.addEventListener('resize', resizeCanvas);
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [model, pdfLoaded]);

  return (
      <>
        {pdfLoaded && (
            <>
              <div style={{ backgroundImage: "url('/loading.png')", width: "139px", height: "143px", top: "50%", position: "absolute", left: "50%", transform: "translate(-50%, -50%)" }}></div>
              <div className="relative w-640px h-480px">
              <video ref={videoRef} className="size-full"/>
              <canvas ref={canvasRef} className="size-full absolute top-0 left-0" />
            </div>

            </>
        )}
      </>
  );
};

export default App;