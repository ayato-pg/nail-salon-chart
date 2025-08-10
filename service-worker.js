// ネイルサロン電子カルテ PWA Service Worker
const CACHE_NAME = 'nail-salon-v1.0.0';
const OFFLINE_URL = './offline.html';

// キャッシュするリソース一覧
const CACHE_RESOURCES = [
  './app.html',
  './style.css', 
  './script.js',
  './manifest.json',
  './offline.html',
  // アイコンファイル（実際のファイルが作成されたら追加）
  './icon-192x192.png',
  './icon-512x512.png'
];

// データベース用のキャッシュ名
const DATA_CACHE_NAME = 'nail-data-v1';

// Service Worker インストール時
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching app shell');
        return cache.addAll(CACHE_RESOURCES);
      })
      .then(() => {
        // 新しいService Workerをすぐにアクティブにする
        return self.skipWaiting();
      })
  );
});

// Service Worker アクティブ時
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activating...');
  
  event.waitUntil(
    // 古いキャッシュを削除
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 全てのタブでService Workerを有効にする
      return self.clients.claim();
    })
  );
});

// ネットワークリクエストの処理
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // HTMLリクエストの処理（アプリシェル）
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // オフライン時はキャッシュから返す
          return caches.match('./app.html')
            .then((response) => {
              return response || caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }
  
  // 静的リソースの処理（CSS, JS, 画像など）
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image') {
    
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then((response) => {
              // レスポンスをクローンしてキャッシュに保存
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
              
              return response;
            })
            .catch(() => {
              // 画像が取得できない場合はプレースホルダーを返す
              if (request.destination === 'image') {
                return new Response('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#e0e0e0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#666">画像なし</text></svg>', {
                  headers: { 'Content-Type': 'image/svg+xml' }
                });
              }
            });
        })
    );
    return;
  }
  
  // その他のリクエスト（API等）
  event.respondWith(
    fetch(request)
      .catch(() => {
        // ネットワークエラー時の処理
        return new Response('オフラインです', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// プッシュ通知の処理
self.addEventListener('push', (event) => {
  console.log('📢 Push message received:', event);
  
  const options = {
    body: event.data ? event.data.text() : '新しい通知があります',
    icon: './icon-192x192.png',
    badge: './icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '開く',
        icon: './icon-192x192.png'
      },
      {
        action: 'close', 
        title: '閉じる',
        icon: './icon-192x192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('ネイルサロン電子カルテ', options)
  );
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification click received:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // アプリを開く
    event.waitUntil(
      clients.openWindow('./app.html')
    );
  }
});

// バックグラウンド同期（将来の拡張用）
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background sync:', event);
    event.waitUntil(doBackgroundSync());
  }
});

// バックグラウンド同期の実行
async function doBackgroundSync() {
  try {
    // オフライン時に蓄積されたデータを同期
    console.log('🔄 Performing background sync...');
    // 実装は後で追加
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// メッセージ処理（アプリからの通信）
self.addEventListener('message', (event) => {
  console.log('💬 Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    // キャッシュを強制更新
    event.waitUntil(updateCache());
  }
});

// キャッシュ更新
async function updateCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CACHE_RESOURCES);
    console.log('✅ Cache updated successfully');
  } catch (error) {
    console.error('❌ Cache update failed:', error);
  }
}

// 定期的なキャッシュクリーンアップ
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupOldCache());
  }
});

// 古いキャッシュのクリーンアップ
async function cleanupOldCache() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    name.startsWith('nail-salon-') && name !== CACHE_NAME
  );
  
  await Promise.all(
    oldCaches.map(name => caches.delete(name))
  );
  
  console.log('🧹 Old caches cleaned up');
}