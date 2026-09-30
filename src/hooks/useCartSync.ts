import { useEffect, useRef, useCallback, useState } from 'react';
import * as signalR from '@microsoft/signalr';

export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  unit?: string;
}

interface UseCartSyncOptions {
  tenantId: string | undefined;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

/**
 * Hook for real-time cart sync between devices via SignalR.
 * Phone (barcode scanner) <-> Desktop (POS) sync.
 * 
 * How it works:
 * - Connects to /hubs/cart via SignalR
 * - Joins a tenant-specific group
 * - When local cart changes, broadcasts to other devices
 * - When receiving updates from other devices, merges into local cart
 */
export function useCartSync({ tenantId, cart, setCart }: UseCartSyncOptions) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const isRemoteUpdateRef = useRef(false);
  const lastSyncedCartRef = useRef<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [syncDevices, setSyncDevices] = useState(0);

  // Build the hub URL based on current environment
  const getHubUrl = useCallback(() => {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    if (apiUrl) {
      // Remove /api suffix to get base URL, then append /hubs/cart
      const baseUrl = apiUrl.replace(/\/api\/?$/, '');
      return `${baseUrl}/hubs/cart`;
    }
    // Default: same origin
    return '/hubs/cart';
  }, []);

  // Broadcast cart changes to other devices
  const broadcastCart = useCallback(async (cartItems: CartItem[]) => {
    const conn = connectionRef.current;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected || !tenantId) return;
    
    const cartJson = JSON.stringify(cartItems);
    if (cartJson === lastSyncedCartRef.current) return; // No change
    lastSyncedCartRef.current = cartJson;
    
    try {
      await conn.invoke('SyncCart', tenantId, cartItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        category: item.category,
        unit: item.unit || null,
      })));
    } catch (err) {
      console.warn('[CartSync] Failed to broadcast cart:', err);
    }
  }, [tenantId]);

  // Connect to SignalR hub
  useEffect(() => {
    if (!tenantId) return;

    const hubUrl = getHubUrl();
    const token = localStorage.getItem('paperless_token');
    
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token || '',
      })
      .withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = connection;

    // Handle receiving cart sync from another device
    connection.on('CartSynced', (remoteCart: CartItem[]) => {
      isRemoteUpdateRef.current = true;
      lastSyncedCartRef.current = JSON.stringify(remoteCart);
      setCart(remoteCart);
      // Reset flag after React processes the state update
      setTimeout(() => { isRemoteUpdateRef.current = false; }, 50);
    });

    // Handle single item added (e.g., from phone barcode scan)
    connection.on('ItemAdded', (_item: CartItem) => {
      // The full CartSynced event follows immediately, so we don't need to handle this separately
      // But we could show a toast notification here
    });

    // Handle cart cleared (e.g., after checkout on another device)
    connection.on('CartCleared', () => {
      isRemoteUpdateRef.current = true;
      lastSyncedCartRef.current = '[]';
      setCart([]);
      setTimeout(() => { isRemoteUpdateRef.current = false; }, 50);
    });

    connection.on('JoinedCartSession', (_tenantId: string) => {
      console.log('[CartSync] Joined session for tenant:', _tenantId);
    });

    connection.onreconnected(() => {
      setIsConnected(true);
      // Rejoin group after reconnect
      connection.invoke('JoinCartSession', tenantId).catch(console.warn);
    });

    connection.onreconnecting(() => {
      setIsConnected(false);
    });

    connection.onclose(() => {
      setIsConnected(false);
    });

    // Start connection
    connection
      .start()
      .then(() => {
        setIsConnected(true);
        return connection.invoke('JoinCartSession', tenantId);
      })
      .catch(err => {
        console.warn('[CartSync] Connection failed:', err);
        setIsConnected(false);
      });

    return () => {
      connection.stop().catch(() => {});
      connectionRef.current = null;
      setIsConnected(false);
    };
  }, [tenantId, getHubUrl, setCart]);

  // Broadcast local cart changes to other devices
  useEffect(() => {
    // Skip broadcasting if this update came from a remote device
    if (isRemoteUpdateRef.current) return;
    
    broadcastCart(cart);
  }, [cart, broadcastCart]);

  return { isConnected, syncDevices };
}
