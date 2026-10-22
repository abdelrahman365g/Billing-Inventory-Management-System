import { Component, output } from '@angular/core';
import { NAV_ITEMS } from './nav-items';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  readonly navItems = NAV_ITEMS;

  readonly navigated = output<void>();
}
