// This slice has been deprecated.
// The business logic for game actions (e.g., handling player input, starting games)
// has been moved to standalone, exported functions in `store/gameStore.ts`.
// This refactoring improves separation of concerns and makes the state management more scalable.
// Components now import these actions directly instead of selecting them from the store.
