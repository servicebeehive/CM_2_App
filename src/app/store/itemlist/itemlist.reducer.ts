import { createReducer, on } from '@ngrx/store';
import { loadItemList, loadItemListSuccess, loadItemListFailure } from './itemlist.actions';

export interface ItemListState {
  data: any;
  loading: boolean;
  error: any;
}

export const initialState: ItemListState = {
  data: null,
  loading: false,
  error: null,
};

export const itemlistReducer = createReducer(
  initialState,

  on(loadItemList, state => ({
    ...state,
    loading: true,
    error: null
  })),

  on(loadItemListSuccess, (state, { data }) => ({
    ...state,
    loading: false,
    data
  })),

  on(loadItemListFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);
