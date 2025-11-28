import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PadreService } from '../../../services/padre.service';
import { AuthService } from '../../../services/auth.service';
import { PADRECitaRequestDTO } from '../../../models/padre-cita-request.dto';
import { PADRESolicitudCitaDTO } from '../../../models/padre-solicitud-cita.dto';
import { PADREMenorDTO } from '../../../models/padre-menor.dto';
import { PADREPsicologoDTO } from '../../../models/padre-psicologo.dto';
import { DisponibilidadSlotDTO } from '../../../models/disponibilidad-slot.dto';
import { ADMINAsignacionDTO } from '../../../models/admin-asignacion.dto';

@Component({
  selector: 'app-add-cita',
  standalone: false,
  templateUrl: './add-cita.html',
  styleUrls: ['./add-cita.css']
})
export class AddCitaComponent implements OnInit {

  addCitaForm!: FormGroup;
  title: string = 'Solicitar Nueva Cita';
  
  // NUEVO MODELO AUTOSERVICIO
  misMenores: PADREMenorDTO[] = [];
  psicologosDisponibles: PADREPsicologoDTO[] = [];
  
  // NUEVO: SELECCIÓN DINÁMICA DE HORARIOS
  horariosDisponibles: string[] = [];
  cargandoHorarios = false;
  disponibilidadInfo: DisponibilidadSlotDTO | null = null;
  
  // MODELO ANTERIOR (mantenido para compatibilidad)
  misAsignaciones: ADMINAsignacionDTO[] = [];
  minDate: Date = new Date(); // Fecha mínima: hoy (no se pueden agendar citas pasadas)

  constructor(
    private fb: FormBuilder,
    private padreService: PadreService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<AddCitaComponent>
  ) { }

  ngOnInit(): void {
    this.CargarFormulario();
    // NUEVO MODELO: Cargar menores y psicólogos por separado
    this.CargarMenores();
    this.CargarPsicologos();
    this.ConfigurarListeners();
    // MODELO ANTERIOR: Mantener para compatibilidad
    // this.CargarAsignaciones();
  }

  CargarFormulario(): void {
    this.addCitaForm = this.fb.group({
      // NUEVO MODELO AUTOSERVICIO
      menorId: [null, Validators.required],
      psicologoId: [null, Validators.required],
      
      // CAMPOS COMUNES
      fecha: ['', Validators.required],
      horarioSeleccionado: ['', Validators.required], // NUEVO: Reemplaza horaInicio/horaFin
      motivo: ['', Validators.required]
      
      // MODELO ANTERIOR (comentado)
      // horaInicio: ['', Validators.required],
      // horaFin: ['', Validators.required],
      // asignacionId: [null, Validators.required],
    });
  }

