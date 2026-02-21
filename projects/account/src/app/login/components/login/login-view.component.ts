import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login-view',
  templateUrl: './login-view.component.html',
  styleUrls: ['./login-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginViewComponent {

  @Input() errorMessage!: string;
  @Output() submitEM = new EventEmitter();

  public loginForm!: FormGroup;

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.loginForm = this.fb.group({
      userName: ['', Validators.required],
      password: ['', Validators.required]
    })
  }

  submit() {
    this.errorMessage = '';
    if (this.loginForm.valid) {
      this.submitEM.emit(this.loginForm.value);
    }
  }

}