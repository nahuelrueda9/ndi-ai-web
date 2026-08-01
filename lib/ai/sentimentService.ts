export async function analizarSentimiento(historial: any[]) {
  const res = await fetch("/api/sentiment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      historial,
    }),
  });

  return await res.json();
}