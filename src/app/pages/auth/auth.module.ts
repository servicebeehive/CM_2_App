import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


// PrimeNG modules
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { CheckboxModule } from 'primeng/checkbox';


import { AppConfigurator } from '@/layout/components/app.configurator';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    FormsModule,
    AppConfigurator,
    ReactiveFormsModule,
    // PrimeNG
    InputTextModule,
    CheckboxModule,
    PasswordModule,
    ButtonModule,
    CardModule,
    DividerModule,
     IconFieldModule,
        InputIconModule,


  ]
})
export class AuthModule {}
