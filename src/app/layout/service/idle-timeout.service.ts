import { Injectable, NgZone } from "@angular/core";
import { Router } from "@angular/router";

@Injectable({ providedIn :'root'})
export class IdleTimeoutService{
private timeoutId:any;
private idleTime = 15 * 60 * 1000;
constructor(private router :Router, private ngZone: NgZone){}
startWatching(){
    this.resetTimer();
    ['mousemove' , 'keydown' , 'click','touchstart'].forEach(event=>{
        window.addEventListener(event,()=>this.resetTimer());
    });
}
private resetTimer(){
clearTimeout(this.timeoutId);
 this.ngZone.runOutsideAngular(() => {
      this.timeoutId = setTimeout(() => {
        this.ngZone.run(() => this.logout());
      }, this.idleTime);
    });
}
logout(){
    localStorage.clear();
    this.router.navigate(['/login']);
}
}