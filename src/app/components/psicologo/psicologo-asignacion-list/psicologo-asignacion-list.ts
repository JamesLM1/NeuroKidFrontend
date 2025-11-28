import { Component, OnInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { PsicologoService } from '../../../services/psicologo.service';
import { ADMINAsignacionDTO } from '../../../models/admin-asignacion.dto';

// Módulos para la plantilla
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-psicologo-asignacion-list',
  standalone: true, // <-- CORRECCIÓN 1: Cambiado a true
  imports: [ // <-- CORRECCIÓN 2: Añadidos imports
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './psicologo-asignacion-list.html',
  styleUrls: ['./psicologo-asignacion-list.css']
})
export class PsicologoAsignacionListComponent implements OnInit {

  displayedColumns: string[] = ['padre', 'menor', 'fechaAsignacion', 'estado'];
  dsAsignaciones = new MatTableDataSource<ADMINAsignacionDTO>();

  constructor(
    private psicologoService: PsicologoService
  ) { }

  ngOnInit(): void {
    this.CargarLista();
  }

  CargarLista(): void {
    // El backend ya enriquece los DTOs con nombres completos, usamos directamente los datos
    this.psicologoService.getMisAsignaciones().subscribe({
      next: (asignaciones: ADMINAsignacionDTO[]) => {
        // Usar directamente los datos del backend sin transformaciones innecesarias
        this.dsAsignaciones = new MatTableDataSource<ADMINAsignacionDTO>(asignaciones);
      },
      error: (err) => {
        console.error("Error al cargar asignaciones:", err);
        this.dsAsignaciones = new MatTableDataSource<ADMINAsignacionDTO>([]);
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dsAsignaciones.filter = filterValue.trim().toLowerCase();
  }
}