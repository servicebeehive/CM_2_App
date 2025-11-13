import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, GuardResult, MaybeAsync, Router, RouterStateSnapshot } from "@angular/router";
import { AuthService } from "../services/auth.service";

@Injectable({
    providedIn:'root'
})
export class RoleGaurd implements CanActivate{
    constructor(private authService:AuthService, private router:Router){}
  canActivate(route: ActivatedRouteSnapshot):boolean {
      const expectedRole = route.data['expectedRole'];
      const userRole = this.authService.getUserRole();
      if(this.authService.isLogIn() && userRole===expectedRole){
        return true;
      }else{
        this.router.navigate(['/unauthorized']);
        return false;
      }
  }
}