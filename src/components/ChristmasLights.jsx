const colors = ['#ff6969', '#ffd66b', '#6ee7a0', '#81b9ff', '#e5a0ff'];

export function ChristmasLights() {
  return (
    <div className="christmas-lights" aria-hidden="true">
      {Array.from({ length: 24 }, (_, index) => (
        <span
          className="christmas-light"
          key={index}
          style={{
            '--bulb-color': colors[index % colors.length],
            '--bulb-delay': `${-(index % 7) * 0.6}s`,
            '--bulb-drop': `${index % 2 ? 7 : 0}px`,
          }}
        >
          <i />
        </span>
      ))}
    </div>
  );
}
