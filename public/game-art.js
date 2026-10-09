(function (root, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else {
        root.Room25Art = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // SVG Artwork library for all Room Types
    const ROOM_SVGS = {
        central: `
        <svg viewBox="0 0 100 100" class="room-art-svg" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="grad-central" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.8"/>
                    <stop offset="100%" stop-color="#4c1d95" stop-opacity="0.2"/>
                </radialGradient>
            </defs>
            <rect x="4" y="4" width="92" height="92" rx="8" fill="url(#grad-central)" stroke="#8b5cf6" stroke-width="2.5"/>
            <!-- Safe Zone Cross Hatch Pattern -->
            <path d="M 20 20 L 80 80 M 80 20 L 20 80" stroke="#a78bfa" stroke-width="2" stroke-dasharray="4,4" opacity="0.4"/>
            <!-- Sanctuary Shield Icon -->
            <polygon points="50,18 78,28 78,55 50,82 22,55 22,28" fill="#5b21b6" stroke="#c4b5fd" stroke-width="2.5"/>
            <path d="M 50 24 L 72 32 L 72 53 Q 72 70 50 78 Q 28 70 28 53 L 28 32 Z" fill="#6d28d9" opacity="0.7"/>
            <circle cx="50" cy="50" r="10" fill="#a78bfa"/>
            <polygon points="50,44 54,52 50,56 46,52" fill="#ede9fe"/>
        </svg>`,

        room25: `
        <svg viewBox="0 0 100 100" class="room-art-svg" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="grad-r25" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9"/>
                    <stop offset="60%" stop-color="#0284c7" stop-opacity="0.5"/>
                    <stop offset="100%" stop-color="#0369a1" stop-opacity="0.1"/>
                </radialGradient>
            </defs>
            <rect x="4" y="4" width="92" height="92" rx="8" fill="url(#grad-r25)" stroke="#38bdf8" stroke-width="3"/>
            <!-- Emergency Exit Gateways -->
            <rect x="15" y="15" width="70" height="70" rx="6" fill="#0f172a" stroke="#7dd3fc" stroke-width="2"/>
            <path d="M 25 50 L 75 50" stroke="#38bdf8" stroke-width="2" stroke-dasharray="3,3"/>
            <circle cx="50" cy="50" r="22" fill="#0284c7" opacity="0.6"/>
            <!-- Golden "25" Insignia -->
            <text x="50" y="58" font-family="'Orbitron', sans-serif" font-size="24" font-weight="900" fill="#f0f9ff" text-anchor="middle" letter-spacing="1">25</text>
            <polygon points="50,18 55,25 45,25" fill="#38bdf8"/>
            <polygon points="50,82 55,75 45,75" fill="#38bdf8"/>
        </svg>`,

        empty: `
        <svg viewBox="0 0 100 100" class="room-art-svg" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="92" height="92" rx="8" fill="#1e293b" stroke="#334155" stroke-width="2"/>
            <!-- Clean Metal Grid Flooring -->
            <line x1="25" y1="4" x2="25" y2="96" stroke="#475569" stroke-width="1" opacity="0.3"/>
            <line x1="50" y1="4" x2="50" y2="96" stroke="#475569" stroke-width="1" opacity="0.3"/>
            <line x1="75" y1="4" x2="75" y2="96" stroke="#475569" stroke-width="1" opacity="0.3"/>
            <line x1="4" y1="25" x2="96" y2="25" stroke="#475569" stroke-width="1" opacity="0.3"/>
            <line x1="4" y1="50" x2="96" y2="50" stroke="#475569" stroke-width="1" opacity="0.3"/>
            <line x1="4" y1="75" x2="96" y2="75" stroke="#475569" stroke-width="1" opacity="0.3"/>
            <!-- Safe Minimalist Beacon -->
            <circle cx="50" cy="50" r="8" fill="#10b981" opacity="0.3"/>
            <circle cx="50" cy="50" r="4" fill="#34d399"/>
        </svg>`,

        vision: `
        <svg viewBox="0 0 100 100" class="room-art-svg" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="92" height="92" rx="8" fill="#1e1b4b" stroke="#818cf8" stroke-width="2"/>
            <!-- All-Seeing Futuristic Lens -->
            <circle cx="50" cy="50" r="32" fill="#312e81" stroke="#a5b4fc" stroke-width="1.5" stroke-dasharray="4,2"/>
            <path d="M 20 50 Q 50 20 80 50 Q 50 80 20 50 Z" fill="#4338ca" stroke="#c7d2fe" stroke-width="2.5"/>
            <circle cx="50" cy="50" r="14" fill="#6366f1"/>
            <circle cx="50" cy="50" r="7" fill="#e0e7ff"/>
            <circle cx="53" cy="47" r="2.5" fill="#ffffff"/>
            <!-- Scanner Rays -->
            <line x1="10" y1="50" x2="90" y2="50" stroke="#818cf8" stroke-width="1" stroke-dasharray="2,4" opacity="0.6"/>
        </svg>`,

        moving: `
        <svg viewBox="0 0 100 100" class="room-art-svg" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="92" height="92" rx="8" fill="#064e3b" stroke="#10b981" stroke-width="2"/>
            <!-- Rotating Kinetic Platform Arrows -->
            <circle cx="50" cy="50" r="30" fill="none" stroke="#34d399" stroke-width="3" stroke-dasharray="25,12"/>
            <!-- Twin Swapping Arrows -->
            <path d="M 32 38 L 46 24 L 46 34 L 62 34 L 62 42 L 46 42 L 46 52 Z" fill="#6ee7b7"/>
            <path d="M 68 62 L 54 76 L 54 66 L 38 66 L 38 58 L 54 58 L 54 48 Z" fill="#a7f3d0"/>
            <circle cx="50" cy="50" r="4" fill="#ecfdf5"/>
        </svg>`,

        controlRoom: `
        <svg viewBox="0 0 100 100" class="room-art-svg" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="92" height="92" rx="8" fill="#1e293b" stroke="#0ea5e9" stroke-width="2"/>
            <!-- Mechanical Gears & Rail Matrix -->
            <circle cx="50" cy="50" r="26" fill="#0f172a" stroke="#38bdf8" stroke-width="3"/>
            <!-- Cog Teeth -->
            <rect x="46" y="18" width="8" height="6" fill="#38bdf8" rx="1"/>
            <rect x="46" y="76" width="8" height="6" fill="#38bdf8" rx="1"/>
            <rect x="18" y="46" width="6" height="8" fill="#38bdf8" rx="1"/>
            <rect x="76" y="46" width="6" height="8" fill="#38bdf8" rx="1"/>
            <circle cx="50" cy="50" r="14" fill="#0284c7"/>
            <polygon points="50,42 56,54 44,54" fill="#f0f9ff"/>
        </svg>`,

        vortex: `
        <svg viewBox="0 0 100 100" class="room-art-svg" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="92" height="92" rx="8" fill="#422006" stroke="#f59e0b" stroke-width="2"/>
            <!-- Gravitational Singularity Spiral -->
            <circle cx="50" cy="50" r="34" fill="#78350f" opacity="0.4"/>
            <path d="M 50 15 A 35 35 0 0 1 85 50 A 25 25 0 0 1 50 75 A 15 15 0 0 1 35 50 A 8 8 0 0 1 50 42 Z" 
                  fill="none" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
            <circle cx="50" cy="50" r="8" fill="#000000" stroke="#f59e0b" stroke-width="2"/>
            <circle cx="50" cy="50" r="3" fill="#fef3c7"/>
        </svg>`,

        freezer: `
        <svg viewBox="0 0 100 100" class="room-art-svg" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="92" height="92" rx="8" fill="#0c4a6e" stroke="#38bdf8" stroke-width="2"/>
            <!-- Frost Ice Shards & Snowflake -->
            <path d="M 50 15 L 50 85 M 15 50 L 85 50 M 25 25 L 75 75 M 25 75 L 75 25" stroke="#bae6fd" stroke-width="3" stroke-linecap="round"/>
            <polygon points="50,18 46,26 54,26" fill="#e0f2fe"/>
            <polygon points="50,82 46,74 54,74" fill="#e0f2fe"/>
            <polygon points="18,50 26,46 26,54" fill="#e0f2fe"/>
            <polygon points="82,50 74,46 74,54" fill="#e0f2fe"/>
            <circle cx="50" cy="50" r="10" fill="#0284c7" stroke="#e0f2fe" stroke-width="2"/>
        </svg>`,

        dark: `
        <svg viewBox="0 0 100 100" class="room-art-svg" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="92" height="92" rx="8" fill="#020617" stroke="#475569" stroke-width="2"/>
            <!-- Eclipse / Obscured Chamber -->
            <circle cx="50" cy="50" r="30" fill="#0f172a" stroke="#64748b" stroke-width="2"/>
            <path d="M 38 24 A 28 28 0 1 0 76 62 A 25 25 0 1 1 38 24 Z" fill="#94a3b8" opacity="0.6"/>
            <!-- Prohibited Eye Crossout -->
            <path d="M 30 50 Q 50 35 70 50 Q 50 65 30 50" fill="none" stroke="#64748b" stroke-width="2"/>
            <line x1="28" y1="68" x2="72" y2="32" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
        </svg>`,

        mortal: `
        <svg viewBox="0 0 100 100" class="room-art-svg" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="grad-mortal" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#ef4444" stop-opacity="0.9"/>
                    <stop offset="70%" stop-color="#991b1b" stop-opacity="0.6"/>
                    <stop offset="100%" stop-color="#450a0a" stop-opacity="0.3"/>
                </radialGradient>
            </defs>
            <rect x="4" y="4" width="92" height="92" rx="8" fill="url(#grad-mortal)" stroke="#ef4444" stroke-width="3"/>
            <!-- Toxic Skull & Crossbones Hazard -->
            <circle cx="50" cy="42" r="18" fill="#fee2e2" stroke="#b91c1c" stroke-width="2"/>
            <rect x="40" y="52" width="20" height="12" fill="#fee2e2" rx="2" stroke="#b91c1c" stroke-width="2"/>
            <!-- Eye Sockets & Teeth -->
            <circle cx="43" cy="42" r="5" fill="#7f1d1d"/>
            <circle cx="57" cy="42" r="5" fill="#7f1d1d"/>
            <line x1="45" y1="55" x2="45" y2="62" stroke="#7f1d1d" stroke-width="2"/>
            <line x1="50" y1="55" x2="50" y2="62" stroke="#7f1d1d" stroke-width="2"/>
            <line x1="55" y1="55" x2="55" y2="62" stroke="#7f1d1d" stroke-width="2"/>
            <!-- Crossbones Bottom -->
            <path d="M 25 78 L 75 78" stroke="#fca5a5" stroke-width="4" stroke-linecap="round"/>
        </svg>`,

        trapped: `
        <svg viewBox="0 0 100 100" class="room-art-svg" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="92" height="92" rx="8" fill="#451a03" stroke="#f97316" stroke-width="2.5"/>
            <!-- Steel Spiked Portcullis & Danger Triangle -->
            <polygon points="50,16 84,78 16,78" fill="#7c2d12" stroke="#fb923c" stroke-width="3"/>
            <text x="50" y="68" font-family="'Orbitron', sans-serif" font-size="34" font-weight="900" fill="#ffedd5" text-anchor="middle">!</text>
            <!-- Timer Clock Silhouette -->
            <circle cx="50" cy="48" r="30" fill="none" stroke="#ea580c" stroke-width="2" stroke-dasharray="6,4"/>
        </svg>`,

        acid: `
        <svg viewBox="0 0 100 100" class="room-art-svg" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="92" height="92" rx="8" fill="#14532d" stroke="#22c55e" stroke-width="2.5"/>
            <!-- Caustic Acid Bubbles & Biohazard Symbol -->
            <circle cx="50" cy="50" r="28" fill="#166534" stroke="#4ade80" stroke-width="2"/>
            <!-- Biohazard Trefoil -->
            <circle cx="50" cy="38" r="10" fill="none" stroke="#bbf7d0" stroke-width="3"/>
            <circle cx="40" cy="58" r="10" fill="none" stroke="#bbf7d0" stroke-width="3"/>
            <circle cx="60" cy="58" r="10" fill="none" stroke="#bbf7d0" stroke-width="3"/>
            <circle cx="50" cy="50" r="6" fill="#86efac"/>
        </svg>`,

        flooded: `
        <svg viewBox="0 0 100 100" class="room-art-svg" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="92" height="92" rx="8" fill="#1e3a5f" stroke="#0284c7" stroke-width="2.5"/>
            <!-- Rising Water Waves -->
            <path d="M 12 40 Q 32 30 52 40 T 92 40 L 92 88 L 12 88 Z" fill="#0369a1" opacity="0.6"/>
            <path d="M 8 55 Q 28 45 48 55 T 88 55 L 88 92 L 8 92 Z" fill="#0284c7" opacity="0.8"/>
            <path d="M 10 70 Q 30 60 50 70 T 90 70 L 90 92 L 10 92 Z" fill="#38bdf8"/>
            <circle cx="36" cy="30" r="4" fill="#bae6fd" opacity="0.7"/>
            <circle cx="68" cy="24" r="5" fill="#bae6fd" opacity="0.7"/>
        </svg>`,

        twins: `
        <svg viewBox="0 0 100 100" class="room-art-svg" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="92" height="92" rx="8" fill="#312e81" stroke="#818cf8" stroke-width="2"/>
            <!-- Quantum Entangled Portals -->
            <ellipse cx="34" cy="50" rx="14" ry="24" fill="#4338ca" stroke="#c7d2fe" stroke-width="2.5"/>
            <ellipse cx="66" cy="50" rx="14" ry="24" fill="#4338ca" stroke="#c7d2fe" stroke-width="2.5"/>
            <path d="M 34 50 Q 50 30 66 50" fill="none" stroke="#e0e7ff" stroke-width="2" stroke-dasharray="3,3"/>
            <path d="M 34 50 Q 50 70 66 50" fill="none" stroke="#e0e7ff" stroke-width="2" stroke-dasharray="3,3"/>
        </svg>`,

        illusion: `
        <svg viewBox="0 0 100 100" class="room-art-svg" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="92" height="92" rx="8" fill="#3b0764" stroke="#c084fc" stroke-width="2"/>
            <!-- Shimmering Prismatic Hologram Star -->
            <polygon points="50,15 58,38 82,42 64,58 70,82 50,68 30,82 36,58 18,42 42,38" 
                     fill="#9333ea" stroke="#f3e8ff" stroke-width="2" opacity="0.8"/>
            <circle cx="50" cy="50" r="10" fill="#e9d5ff"/>
        </svg>`,

        hidden: `
        <svg viewBox="0 0 100 100" class="room-art-svg" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="92" height="92" rx="8" fill="#131322" stroke="#2a2a44" stroke-width="2"/>
            <!-- Complex Armor Plating Pattern -->
            <rect x="12" y="12" width="76" height="76" rx="4" fill="none" stroke="#252538" stroke-width="2"/>
            <line x1="12" y1="12" x2="30" y2="30" stroke="#373752" stroke-width="2"/>
            <line x1="88" y1="12" x2="70" y2="30" stroke="#373752" stroke-width="2"/>
            <line x1="12" y1="88" x2="30" y2="70" stroke="#373752" stroke-width="2"/>
            <line x1="88" y1="88" x2="70" y2="70" stroke="#373752" stroke-width="2"/>
            <circle cx="50" cy="50" r="18" fill="#1c1c30" stroke="#3b3b5c" stroke-width="2"/>
            <text x="50" y="58" font-family="'Orbitron', sans-serif" font-size="22" font-weight="900" fill="#64748b" text-anchor="middle">?</text>
        </svg>`
    };

    // Characters Roster with Color, Name, Archetype & Ultimate Special Ability
    const CHARACTERS = [
        {
            id: 'alice',
            name: 'Alice',
            role: 'The Hacker',
            color: '#00d4ff',
            avatarSvg: `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#0891b2" stroke="#22d3ee" stroke-width="2.5"/><circle cx="20" cy="15" r="7" fill="#cffafe"/><path d="M 8 34 Q 20 22 32 34 Z" fill="#cffafe"/></svg>`,
            abilityName: 'Diagonal Peek',
            abilityDesc: 'Can peek diagonally at secret rooms'
        },
        {
            id: 'frank',
            name: 'Frank',
            role: 'The Tank',
            color: '#ff3e8e',
            avatarSvg: `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#be185d" stroke="#f472b6" stroke-width="2.5"/><circle cx="20" cy="15" r="8" fill="#fce7f3"/><path d="M 6 35 Q 20 20 34 35 Z" fill="#fce7f3"/></svg>`,
            abilityName: 'Power Push',
            abilityDesc: 'Can push opponents 2 rooms or resist pushes'
        },
        {
            id: 'kevin',
            name: 'Kevin',
            role: 'The Acrobat',
            color: '#00ff88',
            avatarSvg: `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#047857" stroke="#34d399" stroke-width="2.5"/><circle cx="20" cy="14" r="6.5" fill="#d1fae5"/><path d="M 9 33 Q 20 21 31 33 Z" fill="#d1fae5"/></svg>`,
            abilityName: 'Long Jump',
            abilityDesc: 'Can jump across an adjacent room'
        },
        {
            id: 'jennifer',
            name: 'Jennifer',
            role: 'The Leader',
            color: '#ffd700',
            avatarSvg: `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#b45309" stroke="#fbbf24" stroke-width="2.5"/><circle cx="20" cy="15" r="7" fill="#fef3c7"/><path d="M 7 34 Q 20 21 33 34 Z" fill="#fef3c7"/></svg>`,
            abilityName: 'Escort',
            abilityDesc: 'Can carry teammates along when moving'
        },
        {
            id: 'emmy',
            name: 'Emmy',
            role: 'The Psychic',
            color: '#ff8c00',
            avatarSvg: `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#c2410c" stroke="#fb923c" stroke-width="2.5"/><circle cx="20" cy="15" r="7" fill="#ffedd5"/><path d="M 8 34 Q 20 22 32 34 Z" fill="#ffedd5"/></svg>`,
            abilityName: 'Mind Swap',
            abilityDesc: 'Can swap Action 1 and Action 2 order'
        },
        {
            id: 'bruce',
            name: 'Bruce',
            role: 'The Engineer',
            color: '#8b5cf6',
            avatarSvg: `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#6d28d9" stroke="#a78bfa" stroke-width="2.5"/><circle cx="20" cy="15" r="7.5" fill="#ede9fe"/><path d="M 7 34 Q 20 20 33 34 Z" fill="#ede9fe"/></svg>`,
            abilityName: 'Double Shift',
            abilityDesc: 'Can slide row 2 spaces at once'
        }
    ];

    return {
        ROOM_SVGS,
        CHARACTERS,
        getRoomSvg: (type) => ROOM_SVGS[type] || ROOM_SVGS.empty
    };
}));
