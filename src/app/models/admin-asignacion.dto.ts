export interface ADMINAsignacionDTO {
    asignacionId: number;
    padreId: number;
    menorId: number;
    psicologoId: number;
    fechaAsignacion: string; // Usamos string para fechas, como en el ejemplo
    estado: string;
    
    // Campos opcionales para nombres completos (enriquecidos desde el backend o frontend)
    nombrePadre?: string;
    nombreMenor?: string;
    nombrePsicologo?: string;
}
