type Mensaje = {
  role: "user" | "assistant";
  content: string;
};

type ChatMessagesProps = {
  mensajes: Mensaje[];
  nombreAgente: string;
};

export default function ChatMessages({
  mensajes,
  nombreAgente,
}: ChatMessagesProps) {
  if (mensajes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-center text-zinc-500">
        <div>
          <p className="text-lg font-medium text-zinc-700">
            ¡Hola! 👋
          </p>

          <p className="mt-2">
            Soy <strong>{nombreAgente}</strong>.
          </p>

          <p className="mt-2">
            ¿En qué puedo ayudarte hoy?
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {mensajes.map((mensaje, index) => (
        <div
          key={index}
          className={`flex ${
            mensaje.role === "user"
              ? "justify-end"
              : "justify-start"
          }`}
        >
          <div
            className={`max-w-[85%] rounded-3xl px-4 py-3 shadow whitespace-pre-wrap ${
              mensaje.role === "user"
                ? "rounded-br-md bg-blue-600 text-white"
                : "rounded-bl-md bg-white text-zinc-900"
            }`}
          >
            <p className="mb-1 text-xs opacity-60">
              {mensaje.role === "user"
                ? "Vos"
                : nombreAgente}
            </p>

            {mensaje.content}
          </div>
        </div>
      ))}
    </>
  );
}