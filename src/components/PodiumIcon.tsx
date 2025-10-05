const PodiumIcon = ({ className = "h-7 w-7" }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Podium base */}
      <rect x="2" y="16" width="5" height="6" fill="#9CA3AF" rx="0.5" />
      <rect x="9" y="10" width="6" height="12" fill="#FCD34D" rx="0.5" />
      <rect x="17" y="14" width="5" height="8" fill="#FB923C" rx="0.5" />
      
      {/* Numbers */}
      <text x="4.5" y="20" fill="#4B5563" fontSize="4" fontWeight="bold" textAnchor="middle">2</text>
      <text x="12" y="17" fill="#78350F" fontSize="5" fontWeight="bold" textAnchor="middle">1</text>
      <text x="19.5" y="19" fill="#78350F" fontSize="4" fontWeight="bold" textAnchor="middle">3</text>
      
      {/* Trophy on top */}
      <path
        d="M10 8V7C10 6.5 10.5 6 11 6H13C13.5 6 14 6.5 14 7V8M12 8V5M10 5H14C14.5 5 15 4.5 15 4H9C9 4.5 9.5 5 10 5Z"
        stroke="#FCD34D"
        strokeWidth="0.8"
        fill="none"
      />
      <ellipse cx="12" cy="3" rx="2" ry="1" fill="#FCD34D" />
    </svg>
  );
};

export default PodiumIcon;