  // NUEVO MÉTODO: Cargar menores del padre autenticado
  CargarMenores(): void {
    this.padreService.getMenoresDisponibles().subscribe({
      next: (data) => {
        this.misMenores = data;
        console.log('👶 Menores cargados:', this.misMenores);
      },
      error: (err) => {
        console.error('❌ Error al cargar menores:', err);
        this.snackBar.open('Error al cargar la lista de hijos. Verifica que tengas hijos registrados.', 'OK', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // NUEVO MÉTODO: Cargar psicólogos disponibles
  CargarPsicologos(): void {
    this.padreService.getPsicologosDisponibles().subscribe({
      next: (data) => {
        this.psicologosDisponibles = data;
        console.log('👨‍⚕️ Psicólogos disponibles cargados:', this.psicologosDisponibles);
      },
      error: (err) => {
        console.error('❌ Error al cargar psicólogos:', err);
        this.snackBar.open('Error al cargar la lista de psicólogos disponibles.', 'OK', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // NUEVO MÉTODO: Configurar listeners para cargar horarios dinámicamente
  ConfigurarListeners(): void {
    // Listener para cambios en psicólogo (la fecha se maneja en onFechaChange)
    this.addCitaForm.get('psicologoId')?.valueChanges.subscribe(() => {
      this.CargarHorariosDisponibles();
    });

    // Listener para cambios en fecha (cuando se actualiza programáticamente)
    // Nota: El datepicker dispara onFechaChange, pero mantenemos este listener por si acaso
    this.addCitaForm.get('fecha')?.valueChanges.subscribe((fecha) => {
      // Solo cargar si la fecha es un string válido (no un objeto Date)
      if (fecha && typeof fecha === 'string') {
        this.CargarHorariosDisponibles();
      }
    });
  }

  // MÉTODO: Manejar cambio de fecha desde el datepicker
  onFechaChange(event: any): void {
    const fechaSeleccionada = event.value;
    if (fechaSeleccionada) {
      // Convertir Date a string YYYY-MM-DD para el formulario
      const fechaString = this.formatDateToString(fechaSeleccionada);
      this.addCitaForm.get('fecha')?.setValue(fechaString, { emitEvent: false });
      // Disparar carga de horarios
      this.CargarHorariosDisponibles();
    }
  }

  // MÉTODO HELPER: Convertir Date a string YYYY-MM-DD
  formatDateToString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // NUEVO MÉTODO: Cargar horarios disponibles cuando cambie psicólogo o fecha
  CargarHorariosDisponibles(): void {
    const psicologoId = this.addCitaForm.get('psicologoId')?.value;
    const fecha = this.addCitaForm.get('fecha')?.value;

    // Limpiar selección anterior
    this.addCitaForm.get('horarioSeleccionado')?.setValue('');
    this.horariosDisponibles = [];
    this.disponibilidadInfo = null;

    // Validar que ambos campos estén completos
    if (!psicologoId || !fecha) {
      console.log('⏳ Esperando selección de psicólogo y fecha...');
      return;
    }

    // Validar que la fecha no sea pasada
    const fechaSeleccionada = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaSeleccionada.setHours(0, 0, 0, 0);

    if (fechaSeleccionada < hoy) {
      this.snackBar.open('No se pueden consultar horarios de fechas pasadas', 'OK', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    console.log('🕐 Cargando horarios disponibles - Psicólogo:', psicologoId, 'Fecha:', fecha);
    this.cargandoHorarios = true;

    this.padreService.getDisponibilidad(psicologoId, fecha).subscribe({
      next: (disponibilidad) => {
        this.disponibilidadInfo = disponibilidad;
        this.horariosDisponibles = disponibilidad.horariosDisponibles;
        this.cargandoHorarios = false;

        console.log('✅ Horarios disponibles cargados:', this.horariosDisponibles);
        console.log('📊 Estadísticas:', {
          total: disponibilidad.totalSlots,
          ocupados: disponibilidad.slotsOcupados,
          disponibles: disponibilidad.slotsDisponibles
        });

        if (this.horariosDisponibles.length === 0) {
          this.snackBar.open('No hay horarios disponibles para esta fecha. Intenta con otra fecha.', 'OK', {
            duration: 4000,
            panelClass: ['warning-snackbar']
          });
        }
      },
      error: (err) => {
        console.error('❌ Error al cargar horarios:', err);
        this.cargandoHorarios = false;
        this.snackBar.open('Error al consultar horarios disponibles. Intenta nuevamente.', 'OK', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // MÉTODO ANTERIOR: Mantener para compatibilidad (comentado)
  /*
  CargarAsignaciones(): void {
    this.padreService.getMisAsignaciones().subscribe({
      next: (data) => {
        // Filtrar solo las asignaciones activas
        this.misAsignaciones = data.filter(a => a.estado === 'Activa');
        console.log('📋 Asignaciones cargadas:', this.misAsignaciones);
      },
      error: (err) => {
        console.error('❌ Error al cargar asignaciones:', err);
        this.snackBar.open('Error al cargar asignaciones. Verifica que tengas asignaciones activas.', 'OK', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
  */

  Grabar(): void {
    if (this.addCitaForm.invalid) {
      Object.keys(this.addCitaForm.controls).forEach(key => {
        this.addCitaForm.get(key)?.markAsTouched();
      });
      this.snackBar.open('Por favor complete todos los campos requeridos', 'OK', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    // TRUCO DEL MEDIODÍA: Forzar hora a 12:00 para evitar desfase de zona horaria
    const rawDate = this.addCitaForm.value.fecha;
    let fechaString: string;
    
    if (!rawDate) {
      this.snackBar.open('La fecha es requerida', 'OK', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    // Clonar la fecha para no mutar el form original
    let fechaAjustada: Date;
    
    if (rawDate instanceof Date) {
      // Si es objeto Date (del datepicker), clonarlo
      fechaAjustada = new Date(rawDate);
    } else if (typeof rawDate === 'string') {
      // Si ya es string (formato YYYY-MM-DD), convertir a Date
      fechaAjustada = new Date(rawDate);
    } else {
      // Fallback: intentar convertir a Date
      fechaAjustada = new Date(rawDate);
    }
    
    // TRUCO DEL MEDIODÍA: Forzar a las 12:00 del día para evitar saltos de zona horaria
    fechaAjustada.setHours(12, 0, 0, 0);
    
    // Validación: verificar que la fecha no sea pasada
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparar solo fechas
    const fechaComparacion = new Date(fechaAjustada);
    fechaComparacion.setHours(0, 0, 0, 0);
    
    if (fechaComparacion < hoy) {
      this.snackBar.open('No se pueden agendar citas en fechas pasadas', 'OK', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    // Ahora sí, convertir a string YYYY-MM-DD usando los métodos de la fecha ajustada
    const year = fechaAjustada.getFullYear();
    const month = String(fechaAjustada.getMonth() + 1).padStart(2, '0');
    const day = String(fechaAjustada.getDate()).padStart(2, '0');
    fechaString = `${year}-${month}-${day}`;
    
    console.log('📅 Fecha original:', rawDate);
    console.log('📅 Fecha ajustada (mediodía):', fechaAjustada);
    console.log('📅 Fecha string construida:', fechaString);

    // Extraer hora de inicio y calcular hora de fin (1 hora después)
    const horarioSeleccionado = this.addCitaForm.value.horarioSeleccionado;
    const horaInicio = horarioSeleccionado;
    
    // Calcular hora de fin (1 hora después)
    const [horas, minutos] = horarioSeleccionado.split(':').map(Number);
    const horaFin = `${String(horas + 1).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;

    // NUEVO MODELO: Solicitud directa con menor y psicólogo
    const solicitudData: PADRESolicitudCitaDTO = {
      menorId: this.addCitaForm.value.menorId,
      psicologoId: this.addCitaForm.value.psicologoId,
      fecha: fechaString, // Enviamos el string en formato YYYY-MM-DD construido manualmente
      horaInicio: horaInicio,
      horaFin: horaFin,
      motivo: this.addCitaForm.value.motivo.trim(),
      estado: 'Pendiente'
    };

    console.log('📅 Solicitando cita directa:', solicitudData);

    this.padreService.solicitarCitaDirecta(solicitudData).subscribe({
      next: (response) => {
        console.log('✅ Cita creada exitosamente:', response);
        console.log('📋 Cita ID:', response.citaId, 'Estado:', response.estado);
        this.snackBar.open('¡Cita solicitada con éxito! Esperando confirmación del psicólogo.', 'OK', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        // Cerrar el diálogo con true para indicar éxito y recargar la lista
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('❌ Error al solicitar cita:', err);
        const errorMsg = err.error?.message || err.message || 'Error al solicitar cita';
        this.snackBar.open(`ERROR: ${errorMsg}`, 'OK', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // MÉTODO HELPER: Calcular hora de fin para mostrar en el select
  getHoraFin(horaInicio: string): string {
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const horaFin = `${String(horas + 1).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
    return horaFin;
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
