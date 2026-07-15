import { useEffect, useState, useMemo } from "react";
import { NavLink } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import axiosClient from '../utils/axiosClient';
import { loginUser, logoutUser } from "../authSlice";



function Homepage(){

    const dispatch=useDispatch();
    const {user}=useSelector((state)=>state.auth);
    const [problem,setproblems]=useState([]);
    const [solvedprob,setsolvedprob]=useState([]);
    const [filters,setfilters]=useState({
        difficulty:'all',
        tag:'all',
        status:'all'

    });

    // UI-only state for the user menu dropdown
    const [showUserMenu,setShowUserMenu]=useState(false);

    useEffect(()=>{
        const fethchprblem=async ()=>{
            try{
                const { data } = await axiosClient.get('/problems/allproblems');
setproblems(data.problems);
            }
            catch(err){
                console.error('error fetching the problem', err);
            }
        };
        const fetchsolvedprob=async ()=>{
            try{
                const { data } = await axiosClient.get('/problems/problemSolvedByUser');
setsolvedprob(data.problems);

            }
            catch(err){
                console.error('problm in fetching the solved problems ', err);
            }
        }
        fethchprblem();
        if(user)
            fetchsolvedprob();
    },[user]);

    const handleLogout=()=>{
       dispatch(logoutUser());
       setsolvedprob([]);
       setShowUserMenu(false);
    };

    const filterproblems=problem.filter(prob=>{
        const difficultyMatch=filters.difficulty==='all' || prob.difficulty === filters.difficulty;
        const tagMatch=filters.tag==='all'||prob.tags === filters.tag;
        const statusMatch=filters.status==='all' || 
                                               solvedprob.some(sp=>sp._id===prob._id);
        return difficultyMatch && tagMatch && statusMatch;
    })

    // Derived list of unique tags from fetched problems, for the tag dropdown.
    // (Purely presentational — does not touch the filtering logic above.)
    const availableTags = useMemo(()=>{
        const tagSet = new Set(problem.map(p=>p.tags).filter(Boolean));
        return Array.from(tagSet);
    },[problem]);

    const difficultyStyles = {
        easy: "text-[#4f9d63] border-[#4f9d63]/40 bg-[#4f9d63]/10",
        medium: "text-[#c9a24b] border-[#c9a24b]/40 bg-[#c9a24b]/10",
        hard: "text-[#c0453d] border-[#c0453d]/40 bg-[#c0453d]/10",
    };

    return (
       <div className="min-h-screen relative bg-[#0b0a08] overflow-x-hidden">
            {/* ambient background: mist + ember glow */}
            <div className="pointer-events-none fixed inset-0">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-[#c9a24b]/10 blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[#7a1616]/10 blur-[120px]" />
                <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage:
                            "repeating-linear-gradient(0deg, #c9a24b 0px, transparent 1px, transparent 3px)",
                    }}
                />
            </div>

            {/* ===== Navbar ===== */}
            <nav className="relative z-20 border-b border-[#c9a24b]/20 bg-[#141210]/95 backdrop-blur">
                <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-8 py-4">
                    {/* Logo */}
                    <NavLink to="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-[#c9a24b] flex items-center justify-center shadow-[0_0_20px_-5px_rgba(201,162,75,0.6)]">
                            <span className="text-[#c9a24b] text-lg font-bold">悟</span>
                        </div>
                        <span className="font-serif tracking-[0.2em] text-lg sm:text-xl text-[#e9dfc7] uppercase">
                            Wukong Code
                        </span>
                    </NavLink>

                    {/* User menu */}
                    <div className="relative">
                        <button
                            onClick={()=>setShowUserMenu(prev=>!prev)}
                            className="flex items-center gap-2 border border-[#3a3226] hover:border-[#c9a24b]/60 px-4 py-2 rounded-none text-[#e9dfc7] text-sm tracking-[0.1em] uppercase transition-colors"
                        >
                            <span className="w-6 h-6 rounded-full bg-[#c9a24b]/20 border border-[#c9a24b]/50 flex items-center justify-center text-[#c9a24b] text-xs">
                                {user?.firstname ? user.firstname.charAt(0).toUpperCase() : "?"}
                            </span>
                            {user?.firstname || "Guest"}
                        </button>


                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-40 bg-[#141210] border border-[#c9a24b]/30 shadow-[0_0_40px_-10px_rgba(201,162,75,0.25)] z-30">
                              <ul>
                                <li><button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-3 text-xs tracking-[0.15em] uppercase text-[#c0453d] hover:bg-[#c0453d]/10 transition-colors"
                                >
                                    Logout
                                </button></li>

                                {user.role==='admin' && <li>
      <NavLink to="/admin" className="block w-full text-left px-4 py-3 text-xs tracking-[0.15em] uppercase text-[#c0453d] hover:bg-[#c0453d]/10 transition-colors">
        Admin
      </NavLink>
      </li>}


                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* ===== Main content ===== */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-10">

                <div className="flex flex-col items-center text-center mb-10">
                    <h1 className="font-serif tracking-[0.2em] text-2xl sm:text-3xl text-[#e9dfc7] uppercase">
                        The Trials
                    </h1>
                    <div className="flex items-center gap-2 mt-3">
                        <span className="h-px w-8 bg-[#c9a24b]/50" />
                        <p className="text-[11px] tracking-[0.25em] text-[#c9a24b]/80 uppercase">
                            Face Your Challenges
                        </p>
                        <span className="h-px w-8 bg-[#c9a24b]/50" />
                    </div>
                </div>

                {/* ===== Filters ===== */}
                <div className="flex flex-wrap gap-4 mb-8 justify-center">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] tracking-[0.15em] uppercase text-[#a89a78]">
                            Difficulty
                        </span>
                        <select
                            value={filters.difficulty}
                            onChange={(e)=>setfilters({...filters, difficulty:e.target.value})}
                            className="bg-[#0f0e0c] border border-[#3a3226] text-[#e9dfc7] text-sm px-4 py-2 rounded-none focus:outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]/60 transition-colors"
                        >
                            <option value="all">All</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] tracking-[0.15em] uppercase text-[#a89a78]">
                            Tag
                        </span>
                        <select
                            value={filters.tag}
                            onChange={(e)=>setfilters({...filters, tag:e.target.value})}
                            className="bg-[#0f0e0c] border border-[#3a3226] text-[#e9dfc7] text-sm px-4 py-2 rounded-none focus:outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]/60 transition-colors"
                        >
                            <option value="all">All</option>
                            {availableTags.map(tag=>(
                                <option key={tag} value={tag}>{tag}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] tracking-[0.15em] uppercase text-[#a89a78]">
                            Status
                        </span>
                        <select
                            value={filters.status}
                            onChange={(e)=>setfilters({...filters, status:e.target.value})}
                            className="bg-[#0f0e0c] border border-[#3a3226] text-[#e9dfc7] text-sm px-4 py-2 rounded-none focus:outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]/60 transition-colors"
                        >
                            <option value="all">All</option>
                            <option value="solved">Solved</option>
                        </select>
                    </div>
                </div>

                {/* ===== Problem list ===== */}
                <div className="bg-[#141210]/95 border border-[#c9a24b]/30 shadow-[0_0_60px_-10px_rgba(201,162,75,0.25)]">
                    {filterproblems.length === 0 && (
                        <div className="px-6 py-10 text-center text-sm text-[#7a6f56] tracking-[0.1em] uppercase">
                            No trials found
                        </div>
                    )}

                    {filterproblems.map((prob, idx)=>{
                        const isSolved = solvedprob.some(sp=>sp._id===prob._id);
                        return (
                            <NavLink
                                key={prob._id}
                                to={`/problem/${prob._id}`}
                                className={`flex items-center justify-between gap-4 px-6 py-4 border-[#c9a24b]/10 hover:bg-[#c9a24b]/5 transition-colors ${idx !== filterproblems.length - 1 ? "border-b" : ""}`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className={`w-5 h-5 flex items-center justify-center rounded-full border text-[10px] shrink-0 ${isSolved ? "border-[#4f9d63] text-[#4f9d63] bg-[#4f9d63]/10" : "border-[#3a3226] text-[#5c5340]"}`}>
                                        {isSolved ? "✓" : ""}
                                    </span>
                                    <span className="text-[#e9dfc7] text-sm sm:text-base truncate">
                                        {prob.title}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="hidden sm:inline text-[10px] tracking-[0.15em] uppercase text-[#a89a78] border border-[#3a3226] px-2 py-1">
                                        {prob.tags}
                                    </span>
                                    <span className={`text-[10px] tracking-[0.15em] uppercase px-2 py-1 border ${difficultyStyles[prob.difficulty] || "text-[#a89a78] border-[#3a3226]"}`}>
                                        {prob.difficulty}
                                    </span>
                                </div>
                            </NavLink>
                        );
                    })}
                </div>
            </div>
       </div>
    )
}

export default Homepage;
