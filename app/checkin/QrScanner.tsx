"use client";

import jsQR from "jsqr";
import { useEffect, useRef, useState } from "react";

type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>>;
};

type BarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => BarcodeDetectorLike;

type QrScannerProps = {
  onScan: (value: string) => void;
  active: boolean;
};

export function QrScanner({ onScan, active }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastValueRef = useRef<string | null>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!active) {
      return;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;
    let animationFrame: number | null = null;

    const barcodeDetectorCtor =
      "BarcodeDetector" in window
        ? (
            window as unknown as {
              BarcodeDetector: BarcodeDetectorConstructor;
            }
          ).BarcodeDetector
        : null;
    const barcodeDetector = barcodeDetectorCtor
      ? new barcodeDetectorCtor({ formats: ["qr_code"] })
      : null;

    const handleDecoded = (value: string) => {
      if (value !== lastValueRef.current) {
        lastValueRef.current = value;
        onScanRef.current(value);
      }
    };

    const tick = async () => {
      const video = videoRef.current;
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrame = requestAnimationFrame(tick);
        return;
      }

      if (barcodeDetector) {
        try {
          const results = await barcodeDetector.detect(video);
          if (results.length > 0) {
            handleDecoded(results[0].rawValue);
          }
        } catch {
          // Ignore transient decode errors and keep scanning.
        }
      } else {
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (canvas && context) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          );
          const decoded = jsQR(
            imageData.data,
            imageData.width,
            imageData.height,
          );
          if (decoded) {
            handleDecoded(decoded.data);
          }
        }
      }

      animationFrame = requestAnimationFrame(tick);
    };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((mediaStream) => {
        if (cancelled) {
          for (const track of mediaStream.getTracks()) {
            track.stop();
          }
          return;
        }
        stream = mediaStream;
        setError(null);
        const video = videoRef.current;
        if (video) {
          video.srcObject = mediaStream;
          video.play();
        }
        animationFrame = requestAnimationFrame(tick);
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Camera access denied or unavailable. Use manual entry instead.",
          );
        }
      });

    return () => {
      cancelled = true;
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
      }
      lastValueRef.current = null;
    };
  }, [active]);

  if (!active) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-square w-full max-w-sm overflow-hidden rounded border border-gray-300 bg-black dark:border-gray-700">
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover"
        />
      </div>
      <canvas ref={canvasRef} className="hidden" />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
