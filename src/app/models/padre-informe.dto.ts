export interface PADREInformeDTO {
    informeId: number;
    menorId: number;
    nombreMenor: string;
    mes: number;
    anio: number;
    resumen: string;
    // Campos enriquecidos para mejor visualización
    fechaCreacion?: string;
    nombrePsicologo?: string;
    titulo?: string; // Título del informe (para búsqueda inteligente)
}