// Wrapper server-component del widget "Tu semana" (racha + días de la semana).
// Lee el estado al vuelo (lazy evaluation) y lo pasa a un island client que se
// encarga de la animación, la tira semanal y el banner de riesgo.

import { getInicioRacha } from "@/lib/racha/server";
import { construirCalendarioActivaciones, semanaActual } from "@/lib/racha/reglas";
import { getHoyColombia } from "@/lib/utils/fecha";
import type { InicioRacha } from "@/lib/racha/types";
import { StreakWidgetClient } from "./StreakWidgetClient";

export async function StreakWidget({ userId }: { userId: string }) {
  let datos: InicioRacha = {
    estado: {
      currentCount: 0,
      lastActivatedDate: null,
      diasFalladosConsecutivos: 0,
      hoyActivado: false,
      esDomingo: false,
      enRiesgo: false,
      rota: false,
    },
    semana: semanaActual(construirCalendarioActivaciones([]), getHoyColombia()),
  };
  try {
    datos = await getInicioRacha(userId);
  } catch (e) {
    console.error("Error cargando racha para widget:", e);
  }

  return <StreakWidgetClient initialState={datos.estado} semanaInicial={datos.semana} />;
}
