import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  return next(req).pipe(
    catchError((error) => {
      // Solo procesar en el navegador
      if (isPlatformBrowser(platformId)) {
        // Error 403 con flag banned = usuario baneado
        if (error.status === 403 && error.error?.banned === true) {
          // Limpiar sesión
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Mostrar alerta
          alert(error.error.message || 'Tu cuenta ha sido suspendida. Contacta al administrador.');
          
          // Redirigir a login
          router.navigate(['/login']);
        }
        
        // Error 401 = token inválido o expirado
        if (error.status === 401) {
          // Limpiar sesión
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Redirigir a login
          router.navigate(['/login']);
        }
      }
      
      return throwError(() => error);
    })
  );
};
