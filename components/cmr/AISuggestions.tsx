"use client";

interface Props {
  suggestions: string[];
  onSelect: (text: string) => void;
  loading?: boolean;
}

export default function AISuggestions({
  suggestions,
  onSelect,
  loading,
}: Props) {
  if (loading) {
    return (
      <div className="rounded-lg border bg-white p-4">
        <p className="text-sm text-gray-500">
          🤖 Generando respuestas...
        </p>
      </div>
    );
  }

  if (!suggestions.length) return null;

  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <h3 className="text-sm font-semibold">
        🤖 Respuestas sugeridas
      </h3>

      {suggestions.map((item, index) => (
        <button
          key={index}
          onClick={() => onSelect(item)}
          className="w-full rounded-lg border p-3 text-left hover:bg-gray-50 transition"
        >
          {item}
        </button>
      ))}
    </div>
  );
}