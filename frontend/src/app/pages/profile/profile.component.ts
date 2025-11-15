import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  avatar_url?: string;
}

interface Stats {
  totalFavorites: number;
  totalReviews: number;
  averageRating: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  stats: Stats = {
    totalFavorites: 0,
    totalReviews: 0,
    averageRating: 0
  };
  isLoading = true;
  errorMessage = '';
  
  // Edit mode
  isEditing = false;
  editUsername = '';
  
  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    // Solo cargar en el navegador, no en SSR
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Cargar datos del usuario desde localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.user = JSON.parse(userStr);
      this.editUsername = this.user?.username || '';
    }

    // Cargar estadísticas
    this.loadStats();
  }

  loadStats() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    let favoritesLoaded = false;
    let reviewsLoaded = false;

    // Cargar favoritos
    this.http.get<any[]>(`${this.apiUrl}/favorites/me`, { headers }).subscribe({
      next: (favorites) => {
        this.stats.totalFavorites = favorites.length;
        console.log(`✅ Favoritos cargados: ${favorites.length}`);
        favoritesLoaded = true;
        if (reviewsLoaded) this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('❌ Error al cargar favoritos:', error);
        favoritesLoaded = true;
        if (reviewsLoaded) this.checkLoadingComplete();
      }
    });

    // Cargar todas las reviews y filtrar por usuario
    // Necesitamos cargar todas las películas y sus reviews para contar las del usuario
    if (this.user) {
      this.loadUserReviews(this.user.id, headers).then(() => {
        reviewsLoaded = true;
        if (favoritesLoaded) this.checkLoadingComplete();
      });
    } else {
      reviewsLoaded = true;
      if (favoritesLoaded) this.checkLoadingComplete();
    }
  }

  async loadUserReviews(userId: string, headers: HttpHeaders) {
    try {
      // Cargar todas las películas
      const movies = await this.http.get<any[]>(`${this.apiUrl}/movies`, { headers }).toPromise();
      
      if (!movies) {
        return;
      }

      let totalReviews = 0;
      let totalRating = 0;

      // Para cada película, cargar sus reviews y contar las del usuario
      for (const movie of movies) {
        try {
          const reviews = await this.http.get<any[]>(`${this.apiUrl}/reviews/movie/${movie.id}`, { headers }).toPromise();
          
          if (reviews) {
            const userReviews = reviews.filter(review => review.user_id === userId);
            totalReviews += userReviews.length;
            
            // Sumar los ratings del usuario
            userReviews.forEach(review => {
              totalRating += review.rating;
            });
          }
        } catch (error) {
          // Ignorar errores de películas individuales
        }
      }

      this.stats.totalReviews = totalReviews;
      this.stats.averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;
      
      console.log(`✅ Reviews cargadas: ${totalReviews}, Rating promedio: ${this.stats.averageRating.toFixed(1)}`);
    } catch (error) {
      console.error('❌ Error al cargar reviews del usuario:', error);
    }
  }

  checkLoadingComplete() {
    this.isLoading = false;
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing && this.user) {
      this.editUsername = this.user.username;
    }
  }

  saveProfile() {
    if (!this.editUsername.trim()) {
      return;
    }

    // Aquí iría la llamada al backend para actualizar el perfil
    // PUT /api/users/profile
    console.log('Guardando perfil:', this.editUsername);
    
    // Por ahora solo actualizamos localmente
    if (this.user && isPlatformBrowser(this.platformId)) {
      this.user.username = this.editUsername;
      localStorage.setItem('user', JSON.stringify(this.user));
    }
    
    this.isEditing = false;
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.router.navigate(['/login']);
  }

  getRoleBadgeClass(): string {
    if (this.user?.role === 'admin') {
      return 'profile__badge--admin';
    }
    return 'profile__badge--user';
  }

  getRoleLabel(): string {
    if (this.user?.role === 'admin') {
      return 'Administrador';
    }
    return 'Usuario';
  }
}
