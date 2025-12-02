import { createAction, props } from '@ngrx/store';

export const loadItemList = createAction(
  '[ItemList] Load Item List',
  props<{ payload: any }>()
);

export const loadItemListSuccess = createAction(
  '[ItemList] Load Item List Success',
  props<{ data: any }>()
);

export const loadItemListFailure = createAction(
  '[ItemList] Load Item List Failure',
  props<{ error: any }>()
);
