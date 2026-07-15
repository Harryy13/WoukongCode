import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import axiosClient from "../utils/axiosClient";

const difficultyStyles = {
    easy: "text-[#4f9d63] border-[#4f9d63]/40 bg-[#4f9d63]/10",
    medium: "text-[#c9a24b] border-[#c9a24b]/40 bg-[#c9a24b]/10",
    hard: "text-[#c0453d] border-[#c0453d]/40 bg-[#c0453d]/10",
};

function DeleteProblem() {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [confirmingId, setConfirmingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        const fetchProblems = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data } = await axiosClient.get('/problems/allproblems');
                setProblems(data?.problems || []);
            } catch (err) {
                console.error('error fetching problems', err);
                setError('Could not load the trials.');
            } finally {
                setLoading(false);
            }
        };
        fetchProblems();
    }, []);

    const handleDelete = async (id) => {
        setDeletingId(id);
        try {
            await axiosClient.delete(`/problems/delete/${id}`);
            setProblems((prev) => prev.filter((p) => p._id !== id));
            setNotice({ type: 'success', text: 'Problem deleted successfully.' });
        } catch (err) {
            console.error('error deleting problem', err);
            setNotice({ type: 'error', text: err.response?.data?.message || 'Could not delete the problem.' });
        } finally {
            setDeletingId(null);
            setConfirmingId(null);
            setTimeout(() => setNotice(null), 3000);
        }
    };

    return (
        <div className="min-h-screen relative bg-[#0b0a08] overflow-x-hidden px-4 py-16">
            {/* ambient background: mist + ember glow */}
            <div className="pointer-events-none fixed inset-0">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-[#c9a24b]/10 blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[#7a1616]/10 blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto">
                {/* header / seal */}
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-14 h-14 rounded-full border-2 border-[#c0453d] flex items-center justify-center mb-4 shadow-[0_0_25px_-5px_rgba(192,69,61,0.6)]">
                        <span className="text-[#c0453d] text-2xl font-bold">悟</span>
                    </div>
                    <h1 className="font-serif tracking-[0.2em] text-2xl sm:text-3xl text-[#e9dfc7] uppercase">
                        Delete Trials
                    </h1>
                    <div className="flex items-center gap-2 mt-3">
                        <span className="h-px w-8 bg-[#c0453d]/50" />
                        <p className="text-[11px] tracking-[0.25em] text-[#c0453d]/80 uppercase">
                            Choose With Care
                        </p>
                        <span className="h-px w-8 bg-[#c0453d]/50" />
                    </div>
                </div>

                {/* notice banner */}
                {notice && (
                    <div
                        className={`mb-6 px-4 py-3 text-sm text-center border ${
                            notice.type === 'success'
                                ? 'border-[#4f9d63]/40 bg-[#4f9d63]/10 text-[#4f9d63]'
                                : 'border-[#c0453d]/40 bg-[#c0453d]/10 text-[#c0453d]'
                        }`}
                    >
                        {notice.text}
                    </div>
                )}

                <div className="bg-[#141210]/95 border border-[#c9a24b]/30 shadow-[0_0_60px_-10px_rgba(201,162,75,0.25)]">
                    {loading && (
                        <div className="flex justify-center py-14">
                            <span className="loading loading-spinner loading-lg text-[#c9a24b]"></span>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="px-6 py-10 text-center text-sm text-[#c0453d]">
                            {error}
                        </div>
                    )}

                    {!loading && !error && problems.length === 0 && (
                        <div className="px-6 py-10 text-center text-sm text-[#7a6f56] tracking-[0.1em] uppercase">
                            No trials remain
                        </div>
                    )}

                    {!loading && !error && problems.map((prob, idx) => (
                        <div
                            key={prob._id}
                            className={`flex items-center justify-between gap-4 px-6 py-4 ${idx !== problems.length - 1 ? "border-b border-[#3a3226]" : ""}`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="text-[#e9dfc7] text-sm sm:text-base truncate">
                                    {prob.title}
                                </span>
                                <span className="hidden sm:inline text-[10px] tracking-[0.15em] uppercase text-[#a89a78] border border-[#3a3226] px-2 py-1">
                                    {prob.tags}
                                </span>
                                <span className={`text-[10px] tracking-[0.15em] uppercase px-2 py-1 border ${difficultyStyles[prob.difficulty] || "text-[#a89a78] border-[#3a3226]"}`}>
                                    {prob.difficulty}
                                </span>
                            </div>

                            {confirmingId === prob._id ? (
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs text-[#a89a78] hidden sm:inline">Delete?</span>
                                    <button
                                        onClick={() => handleDelete(prob._id)}
                                        disabled={deletingId === prob._id}
                                        className="text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border border-[#c0453d] text-[#1a1512] bg-[#c0453d] hover:bg-[#e2635a] transition-colors disabled:opacity-50"
                                    >
                                        {deletingId === prob._id ? 'Deleting...' : 'Confirm'}
                                    </button>
                                    <button
                                        onClick={() => setConfirmingId(null)}
                                        disabled={deletingId === prob._id}
                                        className="text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border border-[#3a3226] text-[#a89a78] hover:border-[#c9a24b]/60 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setConfirmingId(prob._id)}
                                    className="text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border border-[#c0453d]/50 text-[#c0453d] hover:bg-[#c0453d]/10 transition-colors shrink-0"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex justify-center mt-8">
                    <NavLink
                        to="/admin"
                        className="text-[11px] tracking-[0.15em] uppercase text-[#c9a24b] hover:text-[#e2be6d] transition-colors"
                    >
                        ← Back to Admin Chamber
                    </NavLink>
                </div>
            </div>
        </div>
    );
}

export default DeleteProblem;