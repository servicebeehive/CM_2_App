import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ItemListState } from './itemlist.reducer';

export const selectItemListState =
  createFeatureSelector<ItemListState>('itemlist');

export const selectItemListData = createSelector(
  selectItemListState,
  state => state.data
);

export const selectItemListLoading = createSelector(
  selectItemListState,
  state => state.loading
);

export const selectItemListError = createSelector(
  selectItemListState,
  state => state.error
);
