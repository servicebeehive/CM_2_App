import { Component } from '@angular/core';
import { UserManagementComponent } from './user-management/user-management.component';
import { Routes } from '@angular/router';

export default [
    { path: 'user-management', component: UserManagementComponent },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
