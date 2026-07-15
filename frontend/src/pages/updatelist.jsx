import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import axiosClient from "../utils/axiosClient";

const difficultyStyles = {
    easy: "text-[#4f9d63] border-[#4f9d63]/40 bg-[#4f9d63]/10",
    medium: "text-[#c9a24b] border-[#c9a24b]/40 bg-[#c9a24b]/10",
    hard: "text-[#c0453d] border-[#c0453d]/40 bg-[#c0453d]/10",
};

function UpdateList() {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                    <div className="w-14 h-14 rounded-full border-2 border-[#c9a24b] flex items-center justify-center mb-4 shadow-[0_0_25px_-5px_rgba(201,162,75,0.6)]">
                        <span className="text-[#c9a24b] text-2xl font-bold">悟</span>
                    </div>
                    <h1 className="font-serif tracking-[0.2em] text-2xl sm:text-3xl text-[#e9dfc7] uppercase">
                        Update Trials
                    </h1>
                    <div className="flex items-center gap-2 mt-3">
                        <span className="h-px w-8 bg-[#c9a24b]/50" />
                        <p className="text-[11px] tracking-[0.25em] text-[#c9a24b]/80 uppercase">
                            Choose a Trial to Reshape
                        </p>
                        <span className="h-px w-8 bg-[#c9a24b]/50" />
                    </div>
                </div>

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
                            No trials to reshape
                        </div>
                    )}

                    {!loading && !error && problems.map((prob, idx) => (
                        <NavLink
                            key={prob._id}
                            to={`/admin/update/${prob._id}`}
                            className={`flex items-center justify-between gap-4 px-6 py-4 hover:bg-[#c9a24b]/5 transition-colors ${idx !== problems.length - 1 ? "border-b border-[#3a3226]" : ""}`}
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

                            <span className="text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border border-[#c9a24b]/40 text-[#c9a24b] shrink-0">
                                Edit
                            </span>
                        </NavLink>
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

export default UpdateList;