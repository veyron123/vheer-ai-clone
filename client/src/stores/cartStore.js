import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      // Add item to cart
      addItem: (item) => {
        set((state) => {
          // Check if item with same configuration exists
          const existingItemIndex = state.items.findIndex(
            (cartItem) =>
              cartItem.imageUrl === item.imageUrl &&
              cartItem.frameColor === item.frameColor &&
              cartItem.size === item.size &&
              cartItem.aspectRatio === item.aspectRatio
          );

          if (existingItemIndex !== -1) {
            // If item exists, increase quantity
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + 1
            };
            return { items: updatedItems };
          } else {
            // Add new item with unique ID
            const newItem = {
              ...item,
              id: Date.now() + Math.random(), // Unique ID
              quantity: 1,
              addedAt: new Date().toISOString()
            };
            return { items: [...state.items, newItem] };
          }
        });
      },

      // Remove item from cart
      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId)
        }));
      },

      // Update item quantity
      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          )
        }));
      },

      // Clear cart
      clearCart: () => {
        set({ items: [] });
      },

      // Toggle cart visibility
      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      // Open cart
      openCart: () => {
        set({ isOpen: true });
      },

      // Close cart
      closeCart: () => {
        set({ isOpen: false });
      },

      // Get cart total
      getTotal: () => {
        const items = get().items;
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      // Get item count
      getItemCount: () => {
        const items = get().items;
        return items.reduce((count, item) => count + item.quantity, 0);
      }
    }),
    {
      name: 'mockup-cart', // unique name for localStorage
      partialize: (state) => ({ items: state.items }) // only persist items
    }
  )
);

export default useCartStore;