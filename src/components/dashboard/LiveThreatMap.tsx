
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { DataSet, Network } from 'vis-network/standalone/esm/vis-network.min.js';
import 'vis-network/styles/vis-network.min.css';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, Wifi, WifiOff, AlertTriangle, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

type ConnectionStatus = 'idle' | 'connecting_ticket' | 'connecting_ws' | 'connected' | 'disconnected' | 'error_ticket' | 'error_ws';

interface VisNode {
  id: string;
  label: string;
  color: string;
}

interface VisEdge {
  from: string;
  to: string;
  arrows?: string;
  label?: string;
}

const LiveThreatMap = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const networkContainerRef = useRef<HTMLDivElement>(null);
  const nodesDatasetRef = useRef<DataSet<VisNode>>(new DataSet<VisNode>([]));
  const edgesDatasetRef = useRef<DataSet<VisEdge>>(new DataSet<VisEdge>([]));
  const networkInstanceRef = useRef<Network | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const initializeNetwork = useCallback(() => {
    if (networkContainerRef.current && !networkInstanceRef.current) {
      const options = {
        autoResize: true,
        height: '100%',
        width: '100%',
        nodes: {
          shape: 'box',
          font: {
            color: 'hsl(var(--foreground))',
            face: 'var(--font-geist-mono), monospace',
          },
          borderWidth: 1,
          shadow: {
            enabled: true,
            color: 'rgba(0,0,0,0.2)',
            size: 5,
            x: 2,
            y: 2
          }
        },
        edges: {
          smooth: {
            enabled: true,
            type: 'cubicBezier',
            forceDirection: 'horizontal',
            roundness: 0.4,
          },
          arrows: {
            to: { enabled: true, scaleFactor: 0.7 },
          },
          color: {
            color: 'hsl(var(--primary))',
            highlight: 'hsl(var(--accent))',
            hover: 'hsl(var(--accent))',
          },
          font: {
            color: 'hsl(var(--muted-foreground))',
            size: 10,
            strokeWidth: 0,
            align: 'top',
          },
          width: 1,
        },
        physics: {
          enabled: true,
          barnesHut: {
            gravitationalConstant: -3000,
            centralGravity: 0.1,
            springLength: 150,
            springConstant: 0.05,
            damping: 0.09,
          },
          solver: 'barnesHut',
        },
        layout: {
          improvedLayout: true,
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          dragNodes: true,
          dragView: true,
          zoomView: true,
        },
      };
      networkInstanceRef.current = new Network(
        networkContainerRef.current,
        { nodes: nodesDatasetRef.current, edges: edgesDatasetRef.current },
        options
      );
    }
  }, []);


  const connectToLiveGraph = useCallback(async () => {
    if (!user) {
      setErrorMessage("User not authenticated.");
      setConnectionStatus('error_ticket');
      return;
    }

    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        console.log("WebSocket already open.");
        setConnectionStatus('connected');
        return;
    }

    setConnectionStatus('connecting_ticket');
    setErrorMessage(null);

    const apiBaseUrl = process.env.NEXT_PUBLIC_SPITESPIRAL_API_BASE_URL;
    if (!apiBaseUrl) {
      toast({ title: "Configuration Error", description: "API base URL not configured.", variant: "destructive" });
      setErrorMessage("API base URL not configured.");
      setConnectionStatus('error_ticket');
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${apiBaseUrl}/v1/ws-auth`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Ticket request failed: ${response.status}` }));
        throw new Error(errorData.message || `Failed to get WebSocket ticket. Status: ${response.status}`);
      }

      const { ticket } = await response.json();
      if (!ticket) {
        throw new Error("No ticket received from authentication server.");
      }

      setConnectionStatus('connecting_ws');
      
      const wsHostname = new URL(apiBaseUrl).hostname;
      const wsUrl = `wss://${wsHostname}/live-graph?ticket=${ticket}`;
      
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      websocketRef.current = new WebSocket(wsUrl);

      websocketRef.current.onopen = () => {
        console.log("WebSocket Connected");
        setConnectionStatus('connected');
        setRetryCount(0); // Reset retry count on successful connection
        initializeNetwork();
      };

      websocketRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string);
          if (message.type === 'new_edge' && message.data) {
            const edgeData = message.data as VisEdge;
            const { from, to } = edgeData;

            if (from && to) {
                if (!nodesDatasetRef.current.get(from)) {
                    nodesDatasetRef.current.add({ id: from, label: from, color: '#fca5a5' }); // Light red for source
                }
                if (!nodesDatasetRef.current.get(to)) {
                    nodesDatasetRef.current.add({ id: to, label: to, color: '#93c5fd' }); // Light blue for target
                }
                edgesDatasetRef.current.add(edgeData);
            } else {
                console.warn("Received new_edge with missing from/to:", edgeData);
            }

          }
        } catch (e) {
          console.error("Error processing WebSocket message:", e);
          toast({ title: "WebSocket Error", description: "Received malformed data from server.", variant: "destructive" });
        }
      };

      websocketRef.current.onerror = (event) => {
        console.error("WebSocket Error:", event);
        setErrorMessage("WebSocket connection error occurred.");
        setConnectionStatus('error_ws');
      };

      websocketRef.current.onclose = (event) => {
        console.log("WebSocket Disconnected:", event.code, event.reason);
        setConnectionStatus('disconnected');
        if (!event.wasClean && retryCount < maxRetries) {
          console.log(`Attempting to reconnect... (${retryCount + 1}/${maxRetries})`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => connectToLiveGraph(), 3000 * (retryCount + 1)); // Exponential backoff
        } else if (!event.wasClean) {
           setErrorMessage("Failed to reconnect after multiple attempts.");
        }
      };

    } catch (error) {
      console.error("Error connecting to Live Graph:", error);
      const msg = error instanceof Error ? error.message : "An unknown error occurred during connection setup.";
      setErrorMessage(msg);
      setConnectionStatus('error_ticket');
      toast({ title: "Connection Error", description: msg, variant: "destructive" });
    }
  }, [user, toast, initializeNetwork, retryCount]);

  useEffect(() => {
    if (user) { // Auto-connect if user is available
      connectToLiveGraph();
    }
    return () => {
      if (websocketRef.current) {
        console.log("Closing WebSocket connection on component unmount.");
        websocketRef.current.close();
        websocketRef.current = null;
      }
      if (networkInstanceRef.current) {
        networkInstanceRef.current.destroy();
        networkInstanceRef.current = null;
      }
      nodesDatasetRef.current.clear();
      edgesDatasetRef.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // connectToLiveGraph is memoized, so it's fine here

  const renderStatus = () => {
    switch (connectionStatus) {
      case 'idle':
        return <Badge variant="outline" className="text-muted-foreground"><Play className="mr-2 h-4 w-4" />Click "Connect" to start</Badge>;
      case 'connecting_ticket':
        return <Badge variant="secondary" className="text-primary"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Authenticating...</Badge>;
      case 'connecting_ws':
        return <Badge variant="secondary" className="text-primary"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connecting to Live Feed...</Badge>;
      case 'connected':
        return <Badge variant="default" className="bg-green-600 text-white"><Wifi className="mr-2 h-4 w-4" />Live Feed Connected</Badge>;
      case 'disconnected':
        return <Badge variant="destructive"><WifiOff className="mr-2 h-4 w-4" />Disconnected. {errorMessage || (retryCount < maxRetries && 'Attempting to reconnect...')}</Badge>;
      case 'error_ticket':
      case 'error_ws':
        return <Badge variant="destructive"><AlertTriangle className="mr-2 h-4 w-4" />Error: {errorMessage || "Connection Failed"}</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="h-[600px] w-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        {renderStatus()}
        {(connectionStatus === 'disconnected' || connectionStatus === 'error_ticket' || connectionStatus === 'error_ws' || connectionStatus === 'idle') && (
          <Button onClick={() => { setRetryCount(0); connectToLiveGraph(); }} variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">
            <Play className="mr-2 h-4 w-4" />
            Connect / Retry
          </Button>
        )}
      </div>
      <div ref={networkContainerRef} className="flex-grow w-full h-full border border-border rounded-md bg-background">
        {/* Vis Network will render here */}
        {(connectionStatus === 'idle' || connectionStatus === 'connecting_ticket' || connectionStatus === 'connecting_ws') && !networkInstanceRef.current && (
             <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Initializing Live Map...</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default LiveThreatMap;
