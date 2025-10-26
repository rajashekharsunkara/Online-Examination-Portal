"""
WebSocket Connection Manager
Manages WebSocket connections, heartbeats, and connection lifecycle
"""
from typing import Dict, Set, Optional, List
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime, timedelta
import asyncio
import json
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections for exam attempts
    Supports multiple connections per user, heartbeat monitoring, and broadcasting
    """
    
    def __init__(
        self,
        heartbeat_interval: int = 30,
        heartbeat_timeout: int = 60,
        max_connections_per_user: int = 3
    ):
        """
        Initialize connection manager
        
        Args:
            heartbeat_interval: Seconds between heartbeat pings
            heartbeat_timeout: Seconds before marking connection as stale
            max_connections_per_user: Maximum simultaneous connections per user
        """
        # Connection storage: {attempt_id: {connection_id: ConnectionInfo}}
        self.active_connections: Dict[int, Dict[str, "ConnectionInfo"]] = defaultdict(dict)
        
        # User tracking: {user_id: Set[attempt_id]}
        self.user_attempts: Dict[int, Set[int]] = defaultdict(set)
        
        # Reverse lookup: {connection_id: attempt_id}
        self.connection_to_attempt: Dict[str, int] = {}
        
        # Configuration
        self.heartbeat_interval = heartbeat_interval
        self.heartbeat_timeout = heartbeat_timeout
        self.max_connections_per_user = max_connections_per_user
        
        # Background task tracking
        self._heartbeat_tasks: Dict[str, asyncio.Task] = {}
        
    async def connect(
        self,
        websocket: WebSocket,
        attempt_id: int,
        user_id: int,
        connection_id: str
    ) -> bool:
        """
        Accept and register a new WebSocket connection
        
        Args:
            websocket: FastAPI WebSocket instance
            attempt_id: Student attempt ID
            user_id: User ID
            connection_id: Unique connection identifier
            
        Returns:
            True if connection accepted, False if rejected
        """
        # Check connection limit
        user_connection_count = sum(
            len(conns) for aid in self.user_attempts.get(user_id, set())
            for conns in [self.active_connections.get(aid, {})]
        )
        
        if user_connection_count >= self.max_connections_per_user:
            logger.warning(
                f"User {user_id} exceeded connection limit "
                f"({user_connection_count}/{self.max_connections_per_user})"
            )
            await websocket.close(code=1008, reason="Connection limit exceeded")
            return False
        
        # Accept connection
        await websocket.accept()
        
        # Create connection info
        conn_info = ConnectionInfo(
            websocket=websocket,
            attempt_id=attempt_id,
            user_id=user_id,
            connection_id=connection_id,
            connected_at=datetime.utcnow()
        )
        
        # Register connection
        self.active_connections[attempt_id][connection_id] = conn_info
        self.user_attempts[user_id].add(attempt_id)
        self.connection_to_attempt[connection_id] = attempt_id
        
        # Start heartbeat monitoring
        self._heartbeat_tasks[connection_id] = asyncio.create_task(
            self._heartbeat_monitor(connection_id)
        )
        
        logger.info(
            f"WebSocket connected: attempt_id={attempt_id}, "
            f"user_id={user_id}, connection_id={connection_id}"
        )
        
        return True
    
    async def disconnect(self, connection_id: str) -> None:
        """
        Remove a WebSocket connection
        
        Args:
            connection_id: Connection to remove
        """
        attempt_id = self.connection_to_attempt.get(connection_id)
        if not attempt_id:
            return
        
        # Get connection info
        conn_info = self.active_connections.get(attempt_id, {}).get(connection_id)
        if not conn_info:
            return
        
        # Cancel heartbeat task
        if connection_id in self._heartbeat_tasks:
            self._heartbeat_tasks[connection_id].cancel()
            del self._heartbeat_tasks[connection_id]
        
        # Remove from tracking
        del self.active_connections[attempt_id][connection_id]
        if not self.active_connections[attempt_id]:
            del self.active_connections[attempt_id]
        
        del self.connection_to_attempt[connection_id]
        
        # Clean up user tracking
        if conn_info.user_id in self.user_attempts:
            self.user_attempts[conn_info.user_id].discard(attempt_id)
            if not self.user_attempts[conn_info.user_id]:
                del self.user_attempts[conn_info.user_id]
        
        logger.info(
            f"WebSocket disconnected: attempt_id={attempt_id}, "
            f"connection_id={connection_id}"
        )
    
    async def send_personal_message(
        self,
        message: dict,
        connection_id: str
    ) -> bool:
        """
        Send a message to a specific connection
        
        Args:
            message: Message dictionary
            connection_id: Target connection
            
        Returns:
            True if sent successfully, False otherwise
        """
        attempt_id = self.connection_to_attempt.get(connection_id)
        if not attempt_id:
            return False
        
        conn_info = self.active_connections.get(attempt_id, {}).get(connection_id)
        if not conn_info:
            return False
        
        try:
            await conn_info.websocket.send_json(message)
            conn_info.update_last_activity()
            return True
        except Exception as e:
            logger.error(f"Error sending message to {connection_id}: {e}")
            await self.disconnect(connection_id)
            return False
    
    async def broadcast_to_attempt(
        self,
        message: dict,
        attempt_id: int,
        exclude_connection: Optional[str] = None
    ) -> int:
        """
        Broadcast a message to all connections for an attempt
        
        Args:
            message: Message to broadcast
            attempt_id: Target attempt ID
            exclude_connection: Optional connection ID to exclude
            
        Returns:
            Number of connections that received the message
        """
        connections = self.active_connections.get(attempt_id, {})
        sent_count = 0
        
        for conn_id, conn_info in list(connections.items()):
            if conn_id == exclude_connection:
                continue
            
            try:
                await conn_info.websocket.send_json(message)
                conn_info.update_last_activity()
                sent_count += 1
            except Exception as e:
                logger.error(f"Error broadcasting to {conn_id}: {e}")
                await self.disconnect(conn_id)
        
        return sent_count
    
    async def broadcast_to_user(
        self,
        message: dict,
        user_id: int
    ) -> int:
        """
        Broadcast a message to all connections for a user
        
        Args:
            message: Message to broadcast
            user_id: Target user ID
            
        Returns:
            Number of connections that received the message
        """
        sent_count = 0
        attempt_ids = self.user_attempts.get(user_id, set())
        
        for attempt_id in attempt_ids:
            count = await self.broadcast_to_attempt(message, attempt_id)
            sent_count += count
        
        return sent_count
    
    def get_active_connections_for_attempt(self, attempt_id: int) -> List[str]:
        """Get list of active connection IDs for an attempt"""
        return list(self.active_connections.get(attempt_id, {}).keys())
    
    def get_active_connections_for_user(self, user_id: int) -> List[str]:
        """Get list of active connection IDs for a user"""
        connection_ids = []
        for attempt_id in self.user_attempts.get(user_id, set()):
            connection_ids.extend(self.get_active_connections_for_attempt(attempt_id))
        return connection_ids
    
    def is_attempt_connected(self, attempt_id: int) -> bool:
        """Check if an attempt has any active connections"""
        return attempt_id in self.active_connections and \
               len(self.active_connections[attempt_id]) > 0
    
    async def _heartbeat_monitor(self, connection_id: str) -> None:
        """
        Monitor connection health via heartbeat
        
        Args:
            connection_id: Connection to monitor
        """
        try:
            while True:
                await asyncio.sleep(self.heartbeat_interval)
                
                attempt_id = self.connection_to_attempt.get(connection_id)
                if not attempt_id:
                    break
                
                conn_info = self.active_connections.get(attempt_id, {}).get(connection_id)
                if not conn_info:
                    break
                
                # Check if connection is stale
                time_since_activity = datetime.utcnow() - conn_info.last_activity
                if time_since_activity.total_seconds() > self.heartbeat_timeout:
                    logger.warning(
                        f"Connection {connection_id} timed out "
                        f"(last activity: {time_since_activity.total_seconds()}s ago)"
                    )
                    await self.disconnect(connection_id)
                    break
                
                # Send heartbeat ping
                try:
                    await conn_info.websocket.send_json({
                        "type": "ping",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                except Exception as e:
                    logger.error(f"Heartbeat failed for {connection_id}: {e}")
                    await self.disconnect(connection_id)
                    break
                    
        except asyncio.CancelledError:
            logger.debug(f"Heartbeat monitor cancelled for {connection_id}")
        except Exception as e:
            logger.error(f"Heartbeat monitor error for {connection_id}: {e}")
            await self.disconnect(connection_id)


class ConnectionInfo:
    """Information about a WebSocket connection"""
    
    def __init__(
        self,
        websocket: WebSocket,
        attempt_id: int,
        user_id: int,
        connection_id: str,
        connected_at: datetime
    ):
        self.websocket = websocket
        self.attempt_id = attempt_id
        self.user_id = user_id
        self.connection_id = connection_id
        self.connected_at = connected_at
        self.last_activity = connected_at
        self.message_count = 0
    
    def update_last_activity(self) -> None:
        """Update last activity timestamp"""
        self.last_activity = datetime.utcnow()
        self.message_count += 1
    
    def get_connection_duration(self) -> timedelta:
        """Get duration of connection"""
        return datetime.utcnow() - self.connected_at
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "connection_id": self.connection_id,
            "attempt_id": self.attempt_id,
            "user_id": self.user_id,
            "connected_at": self.connected_at.isoformat(),
            "last_activity": self.last_activity.isoformat(),
            "duration_seconds": self.get_connection_duration().total_seconds(),
            "message_count": self.message_count
        }
