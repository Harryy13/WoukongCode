import { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, RotateCw } from 'lucide-react';

const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const Editorial = ({ secureUrl, thumbnailUrl, duration }) => {
    

    const videoRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [videoDuration, setVideoDuration] = useState(duration || 0);
    const [isHover, setIsHover] = useState(false);
    

    const togglePlayPause = () => {
        if (!videoRef.current) return;
        if (playing) {
            videoRef.current.pause(); // FIX: was `.Pause()` (capital P) — not a real method on HTMLMediaElement
        } else {
            videoRef.current.play();
        }
        setPlaying(!playing);
    };

    const skip = (amount) => {
        if (!videoRef.current) return;
        const max = videoRef.current.duration || videoDuration || 0;
        videoRef.current.currentTime = Math.min(Math.max(videoRef.current.currentTime + amount, 0), max);
    };

    const handleSeek = (e) => {
        if (!videoRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const max = videoRef.current.duration || videoDuration || 0;
        const newTime = Math.min(Math.max(percent * max, 0), max);
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    useEffect(() => {
        console.log(secureUrl);
        const video = videoRef.current;
        const handleUpdate = () => {
            if (video) setCurrentTime(video.currentTime);
        };
        const handleLoadedMetadata = () => {
            if (video) setVideoDuration(video.duration);
        };
        const handleEnded = () => setPlaying(false);

        if (video) {
            video.addEventListener('timeupdate', handleUpdate);
            video.addEventListener('loadedmetadata', handleLoadedMetadata);
            video.addEventListener('ended', handleEnded);
            return () => {
                video.removeEventListener('timeupdate', handleUpdate);
                video.removeEventListener('loadedmetadata', handleLoadedMetadata);
                video.removeEventListener('ended', handleEnded);
            };
        }
    }, []);

    if (!secureUrl) {
        return (
            <p className="text-sm text-[#7a6f56] tracking-[0.05em]">
                No editorial has been inscribed for this trial yet.
            </p>
        );
    }

    const progressPercent = videoDuration ? (currentTime / videoDuration) * 100 : 0;

    return (
        <div
            className="relative bg-black border border-[#c9a24b]/30 overflow-hidden group"
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
        >
            <video
                ref={videoRef}
                src={secureUrl}
                poster={thumbnailUrl}
                className="w-full aspect-video block cursor-pointer"
                onClick={togglePlayPause}
            />

            {/* center play button, shown while paused */}
            {!playing && (
                <button
                    type="button"
                    onClick={togglePlayPause}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <span className="w-16 h-16 rounded-full border-2 border-[#c9a24b] bg-[#0b0a08]/70 flex items-center justify-center shadow-[0_0_25px_-5px_rgba(201,162,75,0.7)]">
                        <Play size={26} className="text-[#c9a24b] ml-1" fill="currentColor" />
                    </span>
                </button>
            )}

            {/* bottom control bar */}
            <div
                className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0b0a08] via-[#0b0a08]/80 to-transparent px-4 pt-8 pb-3 flex items-center gap-3 transition-opacity duration-200 ${
                    playing && !isHover ? 'opacity-0' : 'opacity-100'
                }`}
            >
                <button type="button" onClick={() => skip(-10)} className="text-[#e9dfc7] hover:text-[#c9a24b] transition-colors" title="Back 10s">
                    <RotateCcw size={18} />
                </button>

                <button type="button" onClick={togglePlayPause} className="text-[#e9dfc7] hover:text-[#c9a24b] transition-colors">
                    {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                </button>

                <button type="button" onClick={() => skip(10)} className="text-[#e9dfc7] hover:text-[#c9a24b] transition-colors" title="Forward 10s">
                    <RotateCw size={18} />
                </button>

                <div
                    className="relative h-1.5 flex-1 bg-[#3a3226] cursor-pointer"
                    onClick={handleSeek}
                >
                    <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#e2be6d] to-[#c9a24b]"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                <span className="text-[11px] text-[#a89a78] tracking-[0.05em] shrink-0 tabular-nums">
                    {formatTime(currentTime)} / {formatTime(videoDuration)}
                </span>
            </div>
        </div>
    );
};

export default Editorial;