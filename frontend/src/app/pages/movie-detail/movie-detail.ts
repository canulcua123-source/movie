import { Component, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

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

interface Review {
  id: string;
  user_id: string;
  movie_id: string;
  rating: number;
  comment: string;
  created_at: string;
  username?: string;
}

@Component({
  selector: 'app-movie-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './movie-detail.html',
  styleUrls: ['./movie-detail.scss']
})
export class MovieDetailComponent implements OnInit {
  movie: Movie | null = null;
  reviews: Review[] = [];
  isFavorite = false;
  isLoading = true;
  errorMessage = '';
  
  // Review form
  newReviewRating = 5;
  newReviewComment = '';
  isSubmittingReview = false;
  
  // Edit review
  editingReviewId: string | null = null;
  currentUserId: string = '';
  
  private apiUrl = 'http://localhost:3000/api';
  private movieId: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    // Solo cargar en el navegador, no en SSR
    if (!isPlatformBrowser(this.platformId)) {
      this.isLoading = false;
      return;
    }

    // Obtener ID del usuario actual
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.currentUserId = user.id;
    }

    this.route.params.subscribe(params => {
      this.movieId = params['id'];
      if (this.movieId && this.movieId.trim() !== '') {
        this.loadMovieDetail();
        this.loadReviews();
        this.checkIfFavorite();
      } else {
        this.errorMessage = 'ID de película inválido';
        this.isLoading = false;
      }
    });
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

  loadMovieDetail() {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('Cargando película con ID:', this.movieId);
    console.log('URL completa:', `${this.apiUrl}/movies/${this.movieId}`);

    this.http.get<Movie>(`${this.apiUrl}/movies/${this.movieId}`, { headers: this.getHeaders() })
      .subscribe({
        next: (data) => {
          console.log('Película recibida:', data);
          console.log('Título:', data.title);
          console.log('Synopsis:', data.synopsis);
          console.log('Rating:', data.rating);
          this.movie = data;
          this.isLoading = false;
          console.log('Estado después de asignar - isLoading:', this.isLoading, 'movie:', this.movie);
          // Forzar detección de cambios para SSR
          this.cdr.detectChanges();
          console.log('Detección de cambios forzada');
        },
        error: (error) => {
          console.error('Error al cargar película:', error);
          console.error('Status:', error.status);
          console.error('URL que falló:', error.url);
          this.errorMessage = 'Error al cargar la película';
          this.isLoading = false;
          
          if (error.status === 401) {
            if (isPlatformBrowser(this.platformId)) {
              localStorage.removeItem('token');
            }
            this.router.navigate(['/login']);
          }
        }
      });
  }

  loadReviews() {
    this.http.get<Review[]>(`${this.apiUrl}/reviews/movie/${this.movieId}`, { headers: this.getHeaders() })
      .subscribe({
        next: (data) => {
          this.reviews = data;
        },
        error: (error) => {
          console.error('Error al cargar reviews:', error);
        }
      });
  }

  checkIfFavorite() {
    this.http.get<any[]>(`${this.apiUrl}/favorites/me`, { headers: this.getHeaders() })
      .subscribe({
        next: (favorites) => {
          this.isFavorite = favorites.some(fav => fav.movie_id === this.movieId);
        },
        error: (error) => {
          console.error('Error al verificar favoritos:', error);
        }
      });
  }

  private isTogglingFavorite = false;

  toggleFavorite() {
    // Prevenir múltiples clicks
    if (this.isTogglingFavorite) {
      console.log('⏳ Ya hay una operación en curso...');
      return;
    }

    console.log('🎬 Toggle favorite - movieId:', this.movieId, 'isFavorite:', this.isFavorite);
    this.isTogglingFavorite = true;
    
    if (this.isFavorite) {
      // Remover de favoritos
      this.http.delete(`${this.apiUrl}/favorites/movie/${this.movieId}`, { headers: this.getHeaders() })
        .subscribe({
          next: () => {
            this.isFavorite = false;
            this.isTogglingFavorite = false;
            console.log('✅ Removido de favoritos');
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('❌ Error al remover de favoritos:', error);
            this.isTogglingFavorite = false;
          }
        });
    } else {
      // Agregar a favoritos
      this.http.post(`${this.apiUrl}/favorites/movie/${this.movieId}`, {}, { headers: this.getHeaders() })
        .subscribe({
          next: () => {
            this.isFavorite = true;
            this.isTogglingFavorite = false;
            console.log('✅ Agregado a favoritos');
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('❌ Error al agregar a favoritos:', error);
            this.isTogglingFavorite = false;
          }
        });
    }
  }

  submitReview() {
    if (!this.newReviewComment.trim() || this.isSubmittingReview) {
      return;
    }

    this.isSubmittingReview = true;

    if (this.editingReviewId) {
      // Actualizar review existente
      this.http.put(`${this.apiUrl}/reviews/${this.editingReviewId}`, {
        rating: this.newReviewRating,
        comment: this.newReviewComment
      }, { headers: this.getHeaders() })
        .subscribe({
          next: () => {
            console.log('✅ Review actualizada correctamente');
            this.cancelEditReview();
            this.loadReviews();
            this.loadMovieDetail();
          },
          error: (error) => {
            console.error('❌ Error al actualizar review:', error);
            alert('Error al actualizar review: ' + (error.error?.message || 'Error desconocido'));
            this.isSubmittingReview = false;
          }
        });
    } else {
      // Crear nueva review
      this.http.post(`${this.apiUrl}/reviews/movie/${this.movieId}`, {
        rating: this.newReviewRating,
        comment: this.newReviewComment
      }, { headers: this.getHeaders() })
        .subscribe({
          next: () => {
            console.log('✅ Review enviada correctamente');
            this.newReviewComment = '';
            this.newReviewRating = 5;
            this.isSubmittingReview = false;
            this.loadReviews();
            this.loadMovieDetail();
          },
          error: (error) => {
            console.error('❌ Error al enviar review:', error);
            alert('Error al enviar review: ' + (error.error?.message || 'Error desconocido'));
            this.isSubmittingReview = false;
          }
        });
    }
  }

  editReview(review: Review) {
    this.editingReviewId = review.id;
    this.newReviewRating = review.rating;
    this.newReviewComment = review.comment;
    
    // Scroll al formulario
    const formElement = document.querySelector('.movie-detail__new-review');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  cancelEditReview() {
    this.editingReviewId = null;
    this.newReviewComment = '';
    this.newReviewRating = 5;
    this.isSubmittingReview = false;
  }

  deleteReview(review: Review) {
    if (!confirm(`¿Estás seguro de eliminar tu reseña?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    this.http.delete(`${this.apiUrl}/reviews/${review.id}`, { headers: this.getHeaders() })
      .subscribe({
        next: () => {
          console.log('✅ Review eliminada correctamente');
          alert('Reseña eliminada correctamente');
          this.loadReviews();
          this.loadMovieDetail();
        },
        error: (error) => {
          console.error('❌ Error al eliminar review:', error);
          alert('Error al eliminar review: ' + (error.error?.message || 'Error desconocido'));
        }
      });
  }

  isMyReview(review: Review): boolean {
    return review.user_id === this.currentUserId;
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

  goBack() {
    this.router.navigate(['/movies']);
  }
}
