"""
Redis Service
Provides pub/sub messaging for real-time features and caching
"""
import json
import asyncio
from typing import Optional, Callable, Dict, Any
import redis.asyncio as aioredis
from redis.asyncio.client import PubSub
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class RedisService:
    """
    Redis service for pub/sub messaging and caching
    Supports WebSocket broadcasting and real-time updates
    """
    
    def __init__(self):
        """Initialize Redis service"""
        self.redis: Optional[aioredis.Redis] = None
        self.pubsub: Optional[PubSub] = None
        self._subscribers: Dict[str, Callable] = {}
        self._listener_task: Optional[asyncio.Task] = None
    
    async def connect(self) -> None:
        """Establish Redis connection"""
        try:
            self.redis = await aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            self.pubsub = self.redis.pubsub()
            logger.info(f"Connected to Redis: {settings.REDIS_URL}")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    async def disconnect(self) -> None:
        """Close Redis connection"""
        if self._listener_task:
            self._listener_task.cancel()
            try:
                await self._listener_task
            except asyncio.CancelledError:
                pass
        
        if self.pubsub:
            await self.pubsub.close()
        
        if self.redis:
            await self.redis.close()
        
        logger.info("Disconnected from Redis")
    
    async def publish(self, channel: str, message: dict) -> int:
        """
        Publish a message to a Redis channel
        
        Args:
            channel: Channel name
            message: Message dictionary (will be JSON serialized)
            
        Returns:
            Number of subscribers that received the message
        """
        if not self.redis:
            logger.warning("Redis not connected, cannot publish")
            return 0
        
        try:
            message_json = json.dumps(message)
            result = await self.redis.publish(channel, message_json)
            logger.debug(f"Published to {channel}: {message} (reached {result} subscribers)")
            return result
        except Exception as e:
            logger.error(f"Error publishing to {channel}: {e}")
            return 0
    
    async def subscribe(self, channel: str, handler: Callable) -> None:
        """
        Subscribe to a Redis channel
        
        Args:
            channel: Channel name
            handler: Async function to handle messages
        """
        if not self.pubsub:
            logger.error("PubSub not initialized")
            return
        
        try:
            await self.pubsub.subscribe(channel)
            self._subscribers[channel] = handler
            
            # Start listener task if not already running
            if not self._listener_task or self._listener_task.done():
                self._listener_task = asyncio.create_task(self._listen())
            
            logger.info(f"Subscribed to channel: {channel}")
        except Exception as e:
            logger.error(f"Error subscribing to {channel}: {e}")
    
    async def unsubscribe(self, channel: str) -> None:
        """
        Unsubscribe from a Redis channel
        
        Args:
            channel: Channel name
        """
        if not self.pubsub:
            return
        
        try:
            await self.pubsub.unsubscribe(channel)
            if channel in self._subscribers:
                del self._subscribers[channel]
            logger.info(f"Unsubscribed from channel: {channel}")
        except Exception as e:
            logger.error(f"Error unsubscribing from {channel}: {e}")
    
    async def _listen(self) -> None:
        """Background task to listen for messages"""
        try:
            async for message in self.pubsub.listen():
                if message['type'] == 'message':
                    channel = message['channel']
                    data = message['data']
                    
                    handler = self._subscribers.get(channel)
                    if handler:
                        try:
                            # Parse JSON message
                            message_dict = json.loads(data)
                            await handler(channel, message_dict)
                        except json.JSONDecodeError:
                            logger.error(f"Invalid JSON from {channel}: {data}")
                        except Exception as e:
                            logger.error(f"Error in handler for {channel}: {e}")
        except asyncio.CancelledError:
            logger.debug("Redis listener cancelled")
        except Exception as e:
            logger.error(f"Redis listener error: {e}")
    
    # Cache operations
    
    async def get(self, key: str) -> Optional[str]:
        """Get value from Redis cache"""
        if not self.redis:
            return None
        
        try:
            return await self.redis.get(key)
        except Exception as e:
            logger.error(f"Error getting key {key}: {e}")
            return None
    
    async def set(
        self,
        key: str,
        value: str,
        expire: Optional[int] = None
    ) -> bool:
        """
        Set value in Redis cache
        
        Args:
            key: Cache key
            value: Value to store
            expire: Optional expiration time in seconds
            
        Returns:
            True if successful
        """
        if not self.redis:
            return False
        
        try:
            if expire:
                await self.redis.setex(key, expire, value)
            else:
                await self.redis.set(key, value)
            return True
        except Exception as e:
            logger.error(f"Error setting key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from Redis cache"""
        if not self.redis:
            return False
        
        try:
            await self.redis.delete(key)
            return True
        except Exception as e:
            logger.error(f"Error deleting key {key}: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in Redis"""
        if not self.redis:
            return False
        
        try:
            result = await self.redis.exists(key)
            return result > 0
        except Exception as e:
            logger.error(f"Error checking key {key}: {e}")
            return False
    
    async def incr(self, key: str) -> Optional[int]:
        """Increment counter"""
        if not self.redis:
            return None
        
        try:
            return await self.redis.incr(key)
        except Exception as e:
            logger.error(f"Error incrementing key {key}: {e}")
            return None
    
    async def expire(self, key: str, seconds: int) -> bool:
        """Set expiration on key"""
        if not self.redis:
            return False
        
        try:
            return await self.redis.expire(key, seconds)
        except Exception as e:
            logger.error(f"Error setting expiration on {key}: {e}")
            return False


# Singleton instance
redis_service = RedisService()


# Channel naming conventions
def get_attempt_channel(attempt_id: int) -> str:
    """Get Redis channel name for an attempt"""
    return f"attempt:{attempt_id}"


def get_exam_channel(exam_id: int) -> str:
    """Get Redis channel name for an exam"""
    return f"exam:{exam_id}"


def get_user_channel(user_id: int) -> str:
    """Get Redis channel name for a user"""
    return f"user:{user_id}"


def get_broadcast_channel() -> str:
    """Get Redis channel for system-wide broadcasts"""
    return "broadcast:all"
