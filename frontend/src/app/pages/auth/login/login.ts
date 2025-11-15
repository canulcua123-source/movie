import { Component, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login {
  email = '';
  password = '';
  loading = false;
  error: string | null = null;

  private apiUrl = 'https://cinenoir-api.onrender.com/api';

  constructor(
    private http: HttpClient, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  onSubmit() {
    if (!this.email || !this.password || this.loading) {
      return;
    }

    this.loading = true;
    this.error = null;

    console.log('Intentando login con:', this.email);
    console.log('URL del backend:', `${this.apiUrl}/auth/login`);

    this.http
      .post<{ token: string; user: any }>(`${this.apiUrl}/auth/login`, {
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: (res) => {
          console.log('Login exitoso, respuesta:', res);
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('token', res.token);
            localStorage.setItem('user', JSON.stringify(res.user));
          }
          this.loading = false;
          // Redirigir a la vista de películas después del login
          console.log('Redirigiendo a /movies');
          this.router.navigate(['/movies']);
        },
        error: (err) => {
          console.error('Error en login:', err);
          console.error('Status:', err.status);
          console.error('Error completo:', err.error);
          this.loading = false;
          
          // Manejar usuario baneado
          if (err.status === 403 && err.error?.banned === true) {
            this.error = err.error.message || 'Tu cuenta ha sido suspendida. Contacta al administrador.';
          } else {
            this.error = err?.error?.error || err?.error?.message || 'No se pudo iniciar sesión. Intenta de nuevo.';
          }
        },
      });
  }
}
