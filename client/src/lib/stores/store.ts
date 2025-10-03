import { createContext } from "react";
import CounterStore from "./counterStore";
import { UiStore } from "./uiStore";
import { ActivityStore } from "./activityStore";
import { ProductsUiStore } from "./productsUIStore";

interface Store {
    counterStore: CounterStore
    uiStore: UiStore
    activityStore: ActivityStore,
    productsUiStore:ProductsUiStore
}

export const store: Store = {
    counterStore: new CounterStore(),
    uiStore: new UiStore(),
    activityStore: new ActivityStore(),
    productsUiStore:new ProductsUiStore()
}

export const StoreContext = createContext(store);
