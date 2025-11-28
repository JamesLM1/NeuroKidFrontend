import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PadreService } from '../../../services/padre.service';
import { AuthService } from '../../../services/auth.service';
import { PADREMenorDTO } from '../../../models/padre-menor.dto';

@Component({
  selector: 'app-add-edit-menor',
  standalone: false,
  templateUrl: './add-edit-menor.html',
  styleUrls: ['./add-edit-menor.css']
})
export class AddEditMenorComponent implements OnInit {

  addEditForm!: FormGroup;
  menorId: number | null = null;
  padreId: number;
  title: string = 'Registrar Menor';
  maxDate: Date = new Date(); // Fecha máxima: hoy (no se pueden registrar niños nacidos en el futuro)

  constructor(
    private fb: FormBuilder,
    private padreService: PadreService,
    private authService: AuthService, // Para obtener el ID del padre
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<AddEditMenorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: number | null }
  ) {
    this.menorId = data.id;
    this.padreId = this.authService.getUserId()!;
  }

  ngOnInit(): void {
    this.CargarFormulario();
    if (this.menorId) {
      this.title = 'Editar Menor';
      this.CargarDatosParaEditar();
    }
  }

  CargarFormulario(): void {
    this.addEditForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      fechaNacimiento: ['', Validators.required]
    });
  }

  CargarDatosParaEditar(): void {
    // getMisMenores() filtra por padre, así que es seguro
    this.padreService.getMisMenores().subscribe({
      next: (menores) => {
        const menor = menores.find(m => m.menorId === this.menorId);
        if (menor) {
          // Convertir string de fecha a Date para el datepicker
          const fechaNacimiento = new Date(menor.fechaNacimiento);
          this.addEditForm.patchValue({
            nombre: menor.nombre,
            apellido: menor.apellido,
            fechaNacimiento: fechaNacimiento
          });
        }
      },
      error: (err) => this.snackBar.open('Error al cargar datos del menor', 'OK')
    });
  }

  // MÉTODO: Manejar cambio de fecha desde el datepicker
  onFechaNacimientoChange(event: any): void {
    const fechaSeleccionada = event.value;
    if (fechaSeleccionada) {
      // Convertir Date a string YYYY-MM-DD para el formulario
      const fechaString = this.formatDateToString(fechaSeleccionada);
      this.addEditForm.get('fechaNacimiento')?.setValue(fechaString, { emitEvent: false });
    }
  }

  // MÉTODO HELPER: Convertir Date a string YYYY-MM-DD
  formatDateToString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  Grabar(): void {
    if (this.addEditForm.invalid) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.addEditForm.controls).forEach(key => {
        this.addEditForm.get(key)?.markAsTouched();
      });
      this.snackBar.open('Por favor, complete todos los campos requeridos.', 'OK', { 
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    // TRUCO DEL MEDIODÍA: Forzar hora a 12:00 para evitar desfase de zona horaria
    const rawDate = this.addEditForm.value.fechaNacimiento;
    let fechaString: string;
    
    if (rawDate) {
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
      
      // Ahora sí, convertir a string YYYY-MM-DD usando los métodos de la fecha ajustada
      const year = fechaAjustada.getFullYear();
      const month = String(fechaAjustada.getMonth() + 1).padStart(2, '0');
      const day = String(fechaAjustada.getDate()).padStart(2, '0');
      fechaString = `${year}-${month}-${day}`;
      
      // Validar fecha de nacimiento (no puede ser futura)
      const fechaNacimiento = new Date(fechaString);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparar solo fechas
      fechaNacimiento.setHours(0, 0, 0, 0);
      
      if (fechaNacimiento > hoy) {
        this.snackBar.open('La fecha de nacimiento no puede ser futura', 'OK', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return;
      }
      
      console.log('📅 Fecha original:', rawDate);
      console.log('📅 Fecha ajustada (mediodía):', fechaAjustada);
      console.log('📅 Fecha string construida:', fechaString);
    } else {
      this.snackBar.open('La fecha de nacimiento es requerida', 'OK', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    const menorData: PADREMenorDTO = {
      menorId: this.menorId || undefined,
      padreId: this.padreId, // El ID del padre logueado
      nombre: this.addEditForm.value.nombre.trim(),
      apellido: this.addEditForm.value.apellido.trim(),
      fechaNacimiento: fechaString // Enviamos el string en formato YYYY-MM-DD
    };

    if (this.menorId) {
      // Modo EDITAR
      this.padreService.editMenor(this.menorId, menorData).subscribe({
        next: (data) => {
          this.snackBar.open('Menor actualizado con éxito', 'OK', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.dialogRef.close(true);
        },
        error: (err) => {
          let errorMessage = 'Error al actualizar el menor';
          if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.status === 403) {
            errorMessage = 'No tiene permisos para editar este menor';
          } else if (err.status === 404) {
            errorMessage = 'Menor no encontrado';
          } else if (err.status === 0) {
            errorMessage = 'No se pudo conectar con el servidor';
          }
          this.snackBar.open(`ERROR: ${errorMessage}`, 'OK', { 
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          console.error('Error al actualizar menor:', err);
        }
      });
    } else {
      // Modo CREAR
      this.padreService.newMenor(menorData).subscribe({
        next: (data) => {
          this.snackBar.open('Menor registrado con éxito', 'OK', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.dialogRef.close(true);
        },
        error: (err) => {
          let errorMessage = 'Error al crear el menor';
          if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.status === 400) {
            errorMessage = 'Datos inválidos. Verifique la información ingresada.';
          } else if (err.status === 0) {
            errorMessage = 'No se pudo conectar con el servidor';
          }
          this.snackBar.open(`ERROR: ${errorMessage}`, 'OK', { 
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          console.error('Error al crear menor:', err);
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
