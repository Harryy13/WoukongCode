

import { Plus, Trash2, Edit,Video } from 'lucide-react';
import { NavLink } from "react-router";
 
function AdminPanel() {
    const adminOptions = [
        {
            id: 'create',
            title: 'Create Problem',
            description: 'Add a new coding problem to the platform',
            icon: Plus,
            accent: '#4f9d63',
            route: '/admin/create',
        },
        {
            id: 'update',
            title: 'Update Problem',
            description: 'Edit existing problems and their details',
            icon: Edit,
            accent: '#c9a24b',
            route: '/admin/update',
        },
        {
            id: 'delete',
            title: 'Delete Problem',
            description: 'Remove a problem from the platform',
            icon: Trash2,
            accent: '#c0453d',
            route: '/admin/delete',
        },
         {
            id: 'video',
            title: 'video Problem',
            description: 'uoload and delete videos',
            icon: Video,
            accent: '#3d7fc0ff',
            route: '/admin/video',
        }
    ];
 
    return (
        <div className="min-h-screen relative bg-[#0b0a08] overflow-x-hidden px-4 py-16">
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
 
            <div className="relative z-10 max-w-5xl mx-auto">
                {/* header / seal */}
                <div className="flex flex-col items-center text-center mb-14">
                    <div className="w-14 h-14 rounded-full border-2 border-[#c9a24b] flex items-center justify-center mb-4 shadow-[0_0_25px_-5px_rgba(201,162,75,0.6)]">
                        <span className="text-[#c9a24b] text-2xl font-bold">悟</span>
                    </div>
                    <h1 className="font-serif tracking-[0.2em] text-2xl sm:text-3xl text-[#e9dfc7] uppercase">
                        Admin Chamber
                    </h1>
                    <div className="flex items-center gap-2 mt-3">
                        <span className="h-px w-8 bg-[#c9a24b]/50" />
                        <p className="text-[11px] tracking-[0.25em] text-[#c9a24b]/80 uppercase">
                            Shape the Trials
                        </p>
                        <span className="h-px w-8 bg-[#c9a24b]/50" />
                    </div>
                </div>
 
                {/* cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {adminOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                            <NavLink
                                key={option.id}
                                to={option.route}
                                className="group relative bg-[#141210]/95 border border-[#c9a24b]/30 shadow-[0_0_60px_-10px_rgba(201,162,75,0.25)] px-6 py-8 flex flex-col items-center text-center transition-all hover:border-[#c9a24b]/70 hover:-translate-y-1"
                            >
                                {/* corner ornaments */}
                                <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-[#c9a24b]/60" />
                                <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-[#c9a24b]/60" />
                                <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-[#c9a24b]/60" />
                                <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-[#c9a24b]/60" />
 
                                <div
                                    className="w-14 h-14 rounded-full border-2 flex items-center justify-center mb-5 transition-shadow"
                                    style={{
                                        borderColor: option.accent,
                                        boxShadow: `0 0 25px -5px ${option.accent}80`,
                                    }}
                                >
                                    <Icon size={22} style={{ color: option.accent }} />
                                </div>
 
                                <h2 className="font-serif tracking-[0.15em] text-lg text-[#e9dfc7] uppercase mb-3">
                                    {option.title}
                                </h2>
                                <p className="text-sm text-[#a89a78] leading-relaxed mb-6">
                                    {option.description}
                                </p>
 
                                <span
                                    className="text-[11px] tracking-[0.2em] uppercase px-5 py-2 border transition-colors"
                                    style={{
                                        color: option.accent,
                                        borderColor: `${option.accent}66`,
                                    }}
                                >
                                    Enter
                                </span>
                            </NavLink>
                        );
                    })}
                </div>
            </div>

            
  <div className="flex justify-center mt-4">
    <NavLink
      to="/"
      className="text-sm tracking-[0.15em] uppercase text-[#e9dfc7] hover:text-[#63a0dd] transition-colors"
    >
      ← Back to Home
    </NavLink>
  </div>




        </div>
    );
}
 
export default AdminPanel;