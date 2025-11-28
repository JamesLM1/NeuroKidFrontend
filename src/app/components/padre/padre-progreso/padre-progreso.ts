import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table'; // <-- Importar MatTableModule
import { MatSnackBar } from '@angular/material/snack-bar';
import { PadreService } from '../../../services/padre.service';
import { PADREMenorDTO } from '../../../models/padre-menor.dto';
import { PADREInformeDTO } from '../../../models/padre-informe.dto';
import Chart from 'chart.js/auto'; // Importamos Chart.js

// Módulos necesarios para el HTML
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Para el <select>
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';


@Component({
  selector: 'app-padre-progreso',
  standalone: true, // <-- 1. CAMBIADO A TRUE
  imports: [ // <-- 2. AÑADIDO ARRAY DE IMPORTS
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatTableModule, // <-- Para [dataSource]
    MatIconModule,  // <-- Para <mat-icon>
    MatButtonModule, // <-- Para el botón de ícono
    MatTooltipModule // <-- Para los tooltips
  ],
  templateUrl: './padre-progreso.html',
  styleUrls: ['./padre-progreso.css']
})
export class PadreProgresoComponent implements OnInit, AfterViewInit {

  // Referencias a los <canvas> del HTML
  @ViewChild('chartEmocional') chartEmocionalRef!: ElementRef;
  @ViewChild('chartCognitivo') chartCognitivoRef!: ElementRef;
  
  misMenores: PADREMenorDTO[] = [];
  menorSeleccionadoId: number | null = null;

  displayedColumns: string[] = ['fecha', 'hijo', 'psicologo', 'resumen', 'acciones'];
  dsInformes = new MatTableDataSource<PADREInformeDTO>();

  private chartEmocional: Chart | undefined;
  private chartCognitivo: Chart | undefined;

  constructor(
    private padreService: PadreService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.CargarMenores();
  }

  ngAfterViewInit(): void {
    // Los gráficos se inicializan aquí, después de que la vista esté lista
    // Usamos los mismos datos MOCK de tu 'padres.html'
    this.inicializarGraficos();
  }

  CargarMenores(): void {
    this.padreService.getMisMenores().subscribe({
      next: (data) => {
        this.misMenores = data;
        // Si hay menores, seleccionamos el primero por defecto
        if (data.length > 0) {
          this.menorSeleccionadoId = data[0].menorId!;
          this.CargarInformes();
        }
      },
      error: (err) => this.snackBar.open('Error al cargar la lista de menores', 'OK')
    });
  }

  onMenorChange(): void {
    this.CargarInformes();
    // Aquí también podrías actualizar los gráficos con datos reales si el backend los proveyera
  }

  CargarInformes(): void {
    if (!this.menorSeleccionadoId) {
      this.dsInformes = new MatTableDataSource<PADREInformeDTO>([]);
      return;
    }

    this.padreService.getInformesDeMenor(this.menorSeleccionadoId).subscribe({
      next: (data) => {
        console.log('✅ Informes cargados:', data);
        this.dsInformes = new MatTableDataSource(data);
      },
      error: (err) => {
        console.error('❌ Error al cargar informes:', err);
        this.dsInformes = new MatTableDataSource<PADREInformeDTO>([]); 
        this.snackBar.open(`Error al cargar informes: ${err.error?.message || 'Error desconocido'}`, 'OK', { duration: 5000 });
      }
    });
  }

  // Método auxiliar para obtener la fecha formateada
  getFechaFormateada(informe: PADREInformeDTO): string {
    if (informe.fechaCreacion) {
      return informe.fechaCreacion;
    }
    // Fallback: usar mes/año si no hay fechaCreacion
    return `${informe.mes}/${informe.anio}`;
  }

  // Lógica de gráficos MOCK (tomada de tu padres.html)
  inicializarGraficos(): void {
    const baseMensual = {
      labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
      emocional: [65, 59, 70, 71, 76, 80],
      cognitivo: [55, 60, 65, 68, 72, 75]
    };

    if (this.chartEmocionalRef) { // Asegurarse que la referencia exista
      this.chartEmocional = new Chart(this.chartEmocionalRef.nativeElement, {
        type: "line",
        data: { 
          labels: baseMensual.labels, 
          datasets: [{ 
            label: "Regulación emocional", 
            data: baseMensual.emocional, 
            borderColor: "#5E81F4", 
            backgroundColor: "rgba(94,129,244,.12)", 
            tension: .3, 
            fill: true 
          }] 
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: false, min: 50, max: 100 } } }
      });
    }

    if (this.chartCognitivoRef) { // Asegurarse que la referencia exista
      this.chartCognitivo = new Chart(this.chartCognitivoRef.nativeElement, {
        type: "line",
        data: { 
          labels: baseMensual.labels, 
          datasets: [{ 
            label: "Desarrollo cognitivo", 
            data: baseMensual.cognitivo, 
            borderColor: "#FF7AC6", 
            backgroundColor: "rgba(255,122,198,.12)", 
            tension: .3, 
            fill: true 
          }] 
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: false, min: 50, max: 100 } } }
      });
    }
  }
}
