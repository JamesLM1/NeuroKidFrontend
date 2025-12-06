import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // <-- Importar ReactiveFormsModule
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog'; // <-- Importar MatDialogModule
import { MatSnackBar } from '@angular/material/snack-bar';
import { PsicologoService } from '../../../services/psicologo.service';
import { AuthService } from '../../../services/auth.service';
import { PSICOLOGOInformeDTO } from '../../../models/psicologo-informe.dto';

// Módulos necesarios para la plantilla HTML
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';






@Component({
  selector: 'app-add-informe',
  standalone: true, // <-- Mantenemos esto en true
  imports: [ // <-- Mantenemos los imports
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './add-informe.html',
  styleUrls: ['./add-informe.css']
})
export class AddInformeComponent implements OnInit {

  addInformeForm!: FormGroup;
  title: string = 'Crear Nuevo Informe';
  psicologoId: number;
  asignacionId: number;

  constructor(
    private fb: FormBuilder,
    private psicologoService: PsicologoService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<AddInformeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { asignacionId: number }
  ) {
    this.psicologoId = this.authService.getUserId()!;
    this.asignacionId = data.asignacionId;
  }

  ngOnInit(): void {
    this.CargarFormulario();
  }

  CargarFormulario(): void {
    this.addInformeForm = this.fb.group({
      titulo: ['', Validators.required],
      contenido: ['', Validators.required],
      calificacionEficacia: [5, [Validators.required, Validators.min(1), Validators.max(5)]]
    });
  }

  Grabar(): void {
    if (this.addInformeForm.invalid) {
      this.addInformeForm.markAllAsTouched();
      return;
    }

    const informeData: PSICOLOGOInformeDTO = {
      asignacionId: this.asignacionId,
      psicologoId: this.psicologoId,
      titulo: this.addInformeForm.value.titulo,
      contenido: this.addInformeForm.value.contenido,
      calificacionEficacia: this.addInformeForm.value.calificacionEficacia,
      fechaCreacion: new Date().toISOString(),
    };

    // 👇 ¡CORRECCIÓN AQUÍ! 
    // Revertimos al método original que usa dos argumentos
    this.psicologoService.crearInforme(this.asignacionId, informeData).subscribe({
      next: (data) => {
        this.snackBar.open('Informe creado con éxito', 'OK', { duration: 3000 });
        this.dialogRef.close(true); 
      },
      error: (err) => this.snackBar.open(`ERROR: ${err.error?.message || 'Error al crear informe'}`, 'OK')
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
