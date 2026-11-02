export function NightSky() {
  return (
    <div className="night-sky" aria-hidden="true">
      <div className="night-moon" />
      {Array.from({ length: 75 }, (_, index) => (
        <span
          key={index}
          style={{
            left: `${(index * 37.73) % 100}%`,
            top: `${(index * 19.31) % 100}%`,
            width: `${index % 4 === 0 ? 3 : 1.5}px`,
            height: `${index % 4 === 0 ? 3 : 1.5}px`,
            opacity: 0.3 + (index % 6) * 0.12,
          }}
        />
      ))}
    </div>
  );
}
