import Editor from '@monaco-editor/react';
import { useRef, useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';
import ChatAI from '../components/chatAI';
import Editorial from '../components/editorial';

const LANGUAGES = ['java', 'c++', 'javascript'];

const LANGUAGE_LABELS = {
    'java': 'Java',
    'c++': 'C++',
    'javascript': 'JavaScript',
};

// Maps our backend language values to Monaco's language ids
const MONACO_LANGUAGE = {
    'java': 'java',
    'c++': 'cpp',
    'javascript': 'javascript',
};

// The Admin Panel stores starter/reference code with real newlines encoded
// as the literal characters "\n" — this reverses that so the editor shows
// properly formatted, multi-line code.
const decodeNewlines = (str) => (typeof str === 'string' ? str.replace(/\\n/g, '\n') : str);

const difficultyStyles = {
    easy: 'text-[#4f9d63] border-[#4f9d63]/40 bg-[#4f9d63]/10',
    medium: 'text-[#c9a24b] border-[#c9a24b]/40 bg-[#c9a24b]/10',
    hard: 'text-[#c0453d] border-[#c0453d]/40 bg-[#c0453d]/10',
};

// Maps the raw backend status ("accepted" | "wrong" | "error" | "pending")
// to a display label and color, used for both run results and submission history.
const STATUS_DISPLAY = {
    accepted: { label: 'Accepted', className: 'text-[#4f9d63]' },
    wrong: { label: 'Wrong Answer', className: 'text-[#c0453d]' },
    error: { label: 'Runtime Error', className: 'text-[#c0453d]' },
    pending: { label: 'Pending', className: 'text-[#a89a78]' },
};

const getStatusDisplay = (status) => STATUS_DISPLAY[status] || { label: status || 'Unknown', className: 'text-[#a89a78]' };

const ProblemPage = () => {
    const { problemId } = useParams();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const [problem, setProblem] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const [selectedLanguage, setSelectedLanguage] = useState('javascript');
    const [codeMap, setCodeMap] = useState({});

    const [runLoading, setRunLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [runResult, setRunResult] = useState(null);
    const [submitResult, setSubmitResult] = useState(null);

    const [activeLeftTab, setActiveLeftTab] = useState('description');
    const [activeRightTab, setActiveRightTab] = useState('code');

    const [solutionLanguage, setSolutionLanguage] = useState('javascript');

    const [submissions, setSubmissions] = useState([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [submissionsLoaded, setSubmissionsLoaded] = useState(false);
    const [openSubmissionId, setOpenSubmissionId] = useState(null);

    const editorRef = useRef(null);

    useEffect(() => {
        const fetchProblem = async () => {
            setPageLoading(true);
            try {
                const { data } = await axiosClient.get(`/problems/problemById/${problemId}`);
                // Backend wraps responses as { success, message, problem }, same as
                // every other controller in this app — fall back to `data` itself
                // only if it's ever sent unwrapped.
                const probData = data?.problem ?? data;
                setProblem(probData);

                const initialMap = {};
                (probData.startCode || []).forEach((sc) => {
                    initialMap[sc.language] = decodeNewlines(sc.initialCode);
                });
                setCodeMap(initialMap);
            } catch (err) {
                console.error('error fetching the problem', err);
            } finally {
                setPageLoading(false);
            }
        };

        fetchProblem();
    }, [problemId]);

    const handleEditorMount = (editor) => {
        editorRef.current = editor;
    };

    const handleCodeChange = (value) => {
        setCodeMap((prev) => ({ ...prev, [selectedLanguage]: value ?? '' }));
    };

    const fetchSubmissions = async () => {
        setSubmissionsLoading(true);
        try {
            const { data } = await axiosClient.get(`/problems/submitproblem/${problemId}`);
            setSubmissions(Array.isArray(data?.data) ? data.data : []);
        } catch (err) {
            console.error('error fetching submissions', err);
            setSubmissions([]);
        } finally {
            setSubmissionsLoading(false);
            setSubmissionsLoaded(true);
        }
    };

    const handleLeftTabClick = (tabId) => {
        setActiveLeftTab(tabId);
        if (tabId === 'submissions' && !submissionsLoaded) {
            fetchSubmissions();
        }
    };

    const handleRun = async () => {
        setRunLoading(true);
        setRunResult(null);
        try {
            const { data } = await axiosClient.post(`/subs/run/${problemId}`, {
                code: codeMap[selectedLanguage] || '',
                language: selectedLanguage,
            });
            setRunResult(data);
        } catch (err) {
            console.error('error running code', err);
            setRunResult({
                success: false,
                error: err.response?.data?.message || 'Internal server error',
            });
        } finally {
            setRunLoading(false);
            setActiveRightTab('testcases');
        }
    };

    const handleSubmitCode = async () => {
        setSubmitLoading(true);
        setSubmitResult(null);
        try {
            const { data } = await axiosClient.post(`/subs/submit/${problemId}`, {
                code: codeMap[selectedLanguage] || '',
                language: selectedLanguage,
            });
            setSubmitResult(data);
            // Keep the Submissions tab in sync with the new attempt.
            fetchSubmissions();
        } catch (err) {
            console.error('error submitting code', err);
            setSubmitResult({
                accepted: false,
                error: err.response?.data?.message || 'Internal server error',
            });
        } finally {
            setSubmitLoading(false);
            setActiveRightTab('result');
        }
    };

    if (pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0b0a08]">
                <span className="loading loading-spinner loading-lg text-[#c9a24b]"></span>
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0b0a08]">
                <p className="text-[#7a6f56] tracking-[0.15em] uppercase text-sm">
                    Trial not found
                </p>
            </div>
        );
    }

    const leftTabs = [
        { id: 'description', label: 'Description' },
        { id: 'editorial', label: 'Editorial' },
        { id: 'solutions', label: 'Solutions' },
        { id: 'submissions', label: 'Submissions' },
        { id: 'ChatAI', label: 'ChatAI' },
    ];

    const rightTabs = [
        { id: 'testcases', label: 'Testcases' },
        { id: 'code', label: 'Code' },
        { id: 'result', label: 'Result' },
    ];

    return (
        <div className="min-h-screen relative bg-[#0b0a08] overflow-x-hidden">
            {/* ambient background: mist + ember glow */}
            <div className="pointer-events-none fixed inset-0">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-[#c9a24b]/10 blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[#7a1616]/10 blur-[120px]" />
            </div>

            {/* ===== Top bar ===== */}
            <div className="relative z-20 border-b border-[#c9a24b]/20 bg-[#141210]/95 backdrop-blur">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between px-4 sm:px-8 py-3">
                    <NavLink to="/" className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full border-2 border-[#c9a24b] flex items-center justify-center shadow-[0_0_20px_-5px_rgba(201,162,75,0.6)]">
                            <span className="text-[#c9a24b] text-sm font-bold">悟</span>
                        </div>
                        <span className="font-serif tracking-[0.2em] text-base text-[#e9dfc7] uppercase hidden sm:inline">
                            Wukong Code
                        </span>
                    </NavLink>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-[#e9dfc7] text-sm sm:text-base truncate max-w-[240px]">
                                {problem.title}
                            </span>
                            <span className={`text-[10px] tracking-[0.15em] uppercase px-2 py-1 border ${difficultyStyles[problem.difficulty] || 'text-[#a89a78] border-[#3a3226]'}`}>
                                {problem.difficulty}
                            </span>
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu((prev) => !prev)}
                                className="flex items-center gap-2 border border-[#3a3226] hover:border-[#c9a24b]/60 px-3 py-2 rounded-none text-[#e9dfc7] text-sm tracking-[0.1em] uppercase transition-colors"
                            >
                                <span className="w-6 h-6 rounded-full bg-[#c9a24b]/20 border border-[#c9a24b]/50 flex items-center justify-center text-[#c9a24b] text-xs">
                                    {user?.firstname ? user.firstname.charAt(0).toUpperCase() : '?'}
                                </span>
                                <span className="hidden sm:inline">{user?.firstname || 'Guest'}</span>
                            </button>

                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-40 bg-[#141210] border border-[#c9a24b]/30 shadow-[0_0_40px_-10px_rgba(201,162,75,0.25)] z-30">
                                    <button
                                        onClick={() => { dispatch(logoutUser()); setShowUserMenu(false); }}
                                        className="w-full text-left px-4 py-3 text-xs tracking-[0.15em] uppercase text-[#c0453d] hover:bg-[#c0453d]/10 transition-colors"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== Main split panel ===== */}
            <div className="relative z-10 max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-4 p-4">

                {/* ===== Left panel ===== */}
                <div className="lg:w-1/2 w-full flex flex-col bg-[#141210]/95 border border-[#c9a24b]/30 shadow-[0_0_60px_-10px_rgba(201,162,75,0.25)]">
                    <div className="flex border-b border-[#3a3226]">
                        {leftTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleLeftTabClick(tab.id)}
                                className={`px-4 py-3 text-[11px] tracking-[0.15em] uppercase transition-colors border-b-2 ${
                                    activeLeftTab === tab.id
                                        ? 'text-[#c9a24b] border-[#c9a24b]'
                                        : 'text-[#a89a78] border-transparent hover:text-[#e9dfc7]'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 overflow-y-auto max-h-[75vh]">
                        {activeLeftTab === 'description' && (
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center gap-3">
                                    <h1 className="font-serif tracking-[0.1em] text-xl text-[#e9dfc7]">
                                        {problem.title}
                                    </h1>
                                    <span className={`text-[10px] tracking-[0.15em] uppercase px-2 py-1 border ${difficultyStyles[problem.difficulty] || 'text-[#a89a78] border-[#3a3226]'}`}>
                                        {problem.difficulty}
                                    </span>
                                    {problem.tags && (
                                        <span className="text-[10px] tracking-[0.15em] uppercase px-2 py-1 border border-[#3a3226] text-[#a89a78]">
                                            {problem.tags}
                                        </span>
                                    )}
                                </div>

                                <p className="text-sm text-[#d9cdb0] leading-relaxed whitespace-pre-line">
                                    {problem.description}
                                </p>

                                {problem.visibleTestCases?.length > 0 && (
                                    <div className="flex flex-col gap-4">
                                        {problem.visibleTestCases.map((tc, idx) => (
                                            <div key={idx} className="border border-[#3a3226] p-4">
                                                <p className="text-[10px] tracking-[0.2em] uppercase text-[#c9a24b]/70 mb-2">
                                                    Example {idx + 1}
                                                </p>
                                                <p className="text-xs text-[#a89a78] mb-1">Input:</p>
                                                <pre className="text-sm text-[#e9dfc7] font-mono whitespace-pre-wrap mb-2">{tc.input}</pre>
                                                <p className="text-xs text-[#a89a78] mb-1">Output:</p>
                                                <pre className="text-sm text-[#e9dfc7] font-mono whitespace-pre-wrap mb-2">{tc.output}</pre>
                                                {tc.explanation && (
                                                    <>
                                                        <p className="text-xs text-[#a89a78] mb-1">Explanation:</p>
                                                        <p className="text-sm text-[#d9cdb0]">{tc.explanation}</p>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeLeftTab === 'editorial' && (
                            <Editorial secureUrl={problem.secureUrl} thumbnailUrl={problem.thumbnailUrl}  duration={problem.duration} />
                        )}






{activeLeftTab === 'ChatAI' && (
                            <ChatAI problem={problem} />
                        )}












                        {activeLeftTab === 'solutions' && (() => {
                            const solutionList = problem.referenceSolution || problem.refrenceSolution || [];
                            const currentSolution = solutionList.find((sol) => sol.language === solutionLanguage);
                            return (
                                <div className="flex flex-col gap-4">
                                    {solutionList.length > 0 ? (
                                        <>
                                            <div className="flex gap-2">
                                                {LANGUAGES.map((lang) => (
                                                    <button
                                                        key={lang}
                                                        onClick={() => setSolutionLanguage(lang)}
                                                        className={`text-[11px] tracking-[0.15em] uppercase px-3 py-1.5 border transition-colors ${
                                                            solutionLanguage === lang
                                                                ? 'text-[#1a1512] bg-gradient-to-b from-[#e2be6d] to-[#a97e2e] border-transparent'
                                                                : 'text-[#a89a78] border-[#3a3226] hover:border-[#c9a24b]/60'
                                                        }`}
                                                    >
                                                        {LANGUAGE_LABELS[lang]}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="border border-[#3a3226]">
                                                <pre className="text-xs text-[#e9dfc7] font-mono p-4 overflow-x-auto whitespace-pre">
                                                    {currentSolution ? decodeNewlines(currentSolution.completecode) : 'No solution available for this language.'}
                                                </pre>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-sm text-[#7a6f56] tracking-[0.05em]">
                                            No solutions available yet.
                                        </p>
                                    )}
                                </div>
                            );
                        })()}

                        {activeLeftTab === 'submissions' && (
                            <div className="flex flex-col gap-4">
                                {submissionsLoading ? (
                                    <div className="flex justify-center py-10">
                                        <span className="loading loading-spinner loading-md text-[#c9a24b]"></span>
                                    </div>
                                ) : submissions.length === 0 ? (
                                    <p className="text-sm text-[#7a6f56] tracking-[0.05em]">
                                        No submissions yet for this trial.
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {submissions.map((sub) => {
                                            const statusInfo = getStatusDisplay(sub.status);
                                            const isOpen = openSubmissionId === sub._id;
                                            return (
                                                <div key={sub._id} className="border border-[#3a3226]">
                                                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                                                        <div className="flex flex-wrap items-center gap-4">
                                                            <span className={`text-sm font-semibold ${statusInfo.className}`}>
                                                                {statusInfo.label}
                                                            </span>
                                                            <span className="text-xs text-[#a89a78]">
                                                                {sub.testCasesPassed}/{sub.totalTestCases} cases
                                                            </span>
                                                            <span className="text-xs text-[#a89a78]">
                                                                {sub.runtime}s
                                                            </span>
                                                            <span className="text-xs text-[#a89a78]">
                                                                {sub.memory} KB
                                                            </span>
                                                            <span className="text-xs text-[#7a6f56]">
                                                                {sub.createdAt ? new Date(sub.createdAt).toLocaleString() : '—'}
                                                            </span>
                                                            <span className="text-[10px] tracking-[0.15em] uppercase text-[#a89a78] border border-[#3a3226] px-2 py-0.5">
                                                                {sub.language}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => setOpenSubmissionId(isOpen ? null : sub._id)}
                                                            className="text-[10px] tracking-[0.15em] uppercase text-[#c9a24b] border border-[#c9a24b]/40 px-3 py-1.5 hover:bg-[#c9a24b]/10 transition-colors shrink-0"
                                                        >
                                                            {isOpen ? 'Hide Code' : 'Code'}
                                                        </button>
                                                    </div>
                                                    {isOpen && (
                                                        <pre className="text-xs text-[#e9dfc7] font-mono p-4 border-t border-[#3a3226] overflow-x-auto whitespace-pre">
                                                            {decodeNewlines(sub.code)}
                                                        </pre>
                                                    )}
                                                    {isOpen && sub.errorMessage && (
                                                        <p className="text-xs text-[#c0453d] px-4 pb-3 whitespace-pre-wrap">
                                                            {sub.errorMessage}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ===== Right panel ===== */}
                <div className="lg:w-1/2 w-full flex flex-col bg-[#141210]/95 border border-[#c9a24b]/30 shadow-[0_0_60px_-10px_rgba(201,162,75,0.25)]">
                    {/* sub tabs */}
                    <div className="flex border-b border-[#3a3226]">
                        {rightTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveRightTab(tab.id)}
                                className={`px-4 py-3 text-[11px] tracking-[0.15em] uppercase transition-colors border-b-2 ${
                                    activeRightTab === tab.id
                                        ? 'text-[#c9a24b] border-[#c9a24b]'
                                        : 'text-[#a89a78] border-transparent hover:text-[#e9dfc7]'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {activeRightTab === 'code' && (
                        <>
                            {/* language buttons */}
                            <div className="flex gap-2 px-4 py-3 border-b border-[#3a3226]">
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => setSelectedLanguage(lang)}
                                        className={`text-[11px] tracking-[0.15em] uppercase px-3 py-1.5 border transition-colors ${
                                            selectedLanguage === lang
                                                ? 'text-[#1a1512] bg-gradient-to-b from-[#e2be6d] to-[#a97e2e] border-transparent'
                                                : 'text-[#a89a78] border-[#3a3226] hover:border-[#c9a24b]/60'
                                        }`}
                                    >
                                        {LANGUAGE_LABELS[lang]}
                                    </button>
                                ))}
                            </div>

                            {/* editor */}
                            <div className="flex-1 min-h-[420px]">
                                <Editor
                                    height="420px"
                                    theme="vs-dark"
                                    language={MONACO_LANGUAGE[selectedLanguage]}
                                    value={codeMap[selectedLanguage] || ''}
                                    onChange={handleCodeChange}
                                    onMount={handleEditorMount}
                                    options={{
                                        fontSize: 14,
                                        minimap: { enabled: false },
                                        scrollBeyondLastLine: false,
                                    }}
                                />
                            </div>

                            {/* run / submit */}
                            <div className="flex gap-3 px-4 py-4 border-t border-[#3a3226]">
                                <button
                                    onClick={handleRun}
                                    disabled={runLoading || submitLoading}
                                    className="flex-1 border border-[#c9a24b]/50 text-[#c9a24b] text-[11px] tracking-[0.15em] uppercase py-2.5 hover:bg-[#c9a24b]/10 transition-colors disabled:opacity-50"
                                >
                                    {runLoading ? 'Running...' : 'Run'}
                                </button>
                                <button
                                    onClick={handleSubmitCode}
                                    disabled={runLoading || submitLoading}
                                    className="flex-1 bg-gradient-to-b from-[#e2be6d] to-[#a97e2e] text-[#1a1512] text-[11px] tracking-[0.15em] uppercase font-semibold py-2.5 hover:from-[#f0cd7e] hover:to-[#c9963c] hover:shadow-[0_0_25px_-3px_rgba(201,162,75,0.7)] transition-all disabled:opacity-50"
                                >
                                    {submitLoading ? 'Submitting...' : 'Submit'}
                                </button>
                            </div>
                        </>
                    )}

                    {activeRightTab === 'testcases' && (
                        <div className="p-6 overflow-y-auto max-h-[75vh]">
                            {runLoading ? (
                                <div className="flex justify-center py-10">
                                    <span className="loading loading-spinner loading-md text-[#c9a24b]"></span>
                                </div>
                            ) : runResult ? (
                                runResult.error ? (
                                    <p className="text-sm text-[#c0453d]">{runResult.error}</p>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {(() => {
                                            const statusInfo = getStatusDisplay(runResult.success);
                                            return (
                                                <p className={`font-serif tracking-[0.15em] text-base uppercase ${statusInfo.className}`}>
                                                    {statusInfo.label} — {runResult.testCase}/{problem.visibleTestCases?.length ?? runResult.testCaseResults?.length ?? '-'} passed
                                                </p>
                                            );
                                        })()}
                                        <p className="text-sm text-[#e9dfc7] -mt-2">
                                            Runtime: {runResult.runtime}s &nbsp; Memory: {runResult.memory} KB
                                        </p>

                                        {runResult.testCaseResults?.map((tc, idx) => (
                                            <div
                                                key={idx}
                                                className={`border p-4 ${tc.passed ? 'border-[#3a3226]' : 'border-[#c0453d]/40 bg-[#c0453d]/5'}`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[10px] tracking-[0.2em] uppercase text-[#c9a24b]/70">
                                                        Case {idx + 1}
                                                    </p>
                                                    <span className={`text-[10px] tracking-[0.15em] uppercase ${tc.passed ? 'text-[#4f9d63]' : 'text-[#c0453d]'}`}>
                                                        {tc.passed ? 'Passed' : (tc.statusDescription || 'Failed')}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-[#a89a78] mb-1">Input:</p>
                                                <pre className="text-sm text-[#e9dfc7] font-mono whitespace-pre-wrap mb-2">{tc.input}</pre>

                                                <p className="text-xs text-[#a89a78] mb-1">Expected Output:</p>
                                                <pre className="text-sm text-[#e9dfc7] font-mono whitespace-pre-wrap mb-2">{tc.expectedOutput}</pre>

                                                <p className="text-xs text-[#a89a78] mb-1">Your Output:</p>
                                                <pre className={`text-sm font-mono whitespace-pre-wrap ${tc.passed ? 'text-[#e9dfc7]' : 'text-[#c0453d]'} mb-2`}>
                                                    {tc.actualOutput || '(no output)'}
                                                </pre>

                                                {!tc.passed && tc.errorMessage && (
                                                    <>
                                                        <p className="text-xs text-[#a89a78] mb-1">Error:</p>
                                                        <pre className="text-xs text-[#c0453d] font-mono whitespace-pre-wrap">
                                                            {tc.errorMessage}
                                                        </pre>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {problem.visibleTestCases?.map((tc, idx) => (
                                        <div key={idx} className="border border-[#3a3226] p-4">
                                            <p className="text-[10px] tracking-[0.2em] uppercase text-[#c9a24b]/70 mb-2">
                                                Case {idx + 1}
                                            </p>
                                            <p className="text-xs text-[#a89a78] mb-1">Input:</p>
                                            <pre className="text-sm text-[#e9dfc7] font-mono whitespace-pre-wrap mb-2">{tc.input}</pre>
                                            <p className="text-xs text-[#a89a78] mb-1">Expected Output:</p>
                                            <pre className="text-sm text-[#e9dfc7] font-mono whitespace-pre-wrap">{tc.output}</pre>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeRightTab === 'result' && (
                        <div className="p-6 overflow-y-auto max-h-[75vh]">
                            {submitLoading ? (
                                <div className="flex justify-center py-10">
                                    <span className="loading loading-spinner loading-md text-[#c9a24b]"></span>
                                </div>
                            ) : submitResult ? (
                                submitResult.error ? (
                                    <p className="text-sm text-[#c0453d]">{submitResult.error}</p>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <p className={`font-serif tracking-[0.15em] text-lg uppercase ${submitResult.accepted ? 'text-[#4f9d63]' : 'text-[#c0453d]'}`}>
                                            {submitResult.accepted ? 'Accepted' : 'Not Accepted'}
                                        </p>
                                        <p className="text-sm text-[#e9dfc7]">
                                            Test Cases: {submitResult.passedTestCases} / {submitResult.totalTestCases}
                                        </p>
                                        <p className="text-sm text-[#e9dfc7]">
                                            Runtime: {submitResult.runtime}s &nbsp; Memory: {submitResult.memory} KB
                                        </p>
                                    </div>
                                )
                            ) : (
                                <p className="text-sm text-[#7a6f56] tracking-[0.05em]">
                                    Submit your code to see the verdict here.
                                </p>
                            )}
                        </div>
                    )}
                </div>


 


            </div>


           
          
<div className="flex justify-center mt-4">
  <NavLink
    to="/"
    className="text-sm tracking-[0.15em] uppercase text-[#e9dfc7] hover:text-[#63a0dd] transition-colors"
  >
    ← Back to Trials List
  </NavLink>
</div>


        </div>
    );
};

export default ProblemPage;