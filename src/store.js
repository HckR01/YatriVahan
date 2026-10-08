import { configureStore, createSlice } from "@reduxjs/toolkit";
const emptyDraft = { route: { origin: { name: "", lat: null, lng: null }, destination: { name: "", lat: null, lng: null } }, date: "", time: "", seatsTotal: 3, pricePerSeat: "", vehicle: "", notes: "", womenOnly: false, allowLuggage: true };
const readDraft = () => { try { return JSON.parse(localStorage.getItem("yatrivahan-offer-draft")) || emptyDraft; } catch { return emptyDraft; } };
const offerSlice = createSlice({ name: "offer", initialState: readDraft(), reducers: { updateOffer: (state, action) => ({ ...state, ...action.payload }), clearOffer: () => { localStorage.removeItem("yatrivahan-offer-draft"); return emptyDraft; } } });
export const { updateOffer, clearOffer } = offerSlice.actions;
export const store = configureStore({ reducer: { offer: offerSlice.reducer } });
store.subscribe(() => { try { localStorage.setItem("yatrivahan-offer-draft", JSON.stringify(store.getState().offer)); } catch { /* storage unavailable */ } });
