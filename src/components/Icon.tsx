const PATHS: Record<string, string> = {
  pulse: "M3 12h4l2-5 4 10 2-5h6",
  wave: "M3 9c3-3 6 3 9 0s6 3 9 0M3 15c3-3 6 3 9 0s6 3 9 0",
  body: "M12 5.5a2 2 0 1 0 0-.01M7 9.5h10M12 9.5V15m0 0-3 6m3-6 3 6",
  eye: "M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  people: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 9c0-3.3 2.7-6 6-6s6 2.7 6 6m1-9a3 3 0 1 0 0-6m2 15c0-2.6-1.4-4.8-3.5-5.6",
  spark: "M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2.5 2.5m7 7L18 18M6 18l2.5-2.5m7-7L18 6",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v5m8-5v5",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4l3 2",
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 1 1 14 0C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  check: "M5 12.5 10 17l9-10",
  play: "M8 5v14l11-7z",
  arrow: "M5 12h14m-5-6 6 6-6 6",
  tg: "M21 4 3 11l6 2m12-9-4 16-8-7m12-9L9 13m0 0v6l3-3.5",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  phone: "M6.5 3h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 4.5 5a2 2 0 0 1 2-2Z",
  max: "M4 12a8 8 0 1 1 3.4 6.5L4 20l1.2-3.6A8 8 0 0 1 4 12Zm4.2 2.2V9.8l2 2.6 1.8-2.6v4.4m3-4.4v4.4m0-4.4 2.5 4.4",
  chat: "M4 5h16v11H9l-5 4V5Z",
  close: "M6 6l12 12M18 6 6 18",
  ig:"M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3Zm4.5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.2-1.7h.01",
};

export default function Icon({ name, size = 22, className }: { name: string; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={name === "play" ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
