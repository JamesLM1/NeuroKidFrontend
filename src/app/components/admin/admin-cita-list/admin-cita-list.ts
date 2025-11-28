import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../../services/admin.service';
import { ADMINCitaListDTO } from '../../../models/admin-cita-list.dto';

@Component({
  selector: 'app-admin-cita-list',
  standalone: false,
  templateUrl: './admin-cita-list.html',
  styleUrls: ['./admin-cita-list.css']
})
export class AdminCitaListComponent implements OnInit {

  displayedColumns: string[] = ['fecha', 'hora', 'psicologo', 'menor', 'padre', 'estado', 'actions'];
  dsCitas = new MatTableDataSource<ADMINCitaListDTO>();

  constructor(
    private adminService: AdminService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.CargarLista();
  }

  CargarLista(): void {
    this.adminService.getAllCitas().subscribe({
      next: (data: ADMINCitaListDTO[]) => {
        this.dsCitas = new MatTableDataSource(data);
        // Configurar filtro personalizado (insensible a tildes y multi-columna)
        this.configurarSuperFiltro();
      },
      error: (err) => {
        console.error("Error al cargar citas:", err);
        this.snackBar.open('Error al cargar las citas', 'OK', { duration: 3000 });
      }
    });
  }

  configurarSuperFiltro(): void {
    this.dsCitas.filterPredicate = (data: ADMINCitaListDTO, filter: string) => {
      // 1. Concatenar todos los valores del objeto en un solo string largo
      const dataStr = JSON.stringify(data).toLowerCase();
      
      // 2. Normalizar el string de datos (Quitar tildes: á -> a, ñ -> n, etc.)
      const dataNormalized = dataStr.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      // 3. Normalizar el texto de búsqueda del usuario de la misma manera
      const filterNormalized = filter.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      // 4. Verificar si el texto buscado está dentro de los datos normalizados
      return dataNormalized.indexOf(filterNormalized) !== -1;
    };
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    // El filterPredicate personalizado ya maneja la normalización y toLowerCase
    this.dsCitas.filter = filterValue;
  }

  // Formatear hora para mostrar (HH:mm)
  formatHora(hora: string): string {
    if (!hora) return '-';
    // Si viene en formato HH:mm:ss, tomar solo HH:mm
    return hora.substring(0, 5);
  }

  // Formatear rango de horas
  formatRangoHoras(horaInicio: string, horaFin: string): string {
    const inicio = this.formatHora(horaInicio);
    const fin = this.formatHora(horaFin);
    return `${inicio} - ${fin}`;
  }

  // Ver detalle de cita (futuro: abrir diálogo con detalles completos)
  verDetalle(cita: ADMINCitaListDTO): void {
    // Por ahora solo mostramos un mensaje
    this.snackBar.open(`Cita #${cita.citaId} - ${cita.motivo || 'Sin motivo especificado'}`, 'OK', { 
      duration: 3000 
    });
  }

  // Cancelar cita (futuro: implementar lógica de cancelación)
  cancelarCita(cita: ADMINCitaListDTO): void {
    // Por ahora solo mostramos un mensaje
    this.snackBar.open(`Funcionalidad de cancelación en desarrollo`, 'OK', { 
      duration: 3000 
    });
  }

  // Obtener clase CSS para el badge de estado
  getEstadoClass(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'programada':
      case 'confirmada':
        return 'nk-badge--success';
      case 'cancelada':
        return 'nk-badge--danger';
      case 'completada':
        return 'nk-badge--info';
      case 'en curso':
        return 'nk-badge--warn';
      default:
        return 'nk-badge';
    }
  }
}

