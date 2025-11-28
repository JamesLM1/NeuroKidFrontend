import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PadreService } from '../../../services/padre.service';
import { PADRECitaResponseDTO } from '../../../models/padre-cita-response.dto';
import { AddCitaComponent } from '../add-cita/add-cita';
import { DetalleCitaComponent } from '../detalle-cita/detalle-cita';
import { ConfirmationDeleteComponent, ConfirmDialogData } from '../../shared/confirmation-delete/confirmation-delete';

@Component({
  selector: 'app-padre-cita-list',
  standalone: false,
  templateUrl: './padre-cita-list.html',
  styleUrls: ['./padre-cita-list.css']
})
export class PadreCitaListComponent implements OnInit {

  // Dos tablas: una para próximas, otra para historial
  displayedColumns: string[] = ['fecha', 'horaInicio', 'menor', 'psicologo', 'estado', 'actions'];
  dsProximas = new MatTableDataSource<PADRECitaResponseDTO>();
  dsHistorial = new MatTableDataSource<PADRECitaResponseDTO>();

  constructor(
    private padreService: PadreService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.CargarListas();
  }

  CargarListas(): void {
    console.log('🔄 Recargando listas de citas...');
    
    // Limpiar los DataSources antes de recargar para evitar duplicados visuales
    this.dsProximas.data = [];
    this.dsHistorial.data = [];
    
    // Cargar próximas citas
    this.padreService.getMisProximasCitas().subscribe({
      next: (data) => {
        console.log('✅ Próximas citas cargadas:', data.length);
        console.log('📋 Datos de próximas citas:', data);
        // Actualizar el DataSource con los nuevos datos
        this.dsProximas.data = data;
      },
      error: (err) => {
        console.error("❌ Error al cargar próximas citas:", err);
        this.snackBar.open('Error al cargar próximas citas', 'OK', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });

    // Cargar historial de citas
    this.padreService.getMiHistorialCitas().subscribe({
      next: (data) => {
        console.log('✅ Historial de citas cargado:', data.length);
        // Actualizar el DataSource con los nuevos datos
        this.dsHistorial.data = data;
      },
      error: (err) => {
        console.error("❌ Error al cargar historial de citas:", err);
        this.snackBar.open('Error al cargar historial de citas', 'OK', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddCitaComponent, {
      width: '600px'
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        console.log('✅ Dialog cerrado con éxito - Recargando listas después de solicitar cita');
        // Pequeño delay para asegurar que el backend haya procesado la cita
        setTimeout(() => {
          this.CargarListas();
        }, 500);
      } else {
        console.log('ℹ️  Dialog cerrado sin crear cita');
      }
    });
  }

  openDetailsDialog(cita: PADRECitaResponseDTO): void {
    this.dialog.open(DetalleCitaComponent, {
      width: '600px',
      data: cita // Enviamos la cita completa al diálogo de detalles
    });
  }

  cancelarCita(cita: PADRECitaResponseDTO): void {
    const dialogData: ConfirmDialogData = {
    title: '¿Está seguro que desea CANCELAR esta cita?',
    message: 'Esta acción no se puede deshacer.'
    };

  // 2. Abre el diálogo pasando los datos en la propiedad 'data'
    const dialogRef = this.dialog.open(ConfirmationDeleteComponent, {
    width: '400px', // O el ancho que prefieras
    data: dialogData // <-- FORMA CORRECTA DE PASAR DATOS
    });


    dialogRef.afterClosed().subscribe((result) => {
    if (result) { // 'result' será true si el usuario confirmó
      console.log('🚫 Cancelando cita:', cita.citaId);
      this.padreService.cancelarCita(cita.citaId).subscribe({
        next: () => {
          console.log('✅ Cita cancelada exitosamente');
          this.snackBar.open('Cita cancelada correctamente', 'OK', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.CargarListas();
        },
        error: (err) => {
          console.error('❌ Error al cancelar cita:', err);
          this.snackBar.open('ERROR: ' + (err.error?.message || 'Error al cancelar'), 'OK', {
            duration: 4000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  });
  }
}
