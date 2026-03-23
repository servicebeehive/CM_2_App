import { Component } from '@angular/core';
import { UserManagementComponent } from './user-management/user-management.component';
import { Routes } from '@angular/router';
import { AccessControlComponent } from './access-control/access-control.component';

export default [
    { path: 'user-management', component: UserManagementComponent },
    { path: 'access-control', component: AccessControlComponent },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
