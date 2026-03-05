
import React, { useState, useRef, useEffect } from 'react';
import { Room, Character, CharacterId } from '../types';

interface RoomViewProps {
  room: Room;
  charactersInRoom: Character[];
  activeCharacterId: CharacterId | null;
  onCharacterClick: (charId: CharacterId) => void;
  imageUrl?: string; // Optional override for room background
  characterImages?: Record<string, string>; // Optional override for character portraits
  enableExploration?: boolean; // New prop to enable Pan/Zoom
}

export const RoomView: React.FC<RoomViewProps> = ({ 
  room, 
  charactersInRoom, 
  activeCharacterId, 
  onCharacterClick,
  imageUrl,
  characterImages = {},
  enableExploration = false
}) => {
  const displayImage = imageUrl || room.imageUrl;
  
  // State for Pan/Zoom
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom when room changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [room.id]);

  const handleWheel = (e: React.WheelEvent) => {
    if (!enableExploration) return;
    e.preventDefault();
    const zoomIntensity = 0.1;
    const newScale = Math.min(Math.max(1, scale + (e.deltaY < 0 ? zoomIntensity : -zoomIntensity)), 4);
    setScale(newScale);
    
    // Reset position if zoomed out completely
    if (newScale === 1) setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enableExploration) return;
    // Allow dragging even at scale 1 if the intention is to check boundaries, 
    // but usually we drag only when zoomed. 
    // However, if we change to object-contain, maybe we don't need to drag at scale 1?
    // Let's keep restriction: only drag if zoomed OR if we want to allow panning a large image (if we changed strategy).
    // For object-contain at scale 1, there is nothing to drag.
    if (scale === 1) return;

    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !enableExploration) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
    setScale(prev => {
        const next = Math.max(prev - 0.5, 1);
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
    });
  };
  const handleReset = () => {
      setScale(1);
      setPosition({ x: 0, y: 0 });
  };

  return (
    <div 
        ref={containerRef}
        className={`relative w-full h-full bg-black overflow-hidden shadow-2xl border-b border-neutral-800`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
    >
      {/* Background Image with Transform */}
      <img 
        src={displayImage} 
        alt={room.name}
        draggable={false}
        style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            cursor: enableExploration 
              ? (isDragging ? 'grabbing' : (scale > 1 ? 'grab' : 'zoom-in')) 
              : 'default'
        }}
        className={`absolute inset-0 w-full h-full select-none ${
            enableExploration 
              ? 'object-cover bg-neutral-900' 
              : 'object-cover opacity-50 transition-opacity duration-1000 animate-fade-in'
        }`}
      />
      
      {!enableExploration && (
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-90 pointer-events-none"></div>
      )}
      
      {/* Zoom Controls (Only visible in Exploration Mode) */}
      {enableExploration && (
          <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
              <button onClick={handleZoomIn} className="w-10 h-10 bg-black/70 hover:bg-amber-600 text-white rounded-full border border-neutral-600 font-bold shadow-lg transition-colors flex items-center justify-center" title="Acercar">
                  +
              </button>
              <button onClick={handleZoomOut} className="w-10 h-10 bg-black/70 hover:bg-neutral-700 text-white rounded-full border border-neutral-600 font-bold shadow-lg transition-colors flex items-center justify-center" title="Alejar">
                  -
              </button>
               <button onClick={handleReset} className="w-10 h-10 bg-black/70 hover:bg-neutral-700 text-white rounded-full border border-neutral-600 font-bold shadow-lg transition-colors flex items-center justify-center text-xs" title="Reiniciar">
                  RST
              </button>
              <div className="mt-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md border border-neutral-700 text-center pointer-events-none">
                  Zoom y Arrastrar
              </div>
          </div>
      )}

      {/* Room Overlay Name */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <h2 className="text-2xl font-bold tracking-tighter text-neutral-200 uppercase drop-shadow-md">{room.name}</h2>
        <div className="h-1 w-12 bg-amber-600 mt-1 mb-2 shadow-sm"></div>
        <p className="text-xs text-neutral-300 font-mono tracking-wide max-w-xs drop-shadow-md bg-black/30 p-1 rounded">{room.description}</p>
      </div>

      {/* Characters - Flex container that centers content */}
      <div 
        className="absolute bottom-0 w-full flex justify-center items-end space-x-2 md:space-x-8 px-4 h-[85%] pointer-events-none z-10 pb-4"
        style={{ opacity: enableExploration && scale > 1.2 ? 0 : 1, transition: 'opacity 0.3s' }}
      >
        {charactersInRoom.map((char) => {
          const isActive = activeCharacterId === char.id;
          const charImageSrc = characterImages[char.id] || char.imageUrl;
          
          return (
            <div 
              key={char.id}
              onClick={() => onCharacterClick(char.id)}
              className={`
                relative transition-all duration-500 cursor-pointer pointer-events-auto group flex flex-col justify-end
                ${isActive ? 'scale-105 z-20 brightness-110 grayscale-0' : 'scale-95 opacity-60 hover:opacity-100 hover:scale-100 grayscale hover:grayscale-0'}
              `}
            >
              <div className="relative flex flex-col items-center">
                 <img 
                  src={charImageSrc} 
                  alt={char.name}
                  className={`h-48 md:h-64 lg:h-[32rem] max-h-full w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] transition-all duration-500`}
                />
                
                {/* Character Name Tag */}
                <div className={`
                  mt-4 bg-black/80 backdrop-blur text-white text-[10px] md:text-xs uppercase tracking-[0.2em] px-3 py-1 border-b-2 border-amber-600
                  transition-all duration-300 transform
                  ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0'}
                `}>
                  {char.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
