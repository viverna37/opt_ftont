import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

// Stroke-иконки как в макетах (24×24, stroke 1.8)
function makeIcon(inner: string) {
    return function IconComponent({ size = 22, ...props }: IconProps) {
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: inner }}
                {...props}
            />
        );
    };
}

export const IconGrid = makeIcon('<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>');
export const IconCart = makeIcon('<circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M3 4h2l2.2 11.2a1.8 1.8 0 0 0 1.8 1.5h7.4a1.8 1.8 0 0 0 1.8-1.4L20 8H6"/>');
export const IconReceipt = makeIcon('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>');
export const IconChat = makeIcon('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>');
export const IconSearch = makeIcon('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>');
export const IconBack = makeIcon('<path d="M15 5l-7 7 7 7"/>');
export const IconChevronRight = makeIcon('<path d="M9 5l7 7-7 7"/>');
export const IconChevronDown = makeIcon('<path d="M6 9l6 6 6-6"/>');
export const IconSort = makeIcon('<path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4"/>');
export const IconBox = makeIcon('<path d="M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10"/>');
export const IconUsers = makeIcon('<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 7M21 20c0-2.6-1.6-4.8-4-5.6"/>');
export const IconSettings = makeIcon('<circle cx="12" cy="12" r="3"/><path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.5-2-3.4-2.3.9a7.6 7.6 0 0 0-1.7-1L15 3h-4l-.4 2.4a7.6 7.6 0 0 0-1.7 1l-2.3-.9-2 3.4L6.6 11a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.3-.9a7.6 7.6 0 0 0 1.7 1L11 21h4l.4-2.4a7.6 7.6 0 0 0 1.7-1l2.3.9 2-3.4z"/>');
export const IconPlus = makeIcon('<path d="M12 5v14M5 12h14"/>');
export const IconMinus = makeIcon('<path d="M5 12h14"/>');
export const IconTrash = makeIcon('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>');
export const IconCopy = makeIcon('<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>');
export const IconCamera = makeIcon('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>');
export const IconPhoto = makeIcon('<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>');
export const IconX = makeIcon('<path d="M6 6l12 12M18 6L6 18"/>');
export const IconCheck = makeIcon('<path d="M5 13l4 4 10-10"/>');
export const IconRepeat = makeIcon('<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>');
export const IconBell = makeIcon('<path d="M6 10a6 6 0 0 1 12 0v4l1.5 3h-15L6 14z"/><path d="M10 20a2 2 0 0 0 4 0"/>');
export const IconDownload = makeIcon('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>');
export const IconSend = makeIcon('<path d="M21 3L10 14"/><path d="M21 3l-7 18-4-7-7-4z"/>');
export const IconLock = makeIcon('<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>');
export const IconClock = makeIcon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>');
export const IconShield = makeIcon('<path d="M12 3l7 3v5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>');
export const IconTag = makeIcon('<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>');
export const IconLayers = makeIcon('<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>');
export const IconSliders = makeIcon('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>');
export const IconPalette = makeIcon('<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.5-.8 1.5-1.5 0-1.2-1-1.5-1-2.5 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.2-4-7.5-9-7.5z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="14.5" cy="7" r="1"/>');
export const IconList = makeIcon('<path d="M4 6h16M4 12h16M4 18h10"/>');
export const IconStore = makeIcon('<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9h16v2a3 3 0 0 1-5.3 2 3 3 0 0 1-5.4 0A3 3 0 0 1 4 11z"/><path d="M5 13v7h14v-7"/>');
export const IconEye = makeIcon('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>');
export const IconEyeOff = makeIcon('<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>');
export const IconAlert = makeIcon('<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>');
export const IconMore = makeIcon('<circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/>');
