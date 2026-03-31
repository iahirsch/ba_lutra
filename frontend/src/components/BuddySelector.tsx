type Option = {
  name: string;
  image: string; // Pfad zum Vorschaubild
};

type BuddySelectorProps = {
  label: string;
  options: Option[];
  selected: string;
  onSelect: (name: string) => void;
};

export function BuddySelector({
  label,
  options,
  selected,
  onSelect,
}: BuddySelectorProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '0 16px',
      }}
    >
      <span style={{ color: '#fff', marginBottom: 4 }}>{label}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        {options.map((opt) => (
          <button
            key={opt.name}
            onClick={() => onSelect(opt.name)}
            style={{
              border:
                selected === opt.name ? '2px solid #4caf50' : '1px solid #888',
              background: '#222',
              borderRadius: 8,
              padding: 2,
              cursor: 'pointer',
            }}
          >
            <img
              src={opt.image}
              alt={opt.name}
              style={{ width: 48, height: 48, objectFit: 'contain' }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
export default BuddySelector;
