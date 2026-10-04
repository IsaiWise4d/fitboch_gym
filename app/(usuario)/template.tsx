// Se vuelve a montar en cada navegación: entrada suave de cada pantalla.
// (Respeta "reducir movimiento" vía la media query de globals.css.)
export default function UsuarioTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
      {children}
    </div>
  );
}
