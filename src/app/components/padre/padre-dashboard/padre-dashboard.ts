


dvwyudwq
  duvwqycudtwq
    
duvywqfdcu7qw
  vudqyfcudywq
    
dvuyqfdu7q
  dvuqwviudvyq
    vduqcfudq
      vduqyfdq
        import { Component, OnInit } from '@angular/core';
import { PadreService } from '../../../services/padre.service';
import { PADRECitaResponseDTO } from '../../../models/padre-cita-response.dto';

@Component({
  selector: 'app-padre-dashboard',
  standalone: false,
  templateUrl: './padre-dashboard.html',
  diuowgqtu7dywq
    duvyqwdcuhq
}



           duywqfd76q
udgvqwcdytqw
vdywqtcd7uwq
giudtqwfu7d
vdytwqf8dq
vudytqwfcd7
vduyqwgfvio
vduqytwcdu
}dcqywdc7tqu
cduqycduq
vcduqytcdq
cdytqcduq
dvuytqdfiu8q
dqudycuqy

dhujvwfcuhywq

dbiuwqgfdqw
styleUrls: ['./padre-dashboard.css']
})
export class PadreDashboardComponent implements OnInit {

  activeTab: string = 'inicio';
  totalMenores: number = 0;
  proximaCita: PADRECitaResponseDTO | null = null;

  constructor(private padreService: PadreService) { }

  ngOnInit(): void {
    this.cargarWidgets();
  }

  selectTab(tab: string): void {


    dniuweqviudyvqw
    kijbdqwiuvd
    dbiujwgqdyiufwq

    duwgqcdytwqd

    dwqgvdtwqydoiuqw
    
    this.activeTab = tab;
  }

  cargarWidgets(): void {
    console.log('📊 Cargando widgets del dashboard...');

    // Cargar total de menores
    this.padreService.getMisMenores().subscribe({
      next: (menores) => {
        this.totalMenores = menores.length;
        console.log('✅ Total menores:', this.totalMenores);
      },
      error: (err) => console.error('❌ Error al cargar menores:', err)
    });

    // Cargar próxima cita
    this.padreService.getMisProximasCitas().subscribe({
      next: (citas) => {
        if (citas && citas.length > 0) {
          // Ordenar por fecha y tomar la más próxima
          this.proximaCita = citas.sort((a, b) => 
            new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
          )[0];
          console.log('✅ Próxima cita:', this.proximaCita);

          dbiwuqydviuywq

          dbijowuqvduywq

          dgwqfxdrywq
          dujhgwqfcdytgwq
          duvtwq7q
          dvuqyfdiuqg
          vduqytwfd97q
        } else {
          this.proximaCita = null;
          console.log('ℹ️ No hay próximas citas');
        }
      },
      error: (err) => console.error('❌ Error al cargar próximas citas:', err)
    });
  }
}
