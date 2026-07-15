import { useForm } from 'react-hook-form';
import { Send, Bot, User, Copy, Check } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axiosClient from '../utils/axiosClient';

// Gemini sometimes wraps complexity notation in light LaTeX, e.g.
// "$\mathcal{O}(n)$". We don't need full LaTeX rendering for that — just
// strip it down to plain readable text: "$\mathcal{O}(n)$" -> "O(n)".
const cleanLightweightLatex = (text = '') =>
    text
        .replace(/\\mathcal\{([^}]+)\}/g, '$1')
        .replace(/\$([^$]+)\$/g, '$1');

// A themed, copy-able code block — the "separate box with a copy button" part.
function CodeBlock({ language, code }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('copy failed', err);
        }
    };

    return (
        <div className="my-2 border border-[#3a3226] overflow-hidden rounded-none">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#0f0e0c] border-b border-[#3a3226]">
                <span className="text-[10px] tracking-[0.15em] uppercase text-[#a89a78]">
                    {language || 'code'}
                </span>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[10px] tracking-[0.1em] uppercase text-[#c9a24b] hover:text-[#e2be6d] transition-colors"
                >
                    {copied ? (
                        <><Check size={12} /> Copied</>
                    ) : (
                        <><Copy size={12} /> Copy</>
                    )}
                </button>
            </div>
            <SyntaxHighlighter
                language={language || 'text'}
                style={vscDarkPlus}
                customStyle={{ margin: 0, background: '#0b0a08', fontSize: '13px', padding: '12px' }}
                wrapLongLines
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
}

// Themed overrides so markdown elements (headers, bold, lists, rules, inline
// code) match the Wukong look instead of the browser's default styling.
const markdownComponents = {
    h1: ({ children }) => (
        <h3 className="font-serif text-base text-[#e9dfc7] uppercase tracking-[0.1em] mt-3 mb-2">{children}</h3>
    ),
    h2: ({ children }) => (
        <h3 className="font-serif text-base text-[#e9dfc7] uppercase tracking-[0.1em] mt-3 mb-2">{children}</h3>
    ),
    h3: ({ children }) => (
        <h4 className="font-serif text-sm text-[#c9a24b] uppercase tracking-[0.1em] mt-3 mb-1.5">{children}</h4>
    ),
    p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
    strong: ({ children }) => <strong className="text-[#c9a24b] font-semibold">{children}</strong>,
    em: ({ children }) => <em className="text-[#a89a78] italic">{children}</em>,
    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
    li: ({ children }) => <li className="text-[#e9dfc7]">{children}</li>,
    hr: () => <hr className="border-[#3a3226] my-3" />,
    a: ({ children, href }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#c9a24b] underline underline-offset-2 hover:text-[#e2be6d]">
            {children}
        </a>
    ),
    code({ inline, className, children }) {
        const match = /language-(\w+)/.exec(className || '');
        const codeString = String(children).replace(/\n$/, '');

        if (!inline && match) {
            return <CodeBlock language={match[1]} code={codeString} />;
        }
        // inline code, e.g. `curr` or `nextNode`
        return (
            <code className="bg-[#0f0e0c] border border-[#3a3226] px-1.5 py-0.5 text-[#e2be6d] text-[13px] rounded-none">
                {children}
            </code>
        );
    },
};

// Renders a model reply as proper markdown (headers, bold, lists, rules,
// inline code) with fenced code blocks going through CodeBlock.
function MessageContent({ text }) {
    return (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {cleanLightweightLatex(text)}
        </ReactMarkdown>
    );
}

// Turns the visibleTestCases array into a readable block of text instead of
// letting it get stringified as "[object Object]" when the backend embeds
// it into the system prompt via ${testCases}.
const formatTestCases = (testCases = []) =>
    testCases
        .map((tc, i) => `Example ${i + 1}:\nInput: ${tc.input}\nOutput: ${tc.output}${tc.explanation ? `\nExplanation: ${tc.explanation}` : ''}`)
        .join('\n\n');

// Same idea for startCode — turns the array of { language, initialCode }
// into one readable, labeled block instead of "[object Object]".
const formatStartCode = (startCode = []) =>
    startCode
        .map((sc) => `// ${sc.language}\n${sc.initialCode}`)
        .join('\n\n');

const ChatAI = ({ problem }) => {
    // FIX: was `(problem) =>` — that made the whole props object the
    // "problem" variable (so problem.title was actually undefined; the
    // real title lived at problem.problem.title). Destructuring the prop
    // by name fixes this.

    const [messages, setMessages] = useState([]);
    // FIX: no longer seeding a fake "hi how are you" / "fine" exchange.
    // That placeholder conversation was being sent to Gemini as real
    // context on every request. The greeting below is shown in the UI
    // only, never sent to the backend.

    const [thinking, setThinking] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const messageEndRef = useRef(null);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, thinking]);

    const onSubmit = async (data) => {
        const userMessage = { role: 'user', parts: [{ text: data.message }] };

        // FIX: previously called setMessages(prev => [...prev, userMessage])
        // and then sent the stale `messages` state variable to the backend —
        // due to React's async state updates, that stale value didn't yet
        // include the message the learner just typed, so the AI never saw
        // the latest question. Building the updated array explicitly and
        // using it for both the UI and the API call fixes this.
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        reset();
        setThinking(true); // FIX: was never set to true, so the "thinking" indicator never appeared

        try {
            const response = await axiosClient.post('/ai/chat', {
                messages: updatedMessages,
                title: problem.title,
                description: problem.description,
                startCode: formatStartCode(problem.startCode),
                testCases: formatTestCases(problem.visibleTestCases),
            });

            setMessages((prev) => [
                ...prev,
                {
                    role: 'model',
                    // FIX: was `parts:[{text:response.data.message}] || response.data.content`
                    // — an array literal is always truthy, so the `||` fallback
                    // could never run; it silently did nothing. Backend only
                    // ever sends `message`, so just use that directly.
                    parts: [{ text: response.data.message }],
                },
            ]);
        } catch (err) {
            // FIX: was `console.error('api error', error)` — `error` didn't
            // exist in this scope (the catch parameter is `err`), which threw
            // a ReferenceError inside the catch block itself.
            console.error('api error', err);
            setMessages((prev) => [
                ...prev,
                { role: 'model', parts: [{ text: 'Something went wrong, young warrior. Try again.' }] },
            ]);
        } finally {
            setThinking(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#141210]/95 border border-[#c9a24b]/30 shadow-[0_0_60px_-10px_rgba(201,162,75,0.25)]">
            {/* header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#3a3226]">
                <div className="w-6 h-6 rounded-full border border-[#c9a24b] flex items-center justify-center">
                    <span className="text-[#c9a24b] text-[10px] font-bold">悟</span>
                </div>
                <span className="text-[11px] tracking-[0.2em] uppercase text-[#c9a24b]">
                    Ask the Sage
                </span>
            </div>

            {/* messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 min-h-[300px] max-h-[60vh]">
                {messages.length === 0 && !thinking && (
                    <div className="flex items-start gap-2">
                        <div className="w-7 h-7 shrink-0 rounded-full border border-[#3a3226] flex items-center justify-center text-[#a89a78]">
                            <Bot size={14} />
                        </div>
                        <div className="max-w-[75%] text-sm px-4 py-2.5 bg-[#0f0e0c] border border-[#3a3226] text-[#e9dfc7] leading-relaxed">
                            Young warrior, ask me anything about this trial — a hint, a review of your code, or the path forward.
                        </div>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div
                            className={`w-7 h-7 shrink-0 rounded-full border flex items-center justify-center ${
                                msg.role === 'user'
                                    ? 'border-[#c9a24b]/60 text-[#c9a24b]'
                                    : 'border-[#3a3226] text-[#a89a78]'
                            }`}
                        >
                            {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </div>
                        <div
                            className={`max-w-[85%] text-sm px-4 py-2.5 ${
                                msg.role === 'user'
                                    ? 'bg-gradient-to-b from-[#e2be6d] to-[#a97e2e] text-[#1a1512] whitespace-pre-wrap leading-relaxed'
                                    : 'bg-[#0f0e0c] border border-[#3a3226] text-[#e9dfc7]'
                            }`}
                        >
                            {msg.role === 'user' ? (
                                msg.parts[0].text
                            ) : (
                                <MessageContent text={msg.parts[0].text} />
                            )}
                        </div>
                    </div>
                ))}

                {thinking && (
                    <div className="flex items-start gap-2">
                        <div className="w-7 h-7 shrink-0 rounded-full border border-[#3a3226] flex items-center justify-center text-[#a89a78]">
                            <Bot size={14} />
                        </div>
                        <div className="bg-[#0f0e0c] border border-[#3a3226] px-4 py-2.5">
                            <span className="loading loading-dots loading-sm text-[#c9a24b]"></span>
                        </div>
                    </div>
                )}

                <div ref={messageEndRef} />
            </div>

            {/* input */}
            <form onSubmit={handleSubmit(onSubmit)} className="border-t border-[#3a3226] px-4 py-3">
                <div className="flex items-center gap-3">
                    <input
                        {...register('message', { required: true, minLength: 2 })}
                        placeholder="Ask me anything..."
                        autoComplete="off"
                        className="flex-1 bg-[#0f0e0c] border border-[#3a3226] text-[#e9dfc7] placeholder:text-[#5c5340] text-sm px-3 py-2 rounded-none focus:outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]/60 transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={thinking || !!errors.message}
                        className="p-2.5 border border-[#c9a24b]/50 text-[#c9a24b] hover:bg-[#c9a24b]/10 transition-colors disabled:opacity-40"
                    >
                        <Send size={16} />
                    </button>
                </div>
                {errors.message && (
                    <span className="mt-1 block text-xs text-[#c0453d]">
                        ⚠ Message must be at least 2 characters
                    </span>
                )}
            </form>
        </div>
    );
};

export default ChatAI;