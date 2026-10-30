export default function Logo() {
  return (
    <span className="logo">
      <svg className="logo__mark" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="15" fill="none" stroke="currentColor" strokeWidth="1" />
        <ellipse cx="16" cy="16" rx="15" ry="6.5" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="16" cy="16" r="2.2" fill="currentColor" />
      </svg>
      <span className="logo__word">INTRANOVA</span>
    </span>
  );
}
