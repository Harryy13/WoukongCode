import { useLocation, NavLink } from "react-router";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { UploadCloud, CheckCircle2, FileVideo } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import axios from 'axios';

const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
        size /= 1024;
        i++;
    }
    return `${size.toFixed(1)} ${units[i]}`;
};

const formatDuration = (sec) => {
    if (sec === null || sec === undefined || isNaN(sec)) return '--:--';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

function VideoUpload() {
    
    const location = useLocation();
    const { problemId, title } = location.state || {};


    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedVideo, setUploadedVideo] = useState(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        reset,
        setError,
        clearErrors,
    } = useForm();

    const selectedFile = watch('videoFile')?.[0];

    const onSubmit = async (data) => {
        const file = data.videoFile[0];
        setUploading(true);
        setUploadProgress(0);
        clearErrors();

        try {
            // FIX: backend now reads problemId from req.params and userId
            // from req.result._id (auth middleware) — so this is a GET with
            // the problem id in the URL, no body needed at all.
            const signRes = await axiosClient.get(`/vid/create/${problemId}`);

            const {
                signature,
                timestamp,
                public_id,
                api_key,
                cloud_name,
                upload_url,
            } = signRes.data;

            // FIX: `new formData()` (lowercase) isn't a real constructor —
            // the browser's built-in class is `FormData` (capital F).
            const formData = new FormData();

            formData.append('file', file);
            // FIX: `.appen(...)` typo -> `.append(...)`, on all four lines below.
            formData.append('signature', signature);
            formData.append('timestamp', timestamp);
            formData.append('public_id', public_id);
            formData.append('api_key', api_key);

            // FIX: `axios(upload_url, formData, {...})` is not valid axios
            // usage — axios(url, config) only takes two arguments, so
            // `formData` was being treated as the config object and the
            // real config (headers, progress handler) was silently
            // dropped. Use axios.post(url, data, config) instead.
            // Also removed the manual Content-Type header — axios/the
            // browser sets the correct multipart boundary automatically
            // for FormData; setting it manually without a boundary breaks
            // the upload.
            const uploadRes = await axios.post(upload_url, formData, {
                onUploadProgress: (progressEvent) => {
                    // FIX: axios's config key is `onUploadProgress`, not
                    // `uploadProgress` — the old key was silently ignored,
                    // so the progress bar never moved.
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(progress);
                },
            });

            const cloudinaryResult = uploadRes.data;

            // FIX: same "not a real axios call" bug as above — `axiosClient(url, data)`
            // treats `data` as request config, not a JSON body. Use `.post()`.
            // Also fixed the double slash `/vid//save` -> `/vid/save`.
            const metadataResponse = await axiosClient.post('/vid/save', {
                problemId,
                cloudinaryPublicId: cloudinaryResult.public_id,
                // FIX: Cloudinary's response field is `secure_url` (snake_case),
                // not `secureUrl` — this was always undefined before.
                secureUrl: cloudinaryResult.secure_url,
                // FIX: cloudinaryUrl was never sent at all, but the backend
                // schema/controller both expect it.
                cloudinaryUrl: cloudinaryResult.url,
                duration: cloudinaryResult.duration,
            });

            // FIX: was `metadataResponse.videoSolution` — axios responses are
            // wrapped in `.data`, and the backend's field is the lowercase
            // `videosolution`, not `videoSolution`.
            setUploadedVideo(metadataResponse.data.videosolution);
            reset();
        } catch (err) {
            console.error('upload error', err);
            setError('root', {
                type: 'manual', // FIX: was the typo 'manuall'
                // FIX: was `err.respose` (typo) -> `err.response`
                message: err.response?.data?.error || err.response?.data?.message || 'Upload failed, please try again',
            });
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    if (!problemId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0b0a08] px-4 text-center">
                <p className="text-sm text-[#c0453d]">No trial was selected to upload a solution for.</p>
                <NavLink to="/admin/video" className="text-[11px] tracking-[0.15em] uppercase text-[#3d7fc0] hover:text-[#63a0dd] transition-colors">
                    ← Back to Video Solutions
                </NavLink>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative bg-[#0b0a08] overflow-x-hidden px-4 py-16">
            {/* ambient background: mist + glow */}
            <div className="pointer-events-none fixed inset-0">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-[#c9a24b]/10 blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[#3d7fc0]/10 blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-xl mx-auto">
                {/* header / seal */}
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-14 h-14 rounded-full border-2 border-[#3d7fc0] flex items-center justify-center mb-4 shadow-[0_0_25px_-5px_rgba(61,127,192,0.6)]">
                        <span className="text-[#3d7fc0] text-2xl font-bold">悟</span>
                    </div>
                    <h1 className="font-serif tracking-[0.2em] text-2xl sm:text-3xl text-[#e9dfc7] uppercase">
                        Record the Path
                    </h1>
                    <div className="flex items-center gap-2 mt-3">
                        <span className="h-px w-8 bg-[#3d7fc0]/50" />
                        <p className="text-[11px] tracking-[0.25em] text-[#3d7fc0]/80 uppercase">
                            Upload a Solution Video
                        </p>
                        <span className="h-px w-8 bg-[#3d7fc0]/50" />
                    </div>
                    {title && (
                        <p className="mt-4 text-sm text-[#a89a78]">
                            For trial: <span className="text-[#e9dfc7]">{title}</span>
                        </p>
                    )}
                </div>

                <div className="bg-[#141210]/95 border border-[#3d7fc0]/30 shadow-[0_0_60px_-10px_rgba(61,127,192,0.25)] px-6 py-8 sm:px-8">
                    {uploadedVideo ? (
                        <div className="flex flex-col items-center text-center gap-4 py-6">
                            <CheckCircle2 size={40} className="text-[#4f9d63]" />
                            <p className="font-serif tracking-[0.1em] text-lg text-[#e9dfc7] uppercase">
                                Video Recorded
                            </p>
                            {uploadedVideo.thumbnailUrl && (
                                <img
                                    src={uploadedVideo.thumbnailUrl}
                                    alt="Video thumbnail"
                                    className="w-full max-w-xs border border-[#3a3226]"
                                />
                            )}
                            <p className="text-sm text-[#a89a78]">
                                Duration: {formatDuration(uploadedVideo.duration)}
                            </p>
                            <div className="flex gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setUploadedVideo(null)}
                                    className="text-[11px] tracking-[0.15em] uppercase px-4 py-2 border border-[#3d7fc0]/50 text-[#3d7fc0] hover:bg-[#3d7fc0]/10 transition-colors"
                                >
                                    Upload Another
                                </button>
                                <NavLink
                                    to="/admin/video"
                                    className="text-[11px] tracking-[0.15em] uppercase px-4 py-2 border border-[#3a3226] text-[#a89a78] hover:border-[#c9a24b]/60 transition-colors"
                                >
                                    Back to List
                                </NavLink>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                            <label
                                htmlFor="videoFile"
                                className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#3a3226] hover:border-[#3d7fc0]/60 transition-colors py-10 px-4 cursor-pointer text-center"
                            >
                                {selectedFile ? (
                                    <>
                                        <FileVideo size={32} className="text-[#3d7fc0]" />
                                        <span className="text-sm text-[#e9dfc7] break-all px-2">{selectedFile.name}</span>
                                        <span className="text-xs text-[#a89a78]">{formatFileSize(selectedFile.size)}</span>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud size={32} className="text-[#a89a78]" />
                                        <span className="text-sm text-[#a89a78]">Click to choose a video file</span>
                                        <span className="text-[11px] text-[#5c5340]">MP4, MOV, WebM — up to 100MB</span>
                                    </>
                                )}
                                <input
                                    id="videoFile"
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    {...register('videoFile', {
                                        required: 'Please choose a video file',
                                        validate: {
                                            isVideo: (files) => {
                                                const file = files?.[0];
                                                if (!file) return 'Please choose a video file';
                                                return file.type.startsWith('video/') || 'File must be a video';
                                            },
                                            maxSize: (files) => {
                                                const file = files?.[0];
                                                if (!file) return true;
                                                return file.size <= MAX_SIZE_BYTES || 'Video must be 100MB or smaller';
                                            },
                                        },
                                    })}
                                />
                            </label>
                            {errors.videoFile && (
                                <span className="text-xs text-[#c0453d] flex items-center gap-1">
                                    ⚠ {errors.videoFile.message}
                                </span>
                            )}

                            {uploading && (
                                <div className="flex flex-col gap-1.5">
                                    <div className="h-2 w-full bg-[#0f0e0c] border border-[#3a3226] overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#3d7fc0] to-[#63a0dd] transition-all"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    <span className="text-[11px] text-[#a89a78] text-right">{uploadProgress}%</span>
                                </div>
                            )}

                            {errors.root && (
                                <span className="text-xs text-[#c0453d] flex items-center gap-1">
                                    ⚠ {errors.root.message}
                                </span>
                            )}

                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full rounded-none border-0 bg-gradient-to-b from-[#5a9bd9] to-[#3d7fc0] text-[#0b0a08] font-semibold tracking-[0.15em] uppercase py-3 hover:from-[#6fabe3] hover:to-[#4a8bcb] hover:shadow-[0_0_25px_-3px_rgba(61,127,192,0.7)] transition-all disabled:opacity-50"
                            >
                                {uploading ? `Uploading... ${uploadProgress}%` : 'Upload Video'}
                            </button>
                        </form>
                    )}
                </div>

                {!uploadedVideo && (
                    <div className="flex justify-center mt-8">
                        <NavLink
                            to="/admin/video"
                            className="text-[11px] tracking-[0.15em] uppercase text-[#3d7fc0] hover:text-[#63a0dd] transition-colors"
                        >
                            ← Back to Video Solutions
                        </NavLink>
                    </div>
                )}
            </div>
        </div>
    );
}

export default VideoUpload;