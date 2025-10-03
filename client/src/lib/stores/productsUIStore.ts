import { makeAutoObservable } from "mobx";

export class ProductsUiStore {
  search = "";
  category: string | null = null;
  page = 1;
  pageSize = 20;
  selectedProductId: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setSearch(v: string) { this.search = v; this.page = 1; 
    }
  setCategory(v: string | null) { this.category = v; this.page = 1; }
  setPage(p: number) { this.page = p; }
  selectProduct(id: string | null) { this.selectedProductId = id; }
}

