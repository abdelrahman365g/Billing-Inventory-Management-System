import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Auth } from '../../services/auth';
import { MatIconModule } from '@angular/material/icon';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

@Component({
  imports: [RouterOutlet, MatIconModule, SidebarComponent],
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  readonly isLoading = signal<boolean>(false);
  readonly sidebarOpen = signal(false);

  async logout(): Promise<void> {
    this.isLoading.set(true);
    this.auth.logout();
    this.router.navigate(['/auth/login']);
    this.isLoading.set(false);
  }
}
