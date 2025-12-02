import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { loadItemList, loadItemListSuccess, loadItemListFailure } from './itemlist.actions';
import { mergeMap, map, catchError, of } from 'rxjs';
import { InventoryService } from '@/core/services/inventory.service';

@Injectable()   // ✅ remove providedIn
export class ItemListEffects {

  loadItemList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadItemList),
      mergeMap(action =>
        this.inventoryService.getdropdowndetails(action.payload).pipe(
          map(data => loadItemListSuccess({ data })),
          catchError(error => of(loadItemListFailure({ error })))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private inventoryService: InventoryService
  ) {}
}
