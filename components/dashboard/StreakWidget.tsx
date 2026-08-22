// Wrapper server-component del widget de racha. Lee el estado al vuelo
// (lazy evaluation) y lo pasa a un island client que se encarga de la
// animación y el banner de riesgo.

import { getEstadoRacha } from "@/lib/racha/server";
import type { EstadoRacha } from "@/lib/racha/types";
import { StreakWidgetClient } from "./StreakWidgetClient";

export async function StreakWidget({ userId }: { userId: string }) {
  let estado: EstadoRacha = {
    currentCount: 0,
    lastActivatedDate: null,
    diasFalladosConsecutivos: 0,
    hoyActivado: false,
    esDomingo: false,
    enRiesgo: false,
    rota: false,
  };
  try {
    estado = await getEstadoRacha(userId);
  } catch (e) {
    console.error("Error cargando racha para widget:", e);
  }

  return <StreakWidgetClient initialState={estado} />;
}
