import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent {
  email = '';
  password = '';
  confirmPassword = '';
  username = '';
  errorMessage = '';
  isLoading = false;

  constructor(private http: HttpClient, private router: Router) {}

  onSubmit() {
    this.errorMessage = '';

    // Validaciones básicas
    if (!this.email || !this.password || !this.confirmPassword || !this.username) {
      this.errorMessage = 'Todos los campos son obligatorios';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    this.isLoading = true;

    this.http.post('https://cinenoir-api.onrender.com/api/auth/register', {
      email: this.email,
      password: this.password,
      username: this.username
    }).subscribe({
      next: (response: any) => {
        console.log('Registro exitoso:', response);
        // Redirigir al login después del registro exitoso
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error en registro:', error);
        this.errorMessage = error.error?.message || error.error?.error || 'Error al registrar usuario';
        this.isLoading = false;
      }
    });
  }
}
