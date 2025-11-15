import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

interface Movie {
  id: string;
  title: string;
  description?: string;
  synopsis?: string;
  genre?: string;
  genres?: string[];
  release_year?: number;
  year?: number;
  director: string;
  poster_url: string;
  rating?: number;
  created_at: string;
}

interface Favorite {
  id: string;
  user_id: string;
  movie_id: string;
  created_at: string;
  movie?: Movie;
}

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss']
})
export class FavoritesComponent implements OnInit {
  favorites: Favorite[] = [];
  movies: Movie[] = [];
  searchQuery = '';
  filteredMovies: Movie[] = [];
  isLoading = true;
  errorMessage = '';
  
  private apiUrl = 'https://cinenoir-api.onrender.com/api';

  constructor(
    private http: HttpClient, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.loadFavorites();
  }

  loadFavorites() {
    // Solo cargar en el navegador, no en SSR
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const startTime = performance.now();
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<Favorite[]>(`${this.apiUrl}/favorites/me`, { headers }).subscribe({
      next: (data) => {
        const endTime = performance.now();
        console.log(`✅ Favoritos cargados en ${(endTime - startTime).toFixed(0)}ms`);
        console.log(`📊 Total de favoritos: ${data.length}`);
        
        this.favorites = data;
        // Extraer las películas de los favoritos
        this.movies = data.map(fav => fav.movie).filter(movie => movie !== undefined) as Movie[];
        this.filteredMovies = this.movies;
        this.isLoading = false;
      },
      error: (error) => {
        const endTime = performance.now();
        console.error(`❌ Error después de ${(endTime - startTime).toFixed(0)}ms:`, error);
        this.errorMessage = 'Error al cargar favoritos';
        this.isLoading = false;
        
        // Si el token no es válido, redirigir al login
        if (error.status === 401) {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.removeItem('token');
          }
          this.router.navigate(['/login']);
        }
      }
    });
  }

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.filteredMovies = this.movies;
      return;
    }

    this.filteredMovies = this.movies.filter(movie => {
      const description = movie.synopsis || movie.description || '';
      return movie.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
             description.toLowerCase().includes(this.searchQuery.toLowerCase());
    });
  }

  removeFavorite(movieId: string) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.delete(`${this.apiUrl}/favorites/movie/${movieId}`, { headers }).subscribe({
      next: () => {
        console.log('Removido de favoritos');
        // Recargar la lista
        this.loadFavorites();
      },
      error: (error) => {
        console.error('Error al remover de favoritos:', error);
      }
    });
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
    }
    this.router.navigate(['/login']);
  }

  getStars(rating: number): string[] {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars: string[] = [];
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('full');
    }
    
    if (hasHalfStar) {
      stars.push('half');
    }
    
    while (stars.length < 5) {
      stars.push('empty');
    }
    
    return stars;
  }
}
