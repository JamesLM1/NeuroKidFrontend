import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';
import { DTOUser } from '../../../models/dto-user';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: false,
  styleUrls: ['./register.component.css']
  
})
export class RegisterComponent implements OnInit {

  registerForm!: FormGroup;
  roles: string[] = ['ROLE_PADRE', 'ROLE_PSICOLOGO', 'ROLE_ADMIN'];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.CargarFormulario();
  }

  CargarFormulario(): void {
    this.registerForm = this.formBuilder.group({
      // Tu DTOUser espera 'username', 'password' y 'authorities'
      // Los campos de nombre, apellido, etc., se llenan en el perfil de cada rol.
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      authorities: ['', Validators.required] // Este será el rol
    }, { validator: this.passwordMatchValidator });
  }

  // Validador custom para que las contraseñas coincidan
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  Grabar(): void {
    if (this.registerForm.valid) {
      // Validar que las contraseñas coincidan
      if (this.registerForm.get('password')?.value !== this.registerForm.get('confirmPassword')?.value) {
        this.snackBar.open('Las contraseñas no coinciden', 'OK', { duration: 3000 });
        return;
      }

      // Creamos el DTOUser para enviar al backend
      const user: DTOUser = {
        username: this.registerForm.get('username')?.value,
        password: this.registerForm.get('password')?.value,
        authorities: this.registerForm.get('authorities')?.value
      };

      // Llamamos al servicio de registro
      this.authService.register(user).subscribe({
        next: (data: DTOUser) => {
          this.snackBar.open(`¡Usuario ${data.username} registrado con éxito!`, 'OK', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          // Redirigimos al login después de un breve delay
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500);
        },
        error: (http_error: any) => {
          let errorMessage = 'No se pudo registrar el usuario';
          
          if (http_error.error) {
            if (http_error.error.message) {
              errorMessage = http_error.error.message;
            } else if (typeof http_error.error === 'string') {
              errorMessage = http_error.error;
            } else if (http_error.status === 400) {
              errorMessage = 'Datos inválidos. Verifique la información ingresada.';
            } else if (http_error.status === 409) {
              errorMessage = 'El usuario ya existe. Intente con otro correo.';
            } else if (http_error.status === 0) {
              errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión.';
            }
          }
          
          this.snackBar.open(`ERROR: ${errorMessage}`, 'OK', { 
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          console.error('Error en registro:', http_error);
        }
      });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      this.snackBar.open('Formulario inválido. Revise los campos marcados.', 'OK', { 
        duration: 4000,
        panelClass: ['warning-snackbar']
      });
    }
  }
}