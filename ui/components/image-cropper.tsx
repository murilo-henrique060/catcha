import React, { useRef, useState, useEffect } from 'react';

import { CardWidget } from '../widgets/card';
import { CardFace, CardRarity } from '../widgets/card-types';

type ImageCropperProps = {
  imageFile: File | null;
  onCropChange: (blob: Blob | null) => void;
  cardTitle: string;
  cardRarity: string;
  watermark?: string;
};

const mapRarity = (rarity: string): CardRarity => {
  switch (rarity) {
    case "S": return CardRarity.S;
    case "A": return CardRarity.A;
    case "B": return CardRarity.B;
    default: return CardRarity.C;
  }
};

export function ImageCropper({ imageFile, onCropChange, cardTitle, cardRarity, watermark }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Load image when file changes
  useEffect(() => {
    if (!imageFile) {
      setImageObj(null);
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    const img = new Image();
    img.src = url;
    img.onload = () => {
      setImageObj(img);
      // Auto-scale to cover
      const canvasW = 250;
      const canvasH = 350;
      const scaleX = canvasW / img.width;
      const scaleY = canvasH / img.height;
      const scale = Math.max(scaleX, scaleY);
      setZoom(scale);
      setOffsetX((canvasW - img.width * scale) / 2);
      setOffsetY((canvasH - img.height * scale) / 2);
    };
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Canvas will be transparent by default

    ctx.save();
    // Clip to canvas bounds (already handled by canvas element, but just in case)
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.clip();

    ctx.drawImage(
      imageObj,
      offsetX,
      offsetY,
      imageObj.width * zoom,
      imageObj.height * zoom
    );

    ctx.restore();

    // Export to blob
    canvas.toBlob((blob) => {
      onCropChange(blob);
    }, 'image/webp', 0.9);

  }, [imageObj, zoom, offsetX, offsetY, onCropChange]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    setDragStart({ x: clientX, y: clientY });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;
    setOffsetX(prev => prev + dx);
    setOffsetY(prev => prev + dy);
    setDragStart({ x: clientX, y: clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!imageFile) return null;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div 
        className="relative touch-none"
        style={{ width: 250, height: 350, cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <CardWidget
          className="w-full h-full pointer-events-none"
          title={cardTitle}
          rarity={mapRarity(cardRarity)}
          start_face={CardFace.FRONT}
          watermark={watermark}
        >
          <canvas 
            ref={canvasRef} 
            width={250} 
            height={350} 
            className="w-full h-full object-cover"
          />
        </CardWidget>
      </div>
      <div className="flex flex-col w-full px-4 gap-1">
        <label className="text-[10px] font-extrabold uppercase text-gray-500 tracking-wider">Zoom</label>
        <input 
          type="range" 
          min={0.1} 
          max={3} 
          step={0.01} 
          value={zoom} 
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="w-full accent-[#B01070]"
        />
      </div>
    </div>
  );
}
