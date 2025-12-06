import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { ADMINPsicologoDTO } from '../models/admin-psicologo.dto'; 
import { ADMINAsignacionDTO } from '../models/admin-asignacion.dto';
import { PSICOLOGODisponibilidadDTO } from '../models/psicologo-disponibilidad.dto';
import { PSICOLOGOCitaResponseDTO } from '../models/psicologo-cita-response.dto';
import { PSICOLOGOInformeDTO } from '../models/psicologo-informe.dto';
import { PSICOLOGOProgresoMenorDTO } from '../models/psicologo-progreso-menor.dto';
import { PSICOLOGODashboardDTO } from '../models/psicologo-dashboard.dto';

@Injectable({
  providedIn: 'root'
})//gs
export class PsicologoService {

  ruta_servidor: string = "http://localhost:8080/api/psicologos";

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getPsicologoId(): number | null {
    return this.authService.getUserId();
  }

  // --- GESTIÓN DE DASHBOARD ---
  getDashboardMetrics(): Observable<PSICOLOGODashboardDTO> {
    const id = this.getPsicologoId();
    return this.http.get<PSICOLOGODashboardDTO>(`${this.ruta_servidor}/${id}/dashboard`);
  }

  // --- GESTIÓN DE PERFIL ---
  getMiPerfil(): Observable<ADMINPsicologoDTO> {
    const id = this.getPsicologoId();
    return this.http.get<ADMINPsicologoDTO>(`${this.ruta_servidor}/${id}/perfil`);
  }
  editMiPerfil(data: ADMINPsicologoDTO): Observable<ADMINPsicologoDTO> {
    const id = this.getPsicologoId();
    return this.http.put<ADMINPsicologoDTO>(`${this.ruta_servidor}/${id}/perfil`, data);
  }

  // --- GESTIÓN DE DISPONIBILIDAD ---
  getMiDisponibilidad(): Observable<PSICOLOGODisponibilidadDTO[]> {
    const id = this.getPsicologoId();
    return this.http.get<PSICOLOGODisponibilidadDTO[]>(`${this.ruta_servidor}/${id}/disponibilidad`);
 }
  newDisponibilidad(data: PSICOLOGODisponibilidadDTO): Observable<PSICOLOGODisponibilidadDTO> {
    const id = this.getPsicologoId();
    data.psicologoId = id!;
    return this.http.post<PSICOLOGODisponibilidadDTO>(`${this.ruta_servidor}/${id}/disponibilidad`, data);
  }
  updateDisponibilidad(disponibilidadId: number, data: PSICOLOGODisponibilidadDTO): Observable<PSICOLOGODisponibilidadDTO> {
    const id = this.getPsicologoId();
    data.psicologoId = id!;
    data.disponibilidadId = disponibilidadId;
    // El backend usa PUT para actualizar específicamente por ID
    return this.http.put<PSICOLOGODisponibilidadDTO>(`${this.ruta_servidor}/${id}/disponibilidad/${disponibilidadId}`, data);
  }
  deleteDisponibilidad(disponibilidadId: number): Observable<any> {
    const id = this.getPsicologoId();
    return this.http.delete<any>(`${this.ruta_servidor}/${id}/disponibilidad/${disponibilidadId}`);
  }

  // --- GESTIÓN DE CITAS ---
  getMisProximasCitas(): Observable<PSICOLOGOCitaResponseDTO[]> {
    const id = this.getPsicologoId();
    return this.http.get<PSICOLOGOCitaResponseDTO[]>(`${this.ruta_servidor}/${id}/citas/proximas`);
  } // <--- Aquí estaba la 'G'
  getMiHistorialCitas(): Observable<PSICOLOGOCitaResponseDTO[]> {
    const id = this.getPsicologoId();
    return this.http.get<PSICOLOGOCitaResponseDTO[]>(`${this.ruta_servidor}/${id}/citas/historial`);
  }
  cambiarEstadoCita(citaId: number, estado: string): Observable<PSICOLOGOCitaResponseDTO> {
    const id = this.getPsicologoId();
    return this.http.patch<PSICOLOGOCitaResponseDTO>(`${this.ruta_servidor}/${id}/citas/${citaId}/estado?estado=${estado}`, {});
  }
  finalizarCita(citaId: number, hallazgos: string): Observable<PSICOLOGOCitaResponseDTO> {
    const id = this.getPsicologoId();
    return this.http.patch<PSICOLOGOCitaResponseDTO>(`${this.ruta_servidor}/${id}/citas/${citaId}/finalizar`, hallazgos, {
      headers: { 'Content-Type': 'text/plain' } 
    });
  }

  // --- GESTIÓN DE ASIGNACIONES ---
  getMisAsignaciones(): Observable<ADMINAsignacionDTO[]> {
    const id = this.getPsicologoId();
    return this.http.get<ADMINAsignacionDTO[]>(`${this.ruta_servidor}/${id}/asignaciones`);
  }

  // --- GESTIÓN DE INFORMES Y PROGRESO ---
  crearInforme(asignacionId: number, data: PSICOLOGOInformeDTO): Observable<PSICOLOGOInformeDTO> {
    const id = this.getPsicologoId();
    data.psicologoId = id!;
    return this.http.post<PSICOLOGOInformeDTO>(`${this.ruta_servidor}/${id}/asignaciones/${asignacionId}/informes`, data);
  }
  getInformesPorAsignacion(asignacionId: number): Observable<PSICOLOGOInformeDTO[]> {
    const id = this.getPsicologoId();
    return this.http.get<PSICOLOGOInformeDTO[]>(`${this.ruta_servidor}/${id}/asignaciones/${asignacionId}/informes`);
  } // <--- Aquí estaba la 't'
  getProgresoMenor(menorId: number): Observable<PSICOLOGOProgresoMenorDTO> {
    const id = this.getPsicologoId();
    return this.http.get<PSICOLOGOProgresoMenorDTO>(`${this.ruta_servidor}/${id}/menores/${menorId}/progreso`);
  }
}
