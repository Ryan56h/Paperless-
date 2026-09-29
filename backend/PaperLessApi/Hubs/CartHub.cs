using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace PaperLessApi.Hubs
{
    /// <summary>
    /// SignalR Hub for real-time cart synchronization between devices.
    /// Phone (barcode scanner) <-> Desktop (POS register) sync.
    /// Uses tenant-based groups so each store's devices sync independently.
    /// </summary>
    public class CartHub : Hub
    {
        // In-memory store: tenantId -> current cart items
        // This acts as the "source of truth" so new connections get the current cart
        private static readonly ConcurrentDictionary<string, List<CartItemDto>> _tenantCarts = new();

        /// <summary>
        /// Device joins its tenant's cart sync group.
        /// Immediately receives the current cart state.
        /// </summary>
        public async Task JoinCartSession(string tenantId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"cart_{tenantId}");

            // Send current cart to the newly connected device
            if (_tenantCarts.TryGetValue(tenantId, out var currentCart))
            {
                await Clients.Caller.SendAsync("CartSynced", currentCart);
            }
            else
            {
                await Clients.Caller.SendAsync("CartSynced", new List<CartItemDto>());
            }

            await Clients.Caller.SendAsync("JoinedCartSession", tenantId);
        }

        /// <summary>
        /// Device leaves the cart sync group.
        /// </summary>
        public async Task LeaveCartSession(string tenantId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"cart_{tenantId}");
        }

        /// <summary>
        /// Sync the full cart state to all devices in the same tenant group.
        /// Called whenever any device modifies the cart (add, remove, update quantity, clear).
        /// </summary>
        public async Task SyncCart(string tenantId, List<CartItemDto> cartItems)
        {
            // Update the in-memory store
            _tenantCarts[tenantId] = cartItems;

            // Broadcast to all OTHER devices in the same tenant group
            await Clients.OthersInGroup($"cart_{tenantId}").SendAsync("CartSynced", cartItems);
        }

        /// <summary>
        /// Quick action: add a single item to cart (e.g., from barcode scan on phone).
        /// Broadcasts to all devices so they can merge it into their local state.
        /// </summary>
        public async Task AddItemToCart(string tenantId, CartItemDto item)
        {
            // Update server-side cart
            var cart = _tenantCarts.GetOrAdd(tenantId, _ => new List<CartItemDto>());
            lock (cart)
            {
                var existing = cart.Find(c => c.Id == item.Id);
                if (existing != null)
                {
                    existing.Quantity += item.Quantity;
                }
                else
                {
                    cart.Add(item);
                }
            }

            // Broadcast the add event to ALL devices (including sender for confirmation)
            await Clients.Group($"cart_{tenantId}").SendAsync("ItemAdded", item);

            // Also broadcast the full updated cart for consistency
            List<CartItemDto> snapshot;
            lock (cart) { snapshot = new List<CartItemDto>(cart); }
            await Clients.Group($"cart_{tenantId}").SendAsync("CartSynced", snapshot);
        }

        /// <summary>
        /// Clear the cart for a tenant (e.g., after checkout).
        /// </summary>
        public async Task ClearCart(string tenantId)
        {
            _tenantCarts[tenantId] = new List<CartItemDto>();
            await Clients.Group($"cart_{tenantId}").SendAsync("CartSynced", new List<CartItemDto>());
            await Clients.Group($"cart_{tenantId}").SendAsync("CartCleared");
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
        }
    }

    public class CartItemDto
    {
        public string Id { get; set; } = "";
        public string Name { get; set; } = "";
        public int Quantity { get; set; }
        public long Price { get; set; }
        public string Category { get; set; } = "";
        public string? Unit { get; set; }
    }
}
