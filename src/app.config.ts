import { HTTP_INTERCEPTORS, provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeng/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { MessageService } from 'primeng/api';
import { AuthInterceptor } from '@/core/interceptors/auth.interceptor';
import { provideState, provideStore } from '@ngrx/store';
import { itemlistReducer } from '@/store/itemlist/itemlist.reducer';
import { provideEffects } from '@ngrx/effects';
import { ItemListEffects } from '@/store/itemlist/itemlist.effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';


export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withFetch()),
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),
     
  

    // NgRx Root Store
    provideStore(),

    // Feature States
    provideState('itemlist', itemlistReducer),

    // Effects
    // provideEffects([
    //   ItemListEffects
    // ]),

    // DevTools
    provideStoreDevtools({
      maxAge: 25
    }),
  

    MessageService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }

    ]
};
