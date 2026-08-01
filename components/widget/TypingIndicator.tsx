export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-3xl rounded-tl-md bg-white px-4 py-3 shadow">
        <div className="flex items-center gap-1">
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-zinc-500"
            style={{ animationDelay: "0ms" }}
          />

          <span
            className="h-2 w-2 animate-bounce rounded-full bg-zinc-500"
            style={{ animationDelay: "150ms" }}
          />

          <span
            className="h-2 w-2 animate-bounce rounded-full bg-zinc-500"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}