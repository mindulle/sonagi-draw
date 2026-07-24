
export const getLibraryIcon = (type: string) => {
    const stroke = "#4b5563"
    const fill = "#f3f4f6"
    
    switch (type) {
        case 'button':
            return <svg viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth="2"><rect x="6" y="12" width="28" height="16" rx="4" fill="#bfdbfe" /><path d="M12 20h16" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round"/></svg>
        case 'card':
            return <svg viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth="2"><rect x="6" y="4" width="28" height="32" rx="2" fill={fill} /><rect x="10" y="8" width="20" height="12" fill="#d1d5db" /><path d="M10 24h14 M10 28h20" strokeWidth="2" strokeLinecap="round" /></svg>
        case 'modal':
            return <svg viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth="2"><rect x="2" y="8" width="36" height="24" rx="2" fill={fill} /><path d="M2 16h36 M32 12l4 4 M36 12l-4 4" strokeWidth="1.5" /><rect x="12" y="24" width="16" height="4" fill="#bfdbfe" stroke="none" /></svg>
        case 'wired-progress':
            return <svg viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth="2"><rect x="4" y="16" width="32" height="8" rx="4" fill={fill} /><rect x="4" y="16" width="20" height="8" rx="4" fill="#10b981" stroke="none" /></svg>
        case 'wired-data-table':
            return <svg viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth="2"><rect x="4" y="8" width="32" height="24" rx="2" fill={fill} /><path d="M4 16h32 M4 24h32 M14 8v24 M26 8v24" strokeWidth="1.5" /></svg>
        case 'wired-toggle':
            return <svg viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth="2"><rect x="8" y="14" width="24" height="12" rx="6" fill="#a7f3d0" /><circle cx="26" cy="20" r="4" fill="#fff" /></svg>
        case 'wired-checkbox':
            return <svg viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth="2"><rect x="8" y="14" width="12" height="12" rx="2" fill={fill} /><path d="M10 20l3 3 5-7" stroke="#10b981" strokeLinecap="round" strokeLinejoin="round" /><path d="M24 20h8" strokeLinecap="round" /></svg>
        case 'wired-bar-chart':
            return <svg viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth="2"><path d="M6 34h28 M6 6v28" strokeWidth="2" /><rect x="10" y="20" width="6" height="14" fill="#3b82f6" stroke="none" /><rect x="18" y="10" width="6" height="24" fill="#3b82f6" stroke="none" /><rect x="26" y="24" width="6" height="10" fill="#3b82f6" stroke="none" /></svg>
        case 'wired-donut-chart':
            return <svg viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth="2"><circle cx="20" cy="20" r="14" strokeWidth="4" stroke="#d1d5db" /><path d="M20 6A14 14 0 0 1 34 20" stroke="#10b981" strokeWidth="4" strokeLinecap="round" /></svg>
        case 'mobile-frame':
            return <svg viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth="2"><rect x="12" y="2" width="16" height="36" rx="4" fill={fill} /><path d="M17 6h6 M16 34h8" strokeWidth="1.5" strokeLinecap="round" /></svg>
        case 'browser-window':
            return <svg viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth="2"><rect x="2" y="6" width="36" height="28" rx="2" fill={fill} /><path d="M2 12h36 M6 9h2 M10 9h2 M14 9h2" strokeWidth="2" strokeLinecap="round" /></svg>
        case 'dashboard-skeleton':
            return <svg viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth="2"><rect x="2" y="6" width="36" height="28" rx="2" fill={fill} /><path d="M12 6v28 M12 14h26" strokeWidth="1.5" /><rect x="16" y="18" width="18" height="12" fill="#d1d5db" stroke="none" /></svg>
        case 'auth-form':
            return <svg viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth="2"><rect x="8" y="4" width="24" height="32" rx="2" fill={fill} /><path d="M14 12h12 M12 18h16 M12 24h16" strokeWidth="1.5" strokeLinecap="round" /><rect x="12" y="28" width="16" height="4" fill="#3b82f6" stroke="none" /></svg>
        case 'pricing-table':
            return <svg viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth="2"><rect x="4" y="10" width="10" height="20" rx="2" fill={fill} /><rect x="16" y="6" width="10" height="28" rx="2" fill="#dbeafe" stroke="#3b82f6" /><rect x="28" y="10" width="10" height="20" rx="2" fill={fill} /></svg>
        case 'feed-list':
            return <svg viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth="2"><rect x="6" y="6" width="28" height="8" rx="2" fill={fill} /><rect x="6" y="16" width="28" height="8" rx="2" fill={fill} /><rect x="6" y="26" width="28" height="8" rx="2" fill={fill} /><path d="M10 10h4 M10 20h4 M10 30h4" strokeWidth="2" strokeLinecap="round" /></svg>
        case 'user-flow':
            return <svg viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth="2"><rect x="2" y="16" width="10" height="8" rx="2" fill="#bfdbfe" stroke="#3b82f6" /><path d="M12 20h6 l-2-2 M16 20l-2 2" stroke="#111" strokeWidth="1.5" /><path d="M18 20l6-6h12l-6 6 6 6H24z" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" /></svg>
        case 'sitemap':
            return <svg viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth="2"><rect x="16" y="4" width="8" height="6" rx="1" fill="#111" /><rect x="6" y="20" width="8" height="6" rx="1" fill={fill} /><rect x="16" y="20" width="8" height="6" rx="1" fill={fill} /><rect x="26" y="20" width="8" height="6" rx="1" fill={fill} /><path d="M20 10v6 M20 16H10v4 M20 16h10v4" strokeWidth="1.5" /></svg>
        case 'sticky-cluster':
            return <svg viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth="1.5"><rect x="10" y="8" width="12" height="12" fill="#fef08a" transform="rotate(-10 16 14)" /><rect x="22" y="10" width="12" height="12" fill="#bbf7d0" transform="rotate(5 28 16)" /><rect x="14" y="20" width="12" height="12" fill="#fecaca" transform="rotate(15 20 26)" /></svg>
        case 'cursor-pointer':
            return <svg viewBox="0 0 40 40" fill="none" stroke="#111" strokeWidth="2"><path d="M14 14l8 20 2-8 8-2-18-10z" fill="#fff" strokeLinejoin="round" /></svg>
        case 'comment-pin':
            return <svg viewBox="0 0 40 40" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M20 34c-6-6-10-12-10-18A10 10 0 1 1 30 16c0 6-4 12-10 18z" fill="#fca5a5" /><circle cx="20" cy="16" r="4" fill="#ef4444" /></svg>
        case 'measurement-line':
            return <svg viewBox="0 0 40 40" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M6 10v20 M34 10v20 M6 20h28 M10 16l-4 4 4 4 M30 16l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        default:
            return <svg viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth="2"><rect x="10" y="10" width="20" height="20" rx="4" strokeDasharray="4 4" /></svg>
    }
}
