import { ChangeDetectionStrategy, Component , Input} from '@angular/core';
import { User } from '../../login/models/user.response';
import { Router } from '@angular/router';
import { Asset, Group, Landmark, Layout, MapBoxDirections, MapConfig, MapStyle, PaintProperty, PlotDetails, Project, Source, Survey, Toggle, View } from '../../core/models';


type NavItem = { name: string, active: boolean };

@Component({
  selector: 'app-dashboard-view',
  templateUrl: './dashboard-view.component.html',
  styleUrls: ['./dashboard-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DashboardViewComponent {
  @Input() view!: View;
  @Input() projects!: Project[];
  @Input() surveys!: any;
  @Input() sources!: Source[];
  @Input() groups!: Group[];
  @Input() layouts!: Layout[];
  @Input() assets!: Asset[];
  @Input() landmarks!: Landmark[];
  constructor(private router: Router) {}
  navItems: NavItem[] = [
    { name: 'dashboard', active: true },
    { name: 'subscriptions', active: false },
    { name: 'invoices', active: false },
    { name: 'support', active: false }
  ]
  user!: User;

  
  ngOnInit() {
    const lUser = localStorage.getItem('polygon_user');
    if (lUser) {
      this.user = JSON.parse(lUser) as User;
    }
    this.onNavItemClick(this.navItems[0]);
  }

  onNavItemClick(navItem: NavItem) {
    this.navItems.forEach(item => item.active = navItem.name === item.name);
    if(navItem.name === 'dashboard'){
      this.router.navigate([`dashboard/assets`]);
    }
    else{
      this.router.navigate([`dashboard/${navItem.name}`]);
    }
  }
  userSetings(){
    this.router.navigate([`dashboard/user`]);
  }
  
}
