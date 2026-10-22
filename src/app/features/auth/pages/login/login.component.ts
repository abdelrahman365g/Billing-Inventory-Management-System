import { Component, inject, signal } from '@angular/core';
import { Auth } from '../../../../core/services/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatIconModule } from '@angular/material/icon';

@Component({
  imports: [FormField, FormRoot, MatIconModule],
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly errorMessage = signal<string | null>(null);
  private readonly hidePassword = signal(true);

  private readonly model = signal({ email: '', password: '' });

  protected readonly loginForm = form(
    this.model,
    (path) => {
      required(path.email, { message: 'Email is Required' });
      email(path.email, { message: 'Enter a valid email' });
      required(path.password, { message: 'Password is Required' });
    },
    {
      submission: {
        action: async () => {
          this.errorMessage.set(null);

          try {
            const value = this.model();
            await this.auth.login(value.email, value.password);
            await this.router.navigateByUrl(
              this.route.snapshot.queryParamMap.get('returnUrl') ?? '/',
            );
          } catch (e) {
            this.errorMessage.set(e instanceof Error ? e.message : 'Login failed');
          }
        },
      },
    },
  );
}
