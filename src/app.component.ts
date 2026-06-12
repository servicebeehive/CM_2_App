import { IdleTimeoutService } from '@/layout/service/idle-timeout.service';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule,ToastModule],
    template: `<p-toast></p-toast><router-outlet></router-outlet>`
})
export class AppComponent {
     constructor(private idleService:IdleTimeoutService){}
    ngOnInit(){
        this.idleService.startWatching();
    }
}
