import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

interface Movie {
  id: string;
  title: string;
  synopsis?: string;
  genres?: string[];
  year?: number;
  director: string;
  poster_url: string;
  rating?: number;
}

interface DashboardStats {
  totalMovies: number;
  totalUsers: number;
  totalReviews: number;
  totalFavorites: number;
}

interface User {
  id: string;
  username: string;
  role: string;
  avatar_url?: string;
  banned?: boolean;
  created_at: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  currentView: 'dashboard' | 'movies' | 'users' = 'dashboard';
  
  stats: DashboardStats = {
    totalMovies: 0,
    totalUsers: 0,
    totalReviews: 0,
    totalFavorites: 0
  };
  
  movies: Movie[] = [];
  users: User[] = [];
  isLoading = true;
  errorMessage = '';
  
  // Movie form
  showMovieForm = false;
  editingMovie: Movie | null = null;
  movieForm = {
    title: '',
    synopsis: '',
    genre: 'Drama',
    year: new Date().getFullYear(),
    director: '',
    poster_url: ''
  };
  
  genres = ['Acción', 'Comedia', 'Drama', 'Terror', 'Ciencia Ficción', 'Romance', 'Thriller', 'Animación'];
  
  private apiUrl = 'https://cinenoir-api.onrender.com/api';

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.checkAdminAccess();
    this.loadDashboard();
  }

  checkAdminAccess() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role !== 'admin') {
        alert('Acceso denegado. Solo administradores pueden acceder.');
        this.router.navigate(['/movies']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  getHeaders(): HttpHeaders {
    let token = '';
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('token') || '';
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  loadDashboard() {
    this.isLoading = true;
    
    // Cargar estadísticas del dashboard
    this.http.get<any>(`${this.apiUrl}/admin/dashboard`, { headers: this.getHeaders() })
      .subscribe({
        next: (data) => {
          // Mapear los nombres del backend a los del frontend
          this.stats.totalUsers = data.usersCount || 0;
          this.stats.totalMovies = data.moviesCount || 0;
          console.log('✅ Dashboard cargado:', data);
          
          // Cargar conteo de reviews y favoritos manualmente
          this.loadReviewsCount();
          this.loadFavoritesCount();
        },
        error: (error) => {
          console.error('❌ Error al cargar dashboard:', error);
          this.isLoading = false;
        }
      });
  }

  loadReviewsCount() {
    // Cargar todas las películas y contar sus reviews
    this.http.get<any[]>(`${this.apiUrl}/movies`, { headers: this.getHeaders() })
      .subscribe({
        next: async (movies) => {
          let totalReviews = 0;
          
          for (const movie of movies) {
            try {
              const reviews = await this.http.get<any[]>(
                `${this.apiUrl}/reviews/movie/${movie.id}`, 
                { headers: this.getHeaders() }
              ).toPromise();
              
              if (reviews) {
                totalReviews += reviews.length;
              }
            } catch (error) {
              // Ignorar errores individuales
            }
          }
          
          this.stats.totalReviews = totalReviews;
          console.log(`✅ Total reviews: ${totalReviews}`);
          this.checkDashboardComplete();
        },
        error: (error) => {
          console.error('❌ Error al cargar reviews:', error);
          this.checkDashboardComplete();
        }
      });
  }

  loadFavoritesCount() {
    // No hay endpoint para contar todos los favoritos, así que usamos una estimación
    // En producción deberías tener GET /api/admin/favorites/count
    this.stats.totalFavorites = 0;
    this.checkDashboardComplete();
  }

  checkDashboardComplete() {
    this.isLoading = false;
  }

  loadMovies() {
    this.http.get<Movie[]>(`${this.apiUrl}/movies`, { headers: this.getHeaders() })
      .subscribe({
        next: (data) => {
          this.movies = data;
          console.log(`✅ ${data.length} películas cargadas`);
        },
        error: (error) => {
          console.error('❌ Error al cargar películas:', error);
        }
      });
  }

  switchView(view: 'dashboard' | 'movies' | 'users') {
    this.currentView = view;
    
    if (view === 'movies') {
      this.loadMovies();
    } else if (view === 'users') {
      this.loadUsers();
    }
  }

  loadUsers() {
    this.http.get<User[]>(`${this.apiUrl}/admin/users`, { headers: this.getHeaders() })
      .subscribe({
        next: (data) => {
          this.users = data;
          console.log(`✅ ${data.length} usuarios cargados`);
        },
        error: (error) => {
          console.error('❌ Error al cargar usuarios:', error);
        }
      });
  }

  changeUserRole(user: User, newRole: string) {
    if (!confirm(`¿Cambiar rol de "${user.username}" a ${newRole}?`)) {
      return;
    }

    this.http.put(`${this.apiUrl}/admin/users/${user.id}/role`, { role: newRole }, { headers: this.getHeaders() })
      .subscribe({
        next: () => {
          console.log('✅ Rol actualizado');
          alert(`Rol de ${user.username} cambiado a ${newRole}`);
          this.loadUsers();
          this.loadDashboard(); // Actualizar stats si es necesario
        },
        error: (error) => {
          console.error('❌ Error al cambiar rol:', error);
          alert('Error al cambiar rol: ' + (error.error?.message || 'Error desconocido'));
        }
      });
  }

  toggleUserBan(user: User) {
    const action = user.banned ? 'desbanear' : 'banear';
    if (!confirm(`¿Estás seguro de ${action} a "${user.username}"?`)) {
      return;
    }

    this.http.put(`${this.apiUrl}/admin/users/${user.id}/ban`, {}, { headers: this.getHeaders() })
      .subscribe({
        next: () => {
          console.log(`✅ Usuario ${action}do`);
          alert(`Usuario ${user.username} ${action}do correctamente`);
          this.loadUsers();
        },
        error: (error) => {
          console.error(`❌ Error al ${action} usuario:`, error);
          alert(`Error al ${action} usuario: ` + (error.error?.message || 'Error desconocido'));
        }
      });
  }

  openMovieForm(movie?: Movie) {
    if (movie) {
      this.editingMovie = movie;
      this.movieForm = {
        title: movie.title,
        synopsis: movie.synopsis || '',
        genre: movie.genres ? movie.genres[0] : 'Drama',
        year: movie.year || new Date().getFullYear(),
        director: movie.director,
        poster_url: movie.poster_url
      };
    } else {
      this.editingMovie = null;
      this.movieForm = {
        title: '',
        synopsis: '',
        genre: 'Drama',
        year: new Date().getFullYear(),
        director: '',
        poster_url: ''
      };
    }
    this.showMovieForm = true;
  }

  closeMovieForm() {
    this.showMovieForm = false;
    this.editingMovie = null;
    this.isSavingMovie = false; // Reset flag al cerrar
  }

  isSavingMovie = false;

  saveMovie() {
    // Prevenir múltiples envíos
    if (this.isSavingMovie) {
      console.log('⏳ Ya hay una operación en curso...');
      return;
    }

    if (!this.movieForm.title.trim() || !this.movieForm.director.trim()) {
      alert('Título y director son obligatorios');
      return;
    }

    this.isSavingMovie = true;

    const movieData = {
      title: this.movieForm.title,
      synopsis: this.movieForm.synopsis,
      genres: [this.movieForm.genre],
      year: this.movieForm.year,
      director: this.movieForm.director,
      poster_url: this.movieForm.poster_url
    };

    if (this.editingMovie) {
      // Actualizar película
      console.log('📝 Actualizando película:', this.editingMovie.id);
      this.http.put(`${this.apiUrl}/movies/${this.editingMovie.id}`, movieData, { headers: this.getHeaders() })
        .subscribe({
          next: () => {
            console.log('✅ Película actualizada');
            alert('Película actualizada correctamente');
            this.isSavingMovie = false;
            this.closeMovieForm();
            this.loadMovies();
          },
          error: (error) => {
            console.error('❌ Error al actualizar película:', error);
            alert('Error al actualizar película: ' + (error.error?.message || 'Error desconocido'));
            this.isSavingMovie = false;
          }
        });
    } else {
      // Crear nueva película
      console.log('➕ Creando nueva película');
      this.http.post(`${this.apiUrl}/movies`, movieData, { headers: this.getHeaders() })
        .subscribe({
          next: () => {
            console.log('✅ Película creada');
            alert('Película creada correctamente');
            this.isSavingMovie = false;
            this.closeMovieForm();
            this.loadMovies();
            this.loadDashboard(); // Actualizar stats
          },
          error: (error) => {
            console.error('❌ Error al crear película:', error);
            alert('Error al crear película: ' + (error.error?.message || 'Error desconocido'));
            this.isSavingMovie = false;
          }
        });
    }
  }

  deleteMovie(movie: Movie) {
    if (!confirm(`¿Estás seguro de eliminar "${movie.title}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    this.http.delete(`${this.apiUrl}/movies/${movie.id}`, { headers: this.getHeaders() })
      .subscribe({
        next: () => {
          console.log('✅ Película eliminada');
          alert('Película eliminada correctamente');
          this.loadMovies();
          this.loadDashboard(); // Actualizar stats
        },
        error: (error) => {
          console.error('❌ Error al eliminar película:', error);
          alert('Error al eliminar película: ' + (error.error?.message || 'Error desconocido'));
        }
      });
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.router.navigate(['/login']);
  }
}
