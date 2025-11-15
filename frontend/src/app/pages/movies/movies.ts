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

@Component({
  selector: 'app-movies',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './movies.html',
  styleUrls: ['./movies.scss']
})
export class MoviesComponent implements OnInit {
  movies: Movie[] = [];
  filteredMovies: Movie[] = [];
  searchQuery = '';
  selectedGenre = '';
  isLoading = true;
  errorMessage = '';
  
  genres = ['Acción', 'Comedia', 'Drama', 'Terror', 'Ciencia Ficción', 'Romance', 'Thriller', 'Animación'];

  constructor(
    private http: HttpClient, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.loadMovies();
  }

  loadMovies() {
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

    this.http.get<Movie[]>('https://cinenoir-api.onrender.com/api/movies', { headers }).subscribe({
      next: (data) => {
        const endTime = performance.now();
        console.log(`✅ Películas cargadas en ${(endTime - startTime).toFixed(0)}ms`);
        console.log(`📊 Total de películas: ${data.length}`);
        if (data.length > 0) {
          console.log('🎬 Ejemplo de película:', data[0]);
          console.log('🎬 ID de primera película:', data[0].id);
        }
        this.movies = data;
        this.filteredMovies = data;
        this.isLoading = false;
      },
      error: (error) => {
        const endTime = performance.now();
        console.error(`❌ Error después de ${(endTime - startTime).toFixed(0)}ms:`, error);
        this.errorMessage = 'Error al cargar las películas';
        this.isLoading = false;
        
        // Si el token no es válido, redirigir al login
        if (error.status === 401) {
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
        }
      }
    });
  }

  onSearch() {
    this.applyFilters();
  }

  onGenreChange() {
    this.applyFilters();
  }

  applyFilters() {
    this.filteredMovies = this.movies.filter(movie => {
      const description = movie.synopsis || movie.description || '';
      const matchesSearch = movie.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                           description.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      // Soportar tanto genre (string) como genres (array)
      const movieGenre = movie.genres ? movie.genres[0] : movie.genre;
      const matchesGenre = !this.selectedGenre || movieGenre === this.selectedGenre;
      
      return matchesSearch && matchesGenre;
    });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  onImageError(event: any) {
    // Prevenir loop infinito
    if (event.target.src.startsWith('data:image')) {
      return;
    }
    
    console.log('❌ Error cargando imagen:', event.target.src);
    
    // Usar una imagen SVG inline como fallback
    const placeholder = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450'%3E%3Crect width='300' height='450' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%23999'%3ESin Poster%3C/text%3E%3C/svg%3E`;
    event.target.src = placeholder;
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
