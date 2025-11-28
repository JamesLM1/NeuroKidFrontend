export interface PSICOLOGOInformeDTO {
    informeId?: number; // Opcional al crear
    asignacionId: number;
    psicologoId: number;
    titulo: string;
    contenido: string;
    fechaCreacion: string;
    calificacionEficacia: number;
    // Campo enriquecido para mejor visualización
    nombreMenor?: string;
}