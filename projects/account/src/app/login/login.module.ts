import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { LoginViewComponent } from './components/login/login-view.component';
import { LoginRoutingModule } from './login-routing.module';
import { LoginComponent } from './pages/login.component';
import { AuthService } from './services/auth.service';


@NgModule({
  declarations: [
    LoginComponent,
    LoginViewComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule
  ],
  providers: [
    AuthService
    // {provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {appearance: 'outline'}}
  ],
  exports: [
    LoginRoutingModule
  ]
})
export class LoginModule { }
